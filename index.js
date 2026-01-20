/**
 * Appwrite Function: FCM Notify
 * 
 * Listens to database events (create/update) on all collections
 * and sends FCM push notifications to admin topic with deep-link data.
 * 
 * Environment Variables:
 * - FCM_SERVER_KEY: Firebase Cloud Messaging Server Key (from Firebase Console)
 * 
 * Triggers: Database events
 * - databases.*.collections.*.documents.*.create
 * - databases.*.collections.*.documents.*.update
 */

const https = require('https');

/**
 * Send notification to FCM topic
 */
function sendFCMNotification(serverKey, title, body, data) {
  return new Promise((resolve, reject) => {
    const message = {
      to: '/topics/admins',
      notification: {
        title: title,
        body: body,
      },
      data: data,
    };

    const payload = JSON.stringify(message);

    const options = {
      hostname: 'fcm.googleapis.com',
      port: 443,
      path: '/fcm/send',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${serverKey}`,
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(responseData));
        } else {
          reject(new Error(`FCM request failed with status ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Build notification message based on collection and event
 */
function buildNotification(collection, document, event) {
  const docId = document['$id'] || document.id || 'unknown';
  
  const notificationMap = {
    bookings: {
      create: {
        title: '📅 New Booking',
        body: `Booking ${docId} created`,
      },
      update: {
        title: '✏️ Booking Updated',
        body: `Booking ${docId} updated`,
      },
    },
    contactmessages: {
      create: {
        title: '📧 New Contact Message',
        body: `Message from ${document.name || 'Visitor'} received`,
      },
      update: {
        title: '✏️ Message Updated',
        body: `Message ${docId} updated`,
      },
    },
    tablebookings: {
      create: {
        title: '🍽️ New Table Booking',
        body: `Table booking ${docId} created`,
      },
      update: {
        title: '✏️ Table Booking Updated',
        body: `Table booking ${docId} updated`,
      },
    },
    banquetenquiries: {
      create: {
        title: '🎉 New Banquet Enquiry',
        body: `Banquet enquiry from ${document.name || 'Guest'} received`,
      },
      update: {
        title: '✏️ Banquet Enquiry Updated',
        body: `Banquet enquiry ${docId} updated`,
      },
    },
    roomblocks: {
      create: {
        title: '🚫 Room Blocked',
        body: `Room ${document.roomId || 'unknown'} blocked`,
      },
      update: {
        title: '✏️ Block Updated',
        body: `Block ${docId} updated`,
      },
    },
    rooms: {
      create: {
        title: '🛏️ New Room',
        body: `Room ${document.roomNumber || docId} added`,
      },
      update: {
        title: '✏️ Room Updated',
        body: `Room ${document.roomNumber || docId} updated`,
      },
    },
    housekeeping: {
      create: {
        title: '🧹 New Task',
        body: `Housekeeping task created for room ${document.roomId || 'unknown'}`,
      },
      update: {
        title: '✏️ Task Updated',
        body: `Task ${docId} updated`,
      },
    },
    guests: {
      create: {
        title: '👤 New Guest',
        body: `Guest ${document.firstName || 'Unknown'} checked in`,
      },
      update: {
        title: '✏️ Guest Updated',
        body: `Guest ${docId} updated`,
      },
    },
    payments: {
      create: {
        title: '💳 New Payment',
        body: `Payment of ₹${document.amount || 'N/A'} received`,
      },
      update: {
        title: '✏️ Payment Updated',
        body: `Payment ${docId} updated`,
      },
    },
    reports: {
      create: {
        title: '📊 New Report',
        body: `Report ${docId} generated`,
      },
      update: {
        title: '✏️ Report Updated',
        body: `Report ${docId} updated`,
      },
    },
    users: {
      create: {
        title: '👨‍💼 New User',
        body: `User ${document.name || 'Unknown'} added`,
      },
      update: {
        title: '✏️ User Updated',
        body: `User ${document.name || 'Unknown'} updated`,
      },
    },
  };

  return (
    notificationMap[collection] &&
    notificationMap[collection][event]
  ) || {
    title: `📨 ${collection} Updated`,
    body: `New activity in ${collection}`,
  };
}

/**
 * Extract collection name from Appwrite event string
 * Format: databases.{dbId}.collections.{collectionId}.documents.{docId}.create
 */
function extractCollectionFromEvent(eventString) {
  const parts = eventString.split('.');
  const collectionIndex = parts.indexOf('collections');
  if (collectionIndex !== -1 && collectionIndex + 1 < parts.length) {
    return parts[collectionIndex + 1];
  }
  return null;
}

/**
 * Main function handler
 */
module.exports = async (req, res) => {
  // Start logging immediately
  console.log('🚀 ========== FUNCTION EXECUTION STARTED ==========');
  console.log('📥 Request method:', req.method || 'N/A');
  console.log('📥 Request received at:', new Date().toISOString());
  
  try {
    // Check FCM Server Key first
    const fcmServerKey = process.env.FCM_SERVER_KEY;
    console.log('🔑 FCM_SERVER_KEY check:', fcmServerKey ? '✅ Set' : '❌ Not set');

    if (!fcmServerKey) {
      console.error('❌ FCM_SERVER_KEY not set in function environment');
      return res.json({ 
        error: 'FCM_SERVER_KEY not configured',
        message: 'Please set FCM_SERVER_KEY environment variable in Appwrite Function settings'
      }, 400);
    }

    // Parse the event payload from Appwrite
    // Appwrite can send payload in different formats
    let eventData = {};
    
    // Try to get body from different possible locations
    if (req.body) {
      eventData = req.body;
    } else if (typeof req === 'object' && req.event) {
      eventData = req;
    }
    
    console.log('📥 Raw request body type:', typeof req.body);
    console.log('📥 Full request body:', JSON.stringify(eventData, null, 2));
    console.log('📥 Request body keys:', Object.keys(eventData));
    
    // Appwrite event format: databases.{dbId}.collections.{collectionId}.documents.{docId}.create
    // Or: { event: "...", payload: {...} }
    // Or: { $id: "...", event: "...", payload: {...} }
    const eventString = eventData.event || eventData.$event || '';
    const document = eventData.payload || eventData.document || eventData.$payload || {};
    
    console.log('📥 Event string:', eventString);
    console.log('📥 Event string length:', eventString.length);
    console.log('📥 Document keys:', Object.keys(document));
    console.log('📥 Document:', JSON.stringify(document, null, 2));

    // If event string is empty, try to extract from other fields
    if (!eventString) {
      console.log('⚠️ Event string is empty, checking alternative fields...');
      console.log('📥 All eventData keys:', Object.keys(eventData));
      
      // Return early with detailed error
      return res.json({ 
        error: 'Event string not found',
        receivedData: eventData,
        message: 'Please check Appwrite function triggers configuration'
      }, 400);
    }

    // Extract collection name from event string
    const collection = extractCollectionFromEvent(eventString);
    console.log('📋 Extracted collection:', collection);
    
    if (!collection) {
      console.error('❌ Could not extract collection from event:', eventString);
      console.error('❌ Event string parts:', eventString.split('.'));
      return res.json({ 
        error: 'Invalid event format',
        eventString: eventString,
        message: 'Event format should be: databases.{dbId}.collections.{collectionId}.documents.{docId}.create'
      }, 400);
    }

    // Determine event type (create or update)
    const eventType = eventString.includes('.create') ? 'create' : 
                     eventString.includes('.update') ? 'update' : null;

    console.log('📋 Event type detection:', {
      eventString: eventString,
      includesCreate: eventString.includes('.create'),
      includesUpdate: eventString.includes('.update'),
      detectedType: eventType
    });

    if (!eventType) {
      console.log('⏭️  Skipping non-create/update event:', eventString);
      return res.json({ 
        message: 'Event type not supported',
        eventString: eventString,
        supportedTypes: ['create', 'update']
      }, 200);
    }

    console.log('📋 Collection:', collection);
    console.log('📋 Event Type:', eventType);
    console.log('📋 Document ID:', document['$id'] || document.id || 'unknown');

    // Build notification
    const notification = buildNotification(collection, document, eventType);
    console.log('📤 Notification built:', JSON.stringify(notification, null, 2));

    // Prepare deep-link data (FCM requires all data values to be strings)
    const deepLinkData = {
      collection: String(collection),
      documentId: String(document['$id'] || document.id || ''),
      event: String(eventType),
      timestamp: new Date().toISOString(),
    };
    console.log('📤 Deep link data:', JSON.stringify(deepLinkData, null, 2));

    // Send FCM notification
    console.log('📤 Attempting to send FCM notification...');
    const result = await sendFCMNotification(
      fcmServerKey,
      notification.title,
      notification.body,
      deepLinkData
    );

    console.log('✅ Notification sent successfully!');
    console.log('✅ FCM Response:', JSON.stringify(result, null, 2));
    
    return res.json({
      success: true,
      notification: notification,
      fcmResponse: result,
      collection: collection,
      eventType: eventType,
      documentId: document['$id'] || document.id || 'unknown',
    }, 200);

  } catch (error) {
    console.error('❌ CRITICAL ERROR:', error.message);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    return res.json({
      error: error.message,
      errorName: error.name,
      stack: error.stack,
      message: 'Function execution failed. Check logs for details.'
    }, 500);
  }
};
