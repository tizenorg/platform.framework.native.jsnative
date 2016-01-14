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

/*
 * @module tizen-notification
 * The Tizen Native JS Notification Module.
 *
 * ```
 * var AppControl = require('tizen-app-control');
 * var appControl = new AppControl(AppControl.OPERATION_DEFAULT);
 *
 * var Manager = require('tizen-notification');
 * var dictionary1 = { 'title': 'Noti1',
 *                     'content': 'Noti1 content',
 *                  };
 * 
 * var myNoti1 = new Manager.Notification(dictionary1);
 * var ledBlinkPeriod = {'ledOnPeriod': 110, 'ledOffPeriod': 100};
 * myNoti1.setLed("LED_ON", ledBlinkPeriod);
 * myNoti1.setAction(appControl, "org.tizen.message");
 * Manager.post(myNoti1);
 * console.log('The pkgname of myNoti1 is : ' + Manager.getPkgname(myNoti1.id));
 * console.log('Insertion time of myNoti1: ' + myNoti1.insertTime);
 * 
 * var dictionary2 = { 'title': 'Noti2',
 *                     'content': 'Ongoing content'
 *                   };
 * var myNoti2 = new Manager.OnGoingNotification(dictionary2);
 * myNoti2.setAction(appControl, "app");
 * myNoti2.progressPercentage = 0.1; 
 * Manager.post(myNoti2);
 *
 *  Manager.getNotification(myNoti2.id)
 *   .then(function(loadedNoti) {
 *     var util = require('util');
 *     loadedNoti.progressPercentage = 0.5;
 *     loadedNoti.content = 'New OnGoing contents';
 *     Manager.update(loadedNoti);
 *   });
 *
 * var myNoti3 = new Manager.ActiveNotification(dictionary1);
 * myNoti3.title = 'ActiveNoti';
 * myNoti3.content = 'Hello Tizen!'
 * myNoti3.autoRemove = "FALSE";
 * myNoti3.addButton('BUTTON1', 'Call', appControl);
 * myNoti3.addButton('BUTTON2', 'Reply', appControl);
 * myNoti3.addButton('BUTTON3', 'View', appControl);
 * // myNoti3.removeButton('BUTTON1');
 * Manager.post(myNoti3);
 * 
 * // Manager.remove(myNoti1);
 * // Manager.removeAll();
 * 
 * var message = 'The Status Message Posted';
 * Manager.postStatusMessage(message);
 *
 * ```
 */

'use strict';

var async_message_id = 0;
var async_map = new Map();

function native_sync_call(method, parameter) {
  var args = {};
  args['cmd'] = method;
  args = Object.assign(args, parameter);
  try {
    return JSON.parse(extension.internal.sendSyncMessage(JSON.stringify(args)));
  } catch (e) {
    console.log(e.message);
    return {};
  }
}

function native_async_call(method, parameter, cb) {
  var args = {};
  args['cmd'] = method;
  args = Object.assign(args, parameter);
  var asyncid = async_message_id++;
  args['asyncid'] = 'asynid_' + asyncid;
  async_map.set(args['asyncid'], cb);
  extension.postMessage(JSON.stringify(args));
}

function registerEventHandler(app) {
  var handler = (function(self) {
    return function(json) {
      var msg = JSON.parse(json);
      if (msg['asyncid'] && async_map.has(msg['asyncid'])) {
        var cb = async_map.get(msg['asyncid']);
        async_map.delete(msg['asyncid']);
        cb(msg);
      } else {
        console.log('cb is not function');
      }
    };
  })(app);
  extension.setMessageListener(handler);
}

/**
* A notification is a message that is displayed on the notification area or
* the on-going area. It is created to notify information to the user through
* the application. This API provides functions for creating and inserting and
* updating notification.
* An instance of this class is created by using a constructor with one input
* parameter which is the type of the notification.
*
* @class Notification
* @constructor
* @param {Object} [dictionary] The properties to offers additional arrtibutes
* to represent a notification.
* @throws
* * TypeError - if the parameter is invalid
* * OutofMemoryError - Out of memory
* @since 3.0
*/

class Manager {
  constructor() {
    registerEventHandler(this);
  }

  post(notification) {
    console.log('Manager post() method');
    if (!notification) {
      console.log('Invalid parameter, notification is missing');
      return;
    }

    console.log('input notification to post:');
    var util = require('util');
    console.log(util.inspect(notification, {showHidden: false, depth: null}));

    var result = native_sync_call('post', notification);
    if (result['result'] == 'FAIL') {
      console.log(result['reason']);
    }
    if (result['result'] == 'OK') {
      notification.id_ = result['id'];
      console.log('The posted notification id : ' + notification.id);
      notification.insertionTime_ = new Date(result['insertionTime']) || new Date();
      console.log('post: OK');
    }
  }

