{
  'targets': [
    {
      'target_name': 'player',
      'sources': [
        'player_api.js',
        'player_extension.h',
        'player_extension.cc',
        'picojson.h',
      ],
      'variables': {
        'packages': [
          'dlog',
          'capi-media-player',
        ],
      },
    },
  ],
}
