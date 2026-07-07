# Visual Odometry

> Nistér 2004 · [Paper](https://ieeexplore.ieee.org/document/1315094)

**One-line summary** — Coined the term "visual odometry" and demonstrated real-time, frame-by-frame camera pose estimation from monocular and stereo video, establishing VO as a practical navigation capability.

## Problem

Before this work, camera-based ego-motion estimation existed mainly as offline structure-from-motion: batch pipelines that processed image collections for minutes or hours. What autonomous navigation needed was the opposite — incremental, real-time, frame-by-frame pose estimation from a video stream, robust enough to run on a moving vehicle. Nistér, Naroditsky, and Bergen (CVPR 2004) showed this was practical: their system "estimates the motion of a stereo head or a single moving camera based on video input", operating in real time with low delay so the motion estimates can be used for navigational purposes — and they named the capability *visual odometry* by analogy with wheel odometry.

## Method & architecture

The pipeline is a per-frame loop of four stages (no global optimization anywhere):

1. **Feature detection and matching** — Harris corners are detected in each frame and matched across consecutive frames using normalized correlation of local image patches, producing feature tracks at video rate.
2. **Robust relative-pose estimation** — relative pose between calibrated views is computed inside a RANSAC hypothesise-and-test loop using Nistér's *five-point algorithm*, published as the companion paper ("An Efficient Solution to the Five-Point Relative Pose Problem", also 2004). With calibrated image points $\mathbf{q} \leftrightarrow \mathbf{q}'$, each correspondence constrains the essential matrix through the epipolar constraint

$$
\mathbf{q}'^\top \mathbf{E}\,\mathbf{q} = 0, \qquad \mathbf{E} \equiv [\mathbf{t}]_\times \mathbf{R},
$$

   and a valid essential matrix must additionally satisfy the cubic constraint (Theorem 1 of the five-point paper)

$$
\mathbf{E}\mathbf{E}^\top\mathbf{E} - \tfrac{1}{2}\,\mathrm{trace}\big(\mathbf{E}\mathbf{E}^\top\big)\,\mathbf{E} = \mathbf{0}.
$$

   Five correspondences give a $5 \times 9$ linear system whose 4-dimensional null space $\mathbf{E} = x\mathbf{X} + y\mathbf{Y} + z\mathbf{Z} + w\mathbf{W}$ is reduced via the cubic constraints to a **tenth-degree polynomial**, whose real roots are the candidate motions. Using the *minimal* five points makes each RANSAC hypothesis cheap and maximizes the chance of drawing an all-inlier sample; hypotheses are scored over all matches and outliers rejected. $\mathbf{R}, \mathbf{t}$ are then recovered from the SVD of $\mathbf{E}$.
3. **Triangulation** — inlier matches are triangulated into 3D points (in the stereo configuration the known baseline fixes metric scale; in the monocular case scale is unobservable).
4. **Incremental pose chaining** — each frame-to-frame relative pose is composed to obtain the global trajectory.

The defining architectural property is what is *absent*: no loop closure, no global optimisation, no place recognition, no map reuse — drift accumulates without bound, which is precisely what separates VO from full SLAM.

## Results

The published evaluation (IEEE-paywalled; full text was not available for this note — see paper for the complete evaluation) demonstrated real-time operation with low delay on real video from both a stereo head and a single moving camera, with the estimates used for navigation of ground-vehicle platforms; the extended journal version appeared as "Visual odometry for ground vehicle applications" (Journal of Field Robotics, 2006). The lasting quantitative legacy is architectural: the five-point solver introduced alongside this work became the standard tool for calibrated two-view geometry (OpenCV's `findEssentialMat` descends from it), and "visual odometry" became the accepted name for an entire subfield.

## Why it matters for SLAM

This paper defined visual odometry as a distinct problem and proved that cameras can serve as primary navigation sensors, laying the groundwork for every monocular SLAM system that followed. Its pipeline — features, minimal solver + RANSAC, triangulation, pose composition — is still the skeleton of most geometric front-ends (PTAM even uses the same five-point algorithm for map initialisation). Understanding what it lacks (loop closure, global consistency) is the cleanest way to understand what SLAM adds on top of VO.

## Related

- [VO vs SLAM](vo-vs-slam.md) — the conceptual distinction this paper motivates
- [MonoSLAM](monoslam.md) — the first real-time monocular SLAM, published shortly after
- [Epipolar geometry](../level-01-beginner/epipolar-geometry.md) — theory behind the essential matrix
- [Triangulation](../level-01-beginner/triangulation.md) — recovering 3D points from two views
- [2D-2D correspondence](../level-02-getting-familiar/2d-2d-correspondence.md) — the matching problem underlying VO
- [Corner detector](../level-01-beginner/corner-detector.md) — the Harris features the original pipeline tracked
