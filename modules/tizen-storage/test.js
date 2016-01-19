var storage = require('tizen-storage');
console.log('@@@ 1: required');

storage.getStorages()
  .then(function (storages) {
    console.log('@@@ 2 object: '+storages);
    for(var index in storages) {
      console.log('@@@ 3 id: '+storages[index].id);
      console.log('@@@ 4 type: '+storages[index].type);
      console.log('@@@ 5 state: '+storages[index].state);
      console.log('@@@ 6 path: '+storages[index].path);
      console.log('@@@ 7 totalSpace: '+storages[index].totalSpace);
      console.log('@@@ 8 availableSpace: '+storages[index].availableSpace);

      storages[index].getDirectory('music')
        .then(function (dir) {
          console.log('@@@ 9 getDirectory(): '+dir);
        })
       .catch(function (error) {
         console.log('@@@ -2: error');
         console.error("** " + error.message);
       });
    }
    storages[0].on('changed', function (state) {
      console.log("Storage state has changed to " + state);
    });
  })
  .catch(function (error) {
    console.log('@@@ -1: error');
    console.error("** " + error.message);
  });

