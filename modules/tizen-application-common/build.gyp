{
  'targets': [
    {
      'target_name': 'tizen-application-common',
      'sources': [
        # Only single main js file(xxx_api.js) is allowed here.
        # If you want to use multiple .js files, use '#include' in the main js.
        # See power_api.js
        'tizen-application-common_api.js',
        'app_common_extension.h',
        'app_common_extension.cc',
        'picojson.h',
      ],
      'variables': {
        'packages': [
          'dlog',
          'capi-appfw-application',
        ],
      },
    },
  ],
}
