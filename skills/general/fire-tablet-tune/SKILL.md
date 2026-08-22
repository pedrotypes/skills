---
name: fire-tablet-tune
description: Make an Amazon Fire tablet fast and usable over adb — strip Amazon bloatware, remove animations, and fix apps that flicker or self-restart by moving display density across the sw600dp layout breakpoint. Every change is recorded for one-command revert. Use when a Fire tablet is sluggish, short on memory, or an app loops between its own screens after an update.
---

# fire-tablet-tune

Fire tablets ship with heavy Amazon services and land on unusual display geometry. Both are fixable over `adb` without root. Nothing here needs the bootloader unlocked.

Work in this order: baseline, then the layout fix if an app is looping, then debloat, then animations. Record every change as you go — the revert file is the deliverable, not an afterthought.

## 1. Connect

Fire tablets present MTP by default; ADB is separate and off.

On the device: **Settings → Device Options → About Fire Tablet**, tap **Serial Number** seven times, then **Device Options → Developer Options → Enable ADB** (labelled **USB debugging** on newer Fire OS). Accept the authorisation prompt, choosing *always allow*.

```bash
brew install --cask android-platform-tools    # if adb is missing
adb devices -l                                 # expect one line ending "device"
```

With more than one device attached, every command needs `adb -s <serial>` — the tablets in a household are often the same model and easy to confuse. Generated revert scripts pin the serial for the same reason.

An empty list means ADB is still off on the tablet, not a cable fault. Confirm the tablet is seen at all with `ioreg -p IOUSB -l -w 0 | grep -i "USB Product Name"` — a Fire reports as `KF*`.

Add **OpenMTP** (`brew install --cask openmtp`) when files need dragging by hand; macOS has no native MTP support and Finder never shows the device.

## 2. Baseline

Capture this before changing anything. It is what you compare against and what tells you when to stop.

```bash
adb shell 'getprop ro.build.version.release; getprop ro.build.version.sdk; getprop ro.product.model'
adb shell 'wm size; wm density'
adb shell 'dumpsys meminfo | grep -iE "^Total RAM|^ *Free RAM|ZRAM"'
adb shell 'getprop dalvik.vm.heapgrowthlimit; getprop dalvik.vm.heapsize'
adb shell 'cmd package resolve-activity -a android.intent.action.MAIN -c android.intent.category.HOME | grep packageName'
```

The last line names the **active launcher**. Never disable it.

The Settings screen is not an identifier. A Fire HD 8 12th gen ships as `KFRAWI` (2GB) and `KFRAPWI` — Plus, 3GB — and both display the same name to the owner while differing by a gigabyte of RAM. Take `ro.product.model`, `ro.serialno` and `MemTotal` as the identity. Screen geometry is usually shared across a generation, so the density math in §4 carries over between variants even when memory does not.

## 3. Diagnose an app that flickers or loops

Flicker between an app's own screens is an activity restart loop. Measure it rather than watching it.

```bash
PKG=com.example.app
adb logcat -c
adb shell am force-stop $PKG
adb shell "monkey -p $PKG -c android.intent.category.LAUNCHER 1"
adb shell sleep 16
adb logcat -d > /tmp/app.log

grep -cE "START u0 .*cmp=$PKG/" /tmp/app.log          # restarts in 16s
grep -oE "cmp=$PKG/[A-Za-z0-9_./]*" /tmp/app.log | sort | uniq -c | sort -rn
```

One restart is a normal launch. Ten or more is a loop, and the activity named most often is the one failing.

Read the flags on the repeated `START` line:

| Signal | Meaning |
| --- | --- |
| `from uid <app's own uid>` | The app restarts itself. Application logic, not a crash. |
| `flg=0x10008000` | `NEW_TASK\|CLEAR_TASK` — a deliberate "restart this screen" |
| No `FATAL` / `AndroidRuntime` line | Not a crash. Stop looking for a stack trace. |
| `Activity pause timeout` | A consequence of the restarts, not the cause |

Ignore these; they appear on healthy installs too: `QPLProvider: No QPL instance provided`, `Failed to find provider info for com.facebook.stella.*`, and `NumberFormatException` raised inside pid `android.ext.services` rather than the app's own pid.

A self-restart loop with no exception points at layout selection. Go to §4.

## 4. The sw600dp layout fix

Android picks tablet layouts when the screen's shortest side is at least 600dp. An app whose tablet layout is broken loops on any device sitting just above that line. Dropping density a few points moves the device below it, and the app serves its phone layout instead.

Compute the smallest density that clears the threshold:

```bash
read -r _ _ W H <<< "$(adb shell wm size | tr -d '\r' | tr 'x' ' ')"
S=$(( W < H ? W : H ))
D=$(adb shell wm density | tr -d '\r' | grep -oE '[0-9]+' | head -1)
[ -n "$S" ] && [ "$S" -gt 0 ] && [ -n "$D" ] || { echo "no device — check 'adb devices'"; exit 1; }
awk -v s=$S -v d=$D 'BEGIN{
  dp = s*160/d
  printf "shortest side: %dpx at %ddpi = %.1fdp\n", s, d, dp
  if (dp < 600) { print "already below 600dp — this fix does not apply"; exit }
  nd = int(s*160/600)+1
  printf "set density to %d (= %.1fdp), UI grows %.0f%%\n", nd, s*160/nd, (nd/d-1)*100
}'
```

Apply, then re-measure with §3:

