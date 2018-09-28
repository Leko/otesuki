module.exports = {
  ...require("../../jest.config.base"),
  collectCoverageFrom: ["src/**/*.{ts,tsx}"],
  testMatch: ["**/__tests__/*.+(ts|tsx|js)"]
};
