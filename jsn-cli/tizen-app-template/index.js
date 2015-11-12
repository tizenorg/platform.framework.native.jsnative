#!/usr/bin/env node
module.paths = ['/usr/lib/js-binding/'].concat(module.paths);
var appfw = require('appfw');

appfw.on('create' , function() {
  console.log('!! created');
});

appfw.on('service' , function() {
  console.log('!! service!!!');
});

appfw.on('pause' , function() {
  console.log('!! pause!!!');
});

appfw.on('resume' , function() {
  console.log('!! resume!!!');
});

appfw.on('terminate' , function() {
  console.log('!! terminate!!!');
});

appfw.init('{appid}');