  update(notification) {
    console.log('Manager update() method');
    if (!notification) {
      console.log('Invalid parameter, notification is missing');
      return;
    }

    var result = native_sync_call('update', notification);
    if (result['result'] == 'FAIL') {
      console.log(result['reason']);
    }
    if (result['result'] == 'OK') {
      notification.insertionTime_ = new Date(result['insertionTime']) || new Date();
      console.log('update: OK');
    }
  }

  remove(notificationOrId) {
    console.log('Manager remove() method');
    if (!notificationOrId) {
      console.log('Invalid parameter, notificationOrId is missing');
      return;
    }
    var args = {};
    if (notificationOrId instanceof Notification) {
      args['id'] = notificationOrId.id;
    } else {
      args['id'] = notificationOrId;
    }

    var result = native_sync_call('remove', args);
    if (result['result'] == 'FAIL') {
      console.log(result['reason']);
    }
    if (result['result'] == 'OK') {
      console.log('remove: OK');
    }
  }

  removeAll() {
    console.log('Manager removeAll() method');
    var result = native_sync_call('removeAll');
    if (result['result'] == 'FAIL') {
      console.log(result['reason']);
    }
    if (result['result'] == 'OK') {
      console.log('removeAll: OK');
    }
  }

  getPkgname(notification_id) {
    console.log('Manager getPkgname() method');
    var args = {};
    args['id'] = notification_id;
    var result = native_sync_call('getPkgname', args);
    if (result['result'] == 'FAIL') {
      console.log(result['reason']);
    }
    if (result['result'] == 'OK') {
      console.log('getPkgname: OK');
      return result['pkgname'];
    }
  }

  getNotification(notification_id) {
    console.log('Manager getNotification() method');
    return new Promise(function(resolve, reject) {
      var args = {'id': notification_id};
      console.log('Notification id to get : ' + notification_id);
      native_async_call('getNotification', args, function(result) {
        if (result['result'] == 'OK') {
          delete result.result;
          delete result.asyncid;
          var insertedTime = result['insertionTime'];
          delete result.insertionTime;

          var ret;
          if (result['type'] == 'TYPE_ACTIVE') {
            delete result.type;
            ret = new ActiveNotification(result);
          } else if (result['type'] == 'TYPE_ONGOING') {
            delete result.type;
            ret = new OnGoingNotification(result);
          }  else if (result['type'] == 'TYPE_NOTI') {
            delete result.type;
            ret = new Notification(result);
          }
          ret.insertionTime_ = new Date(insertedTime);
          ret.id_ = notification_id;
          resolve(ret);
          console.log('get: OK');
        } else {
          reject(new Error(result['reason']));
        }
      });
    });
  }

  postStatusMessage(message) {
    console.log('Manager postStatusMessage() method');
    var args = {};
    args['message'] = message;
    var result = native_sync_call('postStatusMessage', args);
    if (result['result'] == 'FAIL') {
      console.log(result['reason']);
    }
    if (result['result'] == 'OK') {
      console.log('postStatusMessage: OK');
    }
  }
};

function clone(obj) {
  if (null == obj || "object" != typeof obj) return obj;
  var copy = obj.constructor();
  for (let attr in obj) {
    if (obj.hasOwnProperty(attr)) {
      copy[attr] = obj[attr];
    }
  }
  return copy;
}

class Notification {
  constructor(dictionary) {
    this.type_ = 'TYPE_NOTI';
    this.dictionary_ = clone(dictionary);
    this.id_ = -1;
    this.insertionTime_ = 0;
    console.log('input type : ' + this.type_);
  }

  setAction(appControl, appId) {
    this.dictionary_.ActionAppControl = appControl;
    if (appId) {
      this.dictionary_.ActionAppId = appId;
    }
  }

  setLed(operation, customColor, ledBlinkPeriod) {
    //operation: LED_ON, LED_OFF
    this.dictionary_.ledOption = operation;
    if (operation == "LED_ON") {
      if (typeof customColor == 'number') {
        this.dictionary_.ledCustomColor = customColor;
        if (ledBlinkPeriod) {
          this.dictionary_.ledOnPeriod = ledBlinkPeriod.ledOnPeriod;
          this.dictionary_.ledOffPeriod = ledBlinkPeriod.ledOffPeriod;
        }
      } else if (typeof customColor == 'object') {
        this.dictionary_.ledOnPeriod = customColor.ledOnPeriod;
        this.dictionary_.ledOffPeriod = customColor.ledOffPeriod;
      }
    } else {
      delete this.dictionary_.ledcustomColor;
      delete this.dictionary_.ledOnPeriod;
      delete this.dictionary_.ledOffPeriod;
    }
  }

  get type() {
    return this.type_;
  }

  get insertTime() {
    return this.insertionTime_;
  }

