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

class Dictionary {
  constructor() {
    // images
    this.iconPath_ = null;
    this.iconForIndicatorPath_ = null;
    this.iconForLockPath_ = null;
    this.thumbnailPath_ = null;
    this.subIconPath_ = null;
    this.backgroundImagePath_ = null;

    this.timestamp_ = 0;
    // text
    this.title_ = null;
    this.content_ = null;
    this.contentForDisplayOptionIsOff_ = null;

    this.sound_ = null;
    this.vibration_ = 'NONE';
    this.led_ = 'OFF';
    this.ledOnPeriod_ = 0;
    this.ledOffPeriod_ = 0;

    this.progressSize_ = 0.0;
    this.progressPercentage_ = 0.0;

    this.appControl_ = null;
    this.tag_ = null;
    this.autoRemove_ = null;
  }

  toObject() {
    var args = {};
    if (this.iconPath_) { args['iconPath'] = this.iconPath_; }
    if (this.iconForIndicatorPath_) { args['iconForIndicatorPath'] = this.iconForIndicatorPath_;}
    if (this.iconForLockPath_) { args['iconForLockPath'] = this.iconForLockPath_; }
    if (this.thumbnailPath_) { args['thumbnailPath'] = this.thumbnailPath_; }
    if (this.subIconPath_) { args['subIconPath'] = this.subIconPath_; }
    if (this.backgroundImagePath_) { args['backgroundImagePath'] = this.backgroundImagePath_; }
    if (this.timestamp_) { args['timestamp'] = this.timestamp_; }
    if (this.title_) { args['title'] = this.title_; }
    if (this.content_) { args['content'] = this.content_; }
    if (this.contentForDisplayOptionIsOff_) { args['contentForDisplayOptionIsOff'] = this.contentForDisplayOptionIsOff_; }
    if (this.sound_) { args['sound'] = this.sound_; }
    if (this.vibration_ != 'NONE') { args['vibration'] = this.vibration_; }
    if (this.led_ != 'OFF') { args['led'] = this.led_; }
    if (this.ledOnPeriod_ != 0) { args['ledOnPeriod'] = this.ledOnPeriod_; }
    if (this.ledOffPeriod_!= 0) { args['ledOffPeriod'] = this.ledOffPeriod_; }
    if (this.progressSize_) { args['progressSize'] = this.progressSize_; }
    if (this.progressPercentage_) { args['progressPercentage'] = this.progressPercentage_; }
    if (this.appControl_) { args['appControl'] = this.appControl_; }
    if (this.tag_) { args['tag'] = this.tag_; }
    if (this.autoRemove_) { args['autoRemove'] = this.autoRemove_; }
    return args;
  }

  updateDictionary(dictionary) {
      console.log('@@@ update dictionary');
    for (let prop in dictionary) {
      console.log('@@@ prop : ' + prop);
      dictionary['key']
      // images
      if (prop == 'iconPath') {this.iconPath_ = dictionary[prop]; }
      if (prop == 'iconForIndicatorPath') { this.iconForIndicatorPath_ = dictionary[prop]; }
      if (prop == 'iconForLockPath') { this.iconForLockPath_ = dictionary[prop]; }
      if (prop == 'thumbnailPath') { this.thumbnailPath_ = dictionary[prop]; }
      if (prop == 'subIconPath') { this.subIconPath_ = dictionary[prop]; }
      if (prop == 'backgroundImagePath') { this.backgroundImagePath_ = dictionary[prop]; }

      if (prop == 'timestamp') { this.timestamp_ = dictionary[prop]; }
      // text
      if (prop == 'title') { this.title_ = dictionary[prop]; }
      if (prop == 'content') { this.content_ = dictionary[prop]; }
      if (prop == 'contentForDisplayOptionIsOff') { this.contentForDisplayOptionIsOff_ = dictionary[prop]; }

      if (prop == 'sound') { this.sound_ = dictionary[prop]; }
      if (prop == 'vibration') { this.vibration_ = dictionary[prop]; }
      if (prop == 'led') { this.led_ = dictionary[led]; }
      if (prop == 'ledOnPeriod') { this.ledOnPeriod_ = dictionary[prop]; }
      if (prop == 'ledOffPeriod') { this.ledOffPeriod_ = dictionary[prop]; }
      if (prop == 'progressSize') { this.progressSize_ = dictionary[prop]; }
      if (prop == 'progressPercentage') { this.progressPercentage_ = dictionary[prop]; }

      if (prop == 'appControl') { this.appControl_ = dictionary[prop]; }
      if (prop == 'postedTime') { this.postedTime_ = dictionary[prop]; }
      if (prop == 'tag') { this.tag_ = dictionary[prop]; }
      if (prop == 'autoRemove') { this.autoRemove_ = dictionary[prop]; }
    }
  }
};

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
class Notification {
  constructor(type, dictionary) {
    registerEventHandler(this);
    if((type == 'TYPE_NOTI') || (type == 'TYPE_ONGOING')) {
      this.type_ = type;
    } else {
      throw Error('Parameter is missing: type');
    }

    this.dictionary_ = new Dictionary();
    if(dictionary) {
      console.log('update dictionary');
      this.dictionary_.updateDictionary(dictionary);
    }
    this.insertionTime_ = 0;
    this.pkgname_ = null;
    this.id_ = 0;
  }

  post(newDictionary) {
    if(newDictionary) {
      this.dictionary_.updateDictionary(newDictionary);
    }
    var dictionary = this.dictionary_.toObject();
    var result = native_sync_call('post', dictionary);

    if(result['result'] == 'FAIL') {
      throw Error(result['reason']);
    }
    if(result['result'] == 'OK') {
      this.id_ = result['id'];
      this.insertionTime_ = new Date(result['insertionTime']) || new Date();
      console.log('post: OK');
    }
  }

