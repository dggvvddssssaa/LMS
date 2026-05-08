jest.mock('./src/utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
}));

jest.mock('./src/utils/db', () => ({
    pool: {
        query: jest.fn(),
        connect: jest.fn(),
    },
    connectDB: jest.fn(),
}));

jest.mock('./src/config/db', () => ({
    query: jest.fn(),
    pool: {
        query: jest.fn(),
    },
}));
