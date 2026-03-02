import typescriptEslint from "typescript-eslint";

export default [{
    ignores: [
        "dist/**",
        "node_modules/**",
        ".vscode/**",
        ".vscode-test/**",
        ".git/**",
        ".github/**",
        ".changeset/**",
        "coverage/**",
        "examples/**",
        "images/**",
        "**/*.min.js",
        "**/*.vsix"
    ],
}, {
    files: ["src/**/*.ts"],
}, {
    plugins: {
        "@typescript-eslint": typescriptEslint.plugin,
    },

    languageOptions: {
        parser: typescriptEslint.parser,
        ecmaVersion: 2022,
        sourceType: "module",
    },

    rules: {
        "@typescript-eslint/naming-convention": ["warn", {
            selector: "import",
            format: ["camelCase", "PascalCase"],
        }],

        curly: "warn",
        eqeqeq: "warn",
        "no-throw-literal": "warn",
        semi: "warn",
    },
}];