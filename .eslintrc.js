module.exports = {
  extends: 'expo',
  plugins: [
    'react-native'
  ],
  rules: {
    'react-native/no-raw-text': 'error',
    // You can add other rules here
  },
  settings: {
    react: {
      version: 'detect', // Automatically detect the React version
    },
  },
  env: {
    'react-native/globals': true, // Enable React Native global variables
  },
}; 