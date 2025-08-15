// Test script to verify API routing
import https from 'https';

async function testApiRouting() {
  console.log('🔧 Testing API Routing...\n');
  
  const baseUrl = 'client-vault-pi.vercel.app';
  
  // Test 1: Simple API endpoint
  console.log('1️⃣ Testing simple API endpoint...');
  try {
    const result = await makeRequest(baseUrl, '/api/test', 'GET');
    console.log('✅ Simple API works:', result);
  } catch (error) {
    console.log('❌ Simple API failed:', error.message);
  }
  
  // Test 2: Clients API endpoint
  console.log('\n2️⃣ Testing clients API endpoint...');
  try {
    const result = await makeRequest(baseUrl, '/api/clients', 'GET');
    console.log('✅ Clients API works, found clients:', result.length);
  } catch (error) {
    console.log('❌ Clients API failed:', error.message);
  }
  
  // Test 3: Services API endpoint
  console.log('\n3️⃣ Testing services API endpoint...');
  try {
    const result = await makeRequest(baseUrl, '/api/services', 'GET');
    console.log('✅ Services API works, found services:', result.length);
  } catch (error) {
    console.log('❌ Services API failed:', error.message);
  }
  
  // Test 4: Client details API endpoint
  console.log('\n4️⃣ Testing client details API endpoint...');
  try {
    const result = await makeRequest(baseUrl, '/api/clients/7cc743f2-81a2-450a-a69e-3f386f479ee7', 'GET');
    console.log('✅ Client details API works:', {
      id: result.id,
      name: result.name,
      paymentCodesCount: result.paymentCodes?.length || 0
    });
  } catch (error) {
    console.log('❌ Client details API failed:', error.message);
  }
  
  // Test 5: Non-existent API endpoint
  console.log('\n5️⃣ Testing non-existent API endpoint...');
  try {
    await makeRequest(baseUrl, '/api/non-existent', 'GET');
    console.log('❌ Should have failed but succeeded');
  } catch (error) {
    if (error.message.includes('404')) {
      console.log('✅ Correctly returned 404 for non-existent API');
    } else {
      console.log('❌ Unexpected error for non-existent API:', error.message);
    }
  }
  
  console.log('\n📊 API Routing Test Summary:');
  console.log('- If you see HTML responses, the API routing is broken');
  console.log('- If you see JSON responses, the API routing is working');
  console.log('- If you see 404 errors for non-existent endpoints, that\'s correct');
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
testApiRouting()
  .then(() => {
    console.log('\n🚀 API routing test completed!');
  })
  .catch((error) => {
    console.error('\n💥 Test execution failed:', error);
  }); 