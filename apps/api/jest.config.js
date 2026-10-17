module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@corelink/shared$': '<rootDir>/../../../packages/shared/dist/index.js',
    '^@corelink/ai$': '<rootDir>/../../../packages/ai/dist/index.js',
  },
  testEnvironment: 'node',
};
