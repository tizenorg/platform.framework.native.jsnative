#!/usr/bin/env node
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
