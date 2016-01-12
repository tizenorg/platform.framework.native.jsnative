SET(MODULE "tizen-app-preference")

# Native Module
ADD_MODULE(${MODULE} XWALK
  JSAPI
    tizen-app-preference_api.js
  SRCS
    app_preference_extension.cc
  DEPENDS
    dlog capi-appfw-application
)

# Copy Project
INSTALL(FILES package.json
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}
)

INSTALL(TARGETS ${MODULE}
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}
)
