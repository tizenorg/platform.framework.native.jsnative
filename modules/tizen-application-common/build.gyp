{
  'targets': [
    {
      'target_name': 'tizen-application-common',
      'sources': [
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
