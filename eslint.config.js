export default [
    {
        files: ["src/**/*.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module"
        },
        rules: {
            "no-undef": "error",
            "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
            "no-redeclare": "error",
            "eqeqeq": ["error", "always"],
            "curly": "error",
            "no-fallthrough": "error"
        }
    }
];