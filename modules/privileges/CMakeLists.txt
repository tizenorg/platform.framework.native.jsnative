SET(TARGET_PRIVILEGES "privileges")
SET(TARGET_PRIVILEGES_NATIVE "privileges_native")

# Native Module
ADD_MODULE(${TARGET_PRIVILEGES_NATIVE} NODE
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
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${TARGET_PRIVILEGES}
)

INSTALL(FILES lib/privileges.js
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${TARGET_PRIVILEGES}/lib
)

INSTALL(TARGETS ${TARGET_PRIVILEGES_NATIVE}
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${TARGET_PRIVILEGES}/build/Release
)
