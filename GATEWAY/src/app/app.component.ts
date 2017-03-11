import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { AppVersion, StatusBar, Splashscreen } from 'ionic-native';

import { TabsPage } from '../pages/tabs/tabs';

//TODO: Update this to match the app.js from the old version
@Component({
  templateUrl: 'app.html'
})

export class Tiles {
  rootPage = TabsPage;
  appVersion: any;

  constructor(platform: Platform) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.

      // Copy-pasted code from the old version (www/js/app.js)
      /*
      if(window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      }
      if(window.StatusBar) {
        StatusBar.styleDefault();
      }

      cordova.plugins.backgroundMode.setDefaults({
        title:  'Tiles Mobile',
        ticker: 'Tiles Mobile',
        text:   'Running in background'
      });
      */

      this.appVersion = AppVersion.getVersionNumber().then(res => JSON.stringify(res));

      StatusBar.styleDefault();
      Splashscreen.hide();
    });
  }
}