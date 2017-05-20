'use strict';

const util = require('util');
const SSHClient = require('ssh2').Client;
const BluePromise = require('bluebird');
const split = require('split');

//app constants
const SSH_USER = 'leap';
const OFF = 0;
const ON = 100;

//todo autodisover, for now enter the ip of your SmartBridge or SmartBridge Pro
let SMARTBRIDGE_IP = '10.0.1.102'

//JSON command files
const getDeviceJson = require('./json/get_devices.json');
const getSceneJson = require('./json/get_scenes.json');
const getDeviceStatusJson = require('./json/get_status.json');
const setDeviceJson = require('./json/set_device.json');
const setSceneJson = require('./json/set_scene.json');


let sshConnected = false;
let shell;
let sendComponentUpdate;
let devicesAndScenes = [];
let sshCommands = [];
let commandExecuting = false;
/*
* SSH Connection, this is called after neeo brain has been connected
*/
module.exports.sshConnect = function () {
  console.log('[Lutron] Start SSH Client');
  let sshConn = new SSHClient();
  sshConn.on('ready', function () {
    sshConnected = true;
    console.log('[Lutron] SSH Connected');
    sshConn.shell(function (err, stream) {
      if (err) throw err;
      stream.on('close', function () {
        console.log('[Lutron] SSH Closed');
        sshConnected = false;
        sshConn.end();
      })
        .pipe(split())
        .on('data', function (data) {
          parseSSHData(data);
          //process any queued up commands 
          if (sshCommands.length > 0) {
            stream.write(sshCommands.shift());
          } else {
            commandExecuting = false;
          }
        })
      shell = stream;
    });
  })
    .connect({
      host: SMARTBRIDGE_IP,
      port: 22,
      username: SSH_USER,
      privateKey: require('fs').readFileSync('./smartbridge/key/rsa_key')
    });
};

/*
* Action callbacks for Neeo Events from Scenes or Devices
*/
module.exports.getScenesAndDevices = function () {
  return Promise.resolve()
    .then(function () {
      devicesAndScenes = [];
      executeCommand(JSON.stringify(getDeviceJson));
      executeCommand(JSON.stringify(getSceneJson));
    }).then(() => sleep(2000))
    .then(function () {
      return devicesAndScenes;
    });
};

module.exports.setSwitch = function (deviceid, value) {
  let currentValue = false;
  let cloned = Object.assign({}, setDeviceJson);
  cloned.Header.Url = util.format('/zone/%s/commandprocessor', deviceid);
  if (Value) {
    cloned.Body.Command.Parameter[0].Value = OFF;
  } else {
    cloned.Body.Command.Parameter[0].Value = ON;
  }
  executeCommand(JSON.stringify(cloned));
};

module.exports.setDimmer = function (deviceid, value) {
  let cloned = Object.assign({}, setDeviceJson);
  cloned.Header.Url = util.format('/zone/%s/commandprocessor', deviceid);
  cloned.Body.Command.Parameter[0].Value = parseInt(value);
  executeCommand(JSON.stringify(cloned));
};

module.exports.setScene = function (deviceid) {
  let cloned = Object.assign({}, setSceneJson);
  cloned.Header.Url = util.format('/virtualbutton/%s/commandprocessor', deviceid);
  executeCommand(JSON.stringify(cloned));
};

module.exports.registerLutronStateUpdateCallback = function (updateFunction) {
  sendComponentUpdate = updateFunction;
};

module.exports.getDimmerValue = function (deviceid) {
  let cloned = Object.assign({}, getDeviceStatusJson);
  cloned.Header.Url = util.format('/zone/%s/status', deviceid);
  executeCommand(JSON.stringify(cloned));
};

/*
* Helper Functions
*/

function sleep(time) {
  return new Promise(resolve => {
    setTimeout(resolve, time)
  })
}

function executeCommand(command) {
  if (sshConnected) {
    sshCommands.push(command + '\n');
    if (!commandExecuting) {
      commandExecuting = true;
      shell.write(sshCommands.shift());
    }
  }
}

function parseSSHData(data) {
  // console.log('[Lutron] Receive Command: ' + data);
  let json = JSON.parse(data.toString('utf8'));
  if (json.CommuniqueType == 'ReadResponse') {
    if (json.Header.StatusCode == '200 OK') {
      if (json.Header.MessageBodyType == 'MultipleDeviceDefinition') {
        for (var device of json.Body.Devices) {
          //we want to ignore picos, the smart bridge, other devices...
          if (device.DeviceType == 'WallDimmer') {
            parseDevice(device);
          }
          //todo add lamp dimmer, not sure what it shows up as
        }
      } else if (json.Header.MessageBodyType == 'MultipleVirtualButtonDefinition') {
        //this will return alot of scenes, seems there might be a limit on scenes
        for (var virtualButton of json.Body.VirtualButtons) {
          if (virtualButton.IsProgrammed) {
            //this is a programmed scene, 
            parseScene(virtualButton);
          }
        }
      } else if (json.Header.MessageBodyType == 'OneZoneStatus') {
        //realtime response
        parseEvent(json);
      } else {
        console.log('[Lutron] Unknown Body Type: ' + json.Header.MessageBodyType);
      }
    } else {
      console.log('[Lutron] Header Error: ' + json.Header.StatusCode);
    }
  } else {
    console.log('[Lutron] Not Read Response: ' + json.CommuniqueType);
  }
}

function parseDevice(deviceJson) {
  let device = {
    id: 'some_id',
    name: 'some name',
    type: 'device'
  };

  device.name = deviceJson.Name;
  device.id = parseInt(deviceJson.LocalZones[0].href.split('/')[2]); //last index of /
  devicesAndScenes.push(device);
}

function parseScene(sceneJson) {
  let scene = {
    id: 'some_id',
    name: 'some name',
    type: 'scene'
  };

  scene.name = sceneJson.Name;
  scene.id = sceneJson.ButtonNumber + 1; //the offset is by one
  devicesAndScenes.push(scene);
}

function parseEvent(eventJson) {
  let level = eventJson.Body.ZoneStatus.Level;
  let zone = parseInt(eventJson.Body.ZoneStatus.Zone.href.split('/')[2]);

  if (!sendComponentUpdate) {
    console.log('[Lutron] update function not yet registered');
    return;
  }

  const updatePayload = {
    uniqueDeviceId: zone,
    component: 'power-slider',
    value: level
  };

  sendComponentUpdate(updatePayload)
    .catch((error) => {
      console.log('[Lutron] failed to send slider notification', error.message);
    });
}