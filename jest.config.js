const jestPreset = require('@testing-library/react-native/jest-preset')

module.exports = {
  'preset': '@testing-library/react-native',
  'verbose': true,
  'automock': false, /* Always explicitly mock modules. Also automocking seems to be broken right now:
                        https://github.com/facebook/jest/issues/6127 */
  'setupFiles': [
    ...jestPreset.setupFiles,
    '<rootDir>/jest.setup.js'
  ],
  'setupFilesAfterEnv': ['jest-extended',
    '<rootDir>/jest.setup.afterenv.js'
  ],
  'transformIgnorePatterns': [
    'node_modules/(?!react-native|@react-navigation/native/dist|react-navigation-stack|@react-native-community/async-storage|react-navigation-header-buttons|rn-fetch-blob|@integreat-app/integreat-api-client|antd|rc-.+)'
  ],
  'moduleFileExtensions': [
    'js'
  ],
  'moduleDirectories': [
    'node_modules',
    'src'
  ],
  'globals': {
    '__DEV__': false
  },
  'collectCoverageFrom': [
    '**/*.{js,jsx}'
  ],
  'coverageDirectory': '../__coverage__'
}
