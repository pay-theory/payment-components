export default ({
  files: ['test/**/*.test.js'],
  nodeResolve: true,
  testRunnerHtml: testFramework =>
    `<html>
      <body>
        <script>window.process = { env: { BUILD_ENV: "dev" } }</script>
        <script type="module" src="${testFramework}"></script>
      </body>
    </html>`,
    coverage: true,
    coverageConfig: {
                        threshold: {
                                      statements: 90,
                                      branches: 90,
                                      functions: 90,
                                      lines: 90,
                                    } ,
                        report: true,
                        reportDir: './coverage',
                        reporters: ['lcov', 'html', 'text']
                      },
});
