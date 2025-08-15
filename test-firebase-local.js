// Simple local test for Firebase connection
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// Set environment variables for testing
process.env.VITE_FIREBASE_API_KEY = "AIzaSyDnD79096i5eYtYd0sgupdwZIOVZsWC4Lw";
process.env.VITE_FIREBASE_PROJECT_ID = "recharging-mobiles-online";
process.env.VITE_FIREBASE_APP_ID = "1:258902263753:web:e1e0b6c7adabbec4714a18";
process.env.VITE_FIREBASE_MESSAGING_SENDER_ID = "258902263753";

async function testFirebaseConnection() {
  try {
    console.log('Testing Firebase connection locally...');
    console.log('Environment variables check:');
    console.log('- VITE_FIREBASE_API_KEY:', process.env.VITE_FIREBASE_API_KEY ? '✓ Set' : '✗ Missing');
    console.log('- VITE_FIREBASE_PROJECT_ID:', process.env.VITE_FIREBASE_PROJECT_ID ? '✓ Set' : '✗ Missing');
    console.log('- VITE_FIREBASE_APP_ID:', process.env.VITE_FIREBASE_APP_ID ? '✓ Set' : '✗ Missing');
    console.log('- VITE_FIREBASE_MESSAGING_SENDER_ID:', process.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? '✓ Set' : '✗ Missing');

    // Firebase configuration
    const firebaseConfig = {
      apiKey: process.env.VITE_FIREBASE_API_KEY,
      authDomain: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.VITE_FIREBASE_APP_ID,
    };

    console.log('\nInitializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log('Testing Firestore connection...');
    // Test Firestore connection by attempting to read from a test collection
    const testDocRef = doc(db, "test", "connection");
    const docSnapshot = await getDoc(testDocRef);
    
    console.log('✅ Firebase connection test completed successfully!');
    console.log('📄 Test document exists:', docSnapshot.exists());
    console.log('🏗️  Project ID:', process.env.VITE_FIREBASE_PROJECT_ID);
    
    return {
      success: true,
      message: "Firebase connection successful",
      details: {
        documentExists: docSnapshot.exists(),
        projectId: process.env.VITE_FIREBASE_PROJECT_ID
      }
    };
    
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown Firebase connection error",
      details: {
        error: error instanceof Error ? error.message : error,
        projectId: process.env.VITE_FIREBASE_PROJECT_ID
      }
    };
  }
}

// Run the test
testFirebaseConnection()
  .then(result => {
    console.log('\n🎯 Final Result:', JSON.stringify(result, null, 2));
    if (result.success) {
      console.log('🎉 Firebase is working correctly!');
    } else {
      console.log('💥 Firebase connection failed!');
    }
  })
  .catch(error => {
    console.error('💥 Test execution failed:', error);
  }); 