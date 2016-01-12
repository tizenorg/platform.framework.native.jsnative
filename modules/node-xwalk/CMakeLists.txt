SET(TARGET_XWALK "node-xwalk")
SET(TARGET_XWALK_NATIVE "native")

# Native Module
ADD_MODULE(${TARGET_XWALK_NATIVE} NODE
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
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${TARGET_XWALK}
)

INSTALL(FILES lib/loader.js
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${TARGET_XWALK}/lib
)

INSTALL(TARGETS ${TARGET_XWALK_NATIVE}
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${TARGET_XWALK}/build/Release
)
