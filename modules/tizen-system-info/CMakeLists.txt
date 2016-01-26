SET(MODULE "tizen-system-info")

# Native Module
ADD_MODULE(${MODULE} XWALK
  JSAPI
    tizen-system-info_api.js
  SRCS
    system_info_extension.cc
  DEPENDS
    dlog jsoncpp capi-system-info
)

# Copy Project
INSTALL(FILES package.json
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}
)

INSTALL(TARGETS ${MODULE}
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}
)