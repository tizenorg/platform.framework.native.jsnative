{
  'targets': [
    {
      'target_name': 'power',
      'sources': [
        # Only single main js file(xxx_api.js) is allowed here.
        # If you want to use multiple .js files, use '#include' in the main js.
        # See power_api.js
        'power_api.js',
        'power_extension.h',
        'power_extension.cc',
        'picojson.h',
        'dbus_operation.h',
        'dbus_operation.cc',
        'power_manager.h',
        'power_manager.cc',
        'power_platform_proxy.h',
        'power_platform_proxy.cc',
      ],
      'variables': {
        'packages': [
          'dlog',
          'vconf',
          'deviced',
          'capi-system-device',
          'dbus-glib-1',
        ],
      },
    },
  ],
}
