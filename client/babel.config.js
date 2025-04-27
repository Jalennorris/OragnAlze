module.exports = function (api) {
  api.cache(false);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // ...existing plugins...
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
        allowUndefined: false,
      }],
    ],
  };
};
