# ESLAM

> Johari 2023 · [Paper](https://arxiv.org/abs/2211.11704)

**One-line summary** — Replaced NICE-SLAM's 3D feature voxel grids with a tri-plane representation, cutting neural SLAM memory growth from $O(L^3)$ to $O(L^2)$ while decoding signed distance fields for clean surfaces.

## Problem

Grid-based neural SLAM stores a feature vector per voxel, so the model grows cubically with scene side-length — NICE-SLAM's hierarchical grids consume significant GPU memory even at room scale, capping resolution and scene size. ESLAM ("Efficient Dense SLAM System Based on Hybrid Representation of Signed Distance Fields") reads sequential RGB-D frames with unknown poses and asks whether the volumetric feature field can be factorised into something fundamentally cheaper without losing reconstruction quality — and whether TSDF beats occupancy as the decoded quantity.

## Method & architecture

**Tri-plane representation**: features live on axis-aligned perpendicular 2D planes at two scales (coarse and fine), with *separate* plane sets for geometry and appearance — separating the two "mitigates the forgetting problem for geometry reconstruction since appearance fluctuates more frequently". A query point $p$ is projected onto each plane and bilinearly interpolated; per-scale features are summed and the scales concatenated:

$$f^{c}_{g}(p)=F^{c}_{xy}(p)+F^{c}_{xz}(p)+F^{c}_{yz}(p),\qquad \boldsymbol{f_g}(p)=[f^{c}_{g}(p);\,f^{f}_{g}(p)],$$

(analogously $\boldsymbol{f_a}(p)$ from the appearance planes). Shallow two-layer MLPs decode $\boldsymbol{\phi_g}(p)=h_g(\boldsymbol{f_g}(p))$ into normalized TSDF (zero at surfaces, magnitude one at truncation distance $T$) and $\boldsymbol{\phi_a}(p)=h_a(\boldsymbol{f_a}(p))$ into raw colour. Model size grows with scene area, not volume.

**SDF-based rendering**: for $N=N_{strat}+N_{imp}$ samples per ray (stratified plus near-surface/importance samples), TSDF is converted to volume density with a learnable sharpness $\beta$,

$$\boldsymbol{\sigma}(p_n)=\beta\cdot\mathrm{Sigmoid}\big(-\beta\cdot\boldsymbol{\phi_g}(p_n)\big),$$

then standard weights $w_n=\exp\big(-\sum_{k=1}^{n-1}\boldsymbol{\sigma}(p_k)\big)\big(1-\exp(-\boldsymbol{\sigma}(p_n))\big)$ render colour $\boldsymbol{\hat{c}}=\sum_n w_n\boldsymbol{\phi_a}(p_n)$ and depth $\boldsymbol{\hat{d}}=\sum_n w_n z_n$.

**Losses**: TSDF permits fast per-point supervision alongside rendering losses — a free-space loss pushing $\boldsymbol{\phi_g}=1$ before the surface, and a signed-distance loss inside the truncation region using the depth measurement as approximate SDF,

$$\mathcal{L}_{T}=\frac{1}{|R|}\sum_{r\in R}\frac{1}{|P_r^T|}\sum_{p\in P_r^T}\big(z(p)+\boldsymbol{\phi_g}(p)\cdot T-D(r)\big)^2,$$

split into middle and tail parts of the truncation region with different weights (a smaller effective truncation sharpens mapping while tracking uses the full band), plus $\ell_2$ depth and colour rendering losses. The same global loss (different weights) drives both mapping and tracking.

**SLAM loop**: no pre-training and no staged optimisation — planes and decoders are randomly initialised on the first frame. Mapping updates every $k$ frames over $W$ frames (current + two previous keyframes + $W-3$ random keyframes), jointly optimising planes, decoders, and the $W$ poses. Tracking runs per frame with Adam on translation + quaternion, excluding depth-less rays and outliers (rendered-depth error > 10× batch median).

## Results

- **Replica (avg of 8 scenes, ± over 5 runs)**: Depth L1 1.18 cm, accuracy 0.97 cm, completion 1.05 cm, completion ratio 98.60%, ATE RMSE 0.63 cm — vs NICE-SLAM 3.29 / 1.66 / 1.63 / 96.74% / 2.05 cm and iMAP* 7.16 / 5.83 / 67.17% / 3.42 cm. This backs the abstract's claim of improving reconstruction and localization "by more than 50%".
- **ScanNet**: average ATE RMSE 7.4 cm vs NICE-SLAM 10.7 and iMAP* 26.6.
- **TUM RGB-D**: 2.47 / 1.11 / 2.42 cm on fr1/desk, fr2/xyz, fr3/office vs NICE-SLAM 2.85 / 2.39 / 3.02.
- **Speed & memory**: frame processing time 0.18 s on Replica vs NICE-SLAM's 2.10 s (up to ~10× faster; 0.55 s vs 3.35 s on ScanNet), with 6.79 M vs 12.18 M parameters and $O(L^2)$ vs $O(L^3)$ growth in scene side-length $L$.

## Why it matters for SLAM

ESLAM is one of the three canonical answers (with Co-SLAM's hash grids and Point-SLAM's neural points) to the question that dominated post-NICE-SLAM neural SLAM research: how to make the map representation efficient. Its tri-plane idea, borrowed from generative 3D modelling, influenced subsequent memory-efficient dense SLAM designs, and its TSDF-with-per-point-losses recipe showed that the choice of decoded quantity (SDF vs occupancy) matters as much as the encoding.

## Related

- [NICE-SLAM](nice-slam.md)
- [Co-SLAM](co-slam.md)
- [Point-SLAM](point-slam.md)
- [iMAP](imap.md)
- [NeRF](nerf.md)
