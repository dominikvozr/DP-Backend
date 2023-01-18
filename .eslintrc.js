module.exports = {
    settings: {
        react: { version: 'detect' },
    },
    parser: '@typescript-eslint/parser',
    extends: ['plugin:@typescript-eslint/recommended', 'prettier'],
    env: {
        es2021: true,
        node: true,
    },

    plugins: ['prettier'],
};