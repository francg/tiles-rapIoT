import { Component } from '@angular/core';
import { Events } from 'ionic-angular';
import { NavController } from 'ionic-angular';

import { TilesApi } from '../../providers/tilesApi.service';
import { Device, DevicesService } from '../../providers/devices.service';
import { MqttClient } from '../../providers/mqttClient';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
	public devices: Device[];

  constructor(public navCtrl: NavController, 
  						public events: Events,
  						//public tilesApi: TilesApi,
  						private devicesService: DevicesService,
  						private mqttClient: MqttClient) {
  	this.devices = devicesService.getMockDevices();

	  this.events.subscribe('command', (deviceId, command) => {
	    for (let i = 0; i < this.devices.length; i++) {
	      const device = this.devices[i];
	      if (device.id === deviceId) {
	        device.ledOn = (command.name === 'led' && command.properties[0] === 'on');
	        console.log('Device led on: '+device.ledOn);
	        //const commandString = this.tilesApi.getCommandObjectAsString(command);
	        // TODO: Find a replacement for this line
	        //$scope.sendData(device, commandString);
	      };
	    };
	  });

	  this.events.subscribe('offline', () => {
	  	this.mqttClient.setServerConnectionStatus('Client gone offline', false);
	  });

	  this.events.subscribe('close', () => {
	  	this.mqttClient.setServerConnectionStatus('Disconnected from server', false);
	  });

		this.events.subscribe('reconnect', () => {
	  	this.mqttClient.setServerConnectionStatus('A reconnect is started', false);
	  });

		this.events.subscribe('error', (err) => {
	  	this.mqttClient.setServerConnectionStatus('Error: ' + err, false);
	  });
	};

};
