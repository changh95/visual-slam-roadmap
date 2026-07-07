# Optical Flow

**Optical flow** is the apparent 2D motion of image brightness patterns between consecutive frames: a vector field $(u, v)$ assigning each pixel (or each tracked point) a displacement from time $t$ to $t+1$. It is how SLAM front-ends follow points through video without re-detecting and re-matching features every frame.

## Brightness constancy and the flow constraint

The founding assumption is **brightness constancy**: a scene point keeps its intensity as it moves,

$$
I(x, y, t) = I(x + u,\, y + v,\, t + 1)
$$

Assuming the motion is **small**, expand the right side to first order (Taylor expansion) and cancel $I(x,y,t)$:

$$
I_x u + I_y v + I_t = 0
$$

where $I_x, I_y$ are the spatial image gradients and $I_t$ is the temporal difference between frames. This **optical flow constraint equation** is one equation in two unknowns per pixel — the flow component *along* the image gradient is observable, the component perpendicular to it is not. This is the **aperture problem**: viewing a moving edge through a small window, you cannot tell how it slides along itself.

## Lucas-Kanade: local least squares

Lucas-Kanade resolves the ambiguity with a third assumption: all pixels in a small window $W$ (e.g. $21\times 21$) share the same flow. Stacking the constraint for the $N$ window pixels:

$$
\underbrace{\begin{bmatrix} I_x^{(1)} & I_y^{(1)} \\ \vdots & \vdots \\ I_x^{(N)} & I_y^{(N)} \end{bmatrix}}_{A}
\begin{bmatrix} u \\ v \end{bmatrix}
= -\underbrace{\begin{bmatrix} I_t^{(1)} \\ \vdots \\ I_t^{(N)} \end{bmatrix}}_{\mathbf{b}}
$$

an overdetermined system solved by least squares: $(A^T A)\,\mathbf{v} = -A^T \mathbf{b}$. The $2\times 2$ matrix $A^T A$ is exactly the **structure tensor** from the Harris [corner detector](../level-01-beginner/corner-detector.md) — a deep and practical connection:

- **Corner** (both eigenvalues large): well-conditioned system, reliable flow. This is why trackers select corners ("good features to track").
- **Edge** (one eigenvalue near zero): ill-conditioned — the aperture problem in matrix form.
- **Flat region** (both near zero): no information at all.

Because the linearization assumes small motion, real implementations iterate the solve (warp, re-linearize) and run **coarse-to-fine** over an [image pyramid](image-pyramid.md): large motions shrink to small ones at coarse scales, and each level's estimate initializes the next. This pyramidal Lucas-Kanade scheme is the core of the [KLT tracker](klt-tracker.md).

## Sparse vs. dense flow

- **Sparse flow** (Lucas-Kanade/KLT) computes flow only at selected keypoints — cheap, and exactly what feature-based VO/SLAM needs for frame-to-frame tracking.
- **Dense flow** estimates a vector per pixel. The classical formulation (Horn-Schunck) makes the problem well-posed globally by adding a smoothness regularizer, minimizing over the whole image

$$
E(u, v) = \iint \left( I_x u + I_y v + I_t \right)^2 + \lambda \left( \|\nabla u\|^2 + \|\nabla v\|^2 \right) \, dx\, dy
$$

  so textureless regions inherit flow from their neighbors. Modern dense flow is dominated by learned methods (FlowNet, PWC-Net, RAFT), which handle large displacements, occlusion, and lighting changes far better than the classical assumptions allow.

A standard reliability filter for tracking is the **forward-backward check**: track a point from frame $t$ to $t+1$, track the result back to $t$, and discard the track if it does not return near its start.

## Why it matters for SLAM

Optical flow is the cheapest way to get frame-to-frame correspondences, and correspondences are the raw material of visual odometry. KLT-based tracking front-ends (e.g. in VINS-Mono and many VIO systems) track corners with pyramidal Lucas-Kanade instead of matching descriptors — faster, and with sub-pixel accuracy that descriptor matching lacks. The same brightness-constancy machinery, generalized from a 2D window shift to a full camera-pose warp, is the foundation of direct methods (LSD-SLAM, DSO). And dense learned flow now powers correspondence in systems like DROID-SLAM. Understanding the constraint equation, the aperture problem, and the structure-tensor conditioning tells you where any of these will fail: fast motion, low texture, and changing illumination.

## Related

- [KLT Tracker](klt-tracker.md)
- [Image pyramid](image-pyramid.md)
- [Corner detector](../level-01-beginner/corner-detector.md)
- [FlowNet](../level-05-deep-learning/flownet.md)
- [RAFT](../level-05-deep-learning/raft.md)
