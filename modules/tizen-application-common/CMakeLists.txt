SET(MODULE "tizen-application-common")

# Native Module
ADD_MODULE(${MODULE} XWALK
  JSAPI
    tizen-application-common_api.js
  SRCS
    app_common_extension.cc
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
