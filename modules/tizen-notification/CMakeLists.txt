SET(MODULE "tizen-notification")

# Native Module
ADD_MODULE(${MODULE} XWALK
  JSAPI
    tizen-notification_api.js
  SRCS
    notification_extension.cc
  DEPENDS
    dlog notification
)

# Copy Project
INSTALL(FILES package.json
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}
)

INSTALL(TARGETS ${MODULE}
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}
)