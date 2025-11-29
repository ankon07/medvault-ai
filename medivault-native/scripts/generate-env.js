#!/usr/bin/env node
/**
 * EAS Build Pre-install Script
 * Generates .env file from environment variables for react-native-dotenv
 * 
 * This script runs during EAS build to create the .env file from secrets
 */

const fs = require('fs');
const path = require('path');

const envVars = [
  'GEMINI_API_KEY',
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_DATABASE_URL',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
];

const envContent = envVars
  .map(key => {
    const value = process.env[key];
    if (value) {
      console.log(`✓ Found ${key}`);
      return `${key}=${value}`;
    } else {
      console.log(`✗ Missing ${key}`);
      return `# ${key}=`;
    }
  })
  .join('\n');

const envPath = path.join(__dirname, '..', '.env');

// Check if we have at least some env vars
const hasEnvVars = envVars.some(key => process.env[key]);

if (hasEnvVars) {
  fs.writeFileSync(envPath, envContent + '\n');
  console.log(`\n✅ Generated .env file at ${envPath}`);
} else {
  console.log('\n⚠️ No environment variables found. Using existing .env if available.');
}