  update(newDictionary) {
    if(newDictionary) {
      this.dictionary_.updateDictionary(newDictionary);
    }
    var dictionary = this.dictionary_.toObject();
    var result = native_sync_call('update', dictionary);

    if(result['result'] == 'FAIL') {
      throw Error(result['reason']);
    }
    if(result['result'] == 'OK') {
      this.insertionTime_ = new Date(result['insertionTime']) || new Date();
      console.log('update: OK');
    }
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
  set type(type) {
    this.type_ = value;
  }

  get insetTime() {
    return this.insertionTime_;
  }

  get pkgname() {
    return native_sync_call("getPkgname");
  }

  get iconPath() {
    return this.dictionary_.iconPath_;
  }
  set iconPath(value) {
    this.dictionary_.iconPath_ = value;
  }

  get iconForIndicatorPath() {
    return this.dictionary_.iconForIndicatorPath_;
  }
  set iconForIndicatorPath_(value) {
    this.dictionary_.iconForIndicatorPath_ = value;
  }

  get iconForLockPath() {
    return this.dictionary_.iconForLockPath_;
  }
  set iconForLockPath(value) {
    this.dictionary_.iconForLockPath_ = value;
  }

  get thumbnailPath() {
    return this.dictionary_.thumbnailPath_;
  }
  set thumbnailPath(value) {
    this.dictionary_.iconForLockPath_ = value;
  }

  get subIconPath() {
    return this.dictionary_.subIconPath_;
  }
  set subIconPath(value) {
    this.dictionary_.subIconPath_ = value;
  }

  get backgroundImagePath() {
    return this.dictionary_.backgroundImagePath_;
  }
  set backgroundImagePath(value) {
    this.dictionary_.backgroundImagePath_ = value;
  }

  get timestamp() {
    return this.dictionary_.timestamp_;
  }
  set timestamp(value) {
    this.dictionary_.timestamp_ = value;
  }

  get title() {
    return this.dictionary_.title_;
  }
  set title(value) {
    this.dictionary_.title_ = value;
  }

  get content() {
    return this.dictionary_.content_;
  }
  set content(value) {
    this.dictionary_.content_ = value;
  }

  get contentForDisplayOptionIsOff() {
    return this.dictionary_.contentForDisplayOptionIsOff_;
  }
  set contentForDisplayOptionIsOff(value) {
    this.dictionary_.contentForDisplayOptionIsOff_ = value;
  }

  get sound() {
    return this.dictionary_.sound_;
  }
  set sound(value) {
    this.dictionary_.sound_ = value;
  }

  get vibration() {
    return this.dictionary_.vibration_;
  }
  set vibration(value) {
    this.dictionary_.vibration_ = value;
  }

  get led() {
    return this.dictionary_.led_;
  }
  set led(value) {
    this.dictionary_.led_ = value;
  }

  get ledOnPeriod() {
    return this.dictionary_.ledOnPeriod_;
  }
  set ledOnPeriod(value) {
    this.dictionary_.ledOnPeriod_ = value;
  }

  get ledOffPeriod() {
    return this.dictionary_.ledOffPeriod_;
  }
  set ledOffPeriod(value) {
    this.dictionary_.ledOffPeriod_ = value;
  }

  get progressSize() {
    return this.dictionary_.progressSize_;
  }
  set progressSize(value) {
    this.dictionary_.progressSize_ = value;
  }

  get progressPercentage() {
    return this.dictionary_.progressPercentage_;
  }
  set progressPercentage(value) {
    this.dictionary_.progressPercentage_ = value;
  }

  get tag() {
    return this.dictionary_.tag_;
  }
  set tag(value) {
    this.dictionary_.tag_ = value;
  }

  get autoRemove() {
    return this.dictionary_.autoRemove_;
  }
  set autoRemove(value) {
    this.dictionary_.autoRemove_ = value;
  }
};


/**
 * @method statusMessagePost
 * @param {string} message
 */
function statusMessagePost (message){
    console.log('@@@@  statusMessagePost is called with the message: ' + message);
}

/*
 * @module tizen-notification
 * The Tizen Native JS Notification Module.
 *
 * ```
 * var Notification = require('tizen-notification');
 *
 * var time = new Date().getTime();
 * time = Math.round(time/1000);
 * var dictionary = {
 * 'iconPath': 'images/image.jpg',
 * 'iconForIndicatorPath': 'images/image.jpg',
 * 'iconForLockPath': 'images/image.jpg',
 * 'thumbnailPath': 'images/thumbnail_image.jpg',
 * 'title': 'Title',
 * 'content': 'Contents Here',
 * 'timestamp': time,
 * 'sound': 'sounds/sound.mp3', // NONE, DAFAULT, path
 * 'vibration': 'DEFAULT',      // NONE, DAFAULT, path
 * 'led' : '#FFFF00',           // OFF(Deafult), ON, custom color
 * };
 *
 * var myNoti = new Notification('TYPE_NOTI', dictionary);
 * var updateDictionary = { 'title': 'New Title' };
 * myNoti.content = 'New Contents, blah blah';
 * myNoti.post(updateDictionary);
 *
 * console.log('Notification insertion time : ' + myNoti.insetTime);
 * console.log('The package name of the notification: ' + myNoti.pkgname);
 *
 * var AppControl = require('tizen-app-control');
 * var appcontrol = new AppControl(AppControl.OPERATION_VIEW);
 * myNoti.setEventHandler(CLICKONBUTTON1, appControl);
 * myNoti.update({'led': 'OFF'});
 *
 * var myOngoingNoti = new Notification('TYPE_ONGOING');
 *
 * ```
 */

exports = Notification;