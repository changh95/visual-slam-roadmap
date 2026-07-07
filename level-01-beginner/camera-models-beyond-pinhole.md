# Camera models beyond pinhole

The pinhole model with radial-tangential distortion works well for narrow and moderate fields of view, but many SLAM platforms use lenses and sensors that break its assumptions. Wide field-of-view lenses see more of the scene — which means more parallax, more trackable features, and better robustness to fast rotation — at the cost of requiring different projection models.

## Projection functions at a glance

All central camera models can be compared by how the image radius $r$ grows with the incidence angle $\theta$ (the angle between the incoming ray and the optical axis):

| Model | $r(\theta)$ | Behaviour at $\theta \to 90°$ |
|---|---|---|
| Perspective (pinhole) | $f\tan\theta$ | diverges — cannot represent FoV ≥ 180° |
| Equidistant fisheye | $f\theta$ | finite |
| Equisolid fisheye | $2f\sin(\theta/2)$ | finite |
| Stereographic | $2f\tan(\theta/2)$ | finite |

The pinhole projection blows up as rays approach 90° from the axis, which is the fundamental reason fisheye lenses need their own models rather than ever-higher-order distortion polynomials.

## Fisheye: Kannala-Brandt

Fisheye lenses reach fields of view of 180° or more, where the pinhole perspective projection ($r = f\tan\theta$) diverges. The **Kannala-Brandt model** instead expresses the image radius directly as a polynomial in the incidence angle:

$$r(\theta) = k_1\theta + k_2\theta^3 + k_3\theta^5 + k_4\theta^7$$

This generic model fits equidistant, equisolid, and other fisheye projections, and is the fisheye model implemented in OpenCV (`cv::fisheye`) and used by systems such as ORB-SLAM3 for wide-angle cameras. Note the structure: it is a *replacement* for the projection function itself, with the odd-power series playing the role that the distortion polynomial plays for pinhole cameras.

## Double-sphere and omnidirectional models

The **double-sphere model** projects a 3D point through two unit spheres followed by a pinhole projection. It fits fisheye lenses with accuracy comparable to Kannala-Brandt while having a closed-form, computationally cheap unprojection — a practical advantage in real-time VIO, since unprojection (pixel to ray) runs for every feature on every frame; polynomial models like Kannala-Brandt need iterative root-finding for the same operation. The model originates from the group behind the Basalt VIO system.

**Omnidirectional models** (e.g., the unified camera model, which projects through a single sphere with a mirror/sphere offset parameter $\xi$, and Scaramuzza's polynomial model) cover catadioptric cameras — cameras with mirrors — and very wide fisheyes. They are supported by calibration tools such as Kalibr and OpenCV's `omnidir` module.

## Rolling-shutter awareness

Most low-cost CMOS cameras use a **rolling shutter**: image rows are exposed sequentially rather than simultaneously. When the camera or scene moves fast, each row is captured from a slightly different pose, producing skew and wobble. A geometric model that assumes one pose per frame is then wrong: a point observed on row $v$ was actually captured at time

$$t(v) = t_0 + \frac{v}{H}\,t_{\text{readout}}$$

where $t_0$ is the start of frame readout, $H$ the image height, and $t_{\text{readout}}$ the total readout time. High-speed SLAM either uses global-shutter hardware or explicitly models per-row capture time, interpolating the camera pose across the readout. At minimum, know which shutter your camera has before trusting the geometry.

## Common pitfalls

- **Forcing a fisheye lens into the radial-tangential pinhole model**: it fits well near the image centre and fails badly toward the border — reprojection error statistics will look deceptively good if the calibration views avoided the edges.
- **Undistorting fisheye images to a pinhole view** throws away the wide FoV (cropping) or stretches the periphery enormously; modern systems keep the native model and adapt the solvers instead.
- **Mixing conventions between tools**: the same lens calibrated in Kalibr, OpenCV, and a SLAM system's config may use different parameter orders and model names; verify by reprojecting points, not by eyeballing numbers.

## Why it matters for SLAM

Feeding fisheye images into a pinhole+distortion model, or ignoring rolling shutter on a fast platform, silently corrupts every measurement in the pipeline. Choosing the right camera model — and calibrating it with tools that support that model — is a prerequisite for accurate tracking on drones, AR headsets, and automotive surround-view rigs, which almost always use wide-angle or fisheye optics.

## Related

- [Pinhole camera model](pinhole-camera-model.md)
- [Camera calibration](camera-calibration.md)
- [Camera device](../level-02-getting-familiar/camera-device.md)
- [Basalt](../level-06-vio-vins/basalt.md)
- [Multi-sensor calibration](../level-02-getting-familiar/multi-sensor-calibration.md)
