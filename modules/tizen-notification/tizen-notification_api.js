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
    return extension.internal.sendSyncMessage(JSON.stringify(args));
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

class Notification {
  constructor(type) {
    registerEventHandler(this);
    if((type == 'TYPE_NOTI') || (type == 'TYPE_ONGOING')) {
      this.type_ = type;
    } else {
      throw Error('Parameter is missing: type');
    }

    //this.dictionary_ = new Dictionary();
    this.dictionary_ = null;
    this.insertTime_ = 0;
  }

  update() {

  }

  post(dictionary) {
    if(dictionary) {
      this.dictionary_ = dictionary;
    } else {
      throw Error('Parameter is missing: dictionary');
    }

    var args = {};
    for (let prop in dictionary) {
      args[prop] = dictionary[prop];
    }
    console.log('@@@@@@ post: native_sync_call');
    console.log('@@@@@@ args[title] : ' + args['title'] );
    var result = native_sync_call('post', args);
    console.log('@@@@@@ end sync call : ' + result['result'])

    if(result['result'] == 'FAIL') {
      console.log('@@@@@ FAIL');
      throw Error(result['reason']);
    }
    if(result['result'] == 'OK') {
      console.log('@@@@@ SUCCESS');
    }
  }

  addButton(buttonIndex) {

  }

  removeButton(buttonIndex) {

  }

  setText(textType, text, key, variableType) {

  }

  get type() {
    return this.type_;
  }
  set type(type) {
    this.type_ = value;
  }

  get insetTime() {
    return this.insertTime_;
  }

};


/*
 * @module tizen-app-control
 *
 *
 * ```
 * var Notification = require('tizen-notification');
 * var myNoti = new Notification('TYPE_NOTI');
 *
 * var dictionary = {
 * 'iconPath': 'images/image.jpg',
 * 'iconForIndicatorPath': 'images/image.jpg',
 * 'iconForLockPath': 'images/image.jpg',
 * 'thumbnailPath': 'images/thumbnail_image.jpg',
 *
 * 'title': 'Title',
 * 'content': 'Contents Here',
 *
 * 'timestamp': '',
 * 'sound': 'sounds/sound.mp3', // NONE, DAFAULT, path
 * 'vibration': 'DEFAULT', // NONE, DAFAULT, path
 * };
 * myNoti.post(dictionary);
 *
 *
 *
 *
 *
 *
 *
 * var myOngoingNoti = new Notification('TYPE_ONGOING');
 *
 * ```
 */

exports = Notification;