// Simple test script to test the API endpoint
import https from 'https';
import http from 'http';

async function testConnection() {
  console.log('Testing Firebase connection via API...');
  
  const options = {
    hostname: 'client-vault-taupe.vercel.app',
    port: 443,
    path: '/api/settings/test-connection',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('Response status:', res.statusCode);
          console.log('Response data:', JSON.stringify(result, null, 2));
          resolve(result);
        } catch (error) {
          console.error('Error parsing response:', error);
          console.log('Raw response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error);
      reject(error);
    });

    req.end();
  });
}

// Run the test
testConnection()
  .then(result => {
    console.log('\n✅ Test completed successfully!');
    if (result.success) {
      console.log('🎉 Firebase connection is working!');
    } else {
      console.log('❌ Firebase connection failed:', result.message);
    }
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error.message);
  }); 