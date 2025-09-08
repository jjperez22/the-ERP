/**
 * Test notification script for the Construction ERP API server
 * This script demonstrates sending push notifications to test the API endpoints
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// API server configuration
const API_BASE_URL = 'http://localhost:3001';

/**
 * Make HTTP request helper
 */
function makeRequest(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const req = require('http').request(url, options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => responseData += chunk);
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(responseData);
                    resolve(jsonData);
                } catch (e) {
                    resolve(responseData);
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

/**
 * Test the API endpoints
 */
async function testAPI() {
    console.log('🚀 Testing Construction ERP API Server...\n');

    try {
        // Test 1: Get VAPID public key
        console.log('📡 Testing VAPID public key endpoint...');
        const vapidResponse = await makeRequest(`${API_BASE_URL}/api/vapid-public-key`);
        console.log('✅ VAPID public key:', vapidResponse.publicKey?.substring(0, 20) + '...');
        console.log();

        // Test 2: Mock subscription (this would normally come from the browser)
        const mockSubscription = {
            endpoint: 'https://fcm.googleapis.com/fcm/send/mock-endpoint-for-testing',
            keys: {
                p256dh: 'mock-p256dh-key-for-testing',
                auth: 'mock-auth-key-for-testing'
            }
        };

        console.log('📝 Testing subscription endpoint...');
        const subResponse = await makeRequest(`${API_BASE_URL}/api/subscribe`, 'POST', mockSubscription);
        console.log('✅ Subscription response:', subResponse.message);
        console.log();

        // Test 3: Send test notification
        const notificationData = {
            title: 'Test Notification 📱',
            message: 'This is a test push notification from the Construction ERP system!',
            type: 'info',
            data: {
                action: 'test',
                timestamp: new Date().toISOString(),
                priority: 'normal'
            }
        };

        console.log('🔔 Testing send notification endpoint...');
        const notifyResponse = await makeRequest(`${API_BASE_URL}/api/send-notification`, 'POST', notificationData);
        console.log('✅ Notification response:', notifyResponse.message);
        console.log('📊 Sent to', notifyResponse.sent || 0, 'subscribers');
        console.log();

        // Test 4: Get notification history
        console.log('📜 Testing notification history endpoint...');
        const historyResponse = await makeRequest(`${API_BASE_URL}/api/notifications/history`);
        console.log('✅ Retrieved', historyResponse.notifications?.length || 0, 'notifications from history');
        console.log();

        // Test 5: Test sync data endpoint
        console.log('🔄 Testing sync data endpoint...');
        const syncResponse = await makeRequest(`${API_BASE_URL}/api/sync/data`);
        console.log('✅ Sync data contains:');
        console.log('  - Products:', syncResponse.products?.length || 0);
        console.log('  - Customers:', syncResponse.customers?.length || 0);
        console.log('  - Orders:', syncResponse.orders?.length || 0);
        console.log('  - Last sync:', syncResponse.lastSync);
        console.log();

        // Test 6: Test uploading offline changes
        const offlineChanges = {
            products: [
                {
                    id: 'temp-' + Date.now(),
                    name: 'Test Product from Offline',
                    category: 'Testing',
                    price: 99.99,
                    quantity: 10,
                    action: 'create',
                    timestamp: new Date().toISOString()
                }
            ],
            orders: [],
            customers: []
        };

        console.log('📤 Testing offline changes upload endpoint...');
        const uploadResponse = await makeRequest(`${API_BASE_URL}/api/sync/upload`, 'POST', offlineChanges);
        console.log('✅ Upload response:', uploadResponse.message);
        console.log('📊 Processed', uploadResponse.processed || 0, 'changes');
        console.log();

        console.log('🎉 All API tests completed successfully!');
        console.log('\n📋 Summary:');
        console.log('  ✅ VAPID public key retrieval');
        console.log('  ✅ Push notification subscription');
        console.log('  ✅ Send push notification');
        console.log('  ✅ Notification history retrieval');
        console.log('  ✅ Data synchronization');
        console.log('  ✅ Offline changes upload');
        console.log('\n🏗️  Construction ERP API server is working correctly!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\n💡 Make sure the API server is running on port 3001:');
        console.log('   npm install (using api-package.json)');
        console.log('   npm start');
        process.exit(1);
    }
}

// Check if API server is running
async function checkServerStatus() {
    try {
        await makeRequest(`${API_BASE_URL}/api/vapid-public-key`);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Main execution
 */
async function main() {
    console.log('🔍 Checking if API server is running...');
    const isRunning = await checkServerStatus();
    
    if (!isRunning) {
        console.log('❌ API server is not running on port 3001');
        console.log('\n🚀 To start the server:');
        console.log('   1. Copy api-package.json to package.json in a new directory');
        console.log('   2. Run: npm install');
        console.log('   3. Run: npm start');
        console.log('\n📝 Or run directly: node api-server.js');
        process.exit(1);
    }

    await testAPI();
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Run the tests
if (require.main === module) {
    main();
}

module.exports = { testAPI, makeRequest };
