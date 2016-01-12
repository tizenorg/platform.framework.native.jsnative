SET(MODULE "reaper")

# Native Module
ADD_MODULE(${MODULE} NODE
  SRCS
    src/reaper.cc
  INCLUDES
    src
  DEPENDS
    dlog
)

# Copy Project
INSTALL(FILES package.json
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}
)

INSTALL(TARGETS ${MODULE}
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}/build/Release
)