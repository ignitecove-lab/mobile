# Ignitecove Mobile

React Native (Expo) mobile app for Ignitecove.

## 📋 Prerequisites

Before starting, make sure you have:

- **Git** – [Install here](https://git-scm.com/)
- **Node.js** (v18 or v20 recommended) – [Install here](https://nodejs.org/)  
  You can use [nvm](https://github.com/nvm-sh/nvm) to manage Node versions:
  ```bash
  nvm install 18
  nvm use 18
- **Expo** – [Install here](https://git-scm.com/)
npm ≥ 9.x (comes with Node) or Yarn ≥ 1.22


```bash
npm install -g expo-cli
npx expo login (Provide "username" or "email" and "password")
```
Android Studio (for Android builds)

Xcode (for iOS builds – macOS only)

CocoaPods (macOS/iOS only)

```bash
sudo gem install cocoapods
```

## 🚀 Setup Instructions
### 1. Clone the repository
```bash
git clone git@github.com:ignitecove-lab/mobile.git
cd mobile
```

### 2. Install dependencies
```bash
npm install --allow-unrelated-histories
```
### 3. Start Metro bundler
```bash
npx expo run android
```
This will run for a few minutes then while this is running set up your emulator or connect your phone but make sure your phone is in <code>Delveloper mode</code> and it's <code>android</code>

After it has run the setup select <code>a</code> to run on android


## Generating apk for test

run
```bash
eas build -p android --profile preview
```