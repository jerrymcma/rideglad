// Monorepo config: Points React Native CLI to the mobile app subdirectory
module.exports = {
  project: {
    android: {
      sourceDir: './mobile/android',
      packageName: 'com.rideglad.app',
    },
    ios: {
      sourceDir: './mobile/ios',
    },
  },
};