```bash
adb shell wm density 214      # the value the calculation prints
```

Density is **device-wide**. Every app using `sw600dp` drops to its phone layout, so say this plainly and let the owner decide before treating it as settled. Android 11 has no per-app override — `dumpsys platform_compat | grep DOWNSCALE` returns nothing before Android 12.

The override persists across reboots (`settings get secure display_density_forced`). Revert with `adb shell wm density reset`.

**Weigh the cost first.** The further above 600dp a device sits, the larger the density bump and the bigger everything on screen becomes. A device at 601dp grows half a percent and nobody notices. One at 677dp grows 13%. One at 857dp grows over 40%, which is not worth it — use the app's website instead and leave density alone.

Prefer the smallest density that works. A device at 601dp needs one point; jumping to a round 240 shrinks every layout for no gain.

## 5. Debloat

Amazon's own apps and services are the bulk of resident memory. Disable, never uninstall — `pm disable-user` is reversible and survives OTA.

Run the whole list **inside a single `adb shell`**. A host-side loop calling `adb` per package stalls.

```bash
adb shell 'for p in \
  com.amazon.kindle com.amazon.kindle.unifiedSearch com.amazon.venezia \
  com.amazon.avod com.amazon.mp3 com.audible.application.kindle \
  com.amazon.photos com.amazon.imdb.tv.mobile.app com.amazon.windowshop \
  com.amazon.dee.app com.amazon.dee.alexaonandroidos \
  com.amazon.weather com.amazon.sneakpeek com.amazon.wallpaper \
  com.amazon.tablet.generative.wallpaper com.amazon.tv.launcher \
  com.amazon.csapp com.amazon.firespotlight \
  com.amazon.advertisingidsettings com.amazon.hybridadidservice \
  com.amazon.tablet.voiceassistant com.amazon.speakscreen \
; do echo "[$p] $(pm disable-user --user 0 $p 2>&1 | head -1)"; done'
```

An empty result for a package means the system refused it. Leave it — which packages refuse varies between units of the same model, so treat the list as best-effort rather than expecting every line to take.

**Kids mode** — `com.amazon.tahoe`, `com.amazon.cloud9.kids`, `com.amazon.comms.kids`, `com.amazon.parentalcontrols`. Add these only when the owner confirms no child profiles are in use.

**Never disable**: the active launcher from §2, `com.amazon.redstone` (launcher content), `com.amazon.tcomm*` (device messaging), `com.amazon.identity.auth.device.authorization`, `com.amazon.device.software.ota`, `com.amazon.webview.chromium`, anything matching `systemui` or `frameworksettings`.

Record the result and write the revert before moving on:

```bash
adb shell 'pm list packages -d' | tr -d '\r' | sed 's/^package://' | sort > disabled-pkgs.txt
printf '#!/bin/sh\nadb shell "for p in %s; do pm enable --user 0 \$p; done"\n' \
  "$(tr '\n' ' ' < disabled-pkgs.txt)" > revert-bloat.sh && chmod +x revert-bloat.sh
```

Reboot afterwards. Freed memory shows up as a drop in `ZRAM ... in swap`, which is what removes the stutter.

## 6. Animations

The largest gain in felt responsiveness per keystroke.

```bash
adb shell 'settings put global window_animation_scale 0; \
           settings put global transition_animation_scale 0; \
           settings put global animator_duration_scale 0'
```

Restore with `1` in place of `0`.

## 7. Verify

Re-run §3 for the app that was looping, and re-read the memory lines from §2. Test the wake path too — resuming from sleep re-inflates the UI and is where a layout loop reappears:

```bash
adb shell input keyevent 26     # screen off
adb shell sleep 6
adb shell input keyevent 26     # screen on
adb shell input keyevent 82     # dismiss keyguard
```

Report restart counts before and after. Counts, not impressions.

## 8. When to stop

Check the app's heap against the device ceiling:

```bash
adb shell 'dumpsys meminfo <pkg> | grep -iE "Dalvik Heap|TOTAL PSS"'
adb shell 'getprop dalvik.vm.heapgrowthlimit'
```

An app sitting near `heapgrowthlimit` has outgrown the hardware. That cap is per-app and fixed; freeing system memory does not raise it. `android:largeHeap="true"` would, but it requires repacking and re-signing the APK — which breaks signature checks and risks an account ban on apps that detect modified clients. Do not do it, and say so rather than leaving it as an option.

At that point the honest answer is the web app in a browser, or newer hardware.

## Known case — WhatsApp

An 8" Fire HD 8 is 800px on its short side. At the stock 213dpi that is **600.9dp**, one dp over the breakpoint, so WhatsApp selects a tablet `HomeActivity` that self-restarts about once a second. `wm density 214` gives 598.1dp and the phone layout, and it holds across sleep and wake.

Two traps on this app specifically. Reinstalling from Play restores the same broken state, because WhatsApp allows Android auto-backup (`pkgFlags=[... ALLOW_BACKUP ...]`) — use `pm clear` when local state genuinely needs resetting, and expect to re-link. And a mismatched language split (`splits=[base, config.*, i18n_de]` on an `en-US` device) is a real Play delivery fault but causes no loop; replacing it with the universal APK from `whatsapp.com/android/current/WhatsApp.apk` fixes the split and changes nothing else. That APK is signed `O=WhatsApp Inc., CN=Brian Acton` and installs in place over the Play build with `adb install -r --full`.
