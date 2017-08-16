'use strict';

const BluePromise = require('bluebird');
const lutron = require('./lutron');

module.exports.startSSH = function () {
  lutron.sshConnect;
};

/*
 * Device Controller
 * Events on that device from the Brain will be forwarded here for handling.
 */

module.exports.button = function (deviceid, name) {
  lutron.setScene(deviceid);
};

module.exports.sliderSet = function (deviceid, value) {
  lutron.setDimmer(deviceid, value);
};

module.exports.sliderGet = function (deviceid) {
  return BluePromise.resolve(lutron.getDimmerValue(deviceid));
};

/**
 * Add all scene and device hooks here, they will be used for the devices that are used in discovery
 */
function sharedDeviceDiscovery() {
  return BluePromise.resolve(lutron.getScenesAndDevices());
}

module.exports.discoverScenes = function () {
  return sharedDeviceDiscovery()
    .filter((device) => device.type === 'scene')
    .map((device) => ({
      id: device.id,
      name: device.name
    }));
};

module.exports.discoverDevices = function () {
  return sharedDeviceDiscovery()
    .filter((device) => device.type === 'device')
    .map((device) => ({
      id: device.id,
      name: device.name
    }));
};

module.exports.registerStateUpdateCallback = function (updateFunction) {
  lutron.registerLutronStateUpdateCallback(updateFunction);
};