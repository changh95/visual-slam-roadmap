# DeepTAM

> Zhou 2018 · [Paper](https://arxiv.org/abs/1808.01900)

**One-line summary** — DeepTAM (ECCV 2018) is a learned re-imagining of DTAM: a coarse-to-fine tracking network estimates pose increments against a synthetic keyframe view, and a mapping network extracts keyframe depth from a plane-sweep cost volume refined in a narrow band around the current estimate.

## Problem

Classical dense tracking-and-mapping (DTAM, LSD-SLAM) relies on direct photometric minimization and handcrafted regularizers, which are brittle under low texture and need good initialization. Naive learned alternatives (DeepVO, SfM-Learner, UnDeepVO) regress motion between two frames and inherit the motion statistics of their training sets — KITTI-style planar 3-DoF motion — so they generalize poorly to full 6-DoF tracking. DeepTAM asks whether keyframe-based dense camera tracking and depth-map estimation can be *entirely learned* while keeping the proven tracking/mapping architecture.

## Method & architecture

**Tracking.** Given the current image $\mathbf{I}^C$ and a keyframe $(\mathbf{I}^K, \mathbf{D}^K)$ (image + inverse depth), the goal is the transform $\mathbf{T}^{KC}$ with $\mathbf{T}^{C}=\mathbf{T}^{K}\mathbf{T}^{KC}$, all in $\mathbf{SE}(3)$. Instead of regressing this directly, DeepTAM renders a *virtual keyframe* $(\mathbf{I}^V, \mathbf{D}^V)$ at the current pose guess $\mathbf{T}^V$ and learns only the small increment

$$\mathbf{T}^{C}=\mathbf{T}^{V}\,\delta\mathbf{T}, \qquad \delta\mathbf{T}=f(\mathbf{I}^{C},\mathbf{I}^{V},\mathbf{D}^{V}),$$

which "significantly simplifies the learning problem and alleviates the dataset bias for camera motions." Three encoder-decoder networks run coarse-to-fine at $80\times 60$, $160\times 120$, and $320\times 240$; each predicts an increment $\delta\mathbf{T}_i$ against a freshly rendered virtual keyframe, and the final pose is the product of all increments. An auxiliary optical-flow branch (active only during training) forces the encoder to learn motion features. Rather than one pose, $N=64$ weight-sharing fully connected branches emit hypotheses $\delta\boldsymbol{\xi}_i=(\mathbf{r}_i,\mathbf{t}_i)^{\top}$ (angle-axis rotation + translation), averaged as

$$\delta\boldsymbol{\xi}=\frac{1}{N}\sum_{i=1}^{N=64}\delta\boldsymbol{\xi}_{i}.$$

The loss $\mathcal{L}_{\text{tracking}}=\mathcal{L}_{\text{flow}}+\mathcal{L}_{\text{motion}}+\mathcal{L}_{\text{uncertainty}}$ combines flow endpoint error, a weighted pose error $\mathcal{L}_{\text{motion}}=\alpha\lVert\mathbf{r}-\mathbf{r}_{\text{gt}}\rVert_2+\lVert\mathbf{t}-\mathbf{t}_{\text{gt}}\rVert_2$, and the negative log-likelihood of a multivariate Laplace distribution over the hypothesis spread (covariance $\mathbf{\Sigma}$ estimated from the samples), which pushes the network to predict distinct hypotheses. Virtual keyframes double as data augmentation: sampling $\mathbf{T}^V_0$ around ground truth simulates all 6-DoF motions despite biased training data (SUN3D, SUNCG).

**Mapping.** Depth per keyframe comes from a plane-sweep cost volume. For pixel $\mathbf{x}$ and depth label $d$, photoconsistency is accumulated over $m$ frames:

$$\mathbf{C}(\mathbf{x},d)=\sum_{i\in\{1,..,m\}}\rho_{i}(\mathbf{x},d)\cdot w_{i}(\mathbf{x}),$$

where $\rho_i$ is the SAD of $3\times 3$ patches between keyframe and warped image, and $w_i$ is a matching-confidence weight close to 1 when the cost curve has a clear unique minimum $d^*$. A **fixed-band module** (32 labels evenly spaced over the depth range, inputs $\mathbf{I}^K$ + cost volume) regresses an interpolation factor $\mathbf{s}_{fb}$ giving $\mathbf{D}_{fb}=(1-\mathbf{s}_{fb})\cdot d_{min}+\mathbf{s}_{fb}\cdot d_{max}$ — a scale-free output that aids generalization. A **narrow-band module** then iterates: it rebuilds the cost volume on per-pixel labels $b_{i}=d_{\text{prev}}+i\cdot\sigma_{\text{nb}}\cdot d_{\text{prev}}$ centered at the previous estimate (band width $\sigma_{nb}=0.0125$); one encoder-decoder turns it into a learned cost volume read out by a differentiable soft argmin, and a second encoder-decoder regularizes the result — the pair acting like alternating data and smoothness terms of a variational method.

## Results

- **Tracking (TUM RGB-D benchmark, translational RMSE in m/s):** average 0.040 vs 0.060 for the frame-to-keyframe odometry of Kerl et al.'s RGB-D SLAM — despite using dataset depth only for keyframes. Ablations: 0.050 without the flow task, 0.043 without multiple hypotheses. No training or fine-tuning on the benchmark.
- **Tracking + mapping:** average 0.086 vs 0.253 for CNN-SLAM (run without pose-graph optimization) across the fr1 sequences.
- **Mapping (10-frame sequences, test splits of MVS/SUNCG/SUN3D):** best on all metrics and datasets — e.g. L1-inv 0.036 vs DTAM 0.086 and DeMoN 0.059 on MVS; sc-inv 0.128 vs SGM 0.248, DTAM 0.343, DeMoN 0.383 on SUNCG. More frames help (MVS L1-inv 0.117 with 2 frames vs 0.083 with 10) and narrow-band iterations converge after about 3 (0.076 at 1 iter vs 0.065 at 3).
- **Robustness:** under increasing pose noise (std up to $0.6|\boldsymbol{\xi}|$), SGM and DTAM degrade quickly while DeepTAM preserves scene structure; qualitative generalization to KITTI without fine-tuning.

## Why it matters for SLAM

DeepTAM showed that the classical dense tracking-and-mapping architecture survives the transition to deep learning: keep the structure (keyframes, cost volumes, incremental alignment) and learn the components that classical methods do poorly (robust alignment, depth regularization). Its incremental-alignment idea foreshadows the iterative update operators of RAFT and DROID-SLAM, making it an important conceptual link between DTAM-era dense SLAM and today's learned systems.

## Related

- [DTAM](../level-03-monocular-slam/dtam.md)
- [DeepV2D](deepv2d.md)
- [DeMoN](demon.md)
- [TANDEM](tandem.md)
- [DVO](../level-04-rgbd-slam/dvo.md)
- [CNN-SLAM](../level-03-monocular-slam/cnn-slam.md)
