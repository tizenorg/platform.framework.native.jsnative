SET(MODULE "tizen-sound-manager")

# Native Module
ADD_MODULE(${MODULE} XWALK
  JSAPI
    tizen-sound-manager_api.js
  SRCS
    sound_manager_extension.cc
  DEPENDS
    dlog capi-media-sound-manager
)

# Copy Project
INSTALL(FILES package.json
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}
)

INSTALL(TARGETS ${MODULE}
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}
)