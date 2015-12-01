/*
 * Copyright (c) 2015 Samsung Electronics Co., Ltd All Rights Reserved
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

var callback_ = null;
extension.setMessageListener(function(json) {
  var msg = JSON.parse(json);
  if (msg['cmd'] == 'ScreenStateChanged') {
    if (callback_) {
      callback_(msg['prev_state'], msg['new_state']);
    }
  }
});

/**
 * This class provides functions to request and release power resource.
 * @constructor
 */
function PowerManager() {
  // constructor of PowerManager
}

/**
 * Requests the minimum-state for a power resource.
 * @param {!PowerResource} resource The power resource for which the request
 *     is made.
 * @param {!PowerState} state The minimal state in which the power resource
 *     is desired to be.
 */
PowerManager.prototype.request = function(resource, state) {
  if (PowerResource.indexOf(resource) < 0 || PowerState.indexOf(state) < 0) {
    throw "TypeMismatch Error";
  }

  var args = {
    'cmd': 'request',
    'resource': resource,
    'state': state
  };

  extension.postMessage(JSON.stringify(args));
};

/**
 * Releases the power state request for the given resource.
 * @param {!PowerResource} resource The resource for which requests are to
 *     be removed.
 */
PowerManager.prototype.release = function(resource) {
  if (PowerResource.indexOf(resource) < 0) {
    throw "TypeMismatch Error";
  }

  var args = {
    'cmd': 'release',
    'resource': resource
  };

  extension.postMessage(JSON.stringify(args));
};

/**
 * Sets the screen state change callback and monitors its state changes.
 * @param {!function} listener The screen state change callback.
 */
PowerManager.prototype.setScreenStateChangeListener = function(listener) {
  callback_ = listener;
};

/**
 * Unsets the screen state change callback and stop monitoring it.
 */
PowerManager.prototype.unsetScreenStateChangeListener = function() {
  callback_ = null;
};

/**
 * Gets the screen brightness level of an application, from 0 to 1.
 * @return {number} Current screen brightness value.
 */
PowerManager.prototype.getScreenBrightness = function() {
  var args = {
    'cmd': 'getScreenBrightness'
  };
  var ret = extension.internal.sendSyncMessage(JSON.stringify(args));
  if (ret == "ERR")
    return false;
  else
    return parseFloat(ret);
}

/**
 * Sets the screen brightness level for an application, from 0 to 1.
 * @param {!number} brightness The screen brightness value to set.
 */
PowerManager.prototype.setScreenBrightness = function(brightness) {
  var args = {
    'cmd': 'setScreenBrightness',
    'brightness': brightness
  };
  extension.postMessage(JSON.stringify(args));
}

/**
 * Returns true if the screen is on.
 * @return {boolean} true if screen is on.
 */
PowerManager.prototype.isScreenOn = function() {
  var args = {
    'cmd': 'isScreenOn'
  };
  var ret = extension.internal.sendSyncMessage(JSON.stringify(args));
  return (ret == 'true')
}

/**
 * Restores the screen brightness to the system default setting value.
 */
PowerManager.prototype.restoreScreenBrightness = function() {
  var args = {
    'cmd': 'restoreScreenBrightness'
  };
  extension.postMessage(JSON.stringify(args));
}

/**
 * Turns on the screen.
 */
PowerManager.prototype.turnScreenOn = function() {
  var args = {
    'cmd': 'turnScreenOn'
  };
  extension.postMessage(JSON.stringify(args));
}

/**
 * Turns off the screen.
 */
PowerManager.prototype.turnScreenOff = function() {
  var args = {
    'cmd': 'turnScreenOff'
  };
  extension.postMessage(JSON.stringify(args));
}
