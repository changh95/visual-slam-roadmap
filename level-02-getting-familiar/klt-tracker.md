# KLT Tracker

The **Kanade-Lucas-Tomasi (KLT) tracker** follows sparse feature points from frame to frame by directly aligning small image patches, instead of re-detecting and re-matching descriptors every frame. It combines the Lucas-Kanade optical flow solution (Lucas & Kanade, 1981), Tomasi & Kanade's tracking formulation (1991), and Shi & Tomasi's feature selection criterion (1994), and — in its pyramidal form (Bouguet) — is the front-end of many VIO systems (MSCKF implementations, VINS-Mono) and the workhorse behind `cv::calcOpticalFlowPyrLK`.

## The Lucas-Kanade core

Assume **brightness constancy**: the patch around a feature keeps its intensity as it moves by $(u, v)$ between frames,

$$
I(x, y, t) = I(x + u,\; y + v,\; t + 1).
$$

For small motion, first-order Taylor expansion gives the **optical flow constraint equation**:

$$
I_x u + I_y v + I_t = 0
$$

where $I_x, I_y$ are spatial image gradients and $I_t$ is the temporal difference. One equation, two unknowns — the aperture problem. Lucas-Kanade adds **spatial coherence**: all $N$ pixels in a window $W$ around the feature share the same $(u, v)$. Stacking the $N$ constraints and solving by least squares yields the $2 \times 2$ system

$$
A^T A \begin{bmatrix} u \\ v \end{bmatrix} = -A^T \mathbf{b},
\qquad
A^T A = \begin{bmatrix} \sum I_x^2 & \sum I_x I_y \\ \sum I_x I_y & \sum I_y^2 \end{bmatrix}
$$

with $\mathbf{b}$ the vector of temporal gradients. Because the motion is not truly infinitesimal, this solve is **iterated** in Gauss-Newton fashion: warp the patch by the current estimate, recompute residuals, solve for an increment, repeat until the update falls below a threshold.

## Good features to track

The matrix $A^T A$ is exactly the **structure tensor** from the Harris corner detector, and its conditioning decides trackability. With eigenvalues $\lambda_1 \ge \lambda_2$:

- both large — a corner; the system is well-conditioned and the full 2D motion is recoverable;
- $\lambda_2 \approx 0$ — an edge; motion along the edge is unobservable (aperture problem);
- both small — a flat region; nothing to track.

Shi & Tomasi's criterion selects features where $\min(\lambda_1, \lambda_2) > \tau$ — "good features to track" are, by construction, the points where the KLT solve is stable. This is `cv::goodFeaturesToTrack`.

## Making it work over real motion

- **Pyramidal coarse-to-fine**: raw LK tolerates only small displacements (the Taylor linearization). Pyramidal KLT solves the flow at the coarsest level of an image pyramid, then propagates and refines the estimate level by level — extending the capture range from a few pixels to tens of pixels while keeping each solve in the linear regime.
- **Forward-backward check**: track each point from frame $t$ to $t+1$, then track the result back to $t$; if the round trip does not return near the starting point, discard the track. A cheap, effective filter for occlusions and drifting tracks.
- **Track maintenance and drift**: tracks are lost to occlusion and appearance change, so the tracker replenishes features (detecting new Shi-Tomasi/FAST corners in under-populated grid cells). Because each step aligns against the *previous* frame, small errors accumulate — template drift. Tomasi-Kanade's remedy is monitoring patch dissimilarity against the *first* frame of the track (with an affine warp to absorb viewpoint change) and killing tracks that degrade.

## Why it matters for SLAM

KLT is the cheap, high-precision alternative to descriptor matching for *frame-to-frame* correspondence: no descriptor computation, no NN search, sub-pixel accuracy, and computation proportional to the number of tracked points — ideal for the tracking thread of a real-time system on embedded hardware. This is why optical-flow front-ends dominate VIO (VINS-Mono tracks KLT corners and never computes descriptors during normal operation) and why semi-direct methods like SVO are built on the same patch-alignment mathematics. Its limits define front-end design, too: KLT degrades under large baselines, illumination change (brightness constancy breaks), and motion blur, and provides no means to re-find a lost feature — which is exactly what descriptor-based matching and place recognition are for. The KLT normal equations are also the simplest instance of the Gauss-Newton pattern that reappears at every scale of SLAM, up to full photometric bundle adjustment.

## Related

- [Optical flow](optical-flow.md)
- [Image pyramid](image-pyramid.md)
- [Corner detector](../level-01-beginner/corner-detector.md)
- [FAST](fast.md)
- [VINS-Mono](../level-06-vio-vins/vins-mono.md)
