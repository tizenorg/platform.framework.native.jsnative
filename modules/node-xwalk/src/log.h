// Copyright (c) 2015 Samsung Electronics Co., Ltd. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#ifndef NODE_XWALK_EXTENSIONS_LOG_H_
#define NODE_XWALK_EXTENSIONS_LOG_H_

#include <stdio.h>

#define LOGD(fmt, args...) printf(fmt "\n", ##args)
#define LOGI(fmt, args...) printf(fmt "\n", ##args)
#define LOGW(fmt, args...) printf(fmt "\n", ##args)
#define LOGE(fmt, args...) printf(fmt "\n", ##args)

#endif  // NODE_XWALK_EXTENSIONS_LOG_H_
