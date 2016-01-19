SET(MODULE "tizen-storage")

# Native Module
ADD_MODULE(${MODULE} XWALK
  JSAPI
    tizen-storage_api.js
  SRCS
    storage_extension.cc
  DEPENDS
    dlog
    storage
    #capi-appfw-application
)

# Copy Project
INSTALL(FILES package.json
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}
)

INSTALL(TARGETS ${MODULE}
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}
)
