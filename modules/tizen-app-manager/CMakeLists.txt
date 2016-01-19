SET(MODULE "tizen-app-manager")

# Native Module
ADD_MODULE(${MODULE} XWALK
  JSAPI
    tizen-app-manager_api.js
  SRCS
    app_manager_extension.cc
  DEPENDS
    dlog jsoncpp capi-appfw-app-manager glib-2.0
)

# Copy Project
INSTALL(FILES package.json
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}
)

INSTALL(TARGETS ${MODULE}
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}
)
