# EVO

> Rebecq 2017 · [Paper](https://rpg.ifi.uzh.ch/docs/RAL16_EVO.pdf)

**One-line summary** — EVO is the pioneering event-based visual odometry system: a purely geometric parallel tracking-and-mapping pipeline that estimates 6-DoF camera motion and reconstructs a semi-dense 3D map from the event stream alone, in real time on a standard CPU at up to several hundred poses per second.

## Problem

Before EVO, event-based ego-motion estimation was confined to restricted settings — rotational motion only, planar scenes with artificial B&W patterns, known maps or poses, attached RGB-D sensors, or intensity images for feature detection. The only prior system covering the general case (Kim 2016) required reconstructing image intensity and regularizing depth, demanding a GPU, and was evaluated only qualitatively. The core difficulty is that events carry no absolute brightness, so neither classical feature matching nor photometric alignment applies directly. EVO targets the most general scenario — 6-DoF motion, natural 3D scenes, events only — with a CPU-real-time geometric approach that never estimates intensity.

## Method & architecture

A PTAM-style separation into interleaved tracking and mapping modules, each consuming the other's output:

- **Tracking by image-to-model alignment**: a binary *event image* $I$ (pixels where recent events fired) is registered against a template $M$ — the projection of the semi-dense 3D map from a reference pose, smoothed with a Gaussian ($\sigma = 0.8$ px) so it approximates a distance function to the projected edges. The photometric error of direct VO is replaced by a *geometric* edge-alignment error, minimized with the inverse compositional Lucas-Kanade method:

$$\sum_{u} \bigl( M(\mathsf{W}(u;\Delta T)) - I(\mathsf{W}(u;T)) \bigr)^2, \qquad T \leftarrow T \cdot (\Delta T)^{-1},$$

with 3D rigid-body warp $\mathsf{W}(u;T) := \pi(T \cdot \pi^{-1}(u, d_u))$, where $d_u$ is the known map depth at pixel $u$ and poses are parametrized by twists $\xi \in \mathbb{R}^6$, $T = \exp(\hat{\xi}) \in SE(3)$. Inverse composition lets $M$-dependent derivatives be precomputed and reused across many event images.
- **Event image construction**: $N_e$ events are aggregated per image ($N_e \approx$ 70% of the map's point count, ~2000 events, spanning only 0.6–2 ms at 1–3 Mevents/s); a sliding window over the stream sets the pose output rate. Tracking uses stochastic gradient descent over random pixel batches (300–500 pixels, up to 5 epochs) — since consecutive event images are sub-pixel apart, no coarse-to-fine pyramid is needed.
- **Mapping via EMVS**: events are back-projected as rays into a Disparity Space Image (DSI) — a projective voxel grid centered at a keyframe with 50 depth planes uniformly spaced in *inverse depth*; each voxel counts traversing rays. Local maxima of ray density mark 3D edges: the DSI is collapsed into a depth + confidence map, adaptively thresholded into a semi-dense depth map, and filtered (15×15 median, radius outlier removal) into a point cloud. No intensity, no explicit data association.
- **Keyframing & interplay**: a new keyframe is created when distance to the last KF divided by mean scene depth exceeds ~15%; the DSI is recomputed from the last 2M events and refined incrementally, with an updated point cloud extracted every 100k events, while tracking continues on the previous map. Bootstrapping assumes a fronto-parallel planar scene for the first $\tau$ seconds.
- **Optional intensity recovery**: using the linearized event generative model $-\langle \nabla L, \dot{u}\Delta t \rangle = C$ (brightness change reaching contrast threshold $C$) plus Poisson reconstruction, EVO's output can produce HDR, super-resolved, blur-free intensity images — but the pipeline never needs them.

## Results

- Data from the DAVIS sensor (240×180 pixels, ~130 dB dynamic range, microsecond resolution); frames used for visualization only. Ground truth from an Optitrack motion-capture system.
- **Single-keyframe, aggressive motion** (up to 780°/s, with room lights switched off and on mid-sequence): average errors of 2° rotation and 2 cm translation over a 35 m trajectory — 0.057% relative position error.
- **Multi-keyframe trajectory**: 6 cm translational and ~3° rotational drift over 30 m — 0.2% relative position error — with no bundle adjustment or pose refinement.
- **Compute**: on an Intel Core i7-4810MQ @ 2.80 GHz, EVO processes ~1.5 Mevents/s and computes more than 500 poses/s; it runs 1.25–3× faster than real time at moderate speeds and at worst 2× slower than real time under high-speed motion.
- Qualitative outdoor experiments in a busy street with aggressive motion and moving elements (pedestrians, bicycles), plus HDR sequences — conditions where standard-camera VO fails.

## Why it matters for SLAM

EVO established the template for event-based SLAM: it showed that the classical tracking-and-mapping decomposition survives the transition to a radically different sensor, provided the front-end is redesigned around event geometry — edge alignment instead of photometric error, ray-density voting instead of correspondence. Nearly every subsequent event odometry system positions itself relative to EVO: ESVO extends the idea to stereo (fixing monocular scale ambiguity), Ultimate-SLAM adds frames and IMU for robustness across all conditions, and learned systems like DEVO use it as the classical baseline lineage.

## Related

- [ESVO](esvo.md)
- [EDS](eds.md)
- [Ultimate-SLAM](ultimate-slam.md)
- [PTAM](../level-03-monocular-slam/ptam.md)
- [Event-based Vision Survey](event-based-vision-survey.md)
