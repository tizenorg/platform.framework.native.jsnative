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
* @param {String} type The notification type
* * 'none' - None
* * 'noti' - Notification type
* * 'ongoing' - Ongoing type
* @param {Object} [dictionary] The properties to offers additional arrtibutes
* to represent a notification.
* @throws
* * TypeError - if the parameter is invalid
* * OutofMemoryError - Out of memory
* @since 3.0
*/

class Manager {
  post(notification) {
    console.log('Manager post() method');
    if(!notification) {
      throw Error('Invalid parameter, notification is missing');
    }

    console.log('input notification to post:');
    var util = require('util');
    console.log(util.inspect(notification, {showHidden: false, depth: null}));

    var result = native_sync_call('post', notification);
    if(result['result'] == 'FAIL') {
      throw Error(result['reason']);
    }
    if(result['result'] == 'OK') {
      notification.id_ = result['id'];
      console.log('The posted notification id : ' + notification.id);
      notification.insertionTime_ = new Date(result['insertionTime']) || new Date();
      console.log('post: OK');
    }
  }

  update(notification) {
    console.log('Manager update() method');
    if(!notification) {
      throw Error('Invalid parameter, notification is missing');
    }

    var result = native_sync_call('update', notification);
    if(result['result'] == 'FAIL') {
      throw Error(result['reason']);
    }
    if(result['result'] == 'OK') {
      notification.insertionTime_ = new Date(result['insertionTime']) || new Date();
      console.log('update: OK');
    }
  }

  remove(notification) {
    console.log('Manager remove() method');
    if(!notification) {
      throw Error('Invalid parameter, notification is missing');
    }

    var result = native_sync_call('remove', notification);
    if(result['result'] == 'FAIL') {
      throw Error(result['reason']);
    }
    if(result['result'] == 'OK') {
      console.log('remove: OK');
    }
  }

  removeAll() {
    console.log('Manager removeAll() method');
    var result = native_sync_call('removeAll');
    if(result['result'] == 'FAIL') {
      throw Error(result['reason']);
    }
    if(result['result'] == 'OK') {
      console.log('removeAll: OK');
    }
  }

  get(notification_id) {
    return new Promise(function(resolve, reject) {
      var args = {'id': notification_id};
      native_async_call('get', args, function(result) {
        if (result['result'] == 'OK') {
          resolve();
        } else {
          reject(new Error(result['reason']));
        }
      });
    });
  }

  getAll() {
    // getAll() returns the list of notifications
    return new Promise(function(resolve, reject) {
      native_async_call('get', args, function(result) {
        if (result['result'] == 'OK') {
          resolve();
        } else {
          reject(new Error(result['reason']));
        }
      });
    });
  }
};

class Notification {
  constructor(type, dictionary) {
    if((type != "TYPE_NOTI") && (type != "TYPE_ONGOING")) {
      throw Error("Invalid type for create a notification");
    }
    this.type_ = type;
    this.dictionary_ = dictionary;
    this.id_ = 0;
    this.insertionTime_ = 0;
    console.log('input type : ' + this.type_);
  }

  showDictionary() {
    var util = require('util');
    console.log(util.inspect(this.dictionary_, {showHidden: false, depth: null}));
  }

  setEventHandler(eventType, eventHandler) {
    // eventType: CLICKONBUTTON1 CLICKONBUTTON2 CLICKONBUTTON3 CLICKONBUTTON4
    //            CLICKONBUTTON5 CLICKONBUTTON6 CLICKONICON CLICKONICONTHUMBNAIL
    var args = {};
    args['eventType'] = eventType;
    args['eventHandler'] = eventHandler;
    var result = native_sync_call('setEventHandler', args);
    if(result['result'] == 'OK') {
      console.log('setEventHandler: OK');
    } else {
      throw Error(result['reason']);
    }
  }

  addButton(buttonIndex) {
    // buttonIndex: BUTTON1 BUTTON2 BUTTON3 BUTTON4 BUTTON5 BUTTON6
    var args = {};
    args['id'] = this.id_;
    args['buttonIndex'] = buttonIndex;
    var result = native_sync_call('addButton', args);
    if(result['result'] == 'OK') {
      console.log('addButton: OK');
    } else {
      throw Error(result['reason']);
    }
  }

  removeButton(buttonIndex) {
    // buttonIndex: BUTTON1 BUTTON2 BUTTON3 BUTTON4 BUTTON5 BUTTON6
    var args = {};
    args['id'] = this.id_;
    args['buttonIndex'] = buttonIndex;
    var result = native_sync_call('removeButton', args);
    if(result['result'] == 'OK') {
      console.log('removeButton: OK');
    } else {
      throw Error(result['reason']);
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
  set iconForIndicatorPath_(value) {
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

  get led() {
    return this.dictionary_.led;
  }
  set led(value) {
    this.dictionary_.led = value;
  }

  get ledOnPeriod() {
    return this.dictionary_.ledOnPeriod;
  }
  set ledOnPeriod(value) {
    this.dictionary_.ledOnPeriod = value;
  }

  get ledOffPeriod() {
    return this.dictionary.ledOffPeriod;
  }
  set ledOffPeriod(value) {
    this.dictionary_.ledOffPeriod = value;
  }

  get size() {
    return this.dictionary_.size;
  }
  set size(value) {
    this.dictionary_.size = value;
  }

  get progress() {
    return this.dictionary_.progress;
  }
  set progress(value) {
    this.dictionary_.progress = value;
  }

  get progressPercentage() {
    return this.dictionary_.progressPercentage;
  }
  set progressPercentage(value) {
    this.dictionary_.progressPercentage = value;
  }

  get tag() {
    return this.dictionary_.tag;
  }
  set tag(value) {
    this.dictionary_.tag = value;
  }

  get autoRemove() {
    return this.dictionary_.autoRemove;
  }
  set autoRemove(value) {
    this.dictionary_.autoRemove = value;
  }
};

/*
 * @module tizen-notification
 * The Tizen Native JS Notification Module.
 *
 * ```
 * var dictionary = {
 * 'title': 'Title',
 * 'content': 'Contents Here',
 * 'iconPath': 'images/image.jpg',
 * 'led': 'ON',
 * 'ledOnPeriod': 100,
 * 'ledOffPeriod': 100,
 * };
 *
 * var Manager = require('tizen-notification');
 * var myNoti1 = new Manager.Notification('TYPE_NOTI', dictionary);
 * myNoti1.setEventHandler(CLICKBUTTON1, appControl);
 * Manager.post(myNoti1);
 *
 * var myNoti2 = new Manager.Notification('TYPE_ONGOING', dictionary);
 * myNoti2.title = "New Title";
 * myNoti2.progress = 0.3;
 * Manager.post(myNoti2);
 *
 * var getNoti = Manager.get(myNoti1.id);
 * var NotiList = Manager.getAll();
 *
 * Manager.remove(myNoti2);
 * Manager.removeAll();
 *
 * ```
 */

exports = new Manager();
exports.Notification = Notification;