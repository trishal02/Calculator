export default [
  {
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "error",
      "no-console": "off"
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        localStorage: "readonly",
        setTimeout: "readonly",
        console: "readonly",
        Math: "readonly",
        parseFloat: "readonly",
        isNaN: "readonly",
        expect: "readonly",
        describe: "readonly",
        test: "readonly",
        String: "readonly",
        Date: "readonly",
        Number: "readonly"
      }
    }
  }
];
