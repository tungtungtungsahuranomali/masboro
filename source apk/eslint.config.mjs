import js from "@eslint/js";

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            parserOptions: {
                ecmaFeatures: { jsx: true },
            },
            globals: {
                console: "readonly",
                setTimeout: "readonly",
                clearTimeout: "readonly",
                setInterval: "readonly",
                clearInterval: "readonly",
                fetch: "readonly",
                FormData: "readonly",
                document: "readonly",
                require: "readonly",
                __DEV__: "readonly",
            },
        },
        rules: {
            "no-unused-vars": "off",
            "no-empty": ["error", { allowEmptyCatch: true }],
        },
    },
    {
        ignores: ["node_modules/**", "android/**", "ios/**", "dist/**", ".expo/**"],
    },
];
