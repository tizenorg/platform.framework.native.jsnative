SET(MODULE "gcontext")

# Native Module
ADD_MODULE(${MODULE} NODE
  SRCS
    src/gcontext.cc
  INCLUDES
    src
  DEPENDS
    dlog glib-2.0 gobject-2.0
)

# Copy Project
INSTALL(FILES package.json
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}
)

INSTALL(TARGETS ${MODULE}
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}/build/Release
)

