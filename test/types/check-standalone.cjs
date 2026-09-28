const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const repositoryRoot = path.resolve(__dirname, '../..');
const runtimeEntryPath = path.join(repositoryRoot, 'src/index.ts');
const runtimeDataPath = path.join(repositoryRoot, 'src/common/data.ts');
const canonicalSourcePath = path.join(repositoryRoot, 'src/paytheory-sdk.ts');
const declarationPath = path.join(repositoryRoot, 'dist/paytheory-sdk.d.ts');
const internalDeclarationPath = path.join(repositoryRoot, 'dist-internal/paytheory-sdk.d.ts');

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

/** Remove type-only expression wrappers so tests inspect the emitted runtime value. */
const runtimeExpression = node => {
  let expression = node;
  while (
    ts.isAsExpression(expression) ||
    ts.isSatisfiesExpression(expression) ||
    ts.isParenthesizedExpression(expression)
  ) {
    expression = expression.expression;
  }
  return expression;
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
      ts.isObjectLiteralExpression(runtimeExpression(node.right))
    ) {
      sdkObject = runtimeExpression(node.right);
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  assert.ok(sdkObject, 'src/index.ts must assign the public SDK object to window.paytheory');

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
      const initializer = runtimeExpression(declaration.initializer);

      if (ts.isStringLiteral(initializer)) {
        constants.set(declaration.name.text, initializer.text);
        return;
      }

      if (
        ['CTA_TYPES', 'PAYMENT_METHOD_CONFIGS'].includes(declaration.name.text) &&
        ts.isArrayLiteralExpression(initializer)
      ) {
        constants.set(
          declaration.name.text,
          initializer.elements.map(element => element.getText(sourceFile)),
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

/** Read named TypeScript declarations that create reusable type definitions. */
const namedTypeDeclarations = sourceFile =>
  sourceFile.statements.flatMap(statement => {
    if (
      !ts.isInterfaceDeclaration(statement) &&
      !ts.isTypeAliasDeclaration(statement) &&
      !ts.isEnumDeclaration(statement)
    ) {
      return [];
    }
    if (!statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
      return [];
    }
    return [statement.name.text];
  });

/** Recursively list TypeScript source files under a directory. */
const typescriptSourcePaths = directoryPath =>
  fs.readdirSync(directoryPath, { withFileTypes: true }).flatMap(entry => {
    const entryPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) return typescriptSourcePaths(entryPath);
    return entry.name.endsWith('.ts') ? [entryPath] : [];
  });

const runtimeSource = readSourceFile(runtimeEntryPath, ts.ScriptKind.TS);
const runtimeDataSource = readSourceFile(runtimeDataPath, ts.ScriptKind.TS);
const canonicalSource = readSourceFile(canonicalSourcePath, ts.ScriptKind.TS);
const declarationSource = readSourceFile(declarationPath, ts.ScriptKind.TS);
const declarationText = declarationSource.getFullText();
const internalDeclarationSource = readSourceFile(internalDeclarationPath, ts.ScriptKind.TS);
const internalDeclarationText = internalDeclarationSource.getFullText();

assert.deepEqual(
  declaredSdkKeys(declarationSource).sort(),
  runtimeSdkKeys(runtimeSource).sort(),
  'PayTheorySDK must describe every runtime key and must not advertise nonexistent keys',
);

// The internal declaration keeps @internal overloads, so the same key may appear more than once.
assert.deepEqual(
  [...new Set(declaredSdkKeys(internalDeclarationSource))].sort(),
  runtimeSdkKeys(runtimeSource).sort(),
  'The internal PayTheorySDK must describe exactly the runtime keys',
);

const canonicalTypeNames = new Set(namedTypeDeclarations(canonicalSource));
const duplicatePublicTypes = typescriptSourcePaths(path.join(repositoryRoot, 'src'))
  .filter(sourcePath => sourcePath !== canonicalSourcePath)
  .flatMap(sourcePath => {
    const sourceFile = readSourceFile(sourcePath, ts.ScriptKind.TS);
    return namedTypeDeclarations(sourceFile)
      .filter(typeName => canonicalTypeNames.has(typeName))
      .map(typeName => `${path.relative(repositoryRoot, sourcePath)}: ${typeName}`);
  });

assert.deepEqual(
  duplicatePublicTypes,
  [],
  `Public types must be defined only in src/paytheory-sdk.ts:\n${duplicatePublicTypes.join('\n')}`,
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

assert.deepEqual(
  declaredStringUnion(declarationSource, 'AcceptedPaymentMethod').sort(),
  sourceConstants.get('PAYMENT_METHOD_CONFIGS').sort(),
  'AcceptedPaymentMethod must contain exactly the values accepted by runtime validation',
);

assert.deepEqual(
  declaredStringUnion(declarationSource, 'ButtonColor').sort(),
  ['WHITE', 'GREY', 'BLACK', 'PURPLE'].map(name => sourceConstants.get(name)).sort(),
  'ButtonColor must contain exactly the public runtime color values',
);

assert.deepEqual(
  declaredStringUnion(declarationSource, 'PaymentFeeMode').sort(),
  ['MERCHANT_FEE', 'SERVICE_FEE'].map(name => sourceConstants.get(name)).sort(),
  'PaymentFeeMode must contain exactly the supported runtime fee modes',
);

/** Every emitted declaration must stand alone and describe the browser globals. */
const assertStandaloneDeclaration = (sourceFile, label) => {
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
  findExternalDependency(sourceFile);

  const text = sourceFile.getFullText();
  assert.equal(
    externalDependency,
    undefined,
    `${label} must not depend on another file or package`,
  );
  assert.match(text, /declare global\s*{/, `${label} must augment browser globals`);
  assert.match(
    text,
    /@deprecated Use `payTheoryFields`/,
    `${label} must deprecate legacy creation APIs`,
  );
  assert.doesNotMatch(
    text,
    /\b(clearInstances|getState|getStateHistory)\s*\(/,
    `${label} must not publish testing-only Messenger methods`,
  );
};

assertStandaloneDeclaration(declarationSource, 'The partner declaration');
assertStandaloneDeclaration(internalDeclarationSource, 'The internal declaration');

// Checkout-portal surface is tagged @internal: stripped from the partner file, kept internally.
const checkoutOnlySurface =
  /\b(checkoutContext|resendInvoiceEmail|CheckoutContextQuery|PayTheoryAuthOptions|CheckoutPaymentFieldsInput)\b/;
assert.doesNotMatch(
  declarationText,
  checkoutOnlySurface,
  'Checkout-portal surface must not be published in the partner declaration',
);
assert.match(
  internalDeclarationText,
  /resendInvoiceEmail\(\): Promise<MessengerResponse>/,
  'The internal declaration must keep resendInvoiceEmail',
);
assert.match(
  internalDeclarationText,
  /constructor\(options: PayTheoryAuthOptions\)/,
  'The internal declaration must keep the checkout-context Messenger constructor',
);
assert.match(
  internalDeclarationText,
  /payTheoryFields\(input: CheckoutPaymentFieldsInput\)/,
  'The internal declaration must keep the checkout-context payTheoryFields overload',
);
