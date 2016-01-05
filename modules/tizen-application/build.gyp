{
  'targets': [
    {
      'target_name': 'tizen-application',
      'sources': [
        'tizen-application_api.js',
        'ui_app_extension.h',
        'ui_app_extension.cc',
        'picojson.h',
        'appfw.cc',
        'appfw.h',
      ],
      'variables': {
        'packages': [
          'dlog',
          'appcore-efl',
          'aul',
        ],
      },
    },
  ],
}

