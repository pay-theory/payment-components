const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const repositoryRoot = path.resolve(__dirname, '../..');
const runtimeEntryPath = path.join(repositoryRoot, 'src/index.js');
const runtimeDataPath = path.join(repositoryRoot, 'src/common/data.ts');
const declarationPath = path.join(repositoryRoot, 'dist/paytheory-sdk.d.ts');

const readSourceFile = (filePath, scriptKind) =>
  ts.createSourceFile(
    filePath,
    fs.readFileSync(filePath, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    scriptKind,
  );

const propertyName = node => {
  if (!node || (!ts.isIdentifier(node) && !ts.isStringLiteral(node))) return null;
  return node.text;
};

/**
 * Read the keys assigned to `window.paytheory`; this is the runtime's authoritative public seam.
 */
const runtimeSdkKeys = sourceFile => {
  let sdkObject;

  const visit = node => {
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      ts.isPropertyAccessExpression(node.left) &&
      node.left.expression.getText(sourceFile) === 'window' &&
      node.left.name.text === 'paytheory' &&
      ts.isObjectLiteralExpression(node.right)
    ) {
      sdkObject = node.right;
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  assert.ok(sdkObject, 'src/index.js must assign the public SDK object to window.paytheory');

  return sdkObject.properties.map(member => {
    const name = propertyName(member.name);
    assert.ok(name, `Unsupported public SDK property syntax: ${member.getText(sourceFile)}`);
    return name;
  });
};

/** Read the keys declared on the partner-facing PayTheorySDK interface. */
const declaredSdkKeys = sourceFile => {
  const sdkInterface = sourceFile.statements.find(
    statement => ts.isInterfaceDeclaration(statement) && statement.name.text === 'PayTheorySDK',
  );
  assert.ok(sdkInterface, 'The declaration must export a PayTheorySDK interface');

  return sdkInterface.members.map(member => {
    const name = propertyName(member.name);
    assert.ok(name, `Unsupported PayTheorySDK member syntax: ${member.getText(sourceFile)}`);
    return name;
  });
};

/** Read public string constants and the validation-backed CTA list from the runtime source. */
const runtimeConstants = sourceFile => {
  const constants = new Map();

  sourceFile.statements.forEach(statement => {
    if (!ts.isVariableStatement(statement)) return;

    statement.declarationList.declarations.forEach(declaration => {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer) return;

      if (ts.isStringLiteral(declaration.initializer)) {
        constants.set(declaration.name.text, declaration.initializer.text);
        return;
      }

      if (
        declaration.name.text === 'CTA_TYPES' &&
        ts.isArrayLiteralExpression(declaration.initializer)
      ) {
        constants.set(
          declaration.name.text,
          declaration.initializer.elements.map(element => element.getText(sourceFile)),
        );
      }
    });
  });

  return constants;
};

/** Read literal-valued constants declared on the partner SDK interface. */
const declaredSdkConstants = sourceFile => {
  const sdkInterface = sourceFile.statements.find(
    statement => ts.isInterfaceDeclaration(statement) && statement.name.text === 'PayTheorySDK',
  );
  assert.ok(sdkInterface, 'The declaration must export a PayTheorySDK interface');

  return new Map(
    sdkInterface.members.flatMap(member => {
      const name = propertyName(member.name);
      if (!name || !member.type || !ts.isLiteralTypeNode(member.type)) return [];
      if (!ts.isStringLiteral(member.type.literal)) return [];
      return [[name, member.type.literal.text]];
    }),
  );
};

/** Read string members from an exported type alias. */
const declaredStringUnion = (sourceFile, aliasName) => {
  const alias = sourceFile.statements.find(
    statement => ts.isTypeAliasDeclaration(statement) && statement.name.text === aliasName,
  );
  assert.ok(alias, `The declaration must export a ${aliasName} type`);

  const members = ts.isUnionTypeNode(alias.type) ? alias.type.types : [alias.type];
  return members.map(member => {
    assert.ok(
      ts.isLiteralTypeNode(member) && ts.isStringLiteral(member.literal),
      `${aliasName} must contain only string literals`,
    );
    return member.literal.text;
  });
};

const runtimeSource = readSourceFile(runtimeEntryPath, ts.ScriptKind.JS);
const runtimeDataSource = readSourceFile(runtimeDataPath, ts.ScriptKind.TS);
const declarationSource = readSourceFile(declarationPath, ts.ScriptKind.TS);
const declarationText = declarationSource.getFullText();

assert.deepEqual(
  declaredSdkKeys(declarationSource).sort(),
  runtimeSdkKeys(runtimeSource).sort(),
  'PayTheorySDK must describe every runtime key and must not advertise nonexistent keys',
);

const sourceConstants = runtimeConstants(runtimeDataSource);
const sdkConstants = declaredSdkConstants(declarationSource);
sdkConstants.forEach((value, name) => {
  if (!sourceConstants.has(name)) return;
  assert.equal(value, sourceConstants.get(name), `${name} must match its runtime constant value`);
});

assert.deepEqual(
  declaredStringUnion(declarationSource, 'CallToAction').sort(),
  sourceConstants.get('CTA_TYPES').sort(),
  'CallToAction must contain exactly the values accepted by runtime validation',
);

let externalDependency;
const findExternalDependency = node => {
  if (
    ts.isImportDeclaration(node) ||
    ts.isImportTypeNode(node) ||
    ts.isExternalModuleReference(node)
  ) {
    externalDependency = node;
    return;
  }
  ts.forEachChild(node, findExternalDependency);
};
findExternalDependency(declarationSource);

assert.equal(
  externalDependency,
  undefined,
  'The downloadable declaration must not depend on another file or package',
);
assert.match(declarationText, /declare global\s*{/, 'The declaration must augment browser globals');
assert.match(
  declarationText,
  /@deprecated Use `payTheoryFields`/,
  'Legacy creation APIs must be deprecated',
);
assert.doesNotMatch(
  declarationText,
  /\b(clearInstances|getState|getStateHistory)\s*\(/,
  'Internal and testing-only Messenger methods must not be published',
);
