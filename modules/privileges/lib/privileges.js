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

var native_ = require("../build/Release/privileges_native");

function Privileges() {
  /**
   * Cynara(since tizen 3.0) only support native privilege.
   * simply web privilege convert native privilege for checking access.
   */
  var privilege = {
    ACCOUNT_READ: 'http://tizen.org/privilege/account.read',
    ACCOUNT_WRITE: 'http://tizen.org/privilege/account.write',
    ALARM: 'http://tizen.org/privilege/alarm.get',
    APPLICATION_INFO: 'http://tizen.org/privilege/packagemanager.info',
    APPLICATION_LAUNCH: 'http://tizen.org/privilege/appmanager.launch',
    APPMANAGER_CERTIFICATE: 'http://tizen.org/privilege/notexist',
    APPMANAGER_KILL: 'http://tizen.org/privilege/appmanager.kill',
    BLUETOOTH_ADMIN: 'http://tizen.org/privilege/bluetooth.admin',
    BLUETOOTH_GAP: 'http://tizen.org/privilege/bluetooth.admin',
    BLUETOOTH_HEALTH: 'http://tizen.org/privilege/bluetooth.admin',
    BLUETOOTH_SPP: 'http://tizen.org/privilege/bluetooth.admin',
    BLUETOOTHMANAGER: 'http://tizen.org/privilege/bluetooth.admin',
    BLUETOOTH: 'http://tizen.org/privilege/bluetooth',
    BOOKMARK_READ: 'http://tizen.org/privilege/bookmark.admin',
    BOOKMARK_WRITE: 'http://tizen.org/privilege/bookmark.admin',
    CALENDAR_READ: 'http://tizen.org/privilege/calendar.read',
    CALENDAR_WRITE: 'http://tizen.org/privilege/calendar.write',
    CALLHISTORY_READ: 'http://tizen.org/privilege/callhistory.read',
    CALLHISTORY_WRITE: 'http://tizen.org/privilege/callhistory.write',
    CONTACT_READ: 'http://tizen.org/privilege/contact.read',
    CONTACT_WRITE: 'http://tizen.org/privilege/contact.write',
    CONTENT_READ: 'http://tizen.org/privilege/content.write',
    CONTENT_WRITE: 'http://tizen.org/privilege/content.write',
    DATACONTROL_CONSUMER: 'http://tizen.org/privilege/datasharing',
    DATASYNC: 'http://tizen.org/privilege/notexist',
    DOWNLOAD: 'http://tizen.org/privilege/download',
    FILESYSTEM_READ: 'http://tizen.org/privilege/systemsettings.admin',
    FILESYSTEM_WRITE: 'http://tizen.org/privilege/systemsettings.admin',
    HEALTHINFO: 'http://tizen.org/privilege/healthinfo',
    INTERNET: 'http://tizen.org/privilege/internet',
    KEYMANAGER: 'http://tizen.org/privilege/keymanager',
    LED: 'http://tizen.org/privilege/led',
    LOCATION: 'http://tizen.org/privilege/location',
    MEDIACONTROLLER_SERVER: 'http://tizen.org/privilege/mediacontroller.server',
    MEDIACONTROLLER_CLIENT: 'http://tizen.org/privilege/mediacontroller.client',
    MESSAGING_READ: 'http://tizen.org/privilege/message.read',
    MESSAGING_WRITE: 'http://tizen.org/privilege/message.write',
    NETWORKBEARERSELECTION: 'http://tizen.org/privilege/network.set',
    NFC_ADMIN: 'http://tizen.org/privilege/nfc.admin',
    NFC_CARDEMULATION: 'http://tizen.org/privilege/nfc.cardemulation',
    NFC_COMMON: 'http://tizen.org/privilege/nfc',
    NFC_P2P: 'http://tizen.org/privilege/nfc',
    NFC_TAG: 'http://tizen.org/privilege/nfc',
    NOTIFICATION: 'http://tizen.org/privilege/notification',
    PACKAGE_INFO: 'http://tizen.org/privilege/packagemanager.info',
    PACKAGEMANAGER_INSTALL: 'http://tizen.org/privilege/packagemanager.admin',
    POWER: 'http://tizen.org/privilege/display',
    PUSH: 'http://tizen.org/privilege/push',
    SECUREELEMENT: 'http://tizen.org/privilege/secureelement',
    SETTING: 'http://tizen.org/privilege/systemsettings.admin',
    SYSTEM: 'http://tizen.org/privilege/telephony',
    SYSTEMMANAGER: 'http://tizen.org/privilege/systemmanager',
    TELEPHONY: 'http://tizen.org/privilege/telephony',
    VOLUME_SET: 'http://tizen.org/privilege/volume.set'
  };

  Object.freeze(privilege);

  Object.defineProperty(this, 'privilege', {
    value: privilege,
    writable: false,
    enumerable: true,
    configurable: false
  });
}

Privileges.prototype.getPkgApiVersion = function() {
  return native_.getPkgApiVersion();
};

Privileges.prototype.checkPrivilegeAccess = function(privilege) {
  return native_.checkPrivilegeAccess(privilege);
};

Privileges.prototype.checkPrivilegeAccess4Ver = function(new_ver, new_priv, old_priv) {
  var app_ver = this.getPkgApiVersion();

  var arr_new_ver = new_ver.split(".");
  var arr_app_ver = app_ver.split(".");
  var num_new;
  var num_app;
  var sel = 0;

  var i;
  var length = Math.min(arr_new_ver.length, arr_app_ver.length);
  for (i = 0; i < length; i++) {
    num_new = parseInt(arr_new_ver[i]);
    num_app = parseInt(arr_app_ver[i]);
    if (num_app < num_new) {
      sel = 1;
      break;
    } else if (num_app > num_new) {
      sel = -1;
      break;
    }
  }

  if (sel === 0 && arr_new_ver.length > arr_app_ver.length) {
    sel = 1;
  }

  if (sel !== 1) {
    this.checkPrivilegeAccess(new_priv);
  } else if (old_priv !== undefined) {
    this.checkPrivilegeAccess(old_priv);
  }
};

Object.freeze(Privileges.prototype);

module.exports = new Privileges();
