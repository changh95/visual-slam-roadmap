# Neural Ray Surfaces

> Vasiljevic 2020 · [Paper](https://arxiv.org/abs/2008.06630)

**One-line summary** — Replaces the fixed pinhole projection in self-supervised depth-and-ego-motion learning with a learned per-pixel ray surface, so the same photometric training framework works on fisheye, catadioptric, and even underwater cameras without calibration.

## Problem

Self-supervised learning became a powerful tool for depth and ego-motion estimation, but every method in the family shares one significant hidden limitation: the view-synthesis step assumes a *known parametric camera model* — almost always standard pinhole geometry. The approach therefore fails outright on imaging systems that deviate significantly from that assumption (catadioptric cameras, underwater imaging, cameras behind curved windshields). Parametric distortion models are only approximately correct, require a new differentiable projection per camera type, and simply do not exist for some settings. Even learning pinhole intrinsics (Gordon 2019) cannot cover these cases.

## Method & architecture

The standard self-supervised setup (Zhou et al.) is kept: a depth network $f_d$, a pose network $f_{\mathbf{x}}$ predicting $\mathbf{X}_{t\to c}\in SE(3)$ between target and context frames, and the photometric warp

$$\hat{\mathbf{p}}_{t}=\pi_{c}\big(\mathbf{R}_{t\rightarrow c}\,\phi_{t}(\mathbf{p}_{t},d_{t})+\mathbf{t}_{t\rightarrow c}\big),$$

trained with $\mathcal{L}=\mathcal{L}_{p}+\lambda_{d}\mathcal{L}_{d}$ (SSIM+L1 appearance loss with per-pixel minimum over context frames and auto-masking, plus edge-aware smoothness). What changes are the unprojection $\phi$ and projection $\pi$. Following Grossberg & Nayar's generic camera, each pixel gets a unit viewing ray: a second decoder sharing the depth network's encoder predicts the ray surface $\hat{\mathbf{Q}}=f_r(I)$.

**Unprojection** is closed-form — scale the ray by depth from the camera center $\mathbf{S}$ (set to the origin for a central camera):

$$\mathbf{P}(u,v)=\mathbf{S}(u,v)+\hat{D}(u,v)\,\hat{\mathbf{Q}}(u,v).$$

**Projection** has no closed form: a 3D point $\mathbf{P}_j$ must be matched to the context pixel whose ray best aligns with the direction $\mathbf{r}_{c\to j}=\mathbf{P}_{j}-\mathbf{S}_{c}$,

$$\mathbf{p}_{i}^{*}=\arg\max_{\mathbf{p}_{i}\in I_{c}}\langle\hat{\mathbf{Q}}_{c}(\mathbf{p}_{i})\,,\mathbf{r}_{c\to j}\rangle,$$

which is both $O((HW)^2)$ and non-differentiable. Three fixes make it trainable: (1) **softmax association** — replace argmax over the similarity tensor $\mathbf{M}_{ij}$ with a temperature-$\tau$ softmax $\tilde{\mathbf{M}}$, annealing $\tau$ toward one-hot, then read out pixel indices and sample with spatial transformer networks; (2) **residual ray-surface template** — learn $\hat{\mathbf{Q}}=\mathbf{Q}_{0}+\lambda_{r}\hat{\mathbf{Q}}_{r}$ around a fixed template $\mathbf{Q}_0$ (a pinhole surface from dummy intrinsics $f_x=c_x=W/2$, $f_y=c_y=H/2$ if no calibration exists), ramping $\lambda_r$ from 0 to 1 over 10 epochs — this pinhole prior stabilizes training even for catadioptric data; (3) **patch-based association** — restrict the search to a $41\times 41$ grid around the target pixel at half resolution during training. At test time no approximation is needed; the full-resolution ray surface comes straight from the network.

## Results

- **KITTI** (sanity check on near-pinhole data, distances to 80 m): NRS-ResNet with fully learned ray surface (RS-L) reaches Abs Rel 0.134 / RMSE 5.263 — competitive with Gordon et al.'s learned-pinhole 0.128 / 5.230; NRS-PackNet improves to Abs Rel 0.127 / Sq Rel 0.667 / RMSE 4.049. The learned surface is stable frame-to-frame (coefficient of variation < 2.5% over the test set).
- **Multi-FOV (synthetic fisheye)**: Abs Rel drops from 0.441 with a pinhole model to 0.225 with NRS — a 51% decrease ($\delta_{1.25}$ 0.336 → 0.593).
- **OmniCam (catadioptric, 360° FOV)**: first self-supervised monocular method to learn odometry on catadioptric video — ATE 0.035 vs 0.408 for the same framework with pinhole projection (which diverges).
- **KITTI odometry** (seq 09/10, 5-snippet ATE): $0.0150\pm 0.0301$ / $0.0103\pm 0.0073$, comparable to calibrated pinhole models without any camera knowledge.
- Qualitative results on an underwater-cave sequence and a fisheye dashcam behind a windshield, where rectified pinhole baselines fail to produce meaningful predictions.

All experiments use identical architecture and hyper-parameters — only the training videos change.

## Why it matters for SLAM

Robots increasingly carry cameras that a pinhole model describes poorly (fisheye on drones and cars, catadioptric rigs), and calibrating each unit is a deployment cost. Neural Ray Surfaces showed that the camera model itself can be treated as one more learnable component — a differentiable per-pixel ray field — extending the self-supervised depth/ego-motion toolbox to arbitrary optics. It is a step toward SLAM front-ends that adapt to whatever sensor they are given, and the reference point for calibration-free geometry learning across heterogeneous optics.

## Related

- [Camera models beyond pinhole](../level-01-beginner/camera-models-beyond-pinhole.md) — the classical models this replaces with learning
- [SfM-Learner](sfm-learner.md) — the self-supervised depth+ego-motion framework it generalizes
- [Depth from Videos in the Wild](depth-from-videos-in-the-wild.md) — closely related idea of learning intrinsics from video
- [MonoDepth](monodepth.md) — origin of photometric self-supervision for depth
- [Camera calibration](../level-01-beginner/camera-calibration.md) — the manual process NRS sidesteps
