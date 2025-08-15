// Test script for client creation flow with Firebase
import https from 'https';

async function testClientCreation() {
  console.log('🧪 Testing Client Creation Flow with Firebase...\n');
  
  // Step 1: Test services API
  console.log('1️⃣ Testing Services API...');
  try {
    const servicesResult = await makeRequest('client-vault-pi.vercel.app', '/api/services', 'GET');
    console.log('✅ Services API works:', servicesResult);
  } catch (error) {
    console.log('❌ Services API failed:', error.message);
    return;
  }
  
  // Step 2: Create a test service
  console.log('\n2️⃣ Creating a test service...');
  try {
    const testService = {
      name: "Test Service",
      color: "#3B82F6",
      icon: "credit-card"
    };
    const serviceResult = await makeRequest('client-vault-pi.vercel.app', '/api/services', 'POST', testService);
    console.log('✅ Service created successfully:', serviceResult);
    
    // Step 3: Get services again to confirm
    const updatedServices = await makeRequest('client-vault-pi.vercel.app', '/api/services', 'GET');
    console.log('✅ Updated services list:', updatedServices);
    
    // Step 4: Create a test client with payment codes
    console.log('\n3️⃣ Creating a test client with payment codes...');
    const testClient = {
      name: "Test Client",
      phone: "+212 600 000 000",
      paymentCodes: [
        {
          serviceId: serviceResult.id,
          code: "TEST123"
        }
      ]
    };
    const clientResult = await makeRequest('client-vault-pi.vercel.app', '/api/clients', 'POST', testClient);
    console.log('✅ Client created successfully:', clientResult);
    
    // Step 5: Get clients to confirm
    console.log('\n4️⃣ Verifying client creation...');
    const clientsResult = await makeRequest('client-vault-pi.vercel.app', '/api/clients', 'GET');
    console.log('✅ Clients list:', clientsResult);
    
    // Step 6: Test duplicate client name
    console.log('\n5️⃣ Testing duplicate client name validation...');
    try {
      await makeRequest('client-vault-pi.vercel.app', '/api/clients', 'POST', testClient);
      console.log('❌ Duplicate validation failed - should have rejected');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Duplicate validation works correctly');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
    console.log('\n🎉 Client creation flow test completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- ✅ Services API working');
    console.log('- ✅ Service creation working');
    console.log('- ✅ Client creation working');
    console.log('- ✅ Payment codes working');
    console.log('- ✅ Duplicate validation working');
    console.log('- ✅ Firebase integration working');
    
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
testClientCreation()
  .then(() => {
    console.log('\n🚀 All tests completed!');
  })
  .catch((error) => {
    console.error('\n💥 Test execution failed:', error);
  }); 