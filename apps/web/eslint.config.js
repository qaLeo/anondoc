import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'src-tauri'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.object.name='Math'][callee.property.name='random']",
          message: 'Use crypto.getRandomValues() instead of Math.random() for security-sensitive operations.',
        },
      ],
    },
  },
  // Anti-regression: Cyrillic strings forbidden in already-localised pages and components.
  // Add more files here as they are localised.
  {
    files: [
      'src/pages/History.tsx',
      'src/pages/Profile.tsx',
      'src/pages/Auth.tsx',
      'src/pages/Pricing.tsx',
      'src/components/DeanonymizationTab.tsx',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.object.name='Math'][callee.property.name='random']",
          message: 'Use crypto.getRandomValues() instead of Math.random() for security-sensitive operations.',
        },
        {
          selector: "JSXText[value=/[а-яА-ЯёЁ]/]",
          message: 'Cyrillic strings in JSX are forbidden. Use t() from useTranslation().',
        },
        {
          selector: "Literal[value=/[а-яА-ЯёЁ]/]",
          message: 'Cyrillic string literals are forbidden. Use t() from useTranslation().',
        },
        {
          selector: "TemplateLiteral > TemplateElement[value.raw=/[а-яА-ЯёЁ]/]",
          message: 'Cyrillic in template literals is forbidden. Use t() from useTranslation().',
        },
      ],
    },
  },
)
