const assert = require('node:assert/strict');
const path = require('node:path');
const ts = require('typescript');

const repositoryRoot = path.resolve(__dirname, '../..');

// The partner and internal declarations both augment `Window`, so each fixture gets its own program.
const contracts = [
  {
    declarationPath: path.join(repositoryRoot, 'dist/paytheory-sdk.d.ts'),
    fixturePath: path.join(__dirname, 'source-contract.ts'),
  },
  {
    declarationPath: path.join(repositoryRoot, 'dist-internal/paytheory-sdk.d.ts'),
    fixturePath: path.join(__dirname, 'internal/source-contract.ts'),
  },
];

// Check callable variance strictly while limiting reported diagnostics to the contract fixture.
// The implementation predates strict mode and has unrelated strict diagnostics in imported files.
const checkContract = ({ declarationPath, fixturePath }) => {
  const program = ts.createProgram({
    rootNames: [declarationPath, fixturePath],
    options: {
      allowJs: true,
      lib: ['lib.dom.d.ts', 'lib.es2020.d.ts'],
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Node10,
      noEmit: true,
      skipLibCheck: true,
      strictFunctionTypes: true,
      target: ts.ScriptTarget.ES2020,
    },
  });

  const fixtureLabel = path.relative(repositoryRoot, fixturePath);
  const contractFixture = program.getSourceFile(fixturePath);
  assert.ok(contractFixture, `${fixtureLabel} must be part of the TypeScript program`);

  const diagnostics = [
    ...program.getSyntacticDiagnostics(contractFixture),
    ...program.getSemanticDiagnostics(contractFixture),
  ];

  assert.equal(
    diagnostics.length,
    0,
    `${fixtureLabel}:\n${diagnostics
      .map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
      .join('\n\n')}`,
  );
};

contracts.forEach(checkContract);
