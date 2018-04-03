'use strict';

const mdns = require('./mdns');

function buildLutronController(service) {
console.log('[discover] Device Found');
  return {
    name: service.host,
    host: service.host,
    port: service.port,
    iparray: service.addresses
  };
}

function findFirstLutronController() {
  return mdns.findFirstLutronController()
    .then(buildLutronController);
}

module.exports.discoverOneBridge = function() {
  return findFirstLutronController();
};