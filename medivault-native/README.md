# MediVault AI - React Native

A personal medical assistant mobile application that digitizes physical medical documents using Artificial Intelligence. Built with React Native and Expo for cross-platform compatibility.

## 🏥 Features

- **AI Document Scanning**: Capture prescriptions, lab reports, and diagnoses with your camera
- **Smart Extraction**: Uses Google Gemini 2.5 Flash to extract structured data from medical documents
- **Medication Management**: Track all your medications with dosage, frequency, and purpose
- **Medical History**: View all your scanned documents in a searchable notebook
- **Schedule View**: Timeline view of your medication schedule
- **Offline Support**: View previously saved records without internet connection
- **Local Storage**: All data is stored securely on your device

## 📱 Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation 6
- **State Management**: Zustand
- **AI/ML**: Google Generative AI SDK (Gemini 2.5 Flash)
- **Storage**: AsyncStorage
- **Icons**: Lucide React Native

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac only) or Android Emulator
- Expo Go app on your physical device (optional)
- Google Gemini API Key

### Installation

1. **Clone and navigate to the project**:
   ```bash
   cd medivault-native
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

4. **Start the development server**:
   ```bash
   npx expo start
   ```

5. **Run on your device/simulator**:
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan QR code with Expo Go app

## 📁 Project Structure

```
medivault-native/
├── App.tsx                    # Main entry point
├── src/
│   ├── components/
│   │   └── common/           # Reusable UI components
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Header.tsx
│   │       ├── LoadingOverlay.tsx
│   │       └── EmptyState.tsx
│   ├── constants/             # App constants
│   │   └── index.ts
│   ├── navigation/            # Navigation setup
│   │   ├── types.ts
│   │   ├── BottomTabNavigator.tsx
│   │   └── RootNavigator.tsx
│   ├── screens/               # App screens
│   │   ├── HomeScreen.tsx
│   │   ├── MedsScreen.tsx
│   │   ├── ScheduleScreen.tsx
│   │   ├── HistoryScreen.tsx
│   │   ├── ScanScreen.tsx
│   │   └── DetailScreen.tsx
│   ├── services/              # Business logic services
│   │   ├── storageService.ts
│   │   ├── imageService.ts
│   │   └── geminiService.ts
│   ├── store/                 # State management
│   │   └── useRecordStore.ts
│   ├── theme/                 # Design system
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── index.ts
│   ├── types/                 # TypeScript types
│   │   ├── index.ts
│   │   └── env.d.ts
│   └── utils/                 # Utility functions
│       ├── dateUtils.ts
│       └── imageUtils.ts
├── package.json
├── tsconfig.json
├── babel.config.js
├── app.json
└── .env.example
```

## 🎨 Design System

### Colors
- **Primary**: Teal (#14b8a6 to #0f766e)
- **Background**: Light gray/white
- **Text**: Gray scale for hierarchy

### Typography
- **Font Family**: Plus Jakarta Sans (system default)
- **Sizes**: 10px to 32px scale

### Spacing
- **Scale**: 4px base unit (4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96)

## 📋 Available Scripts

```bash
# Start development server
npm start

# Start with cache clear
npm run start:clear

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run TypeScript compiler check
npx tsc --noEmit

# Lint code
npm run lint
```

## 🔐 API Configuration

### Getting a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create or select a project
3. Generate an API key
4. Add it to your `.env` file

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | Yes |

## 📱 Screens Overview

### Home Screen
- Dashboard with stats overview
- Recent documents list
- Quick scan button

### Meds Screen
- Grid view of all medications
- Search functionality
- Verification badge for purchased meds

### Schedule Screen
- Calendar day selector
- Morning/Evening timeline
- Medication reminders

### History Screen
- Full list of scanned documents
- Search and filter
- Delete functionality

### Scan Screen
- Camera capture option
- Gallery selection
- AI analysis loading state

### Detail Screen
- Full document analysis
- AI-generated summary
- Medications list
- Original document view

## 🛡️ Data & Privacy

- All data is stored locally on your device using AsyncStorage
- No data is sent to external servers except for AI analysis
- Medical documents are processed by Google's Gemini API
- Images are compressed before API transmission

## 🐛 Troubleshooting

### Common Issues

1. **TypeScript errors after install**:
   ```bash
   npm install
   npx expo start -c
   ```

2. **Camera not working on device**:
   - Ensure camera permissions are granted
   - Restart the Expo Go app

3. **API errors**:
   - Verify your Gemini API key is correct
   - Check your internet connection
   - Ensure API quota hasn't been exceeded

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Google Gemini AI for document analysis
- React Native & Expo teams
- Lucide for beautiful icons
