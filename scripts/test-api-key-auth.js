#!/usr/bin/env node

/**
 * Test script for Personal Token (API Key) authentication
 * 
 * This script tests the API key authentication flow:
 * 1. Creates a test API key
 * 2. Tests authentication with the key
 * 3. Tests accessing a protected endpoint
 * 4. Cleans up the test key
 * 
 * Usage:
 *   node scripts/test-api-key-auth.js
 * 
 * Environment:
 *   Set API_BASE_URL to your API endpoint (default: http://localhost:9002)
 *   You must be logged in with a valid session to run this test
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:9002';

async function testApiKeyAuth() {
  console.log('🧪 Testing Personal Token (API Key) Authentication\n');
  
  let createdKeyId = null;
  let apiKey = null;

  try {
    // Step 1: Create a test API key
    console.log('1️⃣ Creating test API key...');
    const createResponse = await fetch(`${API_BASE_URL}/api/v1/api-keys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include session cookies
      body: JSON.stringify({
        name: 'Test Key - Auto Generated',
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      throw new Error(`Failed to create API key: ${createResponse.status} - ${error}`);
    }

    const keyData = await createResponse.json();
    createdKeyId = keyData.id;
    apiKey = keyData.key;
    console.log(`✅ API key created: ${apiKey.substring(0, 15)}...`);
    console.log(`   Key ID: ${createdKeyId}\n`);

    // Step 2: Test authentication with the API key
    console.log('2️⃣ Testing authentication with API key...');
    const testResponse = await fetch(`${API_BASE_URL}/api/v1/contacts`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!testResponse.ok) {
      const error = await testResponse.text();
      throw new Error(`Failed to authenticate with API key: ${testResponse.status} - ${error}`);
    }

    console.log(`✅ Successfully authenticated with API key`);
    console.log(`   Response status: ${testResponse.status}\n`);

    // Step 3: List all API keys to verify it's there
    console.log('3️⃣ Listing API keys...');
    const listResponse = await fetch(`${API_BASE_URL}/api/v1/api-keys`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!listResponse.ok) {
      throw new Error(`Failed to list API keys: ${listResponse.status}`);
    }

    const keys = await listResponse.json();
    const foundKey = keys.find(k => k.id === createdKeyId);
    if (!foundKey) {
      throw new Error('Created key not found in list');
    }

    console.log(`✅ Found test key in list`);
    console.log(`   Total keys: ${keys.length}\n`);

    // Step 4: Clean up - Delete the test key
    console.log('4️⃣ Cleaning up test key...');
    const deleteResponse = await fetch(`${API_BASE_URL}/api/v1/api-keys/${createdKeyId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!deleteResponse.ok && deleteResponse.status !== 204) {
      throw new Error(`Failed to delete test key: ${deleteResponse.status}`);
    }

    console.log(`✅ Test key deleted successfully\n`);

    // Final success message
    console.log('🎉 All tests passed! API Key authentication is working correctly.\n');
    console.log('📝 Summary:');
    console.log('   ✓ API key creation');
    console.log('   ✓ Authentication with Bearer token');
    console.log('   ✓ Access to protected endpoints');
    console.log('   ✓ Key cleanup');
    console.log('\n✨ You can now use Personal Tokens with Windsurf and other tools!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    // Try to clean up if we created a key
    if (createdKeyId) {
      console.log('\n🧹 Attempting cleanup...');
      try {
        await fetch(`${API_BASE_URL}/api/v1/api-keys/${createdKeyId}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        console.log('✅ Cleanup successful');
      } catch (cleanupError) {
        console.error('⚠️  Cleanup failed:', cleanupError.message);
        console.log(`   Please manually delete key ID: ${createdKeyId}`);
      }
    }
    
    process.exit(1);
  }
}

// Run the test
testApiKeyAuth();
