# Android App Build Guide - Family Directory

This guide walks you through building an Android APK for the Family Directory application.

## ✅ What Has Been Completed

The following setup has been completed automatically:

- ✅ Created `mobile-app` branch
- ✅ Installed Capacitor dependencies
- ✅ Initialized Capacitor configuration
- ✅ Built the web application
- ✅ Added Android platform
- ✅ Created native Android project

## 📋 Prerequisites You Need to Install

Before you can build the APK, install these tools:

### 1. Android Studio
- **Download:** https://developer.android.com/studio
- **Size:** ~1 GB download
- **Installation:** Follow the setup wizard
- **What it includes:** Android SDK, Emulator, Build Tools

### 2. Java JDK 17
- **Windows:** Download from https://adoptium.net/
- **Check if installed:** Open PowerShell and run `java -version`
- **Required:** Android requires JDK 17 specifically

## 🚀 Building Your APK

### Step 1: Open Project in Android Studio

```bash
cd frontend
npx cap open android
```

This will launch Android Studio with your project.

### Step 2: Wait for Initial Setup

**First time only:**
- Android Studio will download required SDK components
- Gradle will sync dependencies (5-10 minutes)
- Status shown in bottom toolbar
- **Wait until it says "Gradle sync finished"**

### Step 3: Build the APK

1. Click **Build** menu (top of Android Studio)
2. Select **Build Bundle(s) / APK(s)**
3. Click **Build APK(s)**
4. Wait for build to complete (1-2 minutes)
5. Click **locate** link in notification popup

**Your APK location:**
```
frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

## 📱 Installing the APK

### Option A: Install on Your Android Phone

1. **Enable USB Debugging:**
   - Go to Settings > About Phone
   - Tap "Build Number" 7 times
   - Go back to Settings > Developer Options
   - Enable "USB Debugging"

2. **Connect Phone via USB**

3. **In Android Studio:**
   - Click the green ▶️ "Run" button
   - Select your device from the list
   - App will install and launch

### Option B: Use Android Emulator

1. **Create Virtual Device:**
   - Click **Tools > Device Manager**
   - Click **Create Device**
   - Select a phone (e.g., Pixel 6)
   - Select system image (e.g., Android 13)
   - Click Finish

2. **Run on Emulator:**
   - Click the green ▶️ "Run" button
   - Select your emulator
   - Wait for emulator to boot
   - App will install and launch

### Option C: Share APK File

To share the APK with others:

1. Copy `app-debug.apk` to Google Drive or email
2. On Android device: Download the APK
3. Open the file to install (may need to enable "Install from Unknown Sources")

## 🔄 Updating the App After Code Changes

Whenever you make changes to your web code:

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Build the web app
npm run build

# 3. Sync changes to Android project
npx cap sync android

# 4. Open in Android Studio and rebuild
npx cap open android
```

## 🎨 Customizing the App

### Change App Icon

1. Create icon images (512x512 PNG recommended)
2. Place in `frontend/android/app/src/main/res/`
3. Use Android Studio's **Image Asset Studio:**
   - Right-click `res` folder
   - New > Image Asset
   - Follow wizard

### Change App Name

Edit `frontend/android/app/src/main/res/values/strings.xml`:
```xml
<string name="app_name">Family Directory</string>
```

### Change Package Name

Edit `frontend/capacitor.config.json`:
```json
{
  "appId": "com.neumanfam.familydirectory"
}
```

Then run: `npx cap sync android`

## 🐛 Troubleshooting

### Problem: Gradle Sync Failed

**Solution:**
```
File > Invalidate Caches / Restart
```

### Problem: SDK not found

**Solution:**
1. Click **Tools > SDK Manager**
2. Install:
   - Android SDK Platform 33 or higher
   - Android SDK Build-Tools
   - Android SDK Platform-Tools

### Problem: Java version error

**Solution:**
1. Install JDK 17 from https://adoptium.net/
2. Set JAVA_HOME environment variable
3. Restart Android Studio

### Problem: App shows old content

**Solution:**
```bash
cd frontend
npm run build
npx cap sync android
```

Then rebuild in Android Studio.

## 📊 Build Variants

### Debug Build (Current)
- What you built above
- Larger file size
- Includes debugging tools
- Filename: `app-debug.apk`

### Release Build (For Production)

To create a signed release APK:

1. **Generate Signing Key:**
   ```bash
   keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure Gradle:** Edit `android/app/build.gradle`

3. **Build Release APK:**
   - Build > Generate Signed Bundle / APK
   - Follow wizard

## 🔗 Useful Links

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/guide)
- [Capacitor Android Plugin API](https://capacitorjs.com/docs/android)

## ✅ Success Checklist

- [ ] Android Studio installed
- [ ] JDK 17 installed
- [ ] Project opens in Android Studio without errors
- [ ] Gradle sync completes successfully
- [ ] APK builds without errors
- [ ] App installs and launches on device/emulator
- [ ] Can log in and access features
- [ ] App connects to https://neumanfam.com

## 🎉 You're Done!

Your Family Directory app is now ready for Android devices!

**Next Steps:**
- Test all features thoroughly
- Share APK with family members
- Consider publishing to Google Play Store (requires developer account)
