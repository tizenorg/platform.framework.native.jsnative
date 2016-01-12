#!/usr/bin/env node
var appfw = require('tizen-application');

appfw.on('appcontrol' , function(appcontrol) {
  console.log('!! appcontrol operation : ' + appcontrol.operation);
});

appfw.on('pause' , function() {
  console.log('!! pause !!');
});

appfw.on('resume' , function() {
  console.log('!! resume !!');
});

appfw.on('terminate' , function() {
  console.log('!! terminate !!');
});

appfw.start().then(function(){
  console.log('!! started !!');
}).catch(function(){
  console.log('!! fail to run !!');
});
