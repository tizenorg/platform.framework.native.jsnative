SET(MODULE "node-xwalk")
SET(MODULE_NATIVE "node-xwalk-native")

# Native Module
ADD_MODULE(${MODULE_NATIVE} NODE
  SRCS
    src/native_binding.cc
    src/extension.cc
    src/extension_adapter.cc
  INCLUDES
    src
  DEPENDS
    dlog
)

# Copy Project
INSTALL(FILES package.json
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}
)

INSTALL(FILES lib/loader.js
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}/lib
)

INSTALL(TARGETS ${MODULE_NATIVE}
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}/build/Release
)
