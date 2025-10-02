# Build Guide for RideGlad Android App

## Overview

This guide explains how to build the RideGlad Android application as an Android App Bundle (AAB) file for submission to Google Play Store.

## Prerequisites

Before building the AAB file, ensure you have:

1. **Node.js** (v20 or higher)
2. **npm** or **yarn**
3. **Java Development Kit (JDK)** - Version 17 or higher
4. **Android SDK** with the following components:
   - Android SDK Platform 36 (or as specified in `android/build.gradle`)
   - Android SDK Build-Tools 36.0.0 (or as specified)
   - Android SDK Platform-Tools
5. **Environment Variables**:
   - `ANDROID_HOME` or `ANDROID_SDK_ROOT` pointing to your Android SDK location
   - `JAVA_HOME` pointing to your JDK installation

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

## Building the AAB File

### Quick Build (Debug Signing)

For testing purposes, you can build an AAB with debug signing:

```bash
npm run build:aab
```

This will create an AAB file at:
```
android/app/build/outputs/bundle/release/app-release.aab
```

**Note:** This uses the debug keystore and should NOT be used for production releases to Google Play.

### Production Build (Release Signing)

For a production release to Google Play, you must configure proper release signing:

#### Step 1: Generate a Release Keystore

```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore my-release-key.keystore \
  -alias my-key-alias \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

**Important:** Store the keystore file and passwords securely. You cannot recover them if lost.

#### Step 2: Configure Signing

1. Place the keystore file in `android/app/` directory (or a secure location)

2. Edit `android/gradle.properties` and add (or create the file if it doesn't exist):

```properties
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=your_store_password
MYAPP_RELEASE_KEY_PASSWORD=your_key_password
```

**Security Note:** Add `gradle.properties` to `.gitignore` to prevent committing passwords to version control.

3. Update `android/app/build.gradle` to use the release signing config:

Find the `signingConfigs` section and update it:

```gradle
signingConfigs {
    debug {
        storeFile file('debug.keystore')
        storePassword 'android'
        keyAlias 'androiddebugkey'
        keyPassword 'android'
    }
    release {
        if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
            storeFile file(MYAPP_RELEASE_STORE_FILE)
            storePassword MYAPP_RELEASE_STORE_PASSWORD
            keyAlias MYAPP_RELEASE_KEY_ALIAS
            keyPassword MYAPP_RELEASE_KEY_PASSWORD
        }
    }
}
```

And update the `buildTypes` section:

```gradle
buildTypes {
    debug {
        signingConfig signingConfigs.debug
    }
    release {
        signingConfig signingConfigs.release
        minifyEnabled enableProguardInReleaseBuilds
        proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
    }
}
```

#### Step 3: Build the Production AAB

```bash
npm run build:aab
```

## Verifying the AAB File

After building, verify the AAB file:

```bash
# Check file size and location
ls -lh android/app/build/outputs/bundle/release/app-release.aab

# Inspect the bundle contents (requires bundletool)
java -jar bundletool.jar validate --bundle=android/app/build/outputs/bundle/release/app-release.aab
```

## Submitting to Google Play

1. **Log in** to [Google Play Console](https://play.google.com/console)

2. **Select your app** or create a new one:
   - App name: RideGlad
   - Package name: `com.rideglad` (as configured in `android/app/build.gradle`)

3. **Navigate to Release** section:
   - Go to **Release > Production** (or **Testing** for alpha/beta)
   - Click **Create new release**

4. **Upload the AAB**:
   - Upload `android/app/build/outputs/bundle/release/app-release.aab`
   - Google Play will automatically generate APKs for different device configurations

5. **Complete release information**:
   - Release name/number
   - Release notes (what's new)
   - Review warnings/errors and fix if necessary

6. **Review and rollout**:
   - Review the release
   - Choose rollout percentage (start with a small percentage for production)
   - Submit for review

## App Configuration

### Update App Details

Before submitting to Google Play, update the following:

1. **Version Code and Version Name** in `android/app/build.gradle`:

```gradle
defaultConfig {
    applicationId "com.rideglad"
    minSdkVersion rootProject.ext.minSdkVersion
    targetSdkVersion rootProject.ext.targetSdkVersion
    versionCode 1        // Increment for each release
    versionName "1.0.0"  // User-visible version string
}
```

2. **App Name** in `android/app/src/main/res/values/strings.xml`:

```xml
<resources>
    <string name="app_name">RideGlad</string>
</resources>
```

3. **App Icon**: Replace the launcher icons in `android/app/src/main/res/mipmap-*/` directories

## Troubleshooting

### Build Fails with "dl.google.com" Error

This indicates a network connectivity issue. Ensure:
- You have internet access
- Proxy/firewall is not blocking `dl.google.com`
- Try running with `--refresh-dependencies`:

```bash
cd android && ./gradlew --refresh-dependencies bundleRelease
```

### "Keystore not found" Error

- Verify the keystore file path in `gradle.properties`
- Ensure the keystore file exists in the specified location

### Out of Memory Error

Increase the Gradle heap size in `android/gradle.properties`:

```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
```

### Build Succeeds but App Won't Install

- Check that you're installing the correct architecture for your device
- For testing, build an APK instead: `npm run build:apk`
- Use `adb install` to get detailed error messages

## Additional Resources

- [React Native Docs - Publishing to Google Play Store](https://reactnative.dev/docs/signed-apk-android)
- [Android Developers - App Bundle Format](https://developer.android.com/guide/app-bundle)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)

## Build Outputs

After a successful build, you'll find:

```
android/app/build/outputs/
├── bundle/
│   └── release/
│       └── app-release.aab          ← AAB for Google Play
└── apk/
    └── release/
        └── app-release.apk          ← APK for direct distribution
```

The AAB file typically ranges from 10-50 MB depending on app complexity and assets.
