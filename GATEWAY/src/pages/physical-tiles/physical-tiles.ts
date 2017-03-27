import { Component } from '@angular/core';
import { AlertController, Events, NavController } from 'ionic-angular';
import { BleService } from '../../providers/ble.service';
import { DevicesService } from '../../providers/devices.service';
import { Device } from '../../providers/utils.service';


@Component({
  selector: 'page-physical-tiles',
  templateUrl: 'physical-tiles.html',
})
export class PhysicalTilesPage {
  devices: Device[];
  serverConnectStatusMsg: string;
  statusMsg: string;
  public refreshed = true;

  constructor(public navCtrl: NavController,
              public alertCtrl: AlertController,
              private events: Events,
              private bleService: BleService,
              private devicesService: DevicesService) {
    this.setDevices();
    this.events.subscribe('offline', () => {
      this.serverConnectStatusMsg = 'Client gone offline';
    });
    this.events.subscribe('updateDevices', () => {
      this.setDevices();
    });
  }

  /**
   * Set the devices equal to the devices from devicesservice
   */
  setDevices = (): void => {
    this.devices = this.devicesService.getDevices();
  }

  /**
   * Called when the refresher is triggered by pulling down on the view of
   * the devices. TODO: Not sure if needed when refresh is done every 30s anyways.
   */
  refreshDevices = (refresher): void => {
    console.log('Scanning for more devices...');
    this.bleService.scanForDevices();
    //Makes the refresher run for 2 secs
    setTimeout(() => {
      refresher.complete();
      if (this.devices.length > 0) {
        this.refreshed = false;
      } else {
        this.refreshed = true;
      }
    }, 2000);
  };

  /**
   * Triggers an event on a tile to identify which tile is which
   * @param {Device} device - A tile
   */
  identifyDevice = (device: Device): void => {
    this.bleService.sendData(device, 'led,on,red');
    setTimeout(() => (this.bleService.sendData(device, 'led,off')), 3000);
  }

  /**
   * Called when the rename button is pushed on the view of the the
   * the devices.
   * @param {Device} device - the target device
   */
  changeNamePop = (device: Device): void => {
    this.alertCtrl.create({
      title: 'Change tile name',
      inputs: [{
        name: 'newName',
        placeholder: 'New name',
      }],
      buttons: [{
        text: 'Cancel',
        role: 'cancel',
      },
      {
        text: 'Rename',
        handler: data => {
          this.devicesService.setCustomDeviceName(device, data.newName);
        },
      }],
    }).present();
  }
}