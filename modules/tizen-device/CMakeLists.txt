SET(MODULE "tizen-device")

# Native Module
ADD_MODULE(${MODULE} XWALK
  JSAPI
    tizen-device_api.js
  SRCS
    device_extension.cc
  DEPENDS
    dlog jsoncpp capi-system-device
)

# Copy Project
INSTALL(FILES package.json
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}
)

INSTALL(TARGETS ${MODULE}
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}
)