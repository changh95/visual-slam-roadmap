# Depth from sensor

RGB-D cameras capture a color image and a per-pixel depth image simultaneously. Getting depth directly from hardware changes the SLAM problem fundamentally: there is no scale ambiguity to resolve, no need to triangulate points from parallax before the map becomes useful, and dense reconstruction becomes possible from the very first frame. The field took off when cheap consumer depth cameras arrived around 2010-2011 (the Microsoft Kinect), which triggered the wave of real-time volumetric fusion systems starting with KinectFusion.

## Two sensing principles (plus a hybrid)

There are two dominant sensing principles:

- **Structured light**: the sensor projects a known infrared dot pattern onto the scene and observes its deformation with an IR camera; depth follows from triangulation between projector and camera. The Kinect v1 (range roughly 0.8-4 m) and Orbbec Astra work this way.
- **Active IR Time-of-Flight (ToF)**: the sensor emits modulated infrared light and measures the travel time (phase shift) of the returned signal per pixel. Kinect v2 and Azure Kinect use ToF, generally giving better accuracy and resolution than structured light.

A third, related design is **active IR stereo** (e.g. Intel RealSense D400 series): a classical stereo pair aided by a projected IR texture, so it also works on textureless surfaces while degrading gracefully to passive stereo in sunlight.

| | Structured light | Active IR ToF |
|---|---|---|
| Principle | Pattern triangulation | Per-pixel travel time |
| Typical range | ~0.5-4 m | up to ~4-5 m |
| Example sensors | Kinect v1, Orbbec Astra | Kinect v2, Azure Kinect |
| Weaknesses | Sunlight, pattern interference | Multi-path reflections, sunlight |

## How the depth error behaves

For any triangulation-based sensor (structured light, active or passive stereo) with focal length $f$, baseline $b$, and disparity $d$, depth is $Z = fb/d$. Differentiating shows why these sensors die with distance: a disparity error $\sigma_d$ produces a depth error that grows *quadratically* with range,

$$\sigma_Z \approx \frac{Z^2}{f\,b}\,\sigma_d.$$

A sensor that is millimeter-accurate at 1 m can be off by several centimeters at 4 m. ToF sensors degrade differently — their random noise grows more gently with distance — but they suffer characteristic systematic errors instead: **multi-path interference** (emitted light bouncing off two surfaces before returning, biasing corners and concave regions) and **flying pixels** (spurious depth values straddling depth discontinuities). This is why RGB-D SLAM systems weight measurements by distance, truncate far readings, and filter depth edges.

## Common devices

- **Microsoft Kinect v1** (2010): structured light, range 0.8-4 m; pioneered consumer RGB-D and enabled the KinectFusion wave of research.
- **Microsoft Kinect v2** (2013): ToF; better accuracy, range up to 4.5 m, higher resolution.
- **Azure Kinect DK** (2019): 1 MP ToF depth, wide-FoV RGB camera, built-in IMU; aimed at AI/edge applications.
- **Intel RealSense D series** (D415/D435/D455): stereo-based active IR; compact and USB-powered, the default choice in much of robotics and drone research.
- **Occipital Structure Core**: mobile-friendly active IR sensor with wide-baseline stereo.
- **Orbbec Astra / Astra Pro**: affordable structured light; popular in ROS-based research.

## The trade-off and its fine print

The trade-off for getting **metric scale for free** is a set of hard physical limitations. Range is short (a few meters), so these sensors are indoor devices. Strong infrared ambient light (sunlight) washes out the emitted signal. Dark, absorbing, transparent, or specular materials return little or corrupted signal, leaving holes in the depth image. Depth noise also grows with distance — roughly quadratically for triangulation-based sensors — which is why RGB-D SLAM systems weight or truncate far measurements.

## Common pitfalls

- **Depth and color are different cameras**: the depth and RGB imagers sit at different positions with different intrinsics; without accurate extrinsic registration (and time synchronization), colored point clouds show color "bleeding" across depth edges, and photometric+geometric methods (e.g. DVO, ElasticFusion) are silently degraded.
- **Invalid pixels are normal, not exceptional**: every real depth frame contains holes (zero/NaN depth) from absorbing, specular, or transparent materials and from occlusion shadows of the projector. Tracking and fusion code must treat missing depth as a first-class case, not an error.
- **Check the depth units and scale factor**: raw depth often comes as 16-bit integers in millimeters, and datasets store depth PNGs with a dataset-specific scale factor. A wrong scale factor produces a map that is subtly (or wildly) the wrong size while everything else appears to work.
- **Multiple sensors interfere**: two structured-light cameras observing the same surface corrupt each other's dot patterns; multi-camera rigs need interference mitigation (time multiplexing, or ToF frequency separation).
- **Fast motion breaks the depth image itself**: motion blur and rolling-shutter-like artifacts corrupt depth before your tracking ever sees it — no amount of robust estimation fixes a measurement that was wrong at capture time.

## Why it matters for SLAM

Every design decision in RGB-D SLAM flows from the sensor: per-pixel metric depth enables dense frame-to-model tracking with ICP and volumetric TSDF or surfel fusion, while the sensor's noise model, range limit, and material failure modes determine where those systems break. Knowing whether your depth comes from structured light, ToF, or active stereo tells you what environments the system can survive — and why RGB-D SLAM is an indoor technology while outdoor systems reach for stereo or LiDAR.

## Related

- [Camera device](../level-02-getting-familiar/camera-device.md) — overview of camera sensor types
- [KinectFusion](kinectfusion.md) — the system that consumer depth cameras enabled
- [Disparity vs Depth](../level-07-stereo-slam/disparity-vs-depth.md) — depth from passive stereo triangulation
- [Scale ambiguity](../level-03-monocular-slam/scale-ambiguity.md) — the monocular problem that depth sensors remove
- [Frame-to-model tracking](frame-to-model-tracking.md) — what dense SLAM does with the depth stream
- [ICP](icp.md) — the alignment algorithm fed by these measurements

[Back to Level 4](../README.md#level-4-rgb-d-visual-slam)
