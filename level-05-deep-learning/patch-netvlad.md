# Patch NetVLAD

> Hausler 2021 · [Paper](https://arxiv.org/abs/2103.01486)

**One-line summary** — Extracts multi-scale patch-level VLAD descriptors from NetVLAD residuals and re-ranks retrieval candidates with spatial verification, making visual place recognition far more robust to viewpoint change and perceptual aliasing.

## Problem

Visual place recognition must survive the twin problems of *appearance change* (season, structure, illumination) and *viewpoint change* in an always-changing world. Global descriptors such as NetVLAD compress the whole image into a single vector, discarding spatial layout — fast to search but vulnerable to viewpoint shifts, partial occlusion, and perceptual aliasing. Full local-feature matching (e.g., SuperPoint + SuperGlue) preserves layout but is far too slow against a large database. Patch-NetVLAD combines the advantages of both local and global descriptor methods in one configurable pipeline.

## Method & architecture

**Two-stage retrieval.** Vanilla NetVLAD first retrieves the top-$k$ ($k{=}100$) database candidates for a query; patch-level matching then re-ranks that shortlist with a spatial-consistency score, so cross-matching cost is paid only on 100 images, never the whole database.

**Patch-level VLAD descriptors.** NetVLAD's aggregation layer sums soft-assigned residuals between CNN features $\mathbf{x}_i$ and $K$ learned cluster centres $\mathbf{c}_k$:

$$ f_{\mathrm{VLAD}}(F)(j,k) = \sum_{i=1}^{N} \bar{a}_k(\mathbf{x}_i)\,\big(x_i(j) - c_k(j)\big) $$

Instead of aggregating the entire $H \times W \times D$ feature map ($N = H \times W$, the global NetVLAD), Patch-NetVLAD applies the same aggregation + projection $\mathbf{f}_i = f_{\mathrm{proj}}(f_{\mathrm{VLAD}}(P_i))$ to a dense set of $d_x \times d_y$ patches with stride $s_p$ over the feature-space grid, with

$$ n_p = \Big\lfloor \tfrac{H-d_y}{s_p} + 1 \Big\rfloor \cdot \Big\lfloor \tfrac{W-d_x}{s_p} + 1 \Big\rfloor $$

patches per image — "locally-global" descriptors tied to spatial locations, requiring no keypoint detection.

**Mutual nearest neighbours + spatial scoring.** Query/reference patch descriptors are exhaustively cross-matched; the mutual-NN pair set $\mathcal{P}$ is scored either by RANSAC (inlier count of a fitted homography, inlier tolerance $s_p$, normalized by $n_p$) or by *rapid spatial scoring* over horizontal/vertical displacements $x_d, y_d$ of matched patches:

$$ s_{\mathrm{spatial}} = \frac{1}{n_p} \sum_{i \in \mathcal{P}} \Big( \big|\max_j x_{d,j}\big| - \big|x_{d,i} - \bar{x}_d\big| \Big)^2 + \Big( \big|\max_j y_{d,j}\big| - \big|y_{d,i} - \bar{y}_d\big| \Big)^2 $$

which penalizes matches whose offsets deviate from the mean motion — spatial verification without sampling.

**Multi-scale fusion via IntegralVLAD.** Scores from $n_s$ patch sizes are fused by a convex combination $s_{\mathrm{spatial}} = \sum_i w_i\, s_{i,\mathrm{spatial}}$ (used config: square patch sizes 2, 5, 8 with $w_i = 0.45, 0.15, 0.4$; a size-5 patch covers 228×228 px of a 640×480 image). An integral feature map $\mathcal{I}(i,j) = \sum_{i' < i, j' < j} \mathbf{f}^1_{i',j'}$ of $1{\times}1$ patch VLADs lets arbitrary patch sizes be recovered with four look-ups, implemented as dilated depth-wise convolution with kernel $K = \begin{pmatrix} 1 & -1 \\ -1 & 1 \end{pmatrix}$. PCA dimensionality reduction on patch descriptors gives a configurable speed/accuracy trade-off.

## Results

Evaluated on ~300,000 images across six benchmarks (Nordland, Pittsburgh 30k, Tokyo 24/7, Mapillary MSLS, RobotCar Seasons v2, Extended CMU Seasons) with a single configuration tuned once on RobotCar Seasons v2 training data:

- Outperforms the global-descriptor methods NetVLAD, DenseVLAD and AP-GEM by 17.5%, 14.8% and 22.3% absolute R@1 on average; on Nordland's extreme seasonal change the margin over NetVLAD is 34.5% (R@1 44.9 vs 10.4).
- Beats an optimistic NetVLAD→SuperPoint+SuperGlue re-ranking baseline by 3.1% absolute R@1 on average (6.0% relative), including 15.8% absolute on Nordland (44.9 vs 29.1) — while SuperGlue edges ahead on parts of Tokyo 24/7 and Pittsburgh.
- **Won the Facebook Mapillary Visual Place Recognition Challenge at ECCV 2020**: 48.1% R@1 on the withheld test set, +13.0% absolute over the NetVLAD baseline (35.1%).
- Rapid spatial scoring on multiple patch sizes is 3.1× faster than multi-RANSAC scoring with only 1.1% R@1 degradation; the speed-optimized configuration runs over an order of magnitude faster than the previous state of the art.

## Why it matters for SLAM

Loop closure and relocalization in SLAM are exactly a place-recognition problem: a wrong match corrupts the pose graph, so robustness to perceptual aliasing matters more than raw retrieval speed. Patch-NetVLAD's global-retrieval-then-spatial-re-ranking recipe is a practical drop-in for SLAM loop-closure front-ends — the paper explicitly targets enhancing "the overall performance of SLAM systems" — and it influenced the hierarchical retrieval designs used in long-term localization systems.

## Related

- [NetVLAD](netvlad.md) — the global descriptor this method builds on
- [HF-Net](hf-net.md) — hierarchical (coarse-to-fine) localization pipeline
- [hloc](hloc.md) — the retrieval-then-match localization toolbox this recipe plugs into
- [SuperGlue](superglue.md) — full local feature matching used when accuracy trumps speed
- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md) — the task this paper targets
