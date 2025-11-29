declare module '@env' {
  export const GEMINI_API_KEY: string;
  
  // Firebase Configuration
  export const FIREBASE_API_KEY: string;
  export const FIREBASE_AUTH_DOMAIN: string;
  export const FIREBASE_DATABASE_URL: string;
  export const FIREBASE_PROJECT_ID: string;
  export const FIREBASE_STORAGE_BUCKET: string;
  export const FIREBASE_MESSAGING_SENDER_ID: string;
  export const FIREBASE_APP_ID: string;
  
  // Google Sign-In
  export const FIREBASE_WEB_CLIENT_ID: string;
}

// Google Sign-In type declarations
declare module '@react-native-google-signin/google-signin' {
  export interface ConfigureParams {
    webClientId?: string;
    offlineAccess?: boolean;
    hostedDomain?: string;
    forceCodeForRefreshToken?: boolean;
    accountName?: string;
    scopes?: string[];
  }

  export interface User {
    idToken: string | null;
    serverAuthCode: string | null;
    scopes: string[];
    user: {
      email: string;
      id: string;
      givenName: string | null;
      familyName: string | null;
      photo: string | null;
      name: string | null;
    };
  }

  export interface SignInResponse {
    type: 'success' | 'cancelled';
    data: User | null;
  }

  export const statusCodes: {
    SIGN_IN_CANCELLED: string;
    IN_PROGRESS: string;
    PLAY_SERVICES_NOT_AVAILABLE: string;
    SIGN_IN_REQUIRED: string;
  };

  export const GoogleSignin: {
    configure: (params: ConfigureParams) => void;
    hasPlayServices: (params?: { showPlayServicesUpdateDialog?: boolean }) => Promise<boolean>;
    signIn: () => Promise<SignInResponse>;
    signOut: () => Promise<void>;
    isSignedIn: () => Promise<boolean>;
    getCurrentUser: () => Promise<User | null>;
    revokeAccess: () => Promise<void>;
    getTokens: () => Promise<{ idToken: string; accessToken: string }>;
  };

  export const GoogleSigninButton: React.ComponentType<{
    style?: any;
    size?: number;
    color?: number;
    onPress?: () => void;
    disabled?: boolean;
  }>;
}
