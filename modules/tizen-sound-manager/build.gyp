{
  'targets': [
    {
      'target_name': 'soundmanager',
      'sources': [
        'soundmanager_api.js',
        'soundmanager_extension.h',
        'soundmanager_extension.cc',
        'picojson.h',
      ],
      'variables': {
        'packages': [
          'dlog',
        ],
      },
    },
  ],
}