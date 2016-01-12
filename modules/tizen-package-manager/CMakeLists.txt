SET(MODULE "tizen-package-manager")

# Native Module
ADD_MODULE(${MODULE} XWALK
  JSAPI
    tizen-package-manager_api.js
  SRCS
    tizen_package_manager_extension.cc
  DEPENDS
    dlog pkgmgr-info capi-appfw-package-manager
)

# Copy Project
INSTALL(FILES package.json
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}
)

INSTALL(TARGETS ${MODULE}
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${MODULE}
)
