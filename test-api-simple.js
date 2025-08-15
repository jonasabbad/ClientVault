// Simple test script for API endpoints
import https from 'https';

async function testAPI() {
  console.log('Testing API endpoints...');
  
  // Test the test endpoint first
  console.log('\n1. Testing /api/test...');
  try {
    const testResult = await makeRequest('client-vault-pi.vercel.app', '/api/test', 'GET');
    console.log('✅ Test endpoint works:', testResult);
  } catch (error) {
    console.log('❌ Test endpoint failed:', error.message);
  }
  
  // Test the clients GET endpoint
  console.log('\n2. Testing /api/clients GET...');
  try {
    const clientsResult = await makeRequest('client-vault-pi.vercel.app', '/api/clients', 'GET');
    console.log('✅ Clients GET works:', clientsResult);
  } catch (error) {
    console.log('❌ Clients GET failed:', error.message);
  }
  
  // Test the clients POST endpoint
  console.log('\n3. Testing /api/clients POST...');
  try {
    const testClient = {
      name: "Test Client",
      phone: "+212 600 000 000",
      paymentCodes: []
    };
    const postResult = await makeRequest('client-vault-pi.vercel.app', '/api/clients', 'POST', testClient);
    console.log('✅ Clients POST works:', postResult);
  } catch (error) {
    console.log('❌ Clients POST failed:', error.message);
  }
}

function makeRequest(hostname, path, method, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      port: 443,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`${res.statusCode}: ${parsed.message || responseData}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Run the test
testAPI()
  .then(() => {
    console.log('\n🎉 All tests completed!');
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
  }); 