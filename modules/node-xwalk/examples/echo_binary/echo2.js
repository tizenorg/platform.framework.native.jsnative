#!/usr/bin/env node

// Copyright (c) 2015 Samsung Electronics Co., Ltd. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var xwalk = require('node-xwalk');
var echo2 = xwalk.require('echo2');

// Test async messaging
echo2.echo("Hello Async!!", function(msg) {
  console.log(msg);
  // Test async messaging with ArrayBuffer
  var dataLength = 32;
  var buffer = new ArrayBuffer(dataLength + 4);
  var uint32View = new Uint32Array(buffer, 0, 1);
  uint32View[0] = dataLength;
  var uint8View = new Uint8Array(buffer, 4, dataLength);
  for (var i=0; i < dataLength; i++) {
    uint8View[i] = i;
  }
  echo2.echoBinary(buffer, function(msg) {
    if (!(msg instanceof ArrayBuffer))
      throw "message is not binary.";
    var retUint32View = new Uint32Array(msg, 0, 1);
    var retLength = retUint32View[0];
    if (retLength != dataLength)
      throw "message length doesn't match.";
    var retUint8View = new Uint8Array(msg, 4, retLength);
    console.log(retUint8View);
  });
});

