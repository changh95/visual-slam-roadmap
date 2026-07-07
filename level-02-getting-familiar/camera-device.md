# Camera device

Understanding camera hardware is essential for choosing the right sensor and for recognizing systematic errors that no algorithm can fix downstream. The image your SLAM system sees is shaped by the lens, the sensor, and the exposure settings long before any feature is detected.

## Lens

The lens determines field of view (FoV), depth of field, and distortion:

- **Focal length**: longer focal length = narrower FoV. SLAM typically uses wide-angle lenses for a wide FoV that maximizes parallax and keeps features in view during rotation. **Telecentric lenses** are the opposite specialty: constant magnification with depth, used in metrology rather than SLAM.
- **Aperture** ($f$-number): larger aperture (smaller $f$-number) admits more light, enabling faster shutter speeds and less motion blur, at the cost of shallower depth of field — features at different depths may blur.
- **Lens MTF** (Modulation Transfer Function): quantifies how much contrast the lens preserves at each spatial frequency — effectively the resolving power of the optics. A high-resolution sensor behind a low-MTF lens still yields blurry images; check MTF curves when specifying hardware.
- **Fisheye lenses**: FoV beyond 180° but requiring special projection models (equidistant, equisolid).

## Image sensor: CCD vs. CMOS

- **CCD**: historically higher image quality and lower noise; more expensive and power-hungry. Still used in high-end scientific cameras.
- **CMOS**: dominant in robotics — lower power, cheaper, on-chip processing. Modern CMOS matches CCD quality.

**Global vs. rolling shutter.** A **global shutter** exposes all pixels simultaneously, giving a geometrically consistent snapshot. A **rolling shutter** exposes rows sequentially, distorting the image when the camera or scene moves fast. Most low-cost cameras are rolling shutter; for dynamic platforms either buy global shutter or compensate in the model.

## Exposure, ISO, and resolution trade-offs

Image quality is a three-way negotiation:

- Longer **exposure** gathers more light but adds motion blur — the faster the platform, the shorter the exposure must be.
- Higher **ISO/gain** compensates for short exposures at the cost of noise, which degrades feature detection and matching.
- Higher **resolution** gives more detail but increases processing time per frame; many SLAM systems run at 640x480 or 1280x720 even when the sensor offers more.

**Auto-exposure** changes image brightness between frames, which breaks the brightness-constancy assumption of direct methods — fixed exposure or photometric calibration helps. For VIO rigs, also ensure the camera supports **hardware triggering/timestamping**: software timestamps jitter by milliseconds, which is fatal for tight camera-IMU fusion.

## Depth-capable camera configurations

- **Stereo vision**: two cameras with baseline $b$; depth from disparity $d$ as $Z = b f_x / d$. Passive — works outdoors, but struggles on textureless surfaces. Because $Z \propto 1/d$, a fixed disparity error causes depth error growing roughly with $Z^2$: the baseline directly sets the usable depth range, but a larger baseline also raises the minimum measurable depth and makes matching harder.
- **RGB-D / structured light**: projects an IR pattern and triangulates it (e.g., Kinect v1). Dense indoor depth; fails in sunlight.
- **Active IR stereo / Time-of-Flight (ToF)**: ToF sensors measure the round-trip time of emitted IR light per pixel. Compact and fast; range limits and multi-path artifacts apply.

A **disparity map** — a per-pixel map of stereo disparities, typically computed by semi-global matching (SGM) or read from an RGB-D sensor — is the standard intermediate product; each pixel with disparity $d$ becomes a 3D point through the stereo model.

## Choosing a camera for SLAM

A reasonable starting point for indoor SLAM is a 640x480 or 1280x720 **global-shutter** camera with a **wide-angle lens**; for outdoor, high-speed platforms, prioritize global shutter and frame rate over resolution. Then verify the boring details that dominate real-world performance: fixed (or controllable) exposure, hardware timestamps, a rigid mount, and a lens/model combination your calibration tool supports.

## Common pitfalls

- **Blaming the algorithm for hardware artifacts**: rolling-shutter skew, auto-exposure flicker, and motion blur all masquerade as "tracking bugs".
- **IR interference**: multiple structured-light/ToF cameras observing the same scene corrupt each other's patterns.
- **Loose mounts and heat**: a camera that flexes relative to the IMU or shifts intrinsics as it warms up invalidates calibration silently.
- **USB bandwidth**: multiple cameras on one bus drop frames unpredictably; check the topology, not just the specs.

## Why it matters for SLAM

Sensor choice bounds achievable accuracy: baseline sets stereo depth precision, shutter type sets how fast you can move, and lens FoV/MTF set how many usable features you get. Many "algorithm bugs" in practice turn out to be rolling-shutter skew, auto-exposure flicker, or motion blur — problems solved at the hardware and configuration level, not in code.

## Related

- [Pinhole camera model](../level-01-beginner/pinhole-camera-model.md)
- [Camera models beyond pinhole](../level-01-beginner/camera-models-beyond-pinhole.md)
- [Exteroceptive sensor](exteroceptive-sensor.md)
- [Depth from sensor](../level-04-rgbd-slam/depth-from-sensor.md)
- [Event cameras (DVS)](../level-10-event-camera-slam/event-cameras-dvs.md)
- [Disparity vs Depth](../level-07-stereo-slam/disparity-vs-depth.md)
