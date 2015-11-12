#!/usr/bin/env node

// Copyright (c) 2015 Samsung Electronics Co., Ltd. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var xwalk = require('node-xwalk');
var echo = xwalk.require('echo');

echo.echo("Hello Async!!", function(msg) {
  console.log("Async callback: " + msg);
});

var ret = echo.syncEcho("Hello Sync!!");
console.log("Sync return: " + ret);

