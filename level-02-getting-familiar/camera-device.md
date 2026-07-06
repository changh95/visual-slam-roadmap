# Camera device

Understanding camera hardware is essential for choosing the right sensor and for recognizing systematic errors that no algorithm can fix downstream. The image your SLAM system sees is shaped by the lens, the sensor, and the exposure settings long before any feature is detected.

## Lens

The lens determines field of view (FoV), depth of field, and distortion:

- **Focal length**: longer focal length = narrower FoV. SLAM typically uses wide-angle lenses for a wide FoV that maximizes parallax and keeps features in view during rotation. **Telecentric lenses** are the opposite specialty: constant magnification with depth, used in metrology rather than SLAM.
- **Aperture** ($f$-number): larger aperture (smaller $f$-number) admits more light, enabling faster shutter speeds and less motion blur, at the cost of shallower depth of field.
- **Lens MTF** (Modulation Transfer Function): quantifies how much contrast the lens preserves at each spatial frequency — effectively the resolving power of the optics. A high-resolution sensor behind a low-MTF lens still yields blurry images; check MTF curves when specifying hardware.
- **Fisheye lenses**: FoV beyond 180° but requiring special projection models (equidistant, equisolid).

## Image sensor: CCD vs. CMOS

- **CCD**: historically higher image quality and lower noise; more expensive and power-hungry. Still used in high-end scientific cameras.
- **CMOS**: dominant in robotics — lower power, cheaper, on-chip processing. Modern CMOS matches CCD quality.

**Global vs. rolling shutter.** A **global shutter** exposes all pixels simultaneously, giving a geometrically consistent snapshot. A **rolling shutter** exposes rows sequentially, distorting the image when the camera or scene moves fast. Most low-cost cameras are rolling shutter; for dynamic platforms either buy global shutter or compensate in the model.

## Exposure and ISO

Higher **ISO** amplifies the sensor signal, enabling low-light operation at the cost of noise. Longer **exposure** gathers more light but adds motion blur. Auto-exposure changes image brightness between frames, which breaks the brightness-constancy assumption of direct methods — fixed exposure or photometric calibration helps.

## Depth-capable camera configurations

- **Stereo vision**: two cameras with baseline $b$; depth from disparity $d$ as $Z = b f_x / d$. Passive — works outdoors, but struggles on textureless surfaces.
- **RGB-D / structured light**: projects an IR pattern and triangulates it (e.g., Kinect v1). Dense indoor depth; fails in sunlight.
- **Active IR stereo / Time-of-Flight (ToF)**: ToF sensors measure the round-trip time of emitted IR light per pixel. Compact and fast; range limits and multi-path artifacts apply.

## Why it matters for SLAM

Sensor choice bounds achievable accuracy: baseline sets stereo depth precision, shutter type sets how fast you can move, and lens FoV/MTF set how many usable features you get. Many "algorithm bugs" in practice turn out to be rolling-shutter skew, auto-exposure flicker, or motion blur — problems solved at the hardware and configuration level, not in code.

## Related

- [Pinhole camera model](../level-01-beginner/pinhole-camera-model.md)
- [Camera models beyond pinhole](../level-01-beginner/camera-models-beyond-pinhole.md)
- [Exteroceptive sensor](exteroceptive-sensor.md)
- [Depth from sensor](../level-04-rgbd-slam/depth-from-sensor.md)
- [Event cameras (DVS)](../level-10-event-camera-slam/event-cameras-dvs.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
