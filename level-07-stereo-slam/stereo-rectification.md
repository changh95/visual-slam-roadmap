# Stereo rectification

Stereo rectification warps the two images of a calibrated stereo pair so that they appear to come from two *ideal, parallel* cameras: image planes coplanar, optical axes parallel, and rows aligned. After rectification, the epipolar line of any pixel in the left image is simply the **same row** in the right image.

Why this works: for any pair of camera poses, epipolar geometry constrains the match of a left-image point to a 1D curve (a line for pinhole cameras) in the right image. Rectification is a pair of homographies $H_L, H_R$ applied to the images that map both epipoles to infinity along the horizontal axis, making all epipolar lines horizontal and vertically aligned. The homographies are computed from the calibrated intrinsics $K_L, K_R$ and the extrinsic transform $(R, t)$ between the cameras (e.g., Bouguet's method in OpenCV's `stereoRectify`), and are usually baked into fixed remap tables so rectifying each frame costs one image warp.

What it buys you:

- **1D correspondence search.** Matching reduces from a 2D search to scanning along a single row, which is what makes dense disparity algorithms (block matching, Semi-Global Matching) and fast sparse stereo matching tractable in real time.
- **Simple disparity geometry.** In the rectified frame, correspondence is purely horizontal, so $d = u_L - u_R$ and $Z = fB/d$ hold exactly, with a single common focal length $f$ and baseline $B$ for the virtual camera pair.
- **Outlier rejection for free.** A candidate match lying off its scanline (beyond a small tolerance) violates epipolar geometry and can be discarded immediately.

Practical caveats: rectification quality is limited by calibration quality — errors in $(R, t)$ show up as vertical misalignment that silently degrades matching. Wide field-of-view / fisheye lenses lose significant image area (or require special models) when warped to a pinhole rectified pair. And rectification assumes a rigid, fixed baseline; rigs that flex thermally or mechanically need periodic recalibration or online extrinsic refinement.

## Why it matters for SLAM

Nearly every stereo SLAM front-end — ORB-SLAM2's per-keypoint stereo matching, S-PTAM, dense SGM-based mapping in Kimera — assumes rectified input, because scanline search is the only way to get per-frame depth at real-time rates. Understanding rectification also tells you where stereo pipelines break: bad calibration, unsynchronized shutters, or fisheye optics all violate the rectified model before any SLAM code runs.

## Related

- [Epipolar geometry](../level-01-beginner/epipolar-geometry.md)
- [Disparity vs Depth](disparity-vs-depth.md)
- [Camera calibration](../level-01-beginner/camera-calibration.md)
- [Multi-sensor calibration](../level-02-getting-familiar/multi-sensor-calibration.md)

---
[Back to Level 7](../README.md#level-7-stereo-slam)
