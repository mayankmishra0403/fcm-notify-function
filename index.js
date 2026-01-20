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
  try {
    const fcmServerKey = process.env.FCM_SERVER_KEY;

    if (!fcmServerKey) {
      console.error('❌ FCM_SERVER_KEY not set in function environment');
      return res.json({ error: 'FCM_SERVER_KEY not configured' }, 400);
    }

    // Parse the event payload from Appwrite
    // Appwrite sends: { event: "...", payload: {...} }
    const eventData = req.body || {};
    console.log('📥 Full request body:', JSON.stringify(eventData, null, 2));
    
    // Appwrite event format: databases.{dbId}.collections.{collectionId}.documents.{docId}.create
    const eventString = eventData.event || '';
    const document = eventData.payload || eventData.document || {};
    
    console.log('📥 Event string:', eventString);
    console.log('📥 Document:', JSON.stringify(document, null, 2));

    // Extract collection name from event string
    const collection = extractCollectionFromEvent(eventString);
    
    if (!collection) {
      console.error('❌ Could not extract collection from event:', eventString);
      return res.json({ error: 'Invalid event format' }, 400);
    }

    // Determine event type (create or update)
    const eventType = eventString.includes('.create') ? 'create' : 
                     eventString.includes('.update') ? 'update' : null;

    if (!eventType) {
      console.log('⏭️  Skipping non-create/update event:', eventString);
      return res.json({ message: 'Event type not supported' }, 200);
    }

    console.log('📋 Collection:', collection);
    console.log('📋 Event Type:', eventType);

    // Build notification
    const notification = buildNotification(collection, document, eventType);
    console.log('📤 Sending notification:', notification);

    // Prepare deep-link data (FCM requires all data values to be strings)
    const deepLinkData = {
      collection: String(collection),
      documentId: String(document['$id'] || document.id || ''),
      event: String(eventType),
      timestamp: new Date().toISOString(),
    };

    // Send FCM notification
    const result = await sendFCMNotification(
      fcmServerKey,
      notification.title,
      notification.body,
      deepLinkData
    );

    console.log('✅ Notification sent successfully:', result);
    return res.json({
      success: true,
      notification: notification,
      fcmResponse: result,
      collection: collection,
      eventType: eventType,
    }, 200);

  } catch (error) {
    console.error('❌ Error sending notification:', error);
    console.error('❌ Error stack:', error.stack);
    return res.json({
      error: error.message,
      stack: error.stack,
    }, 500);
  }
};
