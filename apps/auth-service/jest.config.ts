export default {
  displayName: "auth-service",
  preset: "../../jest.preset.js",
  testEnvironment: "node",

  transform: {
    "^.+\\.[tj]s$": "ts-jest",
  },

  moduleFileExtensions: ["ts", "js", "json"],

  modulePathIgnorePatterns: ["<rootDir>/dist", "<rootDir>/node_modules"],

  moduleNameMapper: {
    "^@shopitt/redis$": "<rootDir>/src/tests/__mocks__/redis.ts",
    "^@shopitt/prisma-client$":
      "<rootDir>/src/tests/__mocks__/prisma-client.ts",
    "^@shopitt/error-handler$":
      "<rootDir>/src/tests/__mocks__/error-handler.ts",
  },
};
