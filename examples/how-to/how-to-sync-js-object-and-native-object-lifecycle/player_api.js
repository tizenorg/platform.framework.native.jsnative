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

var playerListener = null;

extension.setMessageListener(function(msg) {
  if (playerListener instanceof Function) {
    playerListener(msg);
  };
});

function ReturnResult(result) {
  var ret = JSON.parse(result);
  if (ret['result'] == 'OK') {
    return true;
  } else {
    if (ret['reason'])
      console.log(ret['reason']);
    return false;
  }
};

var Player = function() {
  var args = {
    'cmd': 'Create'
  };
  var ret = JSON.parse(extension.internal.sendSyncMessage(JSON.stringify(args)));
  if (ret['result'] == 'OK') {
    this.id = ret['id'];
    require('reaper').setReaper(this, function(deleted){
      var args = {
        'cmd': 'Destroy',
        'id': deleted.id,
      };
      extension.internal.sendSyncMessage(JSON.stringify(args));
    });
  }
};

Player.prototype.setUri = function(path) {
  var args = {
    'cmd':'SetUri',
    'path':path,
    'id':this.id,
  };
  return ReturnResult(extension.internal.sendSyncMessage(JSON.stringify(args)));
};

Player.prototype.prepare = function() {
  var args = {
    'cmd':'Prepare',
    'id':this.id,
  };
  return ReturnResult(extension.internal.sendSyncMessage(JSON.stringify(args)));
};

Player.prototype.start = function() {
  var args = {
    'cmd':'Start',
    'id':this.id,
  };
  return ReturnResult(extension.internal.sendSyncMessage(JSON.stringify(args)));
};

Player.prototype.stop = function() {
  var args = {
    'cmd':'Stop',
    'id':this.id,
  };
  return ReturnResult(extension.internal.sendSyncMessage(JSON.stringify(args)));
};

Player.prototype.unprepare = function() {
  var args = {
    'cmd':'Unprepare',
    'id':this.id,
  };
  return ReturnResult(extension.internal.sendSyncMessage(JSON.stringify(args)));
};

exports = Player;
