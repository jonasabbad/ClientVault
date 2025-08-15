#!/usr/bin/env node
/**
 * Check Firebase configuration for Vercel deployment
 * Run this script to verify your Firebase setup
 */

console.log('🔍 Checking Firebase configuration...\n');

// Check environment variables
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_MESSAGING_SENDER_ID'
];

console.log('📋 Required Environment Variables:');
requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  const status = value ? '✅ Configured' : '❌ Missing';
  console.log(`  ${envVar}: ${status}`);
  if (value && envVar.includes('KEY')) {
    console.log(`    Value: ${value.substring(0, 8)}...`);
  }
});

console.log('\n🔧 Firebase Configuration Summary:');
const config = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_PROJECT_ID ? `${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com` : undefined,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_PROJECT_ID ? `${process.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app` : undefined,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '258902263753',
  appId: process.env.VITE_FIREBASE_APP_ID
};

Object.entries(config).forEach(([key, value]) => {
  console.log(`  ${key}: ${value || '❌ Missing'}`);
});

// Check if all required variables are present
const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingVars.length > 0) {
  console.log('\n❌ Missing environment variables:');
  missingVars.forEach(envVar => console.log(`  - ${envVar}`));
  console.log('\n💡 To fix this:');
  console.log('1. Go to Vercel Dashboard → Settings → Environment Variables');
  console.log('2. Add the missing variables with your Firebase values');
  console.log('3. Redeploy your application');
} else {
  console.log('\n✅ All Firebase environment variables are configured!');
}

console.log('\n🚀 Next steps:');
console.log('1. Ensure all environment variables are set in Vercel');
console.log('2. Redeploy your application');
console.log('3. Test the connection again');
