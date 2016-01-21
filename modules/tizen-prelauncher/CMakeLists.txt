SET(MODULE "tizen-prelauncher")
SET(MODULE_NATIVE "tizen-prelauncher-native")
SET(PRELAUNCHER "jsnative-loader")

# Native Module
ADD_MODULE(${MODULE_NATIVE} NODE
  SRCS
    prelauncher.cc
    node_prelauncher.cc
  DEPENDS
    dlog launchpad
)

# Copy Project
INSTALL(FILES package.json
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}
)

INSTALL(FILES tizen-prelauncher.js
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}/
)

INSTALL(TARGETS ${MODULE_NATIVE}
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}/
)

INSTALL(FILES jsnative-loader
  DESTINATION /usr/bin/
)
