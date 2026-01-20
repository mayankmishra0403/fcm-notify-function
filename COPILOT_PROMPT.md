# GitHub Copilot Prompt: Flutter Notification Permission Setup

## Task
Mujhe Flutter app mein notification permission request system chahiye jo:

1. **App start par automatically notification permission request kare**
2. **User-friendly dialog/prompt show kare** agar permission deny ho
3. **FCM topic 'admins' par subscribe kare** jab permission grant ho
4. **Settings screen open karne ka option de** agar permission permanently denied ho

## Requirements

### Dependencies (pubspec.yaml)
- `firebase_messaging: ^14.7.9`
- `firebase_core: ^2.24.2`
- `permission_handler: ^11.1.0`

### Android Setup
- `android/app/src/main/AndroidManifest.xml` mein `POST_NOTIFICATIONS` permission add karein
- Minimum SDK 21, Target SDK 33+

### iOS Setup
- `ios/Runner/Info.plist` mein `UIBackgroundModes` with `remote-notification` add karein

### Code Requirements

1. **NotificationService class** banao:
   - `initialize()` method jo app start par call ho
   - `requestNotificationPermission()` - Android aur iOS dono ke liye
   - `subscribeToAdminTopic()` - FCM topic 'admins' par subscribe
   - `getFCMToken()` - FCM token get kare
   - Notification handlers setup kare (foreground, background, terminated)

2. **Permission Dialog Widget** banao:
   - Beautiful UI dialog
   - Permission kyu chahiye explain kare
   - "Allow" button
   - "Maybe Later" button
   - Agar permanently denied ho to "Open Settings" button

3. **Main App Integration**:
   - `main()` function mein `NotificationService.initialize()` call karein
   - Home/Login screen par permission status check karein
   - Agar permission nahi hai to dialog show karein

### Features

- ✅ Android 13+ notification permission support
- ✅ iOS notification permission support
- ✅ Automatic FCM topic subscription after permission grant
- ✅ Deep link handling for notification data
- ✅ Foreground notification handling
- ✅ Background notification handling
- ✅ App terminated state notification handling
- ✅ User-friendly permission dialog
- ✅ Settings screen navigation if permanently denied

### Expected Behavior

1. App start hote hi notification permission request dialog show ho
2. User "Allow" click kare to permission grant ho aur FCM topic subscribe ho
3. Agar user "Deny" kare to polite message show kare aur baad mein try karne ka option de
4. Agar permanently denied ho to Settings open karne ka option de
5. Permission grant hone ke baad automatically 'admins' topic par subscribe ho
6. Notification aane par proper handling ho (foreground/background/terminated states)

### Code Style
- Clean code with proper comments
- Error handling for all async operations
- Console logs for debugging
- Hindi/English mixed comments acceptable

### Example Flow
```
App Start → Check Permission → Show Dialog → User Allows → Subscribe to Topic → Ready for Notifications
```

Yeh complete notification permission system banao jo production-ready ho aur user-friendly ho.
