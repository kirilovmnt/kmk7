The project is tested in web environment, on Android (4.2+) and iOS mobile devices. To open in a browser, use the www folder and serve the content from a web server. No additional steps for installation required.
Steps for installation as a mobile app:

1. on Android using prepared apk:

Download platforms\android\build\outputs\apk\android-debug.apk on the phone
Install the .apk package

2. using Ionic CLI for Android/iOS:

  1. install Ionic (instructions here: http://ionicframework.com/docs/guide/installation.html)
  2. use commands:

    ionic add platform android [or ios respecitvely]
    
    ionic build android [or ios]
    
    ionic run android [or ionic emulate ios]
   
