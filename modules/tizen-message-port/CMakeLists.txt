SET(MODULE "tizen-message-port")

# Native Module
ADD_MODULE(${MODULE} XWALK
  JSAPI
    tizen-message-port_api.js
  SRCS
    message_port_extension.cc
  DEPENDS
    dlog capi-message-port
)

# Copy Project
INSTALL(FILES package.json
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}
)

INSTALL(TARGETS ${MODULE}
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}
)
