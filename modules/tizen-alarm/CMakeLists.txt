SET(MODULE "tizen-alarm")

# Native Module
ADD_MODULE(${MODULE} XWALK
  JSAPI
    tizen-alarm_api.js
  SRCS
    alarm_extension.cc
  DEPENDS
    dlog capi-appfw-application bundle glib-2.0
)

# Copy Project
INSTALL(FILES package.json
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}
)

INSTALL(TARGETS ${MODULE}
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}
)
