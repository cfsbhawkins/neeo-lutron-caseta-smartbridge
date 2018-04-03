A new fix is coming soon that should allow this to work again. With the help of some other projects I have found out how to use the TLS Leap Server, it will not be as automatic as this one was. But will provide back the controls we used to have. You will need to run a script to generate an certificate from Lutron's servers. 

According to recent documentation, Lutron changed the LEAP SSH key, and locked us out. I'm researching the alterntive methods that have been discovered and will update the project shortly. In the mean time voice your opinion to Lutron and tell them to support third party developers and allow an offical integration.

# Lutron Caseta Integration for NEEO Thinking Remote

[![npm version](https://badge.fury.io/js/neeo-driver-lutron-caseta-smartbridge.svg)](https://badge.fury.io/js/neeo-driver-lutron-caseta-smartbridge)

This plugin will allow your NEEO Brain to communicate with the Lutron SmartBridge for Caseta Lights. It will find your SmartBridge via Bonjour on you local network.

## Installation Instructions
Package is on npm, you can install with command:
npm i neeo-driver-lutron-caseta-smartbridge

## Running NEEO Driver
Follow neeo instructions if you have more than one driver as this uses the default port.
Browse to node modules directory then to the neeo lutron directory and execute:
npm start

The application will automatically find you Lutron Smartbridge on your network using bonjour as well as your NEEO brain using bonjour. If you are hosting on a windows device make sure to install Apple Bonjour Service.

## NPM Dependencies
- SSH2
- Bluebird
- util
- split
- bonjour
- neeo-sdk

Shout out to:
https://github.com/njschwartz/Lutron-Smart-Pi

For the starting point to this application, without the SSH key we would never had had access to the SmartBridge, since its a closed system.

## Help Wanted
Looking for help on Lamp Dimmer, I do not own one so not sure what it shows up as in the devices call. 
