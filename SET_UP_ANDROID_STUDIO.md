### 1. Install Android Studio
- Download from `developer.android.com/studio` and install.
- During installation, make sure these boxes are checked:
    - Android SDK
    - Android SDK Platform
    - Android Virtual Device (AVD)
    - Android Emulator

### 2. Open SDK Manager
- In Android Studio:
    - Go to `More Actions` → `SDK Manager` (or from a project: `File` → `Settings` → `Appearance & Behavior` → `System Settings` → `Android SDK`).
- Check:
    - `Android SDK Platform` for Android 13 (API 33) or newer.
    - Android SDK Tools like:
        - `Android SDK Build-Tools`
        - `Android Emulator`
        - `Intel x86 Emulator Accelerator (HAXM)` — Intel CPUs only (Apple Silicon uses ARM images)
- Click `Apply` to install.

### 3. Open AVD Manager
- In Android Studio:
    - `More Actions` → `Virtual Device Manager`
    - or `Tools` → `Device Manager`.
- Click `Create Device`:
    - Pick a hardware device (e.g., Pixel 6).
    - Choose a system image:
        - `x86_64` image for Intel CPUs
        - `ARM64` image for Apple Silicon (M1/M2/M3)
    - Choose `Google APIs` image (needed for Play Services)
- Click `Next`, then `Finish`.
### 4. Add to path

Run
```bash
# Linux / macOS

sudo nano ~/.bashrc

Then paste the code bellow

export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools

Finaly run:

source ~/.bashrc
```

For macOs

```bash
nano ~/.zshrc

Then paste

export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools

Finaly run:

source ~/.bashrc

```

### 4. Start the emulator
- In `Device Manager`, click the green play `▶️` next to your virtual device.
- Wait for Android to boot — first boot can take a while.


To start the emulator in <code>vs code</code> run this in the terminal. To access the terminal run <code>ctrl + shift + J</code>

```bash
emulator -list-avds

emulator -avd <NAME OF THE EMULATOR SHOWN>

Example:
emulator -avd Pixel_6_API_33
```