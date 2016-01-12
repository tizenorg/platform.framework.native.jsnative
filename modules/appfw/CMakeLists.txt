SET(MODULE "appfw")
SET(MODULE_NATIVE "appfw_native")

ADD_MODULE(${MODULE_NATIVE} NODE
  SRCS
    src/appfw.cc
    src/appfw_native_node.cc
  INCLUDES
    src
  DEPENDS
    appcore-efl aul dlog
)

# Copy Project
INSTALL(FILES package.json
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}
)

INSTALL(FILES lib/appfw.js
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}/lib
)

INSTALL(TARGETS ${MODULE_NATIVE}
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}/build/Release
)
