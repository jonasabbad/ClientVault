// Test script to check query parameters
import https from 'https';

async function testQueryParams() {
  console.log('🔍 Testing Query Parameters...\n');
  
  const baseUrl = 'client-vault-pi.vercel.app';
  
  // Test 1: Get all clients (no query params)
  console.log('1️⃣ Testing GET /api/clients (no query params)...');
  try {
    const clients = await makeRequest(baseUrl, '/api/clients', 'GET');
    console.log('✅ All clients response length:', Array.isArray(clients) ? clients.length : 'Not an array');
  } catch (error) {
    console.log('❌ Failed:', error.message);
  }
  
  // Test 2: Get specific client with query param
  console.log('\n2️⃣ Testing GET /api/clients?id=test-id...');
  try {
    const result = await makeRequest(baseUrl, '/api/clients?id=test-id', 'GET');
    console.log('✅ Response type:', typeof result);
    console.log('✅ Response is array:', Array.isArray(result));
    if (Array.isArray(result)) {
      console.log('✅ Array length:', result.length);
    } else {
      console.log('✅ Single object response');
    }
  } catch (error) {
    console.log('❌ Failed:', error.message);
  }
  
  // Test 3: Get with empty query param
  console.log('\n3️⃣ Testing GET /api/clients?id=...');
  try {
    const result = await makeRequest(baseUrl, '/api/clients?id=', 'GET');
    console.log('✅ Response type:', typeof result);
    console.log('✅ Response is array:', Array.isArray(result));
  } catch (error) {
    console.log('❌ Failed:', error.message);
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
          // Check if response is HTML (indicating routing issue)
          if (responseData.includes('<!DOCTYPE html>') || responseData.includes('<html')) {
            reject(new Error(`API routing issue - received HTML instead of JSON: ${responseData.substring(0, 200)}...`));
            return;
          }
          
          const parsed = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`${res.statusCode}: ${parsed.message || responseData}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${responseData.substring(0, 200)}...`));
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
testQueryParams()
  .then(() => {
    console.log('\n🚀 Query parameters test completed!');
  })
  .catch((error) => {
    console.error('\n💥 Test execution failed:', error);
  }); 