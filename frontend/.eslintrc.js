module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['react', 'react-hooks'],
  rules: {
    // React specific rules
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+
    'react/prop-types': 'warn',
    'react/jsx-uses-react': 'off',
    'react/jsx-uses-vars': 'error',
    'react/no-unescaped-entities': 'off', // Allow unescaped quotes and apostrophes
    'react/no-unknown-property': ['error', { 
      ignore: ['position', 'args', 'intensity', 'castShadow', 'shadow-mapSize-width', 'shadow-mapSize-height', 'wireframe', 'object'] 
    }], // Allow Three.js properties
    
    // React Hooks rules
    'react-hooks/rules-of-hooks': 'warn', // Downgrade to warning
    'react-hooks/exhaustive-deps': 'warn',
    
    // General rules
    'no-unused-vars': 'warn',
    'no-console': 'warn',
    'prefer-const': 'warn', // Downgrade to warning
    'no-var': 'error',
    'no-useless-escape': 'warn', // Downgrade to warning
    
    // Import organization - make it less strict
    'sort-imports': ['warn', {
      'ignoreCase': true,
      'ignoreDeclarationSort': true,
      'ignoreMemberSort': false,
      'memberSyntaxSortOrder': ['none', 'all', 'multiple', 'single'],
    }],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  ignorePatterns: [
    'build/',
    'node_modules/',
    'public/',
    '*.config.js',
  ],
};
