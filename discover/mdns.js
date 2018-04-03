'use strict';

const bonjour = require('bonjour')();
const BluePromise = require('bluebird');

const MDNS_NAME = 'lutron';

//TODO add timeout
function findFirstLutronController() {
  return new BluePromise((resolve, reject) => {

    function serviceUpListener(service) {
      if (!service || !service.txt) {
        reject(new Error('INVALID_SERVICE_FOUND'));
      }
      console.log('[mDNS] Found SmartBridge');
      resolve(service);
    }

    const mdnsBrowser = bonjour.findOne({ type: MDNS_NAME }, serviceUpListener);
    mdnsBrowser.start();
  });
}

module.exports.findFirstLutronController = findFirstLutronController;