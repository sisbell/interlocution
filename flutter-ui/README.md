# Interlocution UI

## Building
Build for Release
```shell
flutter build web --release
```

# Accounts

Verify that you are using correct account

```shell
firebase login:list
```

If you don't see your account, add it
```shell
firebase login:add
```
This will take you to a browser to login and verify your account.

# Setting up Firebase Hosting

```shell
firebase experiments:enable webframeworks
```

Initialize
```shell
firebase init
```
Choose the hosting firebase option, followed by selecting your firebase project. 

# Deploying to Firebase Hosting
```shell
flutter build web --release
firebase deploy
```

### Run
Run the following on the command-line from the flutter-ui directory

```shell
flutter run -d chrome --web-port=5050 --dart-define=ENV=dev lib/main.dart 
```

## Resources
More detailed instructions can be found
https://firebase.google.com/docs/hosting/frameworks/flutter