/*
 * Copyright (c) 2015 Samsung Electronics Co., Ltd All Rights Reserved
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

#include "power_manager.h"

#include <device/display.h>
#include <device/power.h>
#include <device/callback.h>
#include <dlog.h>
#include <unistd.h>
#include <vconf.h>

#include <algorithm>
#include <cstring>

#include "power_platform_proxy.h"

#ifdef LOG_TAG
  #undef LOG_TAG
#endif
#define LOG_TAG "POWER"

namespace sample {

PowerManager::PowerManager()
    : current_state_(POWER_STATE_SCREEN_NORMAL),
      bright_state_enabled_(false),
      current_brightness_(-1),
      should_be_read_from_cache_(false),
      set_custom_brightness_(false),
      current_requested_state_(POWER_STATE_NONE) {
  display_state_e platform_state = DISPLAY_STATE_NORMAL;
  int ret = device_display_get_state(&platform_state);
  if (DEVICE_ERROR_NONE != ret)
    LOGE("device_display_get_state failed (%d)", ret);

  switch (platform_state) {
    case DISPLAY_STATE_NORMAL :
      current_state_ = POWER_STATE_SCREEN_NORMAL;
      break;
    case DISPLAY_STATE_SCREEN_DIM :
      current_state_ = POWER_STATE_SCREEN_DIM;
      break;
    case DISPLAY_STATE_SCREEN_OFF :
      current_state_ = POWER_STATE_SCREEN_OFF;
      break;
    default:
      current_state_ = POWER_STATE_NONE;
      break;
  }

  ret = device_add_callback(DEVICE_CALLBACK_DISPLAY_STATE,
                            PowerManager::OnPlatformStateChangedCB,
                            static_cast<void*>(this));
  if (DEVICE_ERROR_NONE != ret)
    LOGE("device_add_callback failed (%d)", ret);
}

PowerManager::~PowerManager() {
  int ret = device_remove_callback(DEVICE_CALLBACK_DISPLAY_STATE,
                                   PowerManager::OnPlatformStateChangedCB);
  if (DEVICE_ERROR_NONE != ret)
    LOGE("device_remove_callback failed (%d)", ret);
}

PowerManager* PowerManager::GetInstance(){
  static PowerManager instance;
  return &instance;
}

void PowerManager::OnPlatformStateChangedCB(device_callback_e type, void* value, void* user_data) {
  PowerManager* object = static_cast<PowerManager*>(user_data);
  if (object == NULL){
    LOGE("User data is NULL");
    return;
  }
  if (type != DEVICE_CALLBACK_DISPLAY_STATE){
    LOGE("type is not DISPLAY_STATE");
    return;
  }
  display_state_e state = static_cast<display_state_e>(reinterpret_cast<long long>(value));
  PowerState current = POWER_STATE_SCREEN_OFF;
  switch (state) {
    case DISPLAY_STATE_NORMAL :
      current = object->bright_state_enabled_ ? POWER_STATE_SCREEN_BRIGHT : POWER_STATE_SCREEN_NORMAL;
      break;
    case DISPLAY_STATE_SCREEN_DIM :
      current = POWER_STATE_SCREEN_DIM;
      break;
    case DISPLAY_STATE_SCREEN_OFF :
    {
      current = POWER_STATE_SCREEN_OFF;
      if (object->set_custom_brightness_ == true) {
        int err = object->RestoreScreenBrightness();
        if (err) {
          LOGE("RestoreScreenBrightness failed");
          return;
        }
        object->set_custom_brightness_ = false;
      }
      break;
    }
  }
  object->BroadcastScreenState(current);
}

void PowerManager::AddListener(ScreenStateCallback callback) {
  listeners_.push_back(callback);
}

int PowerManager::Request(PowerResource resource, PowerState state) {
  if (resource == POWER_RESOURCE_SCREEN && state == POWER_STATE_CPU_AWAKE)
    return 1;
  if (resource == POWER_RESOURCE_CPU && state != POWER_STATE_CPU_AWAKE)
    return 1;

  if(current_requested_state_ == POWER_STATE_SCREEN_DIM) {
    int result = 0;
    int err = PowerPlatformProxy::GetInstance().UnlockState(&result);
    if (err || result < 0) {
      LOGE("deviceUnlockState error %d", result);
      return 1;
    }
  }

  int ret = 0;
  switch (state) {
    case POWER_STATE_CPU_AWAKE:
    {
      ret = device_power_request_lock(POWER_LOCK_CPU, 0);
      if (DEVICE_ERROR_NONE != ret) {
        LOGE("device_power_request_lock error %d", ret);
        return 1;
      }
      break;
    }
    case POWER_STATE_SCREEN_DIM:
    {
      int result = 0;
      int err = PowerPlatformProxy::GetInstance().LockState(&result);
      if (err || result < 0) {
        LOGE("device_power_request_lock error %d", result);
        return 1;
      }
      break;
    }
    case POWER_STATE_SCREEN_NORMAL:
    {
      ret = device_power_request_lock(POWER_LOCK_DISPLAY, 0);
      if (DEVICE_ERROR_NONE != ret) {
        LOGE("device_power_request_lock error %d", ret);
        return 1;
      }
      break;
    }
    case POWER_STATE_SCREEN_BRIGHT:
    {
      int max_brightness;
      ret = device_display_get_max_brightness(0, &max_brightness);
      if (DEVICE_ERROR_NONE != ret) {
        LOGE("Platform error while getting max brightness: %d", ret);
        return 1;
      }

      int err = SetPlatformBrightness(max_brightness);
      if (err)
        return err;
      LOGD("Succeeded setting the brightness to a max level: %d", max_brightness);

      ret = device_display_change_state(DISPLAY_STATE_NORMAL);
      if (DEVICE_ERROR_NONE != ret) {
        LOGE("device_display_change_state(DISPLAY_STATE_NORMAL) error %d", ret);
        return 1;
      }

      ret = device_power_request_lock(POWER_LOCK_DISPLAY, 0);
      if (DEVICE_ERROR_NONE != ret) {
        LOGE("device_power_request_lock error %d", ret);
        return 1;
      }

      bright_state_enabled_ = true;

      display_state_e platform_state = DISPLAY_STATE_NORMAL;
      ret = device_display_get_state(&platform_state);
      if (DEVICE_ERROR_NONE != ret)
        LOGE("device_display_get_state failed (%d)", ret);
      if (platform_state == DISPLAY_STATE_NORMAL)
        BroadcastScreenState(POWER_STATE_SCREEN_BRIGHT);
      break;
    }
    case POWER_STATE_SCREEN_OFF:
      LOGE("SCREEN_OFF state cannot be requested");
      return 1;
    default:
      return 1;
  }

  current_requested_state_ = state;
  return 0;
}

int PowerManager::Release(PowerResource resource) {
  int ret;
  if (POWER_RESOURCE_SCREEN == resource) {
    ret = device_power_release_lock(POWER_LOCK_DISPLAY);
    if (DEVICE_ERROR_NONE != ret)
      LOGE("Platform return value from dim unlock: %d", ret);

    if (bright_state_enabled_) {
      int result = 0;
      int err = PowerPlatformProxy::GetInstance().SetBrightnessFromSettings(&result);
      if (err || DEVICE_ERROR_NONE != result) {
        LOGE("Platform error while setting restore brightness %d", result);
        return 1;
      }
    }
    bright_state_enabled_ = false;

    display_state_e platform_state = DISPLAY_STATE_NORMAL;
    if(current_requested_state_ == POWER_STATE_SCREEN_DIM) {
      int result = 0;
      int err = PowerPlatformProxy::GetInstance().UnlockState(&result);
      if (err || DEVICE_ERROR_NONE != result) {
        LOGE("Failed to UnlockState (%d)", result);
      }
    }
    ret = device_display_get_state(&platform_state);
    if (DEVICE_ERROR_NONE != ret) {
      LOGE("device_display_get_state failed (%d)", ret);
    } else {
      if (DISPLAY_STATE_NORMAL == platform_state) {
        BroadcastScreenState(POWER_STATE_SCREEN_NORMAL);
      }
    }

    current_requested_state_ = POWER_STATE_NONE;
  } else if (POWER_RESOURCE_CPU == resource) {
    ret = device_power_release_lock(POWER_LOCK_CPU);
    if (DEVICE_ERROR_NONE != ret)
      LOGE("Platform return value from off unlock: %d", ret);
  }

  return 0;
}

int PowerManager::GetScreenBrightness(double* output) {
  int brightness = 0;

  int err = GetPlatformBrightness(&brightness);
  if (err) {
    LOGE("Failed to obtain brightness value from platform.");
    return err;
  }

  LOGD("Brightness value: %d", brightness);

  int max_brightness;
  int ret = device_display_get_max_brightness(0, &max_brightness);
  if (DEVICE_ERROR_NONE != ret) {
    LOGE("Platform error while getting brightness: %d", ret);
    return 1;
  }
  *output = (double)brightness/(double)max_brightness;
  return 0;
}

int PowerManager::SetScreenBrightness(double brightness) {
  if (brightness > 1 || brightness < 0)
    return 1;
  int max_brightness;
  int ret = device_display_get_max_brightness(0, &max_brightness);
  if (DEVICE_ERROR_NONE != ret) {
    LOGE("Platform error while setting restore brightness: %d", ret);
    return 1;
  }

  int platform_brightness = (int)(brightness * max_brightness);
  if (platform_brightness == 0) {
    platform_brightness = 1;
  }
  int err = SetPlatformBrightness(platform_brightness);
  if (err)
    return err;
  LOGD("Set the brightness value: %d", platform_brightness);
  return err;
}

int PowerManager::IsScreenOn(bool* state) {
  display_state_e platform_state = DISPLAY_STATE_NORMAL;

  int ret = device_display_get_state(&platform_state);
  if (DEVICE_ERROR_NONE != ret) {
    LOGE("device_display_get_state failed (%d)", ret);
    return 1;
  }

  *state = (DISPLAY_STATE_SCREEN_OFF != platform_state);
  return 0;
}

int PowerManager::SetScreenState(bool onoff) {
  int ret = device_display_change_state(
      onoff ? DISPLAY_STATE_NORMAL : DISPLAY_STATE_SCREEN_OFF);
  if (DEVICE_ERROR_NONE != ret) {
    LOGE("Platform error while changing screen state %d", ret);
    return 1;
  }

  int timeout = 100;
  bool state = false;
  while (timeout--) {
    int err = IsScreenOn(&state);
    if (err) {
      return err;
    }

    if (state == onoff) {
      break;
    }

    struct timespec sleep_time = { 0, 100L * 1000L * 1000L };
    nanosleep(&sleep_time, nullptr);
  }

  return 0;
}

int PowerManager::RestoreScreenBrightness() {
  int result = 0;
  int err = PowerPlatformProxy::GetInstance().SetBrightnessFromSettings(&result);
  if (err || DEVICE_ERROR_NONE != result) {
    LOGE("Platform error while restoring brightness %d", result);
    return 1;
  }
  return 0;
}

int PowerManager::SetPlatformBrightness(int brightness) {
  if (current_state_ == POWER_STATE_SCREEN_DIM) {
    current_brightness_ = brightness;
    LOGD("Current state is not normal state the value is saved in cache: %d", brightness);
    should_be_read_from_cache_ = true;
    return 0;
  } else if (current_state_ == POWER_STATE_SCREEN_BRIGHT) {
    current_brightness_ = brightness;
    LOGD("Current state is not normal state the value is saved in cache: %d", brightness);
    should_be_read_from_cache_ = true;
    return 0;
  } else {
    should_be_read_from_cache_ = false;
  }

  int result = 0;
  int err = PowerPlatformProxy::GetInstance().SetBrightness(brightness, &result);
  if (err || result != 0) {
    LOGE("Platform error while setting %d brightness: %d", brightness, result);
    return 1;
  }
  set_custom_brightness_ = true;
  current_brightness_ = brightness;
  return 0;
}

int PowerManager::GetPlatformBrightness(int* result) {
  int brightness = 0;

  int is_custom_mode = 0;
  int err = PowerPlatformProxy::GetInstance().IsCustomBrightness(&is_custom_mode);

  if (err) {
    LOGE("Failed to check if custom brightness is set.");
    return err;
  }

  if ((is_custom_mode && current_brightness_ != -1) || should_be_read_from_cache_) {
    LOGD("return custom brightness %d", current_brightness_);
    *result = current_brightness_;
    return 0;
  }

  int is_auto_brightness = 0;
  vconf_get_int(VCONFKEY_SETAPPL_BRIGHTNESS_AUTOMATIC_INT, &is_auto_brightness);
  if (is_auto_brightness == 1) {
    int ret = vconf_get_int(VCONFKEY_SETAPPL_PREFIX"/automatic_brightness_level" /*prevent RSA build error*/, &brightness);
    if (ret != 0) {
      // RSA binary has no AUTOMATIC_BRIGHTNESS
      vconf_get_int(VCONFKEY_SETAPPL_LCD_BRIGHTNESS, &brightness);
    }
  } else {
    LOGD("Brightness via DBUS");
    err = PowerPlatformProxy::GetInstance().GetBrightness(&brightness);

    if (err) {
      LOGE("Failed to obtain brightness via DBUS.");
      return err;
    }
  }

  LOGD("BRIGHTNESS(%s) %d", is_auto_brightness == 1 ? "auto" : "fix" , brightness);

  *result = brightness;

  return 0;
}


int PowerManager::RestoreSettedBrightness() {
int err = 0;
  int is_custom_mode = 0;
  vconf_get_int(VCONFKEY_PM_CUSTOM_BRIGHTNESS_STATUS, &is_custom_mode);
  if (is_custom_mode || should_be_read_from_cache_) {
    if (current_brightness_ == -1) {
      // brightness was changed in other process
      err = RestoreScreenBrightness();
    } else {
      err = SetPlatformBrightness(current_brightness_);
    }
  }
  should_be_read_from_cache_ = false;
  return err;
}

void PowerManager::BroadcastScreenState(PowerState current) {
  if (current_state_ == current)
    return;

  PowerState prev_state = current_state_;
  current_state_ = current;

  if (current_state_ == POWER_STATE_SCREEN_NORMAL) {
    if (prev_state == POWER_STATE_SCREEN_DIM) {
      int err = RestoreSettedBrightness();
      if (err) {
        LOGE("Error restore custom brightness");
      }
    } else if (prev_state == POWER_STATE_SCREEN_OFF) {
      should_be_read_from_cache_ = false;
    }
  }

  for (auto it = listeners_.begin(); it != listeners_.end(); ++it) {
    (*it)(prev_state, current_state_);
  }
}

}  // namespace sample
