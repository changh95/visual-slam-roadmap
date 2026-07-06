# Camera models beyond pinhole

The pinhole model with radial-tangential distortion works well for narrow and moderate fields of view, but many SLAM platforms use lenses and sensors that break its assumptions. Wide field-of-view lenses see more of the scene — which means more parallax, more trackable features, and better robustness to fast rotation — at the cost of requiring different projection models.

## Fisheye: Kannala-Brandt

Fisheye lenses reach fields of view of 180° or more, where the pinhole perspective projection ($r = f\tan\theta$, with $\theta$ the angle from the optical axis) diverges. The **Kannala-Brandt model** instead expresses the image radius directly as a polynomial in the incidence angle:

$$r(\theta) = k_1\theta + k_2\theta^3 + k_3\theta^5 + k_4\theta^7$$

This generic model fits equidistant, equisolid, and other fisheye projections, and is the fisheye model implemented in OpenCV (`cv::fisheye`) and used by systems such as ORB-SLAM3 for wide-angle cameras.

## Double-sphere and omnidirectional models

The **double-sphere model** projects a 3D point through two unit spheres followed by a pinhole projection. It fits fisheye lenses with accuracy comparable to Kannala-Brandt while having a closed-form, computationally cheap unprojection — a practical advantage in real-time VIO (it originates from the group behind the Basalt VIO system). **Omnidirectional models** (e.g., the unified camera model with a mirror/sphere parameter, and Scaramuzza's polynomial model) cover catadioptric cameras and very wide fisheyes; they are supported by calibration tools such as Kalibr and OpenCV's `omnidir` module.

## Rolling-shutter awareness

Most low-cost CMOS cameras use a **rolling shutter**: image rows are exposed sequentially rather than simultaneously. When the camera or scene moves fast, each row is captured from a slightly different pose, producing skew and wobble. A geometric model that assumes one pose per frame is then wrong; high-speed SLAM either uses global-shutter hardware or explicitly models per-row capture time (interpolating the pose across the readout). At minimum, be aware of which shutter your camera has before trusting the geometry.

## Why it matters for SLAM

Feeding fisheye images into a pinhole+distortion model, or ignoring rolling shutter on a fast platform, silently corrupts every measurement in the pipeline. Choosing the right camera model — and calibrating it with tools that support that model — is a prerequisite for accurate tracking on drones, AR headsets, and automotive surround-view rigs, which almost always use wide-angle or fisheye optics.

## Related

- [Pinhole camera model](pinhole-camera-model.md)
- [Camera calibration](camera-calibration.md)
- [Camera device](../level-02-getting-familiar/camera-device.md)
- [Basalt](../level-06-vio-vins/basalt.md)

[Back to Level 1](../README.md#level-1-beginner)
