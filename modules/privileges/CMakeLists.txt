SET(MODULE "privileges")
SET(MODULE_NATIVE "privileges_native")

# Native Module
ADD_MODULE(${MODULE_NATIVE} NODE
  SRCS
    src/privileges_native.cc
  INCLUDES
    src
  DEPENDS
    dlog cynara-client libsmack
    pkgmgr-info capi-appfw-app-manager
)

# Copy Project
INSTALL(FILES package.json
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}
)

INSTALL(FILES lib/privileges.js
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}/lib
)

INSTALL(TARGETS ${MODULE_NATIVE}
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}/build/Release
)
