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

## 📱 Flutter App Setup

### Step 1: Add Dependencies

Add these packages to your `pubspec.yaml`:

```yaml
dependencies:
  firebase_messaging: ^14.7.9
  firebase_core: ^2.24.2
  permission_handler: ^11.1.0
```

Run: `flutter pub get`

### Step 2: Android Configuration

**android/app/src/main/AndroidManifest.xml** mein add karein:

```xml
<manifest>
  <!-- Notification permission for Android 13+ -->
  <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
  
  <application>
    <!-- FCM default notification channel -->
    <meta-data
      android:name="com.google.firebase.messaging.default_notification_channel_id"
      android:value="high_importance_channel" />
  </application>
</manifest>
```

**android/app/build.gradle** mein minimum SDK check karein:

```gradle
android {
    defaultConfig {
        minSdkVersion 21  // At least 21
        targetSdkVersion 33  // Or latest
    }
}
```

### Step 3: iOS Configuration

**ios/Runner/Info.plist** mein add karein:

```xml
<key>UIBackgroundModes</key>
<array>
    <string>remote-notification</string>
</array>
```

### Step 4: Use Notification Service

1. Copy `flutter_notification_setup.dart` file apne Flutter project mein
2. `main.dart` mein initialize karein:

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  await NotificationService.initialize();
  runApp(MyApp());
}
```

3. Login ya home screen par permission request dialog show karein (example code file mein hai)

### Step 5: Test Notification

1. App install karein device par
2. Notification permission allow karein
3. App automatically `admins` topic par subscribe ho jayega
4. Website se query fill karein
5. Notification aana chahiye!

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

### Function Not Executing?

1. **Check Function Triggers:**
   - Go to Appwrite Console → Functions → Your Function → Settings → Events
   - Ensure triggers are added:
     - `databases.*.collections.*.documents.*.create`
     - `databases.*.collections.*.documents.*.update`
   - Or specific database: `databases.{YOUR_DB_ID}.collections.*.documents.*.create`

2. **Check Function Logs:**
   - Go to Appwrite Console → Functions → Your Function → Executions
   - Check if function is being triggered
   - Look for error messages in logs

3. **Verify Environment Variable:**
   - Go to Function Settings → Variables
   - Ensure `FCM_SERVER_KEY` is set correctly
   - Check it's marked as "Secret" if needed

### No Notifications Received?

1. **FCM Server Key:**
   - Verify `FCM_SERVER_KEY` is correct from Firebase Console
   - Go to Firebase Console → Project Settings → Cloud Messaging → Server Key

2. **Device Subscription:**
   - Ensure Flutter app subscribes to topic: `/topics/admins`
   - In Flutter: `FirebaseMessaging.instance.subscribeToTopic('admins')`
   - Check subscription in Firebase Console → Cloud Messaging → Topics
   - **Important:** Notification permission allow karna zaroori hai, warna topic subscribe nahi hoga properly

3. **Check Function Logs:**
   - View execution logs in Appwrite Console
   - Look for "✅ Notification sent successfully" message
   - Check for FCM API errors

4. **Test FCM Directly:**
   - Use Firebase Console → Cloud Messaging → Send test message
   - Send to topic: `admins`
   - If this works, issue is in function. If not, check FCM setup.

### Function Fails?

- Ensure entrypoint is set to `index.js`
- Check runtime is Node.js 18.0 (or latest)
- Verify triggers are configured correctly
- Check build script exists in `package.json`

### Common Issues:

**"FCM_SERVER_KEY not configured"**
- Add environment variable in Appwrite Function settings

**"Could not extract collection from event"**
- Check event format in logs
- Ensure triggers are properly configured

**"FCM request failed"**
- Verify FCM Server Key is correct
- Check Firebase project is active
- Ensure topic exists and devices are subscribed

### Flutter App Issues:

**Notification permission not showing:**
- Check `permission_handler` package properly installed hai
- Android 13+ ke liye `POST_NOTIFICATIONS` permission AndroidManifest mein add karein
- iOS ke liye `Info.plist` properly configured hai

**Notifications not received:**
- Verify notification permission granted hai (Settings mein check karein)
- Check FCM token properly generate ho raha hai
- Ensure `subscribeToAdminTopic()` successfully call hua
- Check app background/foreground state - foreground mein notifications handle karein

**Topic subscription failed:**
- Notification permission allow karein pehle
- Internet connection check karein
- Firebase project properly configured hai
- Check logs: `flutter run` se console logs dekhein

## 📄 License

MIT
