# PTAM

> Klein & Murray 2007 · [Paper](https://www.robots.ox.ac.uk/~gk/publications/KleinMurray2007ISMAR.pdf)

**One-line summary** — Introduced the paradigm of splitting SLAM into parallel tracking and mapping threads, making real-time keyframe-based bundle adjustment possible for the first time.

## Problem

MonoSLAM's EKF approach could not scale beyond small maps: every frame updates a dense covariance over all landmarks, so cost grows quickly with map size and accuracy suffers from repeated linearisation. Bundle adjustment (BA) produces far more accurate results than filtering, but in 2007 it was considered too slow for real-time operation. Klein & Murray (ISMAR 2007, Oxford) argued that tracking a hand-held camera and building a map are separable problems: decouple them into two threads and BA can run in the background while tracking runs at frame rate.

## Method & architecture

**Tracking thread (every frame).** A four-level image pyramid is built and FAST corners detected at each level. Camera pose lives in $\mathrm{SE}(3)$ as a $4\times 4$ matrix $E_{CW}$, updated by left-multiplication via the exponential map with a six-vector $\mu$:

$$
E_{CW}' = M\,E_{CW} = \exp(\mu)\,E_{CW}.
$$

Map points are projected through a calibrated FOV-distortion camera model; each visible point's $8\times 8$ source patch is affinely warped by a matrix $A$ (from back-projecting unit pixel displacements of the source keyframe onto the patch plane), and $\det(A)/4^l$ closest to unity picks the pyramid level $l$ to search. Matching is zero-mean SSD at FAST corner locations inside a circular gate — no descriptors at all. Given the set $S$ of found patches $(\hat{u}_j\ \hat{v}_j)^\top$ with noise $\sigma_j^2 = 2^{2l}$, the pose update minimises a robust reprojection objective by ten iterations of reweighted least squares:

$$
\mu' = \underset{\mu}{\operatorname{argmin}} \sum_{j \in S} \mathrm{Obj}\left( \frac{|\mathbf{e}_j|}{\sigma_j},\ \sigma_T \right), \qquad
\mathbf{e}_j = \begin{pmatrix} \hat{u}_j \\ \hat{v}_j \end{pmatrix} - \mathrm{CamProj}\big(\exp(\mu)\,E_{CW}\,\mathbf{p}_j\big),
$$

where $\mathrm{Obj}(\cdot, \sigma_T)$ is the Tukey biweight with a median-based scale estimate $\sigma_T$. Tracking is two-stage coarse-to-fine: first 50 coarse-level points over a large radius, then up to 1000 points over a tight radius; a decaying-velocity motion model predicts the prior pose, and tracking quality is monitored so poor frames never reach the map (with a relocalizer for full failure).

**Mapping thread (asynchronous).** The map is bootstrapped by user-assisted two-view stereo: 1000 patches tracked between two key-pressed views, essential matrix from the five-point algorithm + RANSAC, triangulation, scale fixed by assuming a 10 cm baseline, and the dominant plane (found by RANSAC) aligned to $z=0$. Keyframes are added only when tracking is good, at least 20 frames have passed, and the camera exceeds a minimum (depth-scaled) distance from existing keyframes; new points come from epipolar search against the nearest keyframe. The thread then runs BA over keyframe poses and points:

$$
\{\mu_2 .. \mu_N\}, \{\mathbf{p}'_1 .. \mathbf{p}'_M\} = \underset{\{\mu\},\{\mathbf{p}\}}{\operatorname{argmin}} \sum_{i=1}^{N} \sum_{j \in S_i} \mathrm{Obj}\left( \frac{|\mathbf{e}_{ji}|}{\sigma_{ji}},\ \sigma_T \right)
$$

— Levenberg–Marquardt with the standard sparse structure-from-motion tricks, scaling as $O(N^3)$ in keyframes. Because full BA stalls during exploration, a *local* BA adjusts only $X$ = the newest keyframe plus its 4 nearest neighbours, over $Z$ = all points they see, constrained by every keyframe $Y$ that measures those points (roughly $O(NM)$). When idle, the thread improves data association: measuring new features in old keyframes and giving Tukey-flagged outlier measurements a "second chance" before deletion.

## Results

All on a desktop Intel Core 2 Duo 2.66 GHz (live hand-held operation):

- **Tracking cost** for a 4000-point map: 19.2 ms/frame total — keyframe preparation 2.2 ms, feature projection 3.5 ms, patch search 9.8 ms, iterative pose update 3.7 ms — i.e. real-time with margin; relocalization spikes to about 90 ms.
- **Desk sequence** (1656 frames): final map of 57 keyframes and 4997 points, tracked at around 20 ms/frame throughout.
- **BA timings**: local BA 170 ms / 270 ms / 440 ms and global BA 380 ms / 1.7 s / 6.9 s for maps of 2–49 / 50–99 / 100–149 keyframes; beyond 150 keyframes global convergence needs tens of seconds. Largest map built: 11000 points, 280 keyframes (practical limit about 6000 points / 150 keyframes).
- **Versus EKF-SLAM** (SceneLib with JCBB, synthetic 18.2 m trajectory): standard deviation from ground truth **6 mm for PTAM vs 135 mm for EKF-SLAM**, with PTAM mapping 6600 points against 114; PTAM tracks in constant ~20 ms while the EKF grows quadratically from 3 ms to 40 ms.
- Demonstrated table-top AR games running live on the map, with no loop closure or large-scale relocalization by design.

## Why it matters for SLAM

PTAM established the frontend/backend separation that virtually every modern SLAM system still follows, and demonstrated empirically that keyframe bundle adjustment beats filtering — a claim later formalised by Strasdat et al.'s "Visual SLAM: Why Filter?". Keyframes, local BA over a neighbourhood, background global refinement, tracking-quality gating: ORB-SLAM is essentially this architecture completed with automatic initialisation, loop closure, and large-scale map management.

## Related

- [MonoSLAM](monoslam.md)
- [Visual-SLAM why filter?](visual-slam-why-filter.md)
- [ORB-SLAM](orb-slam.md)
- [DTAM](dtam.md)
- [S-PTAM](../level-07-stereo-slam/s-ptam.md)
- [Lie groups](../level-02-getting-familiar/lie-groups.md) — the $\exp(\mu)$ pose parametrisation PTAM tracks with
