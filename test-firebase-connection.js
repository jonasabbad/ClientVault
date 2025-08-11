// Simple test script to verify Firebase connection
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file if it exists
try {
  const envContent = readFileSync(join(__dirname, '.env'), 'utf8');
  const envLines = envContent.split('\n');
  envLines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
} catch (error) {
  console.log('No .env file found, using existing environment variables');
}

console.log('Testing Firebase connection...');
console.log('Environment variables check:');
console.log('- VITE_FIREBASE_API_KEY:', process.env.VITE_FIREBASE_API_KEY ? '✓ Set' : '✗ Missing');
console.log('- VITE_FIREBASE_PROJECT_ID:', process.env.VITE_FIREBASE_PROJECT_ID ? '✓ Set' : '✗ Missing');
console.log('- VITE_FIREBASE_APP_ID:', process.env.VITE_FIREBASE_APP_ID ? '✓ Set' : '✗ Missing');

// Import and test the connection
import('./server/firebase-config.js')
  .then(async ({ testFirebaseConnection }) => {
    try {
      const result = await testFirebaseConnection();
      console.log('\nConnection test result:', JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('\nError testing connection:', error);
    }
  })
  .catch(error => {
    console.error('Error loading firebase-config:', error);
  });
