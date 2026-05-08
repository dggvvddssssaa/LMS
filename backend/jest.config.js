module.exports = {
    testEnvironment: 'node',
    clearMocks: true,
    setupFilesAfterEnv: ['./jest.setup.js'],
    testMatch: ['**/tests/**/*.test.js'],
};
