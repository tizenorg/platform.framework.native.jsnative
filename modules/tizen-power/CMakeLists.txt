SET(TARGET_TIZEN_POWER "tizen-power")

# Native Module
ADD_MODULE(${TARGET_TIZEN_POWER} XWALK
  JSAPI
    src/power_api.js
  SRCS
    src/power_extension.cc
    src/power_manager.cc
    src/power_platform_proxy.cc
    src/dbus_operation.cc
  INCLUDES
    src
  DEPENDS
    dlog vconf deviced dbus-glib-1 capi-system-device
)

# Copy Project
INSTALL(FILES package.json
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${TARGET_TIZEN_POWER}
)

INSTALL(TARGETS ${TARGET_TIZEN_POWER}
  DESTINATION ${GLOBAL_NODE_MODULE_PATH}/${TARGET_TIZEN_POWER}
)
