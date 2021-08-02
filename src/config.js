module.exports = {
    PORT: process.env.PORT || 5432,
    NODE_ENV: process.env.NODE_ENV || 'development',
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://dunder-mifflin@localhost/noteful',
    TEST_DATABASE_URL: process.env.TEST_DATABASE_URL || 'postgresql://dunder-mifflin@localhost/noteful-test'
}
