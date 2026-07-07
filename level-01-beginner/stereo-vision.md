# Stereo Vision

**Stereo vision** recovers depth from two calibrated cameras separated by a known **baseline** $b$. Because the relative pose between the cameras is fixed and known, the position of a scene point in one image constrains where it can appear in the other, and the horizontal shift between the two observations encodes metric depth.

## Disparity and depth

After **rectification** (warping both images so that their epipolar lines become the same horizontal scanlines), a 3D point at depth $Z$ appears at horizontal pixel coordinates $u_L$ and $u_R$ in the left and right images. The **disparity** is

$$d = u_L - u_R = \frac{f_x\, b}{Z}$$

where $f_x$ is the focal length in pixels. Depth is recovered by inverting:

$$Z = \frac{f_x\, b}{d}$$

Given $Z$, the full 3D point follows from the pinhole model: $X = (u - c_x) Z / f_x$ and $Y = (v - c_y) Z / f_y$.

## Depth uncertainty

Differentiating $Z(d)$ shows how a matching error $\delta d$ (typically a fraction of a pixel) propagates to depth:

$$\delta Z \approx \frac{Z^2}{f_x\, b}\, \delta d$$

Depth error grows **quadratically with distance** and inversely with baseline. This is the fundamental design trade-off of stereo rigs: a wider baseline improves far-field accuracy but shrinks the overlapping field of view and makes close-range matching harder; a narrow baseline does the opposite. Beyond some range, disparity falls below matching precision and the stereo pair effectively degenerates into a monocular camera.

## Stereo matching

Producing a dense **disparity map** requires finding, for each pixel in the left image, its correspondence along the same scanline in the right image:

- **Local (block) matching** compares small windows using costs such as SAD (sum of absolute differences), NCC (normalized cross-correlation), or the census transform. Fast, but fails on textureless and repetitive regions.
- **Semi-global matching (SGM)** adds a smoothness prior: it minimizes a cost that combines the per-pixel data term with penalties $P_1$ (small disparity changes) and $P_2$ (large jumps) aggregated along multiple 1D paths across the image. SGM is the workhorse of real-time dense stereo and is what most depth-from-stereo sensors run in hardware or on GPU.
- Consistency checks (left-right check, uniqueness, speckle filtering) remove unreliable disparities.

Sparse stereo — matching only detected keypoints between the two views — is common in feature-based SLAM (e.g., ORB-SLAM2's stereo mode), since it avoids the cost of dense matching while still providing metric landmarks.

## Stereo vs. monocular vs. RGB-D

Stereo is triangulation with a fixed, factory-calibrated baseline, which is what makes **metric scale observable**: a monocular camera can only recover geometry up to an unknown scale factor, whereas a stereo rig anchors it in meters. Compared to RGB-D sensors (structured light or time-of-flight), passive stereo works outdoors in sunlight and at longer ranges, but struggles on textureless surfaces where matching has nothing to lock onto.

## Why it matters for SLAM

Stereo removes the two hardest problems of monocular SLAM at once: scale ambiguity and initialization. Every stereo frame yields metric 3D landmarks immediately — no motion parallax needed to bootstrap a map — and scale cannot drift because each new frame re-measures it. That is why stereo (and stereo-inertial) configurations are the default in robotics deployments, and why understanding the disparity-depth relationship and its quadratic error growth is essential for choosing baselines and setting reliable-depth thresholds (e.g., the "close vs. far" point distinction in ORB-SLAM2).

## Related

- [Epipolar geometry](epipolar-geometry.md)
- [Triangulation](triangulation.md)
- [Stereo rectification](../level-07-stereo-slam/stereo-rectification.md)
- [Disparity vs Depth](../level-07-stereo-slam/disparity-vs-depth.md)
- [Scale observability](../level-07-stereo-slam/scale-observability.md)
