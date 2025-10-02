# Quick Start Guide - Building AAB for Google Play

## What's Been Set Up

This repository is now configured as a React Native mobile application with complete support for building Android App Bundle (AAB) files for Google Play Store submission.

## Project Structure

```
rideglad/
├── android/                    # Android native project
│   ├── app/
│   │   ├── build.gradle       # App build configuration
│   │   └── src/main/          # Android source code
│   ├── build.gradle           # Root build configuration
│   ├── gradle.properties      # Gradle properties
│   └── gradlew               # Gradle wrapper (executable)
├── ios/                       # iOS native project
├── App.tsx                    # Main React Native app component
├── package.json               # NPM dependencies and scripts
├── BUILD_GUIDE.md            # Comprehensive build documentation
└── .github/workflows/        # CI/CD automation
    └── build-aab.yml         # GitHub Actions workflow for building AAB
```

## Quick Commands

### Build AAB for Google Play
```bash
npm run build:aab
```
**Output:** `android/app/build/outputs/bundle/release/app-release.aab`

### Build APK for Testing
```bash
npm run build:apk
```
**Output:** `android/app/build/outputs/apk/release/app-release.apk`

### Development
```bash
npm start                      # Start Metro bundler
npm run android               # Run on Android device/emulator
npm run ios                   # Run on iOS simulator (macOS only)
npm test                      # Run tests
npm run lint                  # Run linter
```

## What You Need to Build

### Minimum Requirements
1. **Node.js** v20 or higher
2. **npm** (comes with Node.js)
3. **Java JDK** 17 or higher
4. **Android SDK** (set ANDROID_HOME environment variable)
5. **Internet access** to download dependencies

### First Time Setup

1. Install dependencies:
```bash
npm install
```

2. Build the AAB:
```bash
npm run build:aab
```

That's it! The AAB file will be at `android/app/build/outputs/bundle/release/app-release.aab`

## Before Google Play Submission

⚠️ **Important:** The current build uses a debug keystore. For production:

1. Generate a release keystore (see BUILD_GUIDE.md)
2. Configure signing in `android/gradle.properties`
3. Update `android/app/build.gradle` to use release signing
4. Rebuild with `npm run build:aab`

## Continuous Integration

A GitHub Actions workflow is included at `.github/workflows/build-aab.yml` that will:
- Automatically build AAB files on every push to main
- Build APK files for testing
- Store build artifacts for 30 days

## Documentation

- **BUILD_GUIDE.md** - Comprehensive build instructions with troubleshooting
- **README.md** - Project overview and development instructions
- **QUICK_START.md** - This file

## Troubleshooting

### "dl.google.com" Network Error
- Ensure you have internet access
- Check firewall/proxy settings
- The error indicates blocked access to Google's Maven repository

### Build Takes Too Long
- First build downloads dependencies (5-10 minutes)
- Subsequent builds are much faster (1-2 minutes)

### Out of Memory
- Edit `android/gradle.properties`
- Increase: `org.gradle.jvmargs=-Xmx4096m`

## Next Steps

1. **Customize the App**
   - Edit `App.tsx` to build your features
   - Update app name in `android/app/src/main/res/values/strings.xml`
   - Replace icons in `android/app/src/main/res/mipmap-*/`

2. **Configure Signing**
   - Follow BUILD_GUIDE.md section on "Release Signing Configuration"
   - Never commit keystore passwords to git

3. **Test the Build**
   - Run `npm run build:aab`
   - Verify the output file exists and has reasonable size (10-50 MB typically)

4. **Submit to Google Play**
   - Create app in Google Play Console
   - Upload the AAB file
   - Complete store listing information
   - Submit for review

## Support

For React Native specific issues:
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Troubleshooting Guide](https://reactnative.dev/docs/troubleshooting)

For Google Play submission:
- [Google Play Console](https://play.google.com/console)
- [Android App Bundle Documentation](https://developer.android.com/guide/app-bundle)

## Current Status

✅ React Native project initialized
✅ Android build configuration set up
✅ AAB build scripts added
✅ Documentation created
✅ CI/CD workflow configured
✅ Ready for development and building

The project is **ready to build AAB files** once dependencies are downloaded in an environment with full internet access.
