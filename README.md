# MedVault AI 🏥

<div align="center">

![MedVault AI](https://img.shields.io/badge/MedVault-AI-14b8a6?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTIyIDEyaC00bC0zIDlMOSAzbC0zIDloLTQiLz48L3N2Zz4=)
![Version](https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)

**Your Personal AI-Powered Medical Document Assistant**

[Features](#-features) • [Installation](#-installation) • [Tech Stack](#-tech-stack) • [Screenshots](#-screenshots) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

MedVault AI is an intelligent personal medical assistant that digitizes and organizes your physical medical documents using Artificial Intelligence. Simply scan your prescriptions, lab reports, and diagnoses with your phone camera, and let AI extract, categorize, and store all the important information securely.

## ✨ Features

### 🔬 **AI Document Scanning**
- Capture prescriptions, lab reports, and diagnoses with your camera
- Support for gallery image selection
- Automatic document type detection

### 🧠 **Smart Extraction**
- Powered by Google Gemini 2.5 Flash
- Extracts medications, dosages, diagnoses, and doctor information
- Generates AI summaries of your medical documents

### 💊 **Medication Management**
- Track all your medications with dosage, frequency, and purpose
- Purchase verification for medications
- Visual grid view of all medications

### 📅 **Schedule & Reminders**
- Morning/Evening medication timeline
- Calendar integration with Google Calendar
- Never miss a dose with smart reminders

### 📚 **Medical History**
- Searchable notebook of all scanned documents
- Filter by document type
- View original scans with extracted data

### 🔐 **Secure & Private**
- Firebase Authentication (Email/Password & Google Sign-in)
- Cloud storage with Firebase Realtime Database
- End-to-end encryption for sensitive data

### 🔬 **Lab Test Analyzer**
- AI-powered analysis of lab test results
- Normal range comparisons
- Health insights and recommendations

## 🛠 Tech Stack

| Category | Technologies |
|----------|-------------|
| **Mobile Framework** | React Native with Expo |
| **Language** | TypeScript |
| **State Management** | Zustand |
| **Navigation** | React Navigation 6 |
| **AI/ML** | Google Generative AI (Gemini 2.5 Flash) |
| **Authentication** | Firebase Auth |
| **Database** | Firebase Realtime Database |
| **Storage** | Firebase Storage + AsyncStorage |
| **Icons** | Lucide React Native |

## 📁 Project Structure

```
medvault-ai/
├── medivault-ai/              # Web prototype (AI Studio)
│   ├── App.tsx
│   ├── services/
│   │   └── geminiService.ts
│   └── ...
│
├── medivault-native/          # Main React Native App
│   ├── App.tsx
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   └── common/
│   │   ├── config/            # Firebase configuration
│   │   ├── constants/         # App constants
│   │   ├── navigation/        # Navigation setup
│   │   ├── screens/           # App screens
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── MedsScreen.tsx
│   │   │   ├── ScheduleScreen.tsx
│   │   │   ├── ScanScreen.tsx
│   │   │   ├── DetailScreen.tsx
│   │   │   ├── HistoryScreen.tsx
│   │   │   ├── TestAnalyzerScreen.tsx
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── RegisterScreen.tsx
│   │   │   └── ForgotPasswordScreen.tsx
│   │   ├── services/          # Business logic
│   │   │   ├── geminiService.ts
│   │   │   ├── firebaseAuthService.ts
│   │   │   ├── firebaseDatabaseService.ts
│   │   │   ├── firebaseStorageService.ts
│   │   │   ├── calendarService.ts
│   │   │   └── storageService.ts
│   │   ├── store/             # Zustand stores
│   │   │   ├── useAuthStore.ts
│   │   │   └── useRecordStore.ts
│   │   ├── theme/             # Design system
│   │   ├── types/             # TypeScript types
│   │   └── utils/             # Utility functions
│   └── ...
└── README.md
```

## 🚀 Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Android Studio / Xcode (for emulators)
- Expo Go app (for physical device testing)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/ankon07/medvault-ai.git
   cd medvault-ai
   ```

2. **Navigate to the mobile app**
   ```bash
   cd medivault-native
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your API keys:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   FIREBASE_API_KEY=your_firebase_api_key
   FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   FIREBASE_APP_ID=your_app_id
   ```

5. **Start the development server**
   ```bash
   npx expo start
   ```

6. **Run on device/emulator**
   - Press `a` for Android
   - Press `i` for iOS
   - Scan QR code with Expo Go

## 🔑 API Setup

### Google Gemini API
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add to your `.env` file

### Firebase Setup
1. Create a project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication (Email/Password & Google)
3. Create Realtime Database
4. Create Storage bucket
5. Download `google-services.json` for Android
6. Add Firebase config to `.env`

## 📱 App Screens

| Screen | Description |
|--------|-------------|
| **Home** | Dashboard with stats, recent documents, quick actions |
| **Scan** | Camera/gallery capture with AI analysis |
| **Meds** | Grid view of all medications |
| **Schedule** | Calendar with medication timeline |
| **History** | Searchable document archive |
| **Test Analyzer** | AI-powered lab test analysis |
| **Detail** | Full document view with extracted data |

## 🎨 Design System

- **Primary Color**: Teal (#14b8a6)
- **Typography**: Plus Jakarta Sans
- **Spacing**: 4px base unit scale
- **Components**: Card, Button, Header, EmptyState, LoadingOverlay

## 📜 Scripts

```bash
# Start development
npm start

# Clear cache start
npm run start:clear

# Run on platforms
npm run android
npm run ios

# Type checking
npx tsc --noEmit
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Google Gemini AI](https://ai.google.dev/) for intelligent document analysis
- [React Native](https://reactnative.dev/) & [Expo](https://expo.dev/) for cross-platform development
- [Firebase](https://firebase.google.com/) for backend services
- [Lucide Icons](https://lucide.dev/) for beautiful icons

---

<div align="center">

**Made with ❤️ for better health management**

[⬆ Back to Top](#medvault-ai-)

</div>
