# Get SHA-1 Certificate Using EAS Build

## Step 1: Install EAS CLI (if not installed)
```bash
npm install -g eas-cli
```

## Step 2: Login to Expo
```bash
eas login
```

## Step 3: Build Development APK
```bash
cd /home/meraxix/medi-vault/medivault-native
eas build --profile development --platform android
```

This will:
1. Create a development build on Expo servers
2. Generate the keystore automatically
3. Give you the SHA-1 fingerprint in the build output

## Step 4: Get SHA-1 from Build
After the build completes, you'll see output like:
```
✔ Build finished
...
SHA-1: A7:89:E5:05:C8:17:A1:22:EA:90:6E:A6:EA:A3:D4:8B:3A:30:AB:18
```

**Copy this SHA-1!**

## Step 5: Add SHA-1 to Firebase Console
1. Go to https://console.firebase.google.com
2. Select your MediVault project
3. Click ⚙️ (Settings) → Project Settings
4. Scroll to "Your apps" → Select your Android app
5. Click "Add fingerprint"
6. Paste your SHA-1
7. Click Save

## Step 6: Enable Phone Authentication
1. Go to Firebase Console → Authentication
2. Click "Sign-in method" tab
3. Click "Phone" → Enable → Save

## Alternative: Get SHA-1 from Existing Build
If you already have a build on Expo:
1. Go to https://expo.dev
2. Select your project → Builds
3. Click on your Android build
4. Look for "Credentials" → SHA-1 fingerprint

---

## Done! ✅
Once SHA-1 is added to Firebase, the phone authentication will work with Play Integrity API.
Until then, it will use reCAPTCHA (which still works!).
