import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Events } from 'ionic-angular';
import mqtt from 'mqtt';
/*
interface MqttClientInterface {

	connect: (host: string, port: string) => Observable((observer: any) => void);
	registerDevice: (device: any) => void;
	unregisterDevice: (device: any) => void;
	sendEvent: (deviceId: string, event: any) => void;
	endConnection: (deviceId: string, event: any) => void;
}*/

@Injectable()
export class MqttClient {
  publishOpts = { retain: true };
  serverConnectionTimeout = 10000; // 10 seconds  
  client;


  constructor(public events: Events) {
  };



  /* Returns a url for the specific device
	 * @param deviceId: String
	 * @param isEvent: Boolean
   */
  getDeviceSpecificTopic(deviceId: string, isEvent: boolean): string {
  	// TODO: NB! temporary, remove when tilesApi class is up!!
  	const tilesApi = {username: 'user'}
  	const type = isEvent ? 'evt' : 'cmd';
  	return 'tiles/' + type + '/' + tilesApi.username + '/' + deviceId;
  };


  /* Create a connection to the server and
   * return a javascript promise 
   */
  connect = (host: string, port: string) => {
  	return new Observable( observer => {

  		// Check if a previous server connection exists
  		// and end it if it does
  		if (this.client) {
  			this.client.end();
  		};

  		
  		// Instantiate a mqtt-client from the host and port
  		// keepalive 0 disables keepalive
  		this.client = mqtt.connect({
  			host: host, 
  			port: port,
				keepalive: 0 
  		});


  		// Handlers for different types of responses from the server: 

  		// Client is connected to the server
  		this.client.on('connect', () => {
  			clearTimeout(this.serverConnectionTimeout);
  			observer.complete();
  		});

  		// Handle a message from the server
  		this.client.on('message', (topic, message) => {
  			console.log('Received message from server: ' + message);
  			try {
  				const command = JSON.parse(message);
  				if (command) {
  					const deviceId = topic.split('/')[3];
            this.events.publish('command', deviceId, command);
  			  };
        } finally {};
  		});

  		this.client.on('offline', () => {
        this.events.publish('offline');
	    });

	    this.client.on('close', () => {
	      this.events.publish('close');
	    });

	    this.client.on('reconnect', () => {
	      this.events.publish('reconnect');
	    });

	    this.client.on('error', error => {
	      this.events.publish('error', error);
	    });
  	});
  };


  // The functions called on the client comes from the mqtt-library,
  // API reference can be found at https://github.com/mqttjs/MQTT.js
	registerDevice = device => {
		if (this.client) {

			this.client.publish(
				this.getDeviceSpecificTopic(device.id, true) + '/active', 
				'true', 
				this.publishOpts
			);

      this.client.publish(
      	this.getDeviceSpecificTopic(device.id, true) + '/name', 
      	device.name, 
      	this.publishOpts
      );

      this.client.subscribe(
      	this.getDeviceSpecificTopic(device.id, false)
      );

      console.log('Registered device: ' + device.name + ' (' + device.id + ')');
  	};
	};

  unregisterDevice = device => {
    if (this.client) {

      this.client.publish(
      	this.getDeviceSpecificTopic(device.id, true) + '/active', 
      	'false', 
      	this.publishOpts
      );

      this.client.unsubscribe(
      	this.getDeviceSpecificTopic(device.id, false)
      );
    };
  };

  sendEvent = (deviceId, event) => {
    if (this.client) {

    	this.client.publish(
    		this.getDeviceSpecificTopic(deviceId, true), 
    		JSON.stringify(event), 
    		this.publishOpts
    	);
    };
  };

  endConnection = (deviceId, event) => {
    if (this.client) {
    	this.client.end()
    };
  };

}