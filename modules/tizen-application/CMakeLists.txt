SET(MODULE "tizen-application")

# Native Module
ADD_MODULE(${MODULE} XWALK
  JSAPI
    tizen-application_api.js
  SRCS
    appfw.cc
    ui_app_extension.cc
  DEPENDS
    dlog appcore-efl aul
)

# Copy Project
INSTALL(FILES package.json
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}
)

INSTALL(TARGETS ${MODULE}
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}
)