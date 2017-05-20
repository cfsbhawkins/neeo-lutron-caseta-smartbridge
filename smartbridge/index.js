'use strict';

const neeoapi = require('neeo-sdk');
const controller = require('./controller');

console.log('NEEO Lutron Caseta Integration');
console.log('------------------------------------------');

const discoveryInstructions = {
  headerText: 'Lutron Caseta SmartBridge SSH Integration',
  description: 'This code will execute commands to the IP address that is set in the lutron.js file, make sure to update this to reflect your network'
};

const casetaSceneDiscovery = neeoapi.buildDevice('Caseta SmartBridge Scenes')
  .setManufacturer('Lutron')
  .addAdditionalSearchToken('SmartBridge')
  .addAdditionalSearchToken('SmartBridge Pro')
  .setType('light')
  .addButton({ name: 'scene-button', label: 'Lutron Scene' })
  .addButtonHander(controller.button)
  .enableDiscovery(discoveryInstructions, controller.discoverScenes);

const casetaDeviceDiscovery = neeoapi.buildDevice('Caseta SmartBridge Devices')
  .setManufacturer('Lutron')
  .addAdditionalSearchToken('SmartBridge')
  .addAdditionalSearchToken('SmartBridge Pro')
  .setType('light')

  .addSlider(
  { name: 'power-slider', label: 'Lutron Dimmer', range: [0, 100], unit: '%' },
  { setter: controller.sliderSet, getter: controller.sliderGet })

  .enableDiscovery(discoveryInstructions, controller.discoverDevices)
  .registerSubscriptionFunction(controller.registerControllerStateUpdateCallback);

function startLutronCaseta(brain) {
  console.log('- Start Lutron Server');
  neeoapi.startServer({
    brain,
    port: 6336,
    name: 'lutron-caseta-ssh',
    devices: [casetaSceneDiscovery, casetaDeviceDiscovery]
  })
    .then(() => {
      controller.startSSH();
    })
    .catch((error) => {
      console.error('ERROR!', error.message);
      process.exit(1);
    });
}

const brainIp = process.env.BRAINIP;
if (brainIp) {
  console.log('- use NEEO Brain IP from env variable', brainIp);
  startLutronCaseta(brainIp);
} else {
  console.log('- discover one NEEO Brain...');
  neeoapi.discoverOneBrain()
    .then((brain) => {
      console.log('- Brain discovered:', brain.name);
      startLutronCaseta(brain);
    });
}
