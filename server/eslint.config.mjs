import globals from 'globals';
import pluginJs from '@eslint/js';

export default [
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  {
    rules: {
      node: true,
      // '@typescript-eslint/no-explicit-any': 'off', // Disable no-explicit-any rule
      'no-unused-vars': 'warn', // Warn for unused variables
      // '@typescript-eslint/ban-ts-comment': [
      //   'warn',
      //   {
      //     'ts-ignore': true, // Allow @ts-ignore comments
      //     'ts-expect-error': false, // Optional: configure as needed
      //     'ts-nocheck': false, // Optional: configure as needed
      //   },
      // ],
    },
  },
];
