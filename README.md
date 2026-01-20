# FCM Notify Function

Appwrite Function to send Firebase Cloud Messaging (FCM) push notifications to admin devices when database events occur.

## 🚀 Features

- Listens to all database collection events (create/update)
- Sends push notifications to `/topics/admins` FCM topic
- Supports 11 collections with custom notification messages
- Includes deep-link data for navigation

## 📦 Deployment

### Step 1: Create GitHub Repository

1. Create a new GitHub repository (e.g., `fcm-notify-function`)
2. Push this folder to GitHub:

```bash
cd fcm-notify-function
git init
git add .
git commit -m "Initial commit: FCM notification function"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/fcm-notify-function.git
git push -u origin main
```

### Step 2: Deploy to Appwrite

1. Go to Appwrite Console → Functions
2. Click "Create Function"
3. Select **"Git"** as deployment method
4. Connect your GitHub repository
5. Configure:
   - **Name**: FCM Notify
   - **Runtime**: Node.js 18.0
   - **Entrypoint**: `index.js`
   - **Branch**: `main`

### Step 3: Set Environment Variable

1. In Function settings → Variables
2. Add variable:
   - **Key**: `FCM_SERVER_KEY`
   - **Value**: Your Firebase Server Key from Firebase Console
   - **Mark as Secret**: Yes

### Step 4: Configure Triggers

Add these event triggers in Function settings:

- `databases.*.collections.*.documents.*.create`
- `databases.*.collections.*.documents.*.update`

Or use the patterns:
- `databases.68e80af6002ace58d8e1.collections.*.documents.create`
- `databases.68e80af6002ace58d8e1.collections.*.documents.update`

## 🔑 Get FCM Server Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings (⚙️ icon)
4. Navigate to **Cloud Messaging** tab
5. Copy **Server Key** (Legacy API)

## 📱 Supported Collections

| Collection | Create Icon | Update Icon |
|-----------|-------------|-------------|
| bookings | 📅 | ✏️ |
| contactmessages | 📧 | ✏️ |
| tablebookings | 🍽️ | ✏️ |
| banquetenquiries | 🎉 | ✏️ |
| roomblocks | 🚫 | ✏️ |
| rooms | 🛏️ | ✏️ |
| housekeeping | 🧹 | ✏️ |
| guests | 👤 | ✏️ |
| payments | 💳 | ✏️ |
| reports | 📊 | ✏️ |
| users | 👨‍💼 | ✏️ |

## 🧪 Testing

After deployment, test by:

1. Creating a new document in any collection
2. Check Function Executions in Appwrite Console
3. Verify notification received on admin device

## 📝 Logs

View execution logs in Appwrite Console → Functions → FCM Notify → Executions

## 🛠️ Troubleshooting

**No notifications?**
- Verify FCM_SERVER_KEY is set correctly
- Check device is subscribed to `/topics/admins`
- View function execution logs for errors

**Function fails?**
- Ensure entrypoint is set to `index.js`
- Check runtime is Node.js 18.0
- Verify triggers are configured

## 📄 License

MIT
