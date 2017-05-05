
import { Injectable } from '@angular/core';
import { BLE } from '@ionic-native/ble';
import { Diagnostic } from '@ionic-native/diagnostic';
import { Alert, AlertController, Events, Platform } from 'ionic-angular';
import { Observable, Subscription } from 'rxjs';
import 'rxjs/add/operator/toPromise';

import { DevicesService }from './devices.service';
import { MqttClient } from './mqttClient';
import { TilesApi  } from './tilesApi.service';
import { CommandObject, Device, UtilsService } from './utils.service';


@Injectable()
export class BleService {
  public bleScanner: Subscription;
  public errorAlert: Alert;
  private rfduino = {
    disconnectCharacteristicUUID: '2223',
    receiveCharacteristicUUID: '2221',
    sendCharacteristicUUID: '2222',
    serviceUUID: '2220',
  };

  constructor(private alertCtrl: AlertController,
              private diagnostic: Diagnostic,
              private events: Events,
              private platform: Platform,
              public ble: BLE,
              public devicesService: DevicesService,
              public mqttClient: MqttClient,
              public tilesApi: TilesApi,
              public utils: UtilsService) {
    this.errorAlert = this.alertCtrl.create({
      buttons: [{
        text: 'Dismiss',
      }],
      enableBackdropDismiss: true,
      subTitle: 'An error occured when trying to communicate to ' +
                      'the tile via Bluetooth Low Energy.',
      title: 'Bluetooth error',
    });
  }

  /**
   * Start the BLE scanner making it scan every 7,5s
   */
  public startBLEScanner = (): void => {
    this.checkBleEnabled().then(res => {
      this.bleScanner = Observable.interval(6000).subscribe(scanResult => {
        this.scanBLE();
      });
    }).catch(err => {
      this.errorAlert.present();
    });
  }

  /**
   * Stop the BLE scanner
   */
  public stopBLEScanner = (): void => {
    if (this.bleScanner !== undefined) {
      this.bleScanner.unsubscribe();
    }
  }

  /**
   * Checking if bluetooth is enabled and enable on android if not
   */
  public checkBleEnabled = (): Promise<boolean> => {
    return this.ble.isEnabled().then( res => {
              if (!this.platform.is('ios')) {
                // Checking if location is turned on will not work for ios
                this.checkLocation();
              }
              return true;
            }).catch( err => {
              if (!this.platform.is('ios')) {
                // Enable will not work for ios
                this.ble.enable().then( res => {
                    this.checkLocation();
                    return true;
                  }).catch( errEnable => {
                    return Promise.reject('ble failed to enable');
                  });
              } else {
                return Promise.reject('ble not enabled');
              }
            });
  }

  /**
   * Connect to a device
   * @param {Device} device - the target device
   */
  public connect = (device: Device): void => {
    this.ble.connect(device.id)
        .subscribe(
          res => {
            device.connected = true;
            this.startDeviceNotification(device);
            this.mqttClient.registerDevice(device);
            this.devicesService.newDevice(device);
          },
          err => {
            this.devicesService.clearDisconnectedDevices();
            this.disconnect(device);
          });
  }

  /**
   * Connect and rename a device
   * @param {Device} device - the target device
   */
  public locate = (device: Device): void => {
    this.ble.connect(device.id)
        .subscribe(
          res => {
            this.sendData(device, 'led,on,red');
            setTimeout(() => {
              this.sendData(device, 'led,off').then(res => {
                if (!device.connected) {
                  this.disconnect(device);
                }
              })
            }, 3000);
          },
          err => {
            this.errorAlert.present();
          });
  }

  /**
   * Disconnect from device
   * @param {Device} device - the target device
   */
  public disconnect = (device: Device): void => {
    this.ble.disconnect(device.id)
            .then( res => {
              device.connected = false;
              this.mqttClient.unregisterDevice(device);
              this.devicesService.clearDisconnectedDevices();
              console.log('diconnected from device: ' + device.name);
            })
            .catch( err => {
              console.log('Failed to disconnect');
            });
  }

  /**
   * Send data to a device using BLE
   * @param {Device} device - the target device
   * @param {string} dataString - the string of data to send to the device
   */
  public sendData = (device: Device, dataString: string): Promise<any> => {
    try {
      const dataArray = this.utils.convertStringtoBytes(dataString);
      // Attempting to send the array of bytes to the device
      return this.ble.writeWithoutResponse(device.id,
                               this.rfduino.serviceUUID,
                               this.rfduino.sendCharacteristicUUID,
                               dataArray.buffer)
              .then( res => true)
              .catch( err => {
                this.errorAlert.present();
                return false;
              });
    } catch (err) {
      this.errorAlert.present();
      return new Promise( (res, err) => {
        err('error sending');
      });
    }
  }

  /**
   * Checking to see if any bluetooth devices are in reach
   */
  public scanBLE = (): void => {
    // A list of the discovered devices
    const virtualTiles = this.tilesApi.getVirtualTiles();
    this.devicesService.clearDisconnectedDevices();
    this.ble.scan([], 5).subscribe(
      // function to be called for each new device discovered
      bleDevice => {
        if (this.tilesApi.isTilesDevice(bleDevice)) {
          this.devicesService.convertBleDeviceToDevice(bleDevice).then( device => {
            if (virtualTiles.filter(tile => tile.tile !== null)
                            .map(tile => tile.tile.name)
                            .includes(device.tileId)) {
              this.connect(device);
            } else {
            }
            this.devicesService.newDevice(device);
            this.mqttClient.registerDevice(device);
          });
        }
      },
      err => {
        this.errorAlert.present();
      });
  }

  /**
   * Start getting notifications of events from a device
   * @param {Device} device - the id from the target device
   */
  public startDeviceNotification = (device: Device): void => {
    this.ble.startNotification(device.id, this.rfduino.serviceUUID, this.rfduino.receiveCharacteristicUUID)
      .subscribe(
        res => {
          device.connected = true;
          device.lastDiscovered = (new Date()).getTime();
          const responseString = ((String.fromCharCode.apply(null, new Uint8Array(res))).slice(0, -1)).trim();
          const message: CommandObject = this.utils.getEventStringAsObject(responseString);
          if (message === null) {
            console.log('Couldnt make an object from event: ' + responseString);
          } else {
            this.mqttClient.sendEvent(device.tileId, message);
            this.events.publish('recievedEvent', device.tileId, message);
          }
        },
        err => {
          this.errorAlert.present();
        },
        () => { // called when the device disconnects
          device.connected = false;
          this.devicesService.clearDisconnectedDevices();
          this.mqttClient.unregisterDevice(device);
        });
  }

  private checkLocation = (): void => {
    this.diagnostic.isLocationEnabled().then(diagnosticRes => {
        if (diagnosticRes) {
          this.scanBLE();
        } else {
          alert('Location is not activated, please activate it.');
          this.diagnostic.switchToLocationSettings();
        }
      });
  }
}
