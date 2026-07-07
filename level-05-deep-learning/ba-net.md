# BA-Net

> Tang 2019 · [Paper](https://arxiv.org/abs/1806.04807)

**One-line summary** — BA-Net (ICLR 2019) made bundle adjustment a differentiable network layer, solving dense SfM via feature-metric BA with a learned feature pyramid and a compact basis-depth-map parameterization, trained end-to-end.

## Problem

Traditional SfM pipelines are modular — feature extraction, matching, and bundle adjustment are designed and optimized independently — so the features are never optimized for the geometric estimation they serve. Geometric BA uses only corners/blobs and suffers from matching outliers; photometric (direct) BA uses all pixels but its objective is highly non-convex, so it is sensitive to initialization, exposure changes, and moving objects. The obstacle to unifying learning and BA is that BA is an iterative Levenberg–Marquardt (LM) procedure with two non-differentiable if-else decisions: the convergence-threshold termination and the raise/lower update of the damping factor $\lambda$. BA-Net asks: can dense SfM be solved *through* a differentiable BA layer, so gradients from the reconstruction loss train the features themselves?

## Method & architecture

The network takes multiple images and outputs camera poses $\mathbb{T}$ and a dense depth map $\mathbb{D}$; a shared DRN-54 backbone feeds two heads, whose outputs meet in the BA-Layer.

- **Feature pyramid (what BA aligns).** An FPN-style top-down pathway with lateral connections upsamples backbone maps $C^{k+1}$ by 2, concatenates with $C^k$, and applies a $3\times 3$ conv reducing to 128 channels, giving pyramid $F_i = [F^1_i, F^2_i, F^3_i]$ per image. BA minimizes the **feature-metric error** instead of intensity or reprojection error:

$$e^{f}_{i,j}(\mathcal{X}) = F_i\big(\pi(\mathbf{T}_i,\, d_j \cdot \mathbf{q}_j)\big) - F_1(\mathbf{q}_j),$$

  where $\pi$ projects 3D points to the image, $\mathbf{q}_j$ is a normalized pixel in image $I_1$ with depth $d_j$, and $\mathbf{T}_i$ the pose of image $I_i$. Trained through BA, the learned features develop a clear global minimum with a smooth basin (unlike RGB distance or pretrained-classification features), enlarging the convergence radius.
- **Basis depth maps (what BA optimizes).** Per-pixel depth ($76.8$k unknowns at $320\times 240$) is replaced by a learned monocular encoder–decoder whose last feature maps serve as 128 basis depth maps $\mathbf{B}$ (a $128 \times h\cdot w$ matrix):

$$\mathbb{D} = \mathrm{ReLU}(\mathbf{w}^{\top}\mathbf{B}),$$

  so BA optimizes only the combination weights $\mathbf{w}$ (with a learned initial $\mathbf{w}_0$), while ReLU keeps depth non-negative and dense per-pixel depth is still recovered.
- **BA-Layer (differentiable LM).** Each iteration computes residuals $E(\mathcal{X})$, Jacobian $J(\mathcal{X})$, the Gauss–Newton Hessian $J^{\top}J$ and its diagonal $D(\mathcal{X})$, then takes a standard LM step

$$\Delta\mathcal{X} = \big(J(\mathcal{X})^{\top}J(\mathcal{X}) + \lambda D(\mathcal{X})\big)^{-1} J(\mathcal{X})^{\top} E(\mathcal{X}).$$

  The two non-differentiable decisions are removed by (i) fixing the iteration count ("incomplete optimization": 5 LM iterations per pyramid level, coarse-to-fine over 3 levels = 15 total, with feature warping each iteration), and (ii) *predicting* $\lambda$ with an MLP: global average pooling of $|E(\mathcal{X})|$ over pixels gives a 128-D vector fed to four FC layers with ReLU. Each step is then a differentiable function $\Delta\mathcal{X} = g(\mathcal{X}; \mathbb{F})$, and the solution update $\mathcal{X}_k = g(\mathcal{X}_{k-1};\mathbb{F}) \circ \mathcal{X}_{k-1}$ (addition for depth weights, SE(3) exponential map for poses) backpropagates from poses/depth to the feature pyramids. Poses are initialized to identity rotation and zero translation.
- **Training.** Supervised: quaternion rotation loss $\|\mathbf{q}-\mathbf{q}^{*}\|$, translation loss $\|\mathbf{t}-\mathbf{t}^{*}\|$, and berHu depth loss; ADAM with initial learning rate 0.001, backbone initialized from DRN-54.

## Results

- **ScanNet** (1,413 training / 100 testing sequences; 547,991 training and 2,000 testing pairs): BA-Net reaches **1.018° rotation / 3.39 cm translation error** vs DeMoN 3.791° / 15.5 cm, photometric BA 4.409° / 21.40 cm, and geometric BA 8.56° / 36.995 cm; depth abs-rel **0.161** and RMSE (linear) **0.346** vs DeMoN 0.231 / 0.761. It beats DeMoN whether trained on ScanNet or on DeMoN's own training data.
- **KITTI** (Eigen split; 5-frame snippets on odometry sequences 09/10): depth abs-rel **0.083**, sqr-rel 0.025, RMSE 3.640, RMSE-log 0.134 — better than supervised (Eigen 0.203 abs-rel) and unsupervised (Zhou 0.208, Wang 0.151, Godard 0.148) methods; ATE **0.019** vs 0.045 (Wang 2018) and 0.063 (Zhou 2017).
- Ablations in the appendix compare learned vs pre-trained features, BA vs direct SE(3) pose regression, differentiable LM vs Gauss–Newton, and predicted vs constant $\lambda$ — each component helps; appendix also reports multi-view SfM up to 5 views and comparisons with CodeSLAM.

## Why it matters for SLAM

BA-Net is the founding paper of "differentiable bundle adjustment": it demonstrated that the classical geometric optimization at the heart of SfM/SLAM can live inside a network and be trained through, hard-coding multi-view geometry as structure while learning only what geometry cannot supply (features and depth basis). This recipe became the backbone of DROID-SLAM and DPVO (differentiable dense BA layers) and general differentiable optimization libraries like Theseus, and the low-dimensional optimizable-depth idea is closely related to CodeSLAM-style latent depth codes. If you want to understand modern learned SLAM back-ends, start here.

## Related

- [DROID-SLAM](droid-slam.md)
- [Theseus](theseus.md)
- [DeMoN](demon.md)
- [CodeSLAM](codeslam.md)
- [DeepV2D](deepv2d.md)
- [Differentiability](differentiability.md)
