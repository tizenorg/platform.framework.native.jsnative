SET(MODULE "tizen-system-runtime-info")

# Native Module
ADD_MODULE(${MODULE} XWALK
  JSAPI
    tizen-system-runtime-info_api.js
  SRCS
    system_runtime_info_extension.cc
  DEPENDS
    dlog capi-system-runtime-info
)

# Copy Project
INSTALL(FILES package.json
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}
)

INSTALL(TARGETS ${MODULE}
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}
)
