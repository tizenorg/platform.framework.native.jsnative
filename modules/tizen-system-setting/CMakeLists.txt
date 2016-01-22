SET(MODULE "tizen-system-setting")

# Native Module
ADD_MODULE(${MODULE} XWALK
  JSAPI
    system_setting_api.js
  SRCS
    system_setting_extension.cc
  DEPENDS
    dlog capi-system-system-settings
)

# Copy Project
INSTALL(FILES package.json
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}
)

INSTALL(TARGETS ${MODULE}
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}
)
