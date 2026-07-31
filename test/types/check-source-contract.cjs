const assert = require('node:assert/strict');
const path = require('node:path');
const ts = require('typescript');

const repositoryRoot = path.resolve(__dirname, '../..');
const contractFixturePath = path.join(__dirname, 'source-contract.ts');
const declarationPath = path.join(repositoryRoot, 'dist/paytheory-sdk.d.ts');

// Check callable variance strictly while limiting reported diagnostics to the contract fixture.
// The implementation predates strict mode and has unrelated strict diagnostics in imported files.
const program = ts.createProgram({
  rootNames: [declarationPath, contractFixturePath],
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

const contractFixture = program.getSourceFile(contractFixturePath);
assert.ok(contractFixture, 'The source-to-contract fixture must be part of the TypeScript program');

const diagnostics = [
  ...program.getSyntacticDiagnostics(contractFixture),
  ...program.getSemanticDiagnostics(contractFixture),
];

assert.equal(
  diagnostics.length,
  0,
  diagnostics
    .map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
    .join('\n\n'),
);
