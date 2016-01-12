SET(MODULE "tizen-app-control")

# Copy Project
INSTALL(
  FILES
    package.json
    tizen-app-control.js
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}
)
