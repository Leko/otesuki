// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  preset: "ts-jest",
  automock: false,
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  errorOnDeprecated: true,
  moduleFileExtensions: ["ts", "tsx", "js"],
  testEnvironment: "node"
};
