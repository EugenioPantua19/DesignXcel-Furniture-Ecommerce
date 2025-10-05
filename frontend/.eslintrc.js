module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    // Disable strict rules for production build
    'react/prop-types': 'off',
    'no-unused-vars': 'warn',
    'no-console': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
    'sort-imports': 'off',
    'prefer-const': 'warn',
    'no-unused-expressions': 'warn'
  },
  env: {
    browser: true,
    node: true,
    es6: true
  }
};