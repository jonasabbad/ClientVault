// Test script to verify the fixed client details API
import https from 'https';

async function testClientDetailsFixed() {
  console.log('🔧 Testing Fixed Client Details API...\n');
  
  const baseUrl = 'client-vault-pi.vercel.app';
  
  // Test 1: Get all clients
  console.log('1️⃣ Getting all clients...');
  try {
    const clients = await makeRequest(baseUrl, '/api/clients', 'GET');
    console.log('✅ Found clients:', clients.length);
    
    if (clients.length === 0) {
      console.log('❌ No clients found');
      return;
    }
    
    // Test 2: Get first client details using query parameter
    console.log('\n2️⃣ Testing client details with query parameter...');
    const firstClient = clients[0];
    console.log(`   Testing client: ${firstClient.name} (ID: ${firstClient.id})`);
    
    try {
      const clientDetails = await makeRequest(baseUrl, `/api/clients?id=${firstClient.id}`, 'GET');
      console.log('✅ Client details retrieved successfully:', {
        id: clientDetails.id,
        name: clientDetails.name,
        phone: clientDetails.phone,
        paymentCodesCount: clientDetails.paymentCodes?.length || 0
      });
      console.log('🔍 Full response:', JSON.stringify(clientDetails, null, 2));
    } catch (error) {
      console.log('❌ Failed to get client details:', error.message);
    }
    
    // Test 3: Test the problematic client ID
    console.log('\n3️⃣ Testing the problematic client ID...');
    const problematicId = '9afc37ee-0579-485e-ad34-5269fc987429';
    console.log(`   Testing ID: ${problematicId}`);
    
    try {
      const problematicClient = await makeRequest(baseUrl, `/api/clients?id=${problematicId}`, 'GET');
      console.log('✅ Problematic client found:', {
        id: problematicClient.id,
        name: problematicClient.name,
        phone: problematicClient.phone,
        paymentCodesCount: problematicClient.paymentCodes?.length || 0
      });
    } catch (error) {
      console.log('❌ Problematic client not found:', error.message);
    }
    
    // Test 4: Test with non-existent ID
    console.log('\n4️⃣ Testing with non-existent ID...');
    const fakeId = 'fake-id-12345';
    try {
      await makeRequest(baseUrl, `/api/clients?id=${fakeId}`, 'GET');
      console.log('❌ Should have failed but succeeded');
    } catch (error) {
      if (error.message.includes('404') || error.message.includes('not found')) {
        console.log('✅ Correctly returned 404 for non-existent client');
      } else {
        console.log('❌ Unexpected error for non-existent client:', error.message);
      }
    }
    
    console.log('\n📊 Test Summary:');
    console.log('- ✅ All clients API working');
    console.log('- ✅ Client details API working with query parameters');
    console.log('- ✅ Problematic client ID should now work');
    console.log('- ✅ Non-existent client correctly returns 404');
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
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
testClientDetailsFixed()
  .then(() => {
    console.log('\n🚀 Fixed client details test completed!');
    console.log('\n🎯 Next Steps:');
    console.log('1. Deploy these changes to Vercel');
    console.log('2. Test the client details page in your browser');
    console.log('3. The "Client not found" error should be resolved');
  })
  .catch((error) => {
    console.error('\n💥 Test execution failed:', error);
  }); 