  get id() {
    return this.id_;
  }

  get title() {
    return this.dictionary_.title;
  }
  set title(value) {
    this.dictionary_.title = value;
  }

  get content() {
    return this.dictionary_.content;
  }
  set content(value) {
    this.dictionary_.content = value;
  }

  get iconPath() {
    return this.dictionary_.iconPath;
  }
  set iconPath(value) {
    this.dictionary_.iconPath = value;
  }

  get iconForIndicatorPath() {
    return this.dictionary_.iconForIndicatorPath;
  }
  set iconForIndicatorPath(value) {
    this.dictionary_.iconForIndicatorPath = value;
  }

  get iconForLockPath() {
    return this.dictionary_.iconForLockPath;
  }
  set iconForLockPath(value) {
    this.dictionary_.iconForLockPath = value;
  }

  get thumbnailPath() {
    return this.dictionary_.thumbnailPath;
  }
  set thumbnailPath(value) {
    this.dictionary_.iconForLockPath = value;
  }

  get subIconPath() {
    return this.dictionary_.subIconPath;
  }
  set subIconPath(value) {
    this.dictionary_.subIconPath = value;
  }

  get backgroundImagePath() {
    return this.dictionary_.backgroundImagePath;
  }
  set backgroundImagePath(value) {
    this.dictionary_.backgroundImagePath = value;
  }

  get timestamp() {
    return this.dictionary_.timestamp;
  }
  set timestamp(value) {
    this.dictionary_.timestamp = value;
  }

  get sound() {
    return this.dictionary_.sound;
  }
  set sound(value) {
    this.dictionary_.sound = value;
  }

  get vibration() {
    return this.dictionary_.vibration;
  }
  set vibration(value) {
    this.dictionary_.vibration = value;
  }

  get appControl() {
    return this.dictionary_.appControl;
  }
  set appControl(value) {
    this.dictionary_.appControl = value;
  }
};

class OnGoingNotification extends Notification {
  constructor(dictionary) {
    super(dictionary);
    this.type_ = 'TYPE_ONGOING';
    console.log('Ongoing notification is created');
  }

  get progressSize() {
    return this.dictionary_.progressSize;
  }
  set progressSize(value) {
    this.dictionary_.progressSize = value;
  }

  get progressPercentage() {
    return this.dictionary_.progressPercentage;
  }
  set progressPercentage(value) {
    this.dictionary_.progressPercentage = value;
  }
}


class ActiveNotification extends Notification {
  constructor(dictionary) {
    super(dictionary);
    this.type_ = 'TYPE_ACTIVE';
  }

  get autoRemove() {
    return this.dictionary_.autoRemove;
  }
  set autoRemove(value) {
    this.dictionary_.autoRemove = value;
  }

  addButton(buttonIndex, buttonLabel, appControl, buttonImagePath) {
    // buttonIndex: BUTTON1 BUTTON2 BUTTON3
    var args = {};
    if (buttonIndex == "BUTTON1") {
      this.dictionary_.button1 = "ADD";
      this.dictionary_.button1Label = buttonLabel;
      this.dictionary_.button1AppControl = appControl;
      if (buttonImagePath) {
        this.dictionary_.button1ImagePath = buttonImagePath;
      }
    } else if (buttonIndex == "BUTTON2") {
      this.dictionary_.button2 = "ADD";
      this.dictionary_.button2Label = buttonLabel;
      this.dictionary_.button2AppControl = appControl;
      if (buttonImagePath) {
        this.dictionary_.button2ImagePath = buttonImagePath;
      }
    } else if (buttonIndex == "BUTTON3") {
      this.dictionary_.button3 = "ADD";
      this.dictionary_.button3Label = buttonLabel;
      this.dictionary_.button3AppControl = appControl;
      if (buttonImagePath) {
        this.dictionary_.button3ImagePath = buttonImagePath;
      }
    }
  }

  removeButton(buttonIndex) {
    // buttonIndex: BUTTON1 BUTTON2 BUTTON3
    if (buttonIndex == "BUTTON1") {
      this.dictionary_.button1 = "REMOVE";
    } else if (buttonIndex == "BUTTON2") {
      this.dictionary_.button2 = "REMOVE";
    } else if (buttonIndex == "BUTTON3") {
      this.dictionary_.button3 = "REMOVE";
    } else if (buttonIndex == "BUTTON4") {
      this.dictionary_.button4 = "REMOVE";
    } else if (buttonIndex == "BUTTON5") {
      this.dictionary_.button5 = "REMOVE";
    } else if (buttonIndex == "BUTTON6") {
      this.dictionary_.button6 = "REMOVE";
    }
  }

};

exports = new Manager();
exports.Notification = Notification;
exports.OnGoingNotification = OnGoingNotification;
exports.ActiveNotification = ActiveNotification;