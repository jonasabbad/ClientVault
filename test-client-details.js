// Test script to debug client details issue
import https from 'https';

async function testClientDetails() {
  console.log('🔍 Testing Client Details API...\n');
  
  try {
    // Step 1: Get all clients
    console.log('1️⃣ Getting all clients...');
    const clients = await makeRequest('client-vault-pi.vercel.app', '/api/clients', 'GET');
    console.log('✅ Found clients:', clients.length);
    
    if (clients.length === 0) {
      console.log('❌ No clients found in database');
      return;
    }
    
    // Step 2: Display client IDs
    console.log('\n2️⃣ Client IDs in database:');
    clients.forEach((client, index) => {
      console.log(`   ${index + 1}. ${client.name} - ID: ${client.id}`);
    });
    
    // Step 3: Test getting first client details
    console.log('\n3️⃣ Testing client details for first client...');
    const firstClient = clients[0];
    console.log(`   Testing ID: ${firstClient.id}`);
    
    try {
      const clientDetails = await makeRequest('client-vault-pi.vercel.app', `/api/clients/${firstClient.id}`, 'GET');
      console.log('✅ Client details retrieved successfully:', {
        id: clientDetails.id,
        name: clientDetails.name,
        phone: clientDetails.phone,
        paymentCodesCount: clientDetails.paymentCodes?.length || 0
      });
    } catch (error) {
      console.log('❌ Failed to get client details:', error.message);
    }
    
    // Step 4: Test with the problematic ID from the URL
    console.log('\n4️⃣ Testing the problematic client ID from URL...');
    const problematicId = '9afc37ee-0579-485e-ad34-5269fc987429';
    console.log(`   Testing ID: ${problematicId}`);
    
    try {
      const problematicClient = await makeRequest('client-vault-pi.vercel.app', `/api/clients/${problematicId}`, 'GET');
      console.log('✅ Problematic client found:', problematicClient);
    } catch (error) {
      console.log('❌ Problematic client not found:', error.message);
      
      // Check if this ID exists in our client list
      const exists = clients.find(c => c.id === problematicId);
      if (exists) {
        console.log('⚠️  ID exists in client list but API call failed');
      } else {
        console.log('✅ ID does not exist in client list - this is expected');
      }
    }
    
    // Step 5: Test with a non-existent ID
    console.log('\n5️⃣ Testing with a non-existent ID...');
    const fakeId = 'fake-id-12345';
    try {
      await makeRequest('client-vault-pi.vercel.app', `/api/clients/${fakeId}`, 'GET');
      console.log('❌ Should have failed but succeeded');
    } catch (error) {
      if (error.message.includes('404')) {
        console.log('✅ Correctly returned 404 for non-existent client');
      } else {
        console.log('❌ Unexpected error for non-existent client:', error.message);
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`- Total clients in database: ${clients.length}`);
    console.log('- Client IDs:', clients.map(c => c.id).join(', '));
    console.log('- Problematic ID exists:', clients.some(c => c.id === '9afc37ee-0579-485e-ad34-5269fc987429'));
    
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
testClientDetails()
  .then(() => {
    console.log('\n🚀 Client details test completed!');
  })
  .catch((error) => {
    console.error('\n💥 Test execution failed:', error);
  }); 