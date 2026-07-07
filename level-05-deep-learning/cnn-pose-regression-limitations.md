# CNN Pose Regression Limitations

> Sattler 2019 · [Paper](https://arxiv.org/abs/1903.07504)

**One-line summary** — This CVPR 2019 analysis ("Understanding the Limitations of CNN-based Absolute Camera Pose Regression") showed that PoseNet-style absolute pose regression behaves more like image retrieval with pose interpolation than like true 3D-geometry-based localization.

## Problem

Visual localization — accurate camera pose estimation in a known scene — had traditionally been solved with 3D geometry: establish 2D-3D matches, then run a PnP solver inside RANSAC. End-to-end absolute pose regression (APR) networks that map an image directly to a pose (PoseNet and descendants) became popular for their speed and simplicity, yet consistently failed to reach structure-based accuracy. This paper asks *why*: what do APR networks actually learn, and what are the fundamental limits of the approach?

## Method & architecture

The paper develops a theoretical model covering all PoseNet-like architectures, which share three stages: a convolutional feature extractor $F(\mathcal{I})$, a (non-linear) embedding $E(F(\mathcal{I})) = \alpha^{\mathcal{I}} \in \mathbb{R}^n$ (the second-to-last layer), and a final linear layer projecting the embedding into pose space. The learned localization function is

$$L(\mathcal{I}) = \mathbf{b} + \mathtt{P} \cdot E(F(\mathcal{I})) = \mathbf{b} + \sum_{j=1}^{n} \alpha_j^{\mathcal{I}} \mathbf{P}_j,$$

where $\mathtt{P} \in \mathbb{R}^{(3+r)\times n}$ is the last layer's projection matrix, $\mathbf{b}$ a bias, and $\mathbf{P}_j = (\mathbf{c}_j^T, \mathbf{r}_j^T)^T$ its columns split into translation and orientation parts. Decomposed, the predicted pose is

$$\begin{pmatrix}\hat{\mathbf{c}}_{\mathcal{I}}\\ \hat{\mathbf{r}}_{\mathcal{I}}\end{pmatrix}=\begin{pmatrix}\mathbf{c}_{b}+\sum_{j=1}^{n}\alpha_{j}^{\mathcal{I}}\mathbf{c}_{j}\\ \mathbf{r}_{b}+\sum_{j=1}^{n}\alpha_{j}^{\mathcal{I}}\mathbf{r}_{j}\end{pmatrix}.$$

**Interpretation**: APR learns a set of *base poses* $\mathcal{B} = \{(\mathbf{c}_j, \mathbf{r}_j)\}$ and expresses every prediction as a linear (in practice conical, due to ReLU) combination of them, with image appearance only steering the coefficients $\alpha_j^{\mathcal{I}}$. Nothing ties the output to the scene's 3D structure. Two predictions follow and are verified experimentally:

- **Guaranteed failure cases.** If all training positions lie on a line $\mathbf{o} + \delta\mathbf{d}$, one admissible training solution places all base translations on that line — and linear combinations of points on a line stay on the line, so the network *cannot* generalize. Visualizations of PoseNet's and MapNet's learned base translations confirm exactly this collapse (escalator and building-facade scenes).
- **APR ≈ retrieval.** Writing a test embedding as a training embedding plus an offset, $\alpha^{\mathcal{I}} = \alpha^{\mathcal{J}} + \Delta^{\mathcal{I}}$, gives

$$\begin{pmatrix}\hat{\mathbf{c}}_{\mathcal{I}}\\ \hat{\mathbf{r}}_{\mathcal{I}}\end{pmatrix} = \begin{pmatrix}\hat{\mathbf{c}}_{\mathcal{J}}\\ \hat{\mathbf{r}}_{\mathcal{J}}\end{pmatrix} + \begin{pmatrix}\sum_{j=1}^{n}\Delta_j^{\mathcal{I}}\mathbf{c}_{j}\\ \sum_{j=1}^{n}\Delta_j^{\mathcal{I}}\mathbf{r}_{j}\end{pmatrix},$$

  i.e., APR structurally predicts a pose *relative to similar training images* — the same thing image retrieval plus pose interpolation does, and closely related to relative pose regression.

The experimental toolkit: PoseNet (learned loss weighting) and MapNet as APR representatives, Active Search (RootSIFT + P3P-RANSAC) as the structure-based gold standard, and DenseVLAD (handcrafted dense RootSIFT pooled into a 4096-D VLAD descriptor) as the retrieval baseline, plus a variant interpolating the poses of the top-$k$ retrieved images.

## Results

- **Cambridge Landmarks & 7 Scenes**: "none of the absolute and relative pose regression approaches is able to consistently outperform the retrieval baselines", and APR methods are "often closer in performance to image retrieval than to structure-based methods" (median position/orientation errors, Table 2). AnchorNet, the best end-to-end method, still fails to beat DenseVLAD on the largest scene (Street).
- **TUM LSI** (texture-less indoor): DenseVLAD still outperforms pose regression despite low-level SIFT features being at a disadvantage.
- **RobotCar**: MapNet+ and MapNet+PGO beat DenseVLAD on the 1.1 km LOOP scene but perform "significantly worse" on the 9.6 km FULL scene — a scalability failure.
- **Densely sampled synthetic data** (Shop Facade renderings, extra poses on a 25 cm grid up to 3 m from the training trajectory): more data helps, but PoseNet and MapNet "do not perform even close to Active Search, even with one order of magnitude more data".
- **DeepLoc**: DenseVLAD outperforms single-image APR methods, and Active Search beats even the sequence-based VLocNet++ variants.

## Why it matters for SLAM

This paper is the standard reference for why "just regress the pose with a CNN" is not a substitute for geometric relocalization. Relocalization and loop-closure candidates in SLAM need poses that generalize beyond the mapped trajectory, and this analysis explains which learned approaches can provide that (structure-grounded ones: scene coordinate regression, feature matching + PnP) and which cannot (direct regression). The retrieval-baseline sanity check it introduced is now standard practice for evaluating any learned relocalizer.

## Related

- [PoseNet](posenet.md)
- [DSAC](dsac.md)
- [DSAC\*](dsac-star.md)
- [ACE](ace.md)
- [HF-Net](hf-net.md)
- [NetVLAD](netvlad.md)
