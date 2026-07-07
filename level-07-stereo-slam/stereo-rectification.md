# Stereo rectification

Stereo rectification warps the two images of a calibrated stereo pair so that they appear to come from two *ideal, parallel* cameras: image planes coplanar, optical axes parallel, and rows aligned. After rectification, the epipolar line of any pixel in the left image is simply the **same row** in the right image.

Why this works: for any pair of camera poses, epipolar geometry constrains the match of a left-image point to a 1D curve (a line for pinhole cameras) in the right image. Rectification is a pair of homographies $H_L, H_R$ applied to the images that map both epipoles to infinity along the horizontal axis, making all epipolar lines horizontal and vertically aligned.

## How the rectifying transforms are computed

Given calibrated intrinsics $K_L, K_R$, lens distortion, and the extrinsic transform $(R, t)$ between the cameras, the classic (Bouguet) construction used by OpenCV's `stereoRectify` proceeds as:

1. **Split the relative rotation.** Rotate each camera by "half" of $R$ so the two optical axes become parallel while disturbing each image as little as possible.
2. **Align with the baseline.** Apply a common rotation so the new $x$-axes point along the baseline vector $t$. Both epipoles now sit at infinity, so epipolar lines are horizontal.
3. **Choose common virtual intrinsics.** A single new camera matrix $K_{\text{new}}$ (same $f$, same principal point row) is chosen for both views, giving the rectified pair one focal length and one baseline for $Z = fB/d$.
4. **Bake remap tables.** The per-camera warp $H = K_{\text{new}} R_{\text{rect}} K_{\text{old}}^{-1}$, combined with the lens-undistortion model, is precomputed into lookup tables, so rectifying each frame costs a single image remap.

```python
R1, R2, P1, P2, Q, roi1, roi2 = cv2.stereoRectify(K1, D1, K2, D2, size, R, T)
mapLx, mapLy = cv2.initUndistortRectifyMap(K1, D1, R1, P1, size, cv2.CV_32FC1)
mapRx, mapRy = cv2.initUndistortRectifyMap(K2, D2, R2, P2, size, cv2.CV_32FC1)
rectL = cv2.remap(imgL, mapLx, mapLy, cv2.INTER_LINEAR)
rectR = cv2.remap(imgR, mapRx, mapRy, cv2.INTER_LINEAR)
```

The returned $Q$ matrix reprojects a rectified pixel-plus-disparity $(u, v, d)$ directly to 3D — the disparity-to-depth conversion in matrix form.

## What it buys you

- **1D correspondence search.** Matching reduces from a 2D search to scanning along a single row, which is what makes dense disparity algorithms (block matching, Semi-Global Matching) and fast sparse stereo matching tractable in real time.
- **Simple disparity geometry.** In the rectified frame, correspondence is purely horizontal, so $d = u_L - u_R$ and $Z = fB/d$ hold exactly, with a single common focal length $f$ and baseline $B$ for the virtual camera pair.
- **Outlier rejection for free.** A candidate match lying off its scanline (beyond a small tolerance) violates epipolar geometry and can be discarded immediately.

## Checking rectification quality

A quick sanity check: match features between the rectified images and inspect the vertical disparity $v_L - v_R$. On a well-rectified pair it should be a small fraction of a pixel; a systematic offset or a gradient across the image means the extrinsic calibration has drifted. Rising vertical disparity over a robot's lifetime is the standard symptom of a rig that has been bumped or is flexing thermally.

## Practical caveats

- **Rectification is only as good as calibration.** Errors in $(R, t)$ show up as vertical misalignment that silently degrades matching — the matcher searches the wrong row and either fails or returns biased disparities.
- **Wide-FoV and fisheye lenses suffer.** Warping to a pinhole rectified pair loses significant image area at the periphery (or requires special rectification models); heavy crop factors waste exactly the wide field of view the lens was chosen for.
- **The baseline must stay rigid.** Rectification assumes a fixed $(R, t)$; rigs that flex mechanically or thermally need periodic recalibration or online extrinsic refinement.
- **Shutters must be synchronized.** If the two cameras expose at different instants, a moving platform effectively changes the baseline per frame — no static rectification can fix that.

## Why it matters for SLAM

Nearly every stereo SLAM front-end — ORB-SLAM2's per-keypoint stereo matching, S-PTAM, dense SGM-based mapping in Kimera — assumes rectified input, because scanline search is the only way to get per-frame depth at real-time rates. Understanding rectification also tells you where stereo pipelines break: bad calibration, unsynchronized shutters, or fisheye optics all violate the rectified model before any SLAM code runs.

## Related

- [Epipolar geometry](../level-01-beginner/epipolar-geometry.md)
- [Disparity vs Depth](disparity-vs-depth.md)
- [Camera calibration](../level-01-beginner/camera-calibration.md)
- [Multi-sensor calibration](../level-02-getting-familiar/multi-sensor-calibration.md)
