#!/usr/bin/env node
var app = require('tizen-application');

app.on('appcontrol', function(appcontrol) {
  // Handle the launch request
  console.log('[appcontrol] operation : ' + appcontrol.operation);
});

app.on('pause', function() {
  // Take necessary actions when application becomes invisible.
  console.log('[pause]');
});

app.on('resume', function() {
  // Take necessary actions when application becomes visible.
  console.log('[resume]');
});

app.on('terminate', function() {
  // Release all resources.
  console.log('[terminate]');
});

app.start().then(function() {
  // Initialize UI resources and application's data.
  console.log('[started]');
}).catch(function(e) {
  console.log('Failed to start application : ' + e.message);
});
