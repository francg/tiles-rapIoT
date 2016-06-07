# Tiles Toolkit 

Tiles is an inventor toolbox to support the design and making of interactive objects for learning and play. Tiles allows non-experts to create complex and distributed physical interfaces. For more information visit [tilestoolkit.io](http://tilestoolkit.io)

Tiles allows rapid development of technology-augmented everyday objects (the so-called Internet of Things).

## Fundamentals

Tiles is centered on the concept of 

*Interaction Primitives*, a set of simple interaction events between technology-augmented objects and humans. 

*Input primitives* consist in physical objects manipulation like tapping, rotate or shake. 

*Output primitves* are a set of feedbacks such as LED lights, haptic and sound.

![Interaction Primitive](imgs/primitives.png)

### Squares Modules

In order to enable everyday objects to become interactive and support interaction primitives we developed *Squares*, tiny computers that can be easily sticked anywhere. Square capture input primitives and produce output primitives. They can be recharged using a standard Micro-USB cable. The on/off switch is located on the left side.

![Squares modules](imgs/squares.png)

In order to build applications that make use of interaction primitives captured/produced by square modules within your application we developed a set of software tools called TDT.

### Tiles Development Tools (TDT) v0.1

TDT provides a development environment to facilitate the development of software that make use of sequences of interaction events to implement specific application logic. TDT is composed by 
- **Tiles Cloud** is a cloud infrastructure, and contains real-time APIs and software libraries to enable development and integration of Tile-based interfaces with software applications.
- **Tiles Connect** is a smartphone app for discovery and administration of square modules.
- **Tiles Libraries** enable writeing Tiles application in your preferred programming language.

![alt text](imgs/TDT.png)

#### Tiles Cloud (TC)

Tiles Cloud (TC) provides a centralized, language-agnostic software interface to interact with ecologies of Square modules. It allows developers that are not specialized in writing code for embedded devices to create applications using commonly known languages and tools. Functionalities provided by multiple Square modules attached to several objects, and thus the behaviour of the augmented objects, can be programmed from routines running in a centralized cloud environment; without requiring physical access to the hardware modules. 

A TC server is provided at http://cloud.tilestoolkit.io with administrator interface at http://cloud.tilestoolkit.io:3000
If you want to setup your own Tiles Cloud server follow [these instructions](https://github.com/simonem/tiles-dev-sw/tree/master/Tiles%20CLOUD/api-server)

#### Tiles Connect (TCON)

Tiles connect (TCON) is a software application for smartphones that wirelessly connects Square modules to your application via the TAPI. This is required for the interaction primitives to be captured and exchanged between the Square modules and your application. 

To setup TCON on your smartphone (Android or iPhone) follow [these instructions](https://github.com/simonem/tiles-dev-sw/tree/master/Tiles%20MOBILE). TCON will be soon distributed for beta testing.

#### Tiles Libraries (TL)

Tiles libraries (TL) enable development of Tiles applications. It provides functionalities to connect to TC, send output primitive commands to specific square modules as well as handling input primitives events from the modules.

TL are provided for Python (v00), C++ (v00), Java (v00) and Javascript (v01)

## Build your first Tiles Application

![Tiles Development process](imgs/dev_process.png)

This guide assumes you already have installed the Tiles Connect App on your smartphone and you have one or more Square modules. Ask Simone (simonem@ntnu.no) about how to get them.

### STEP 1

Turn one or more squares on and attach them to objects.

### STEP 2 

Open the Tiles Connect app on your smartphone, and you will be presented with a screen allowing you to connect to the server.

![Tiles Connect App](imgs/tiles_connect_v02.png)

1. Type in your Tiles username. If you don’t have one, it will be automatically created.
2. (Optional) If you have a custom Tiles server, specify the address and port, otherwise, leave the default values.
3. Use pull-to-refresh or the 'Refresh'-button to refresh the list of nearby Bluetooth devices.
4. Connect to a square module by clicking 'Connect'.
5. If you did not connect to a server at startup, or for some other reason need to bring up the server connection screen again, click the button in the upper left corner.

### STEP 3

Write some code in your favourite language, refer to the README files in the libraries pages (Tiles Client) for installation and use. 

We reccomend to write your code in JavaScript following [these instructions](https://github.com/simonem/tiles-dev-sw/tree/master/Tiles%20CLIENTS/js).