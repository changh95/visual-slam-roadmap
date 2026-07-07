# LoFTR

> Sun 2021 · [Paper](https://arxiv.org/abs/2104.00680)

**One-line summary** — Detector-free dense feature matching with Transformers: self- and cross-attention condition features on both images, producing reliable matches even in texture-poor regions where keypoint detectors fail.

## Problem

The classical pipeline performs feature detection, description, and matching *sequentially*, so everything hinges on the detector producing repeatable interest points in both images — which detectors notoriously fail to do in low-texture areas (blank walls, floors) and under repetitive patterns. Existing dense alternatives searched correspondences through cost volumes, which is expensive and still relies on local evidence. LoFTR skips detection entirely: establish pixel-wise dense matches at a coarse level first, then refine the good ones — with a Transformer's global receptive field deciding what matches, conditioned on both images at once.

## Method & architecture

**Backbone.** A ResNet-18 + FPN CNN extracts coarse features $\tilde{F}^A, \tilde{F}^B$ at 1/8 resolution and fine features $\hat{F}^A, \hat{F}^B$ at 1/2 resolution.

**LoFTR module.** 2D sinusoidal positional encodings (added once) make features position-dependent — crucial for matching indistinctive regions. Then $N_c = 4$ interleaved self- and cross-attention layers transform the coarse features into $\tilde{F}^A_{tr}, \tilde{F}^B_{tr}$. Vanilla attention $\mathrm{Attention}(Q,K,V) = \mathrm{softmax}(QK^T)\,V$ costs $O(N^2)$, so LoFTR uses the Linear Transformer kernel

$$ \mathrm{sim}(Q,K) = \phi(Q)\cdot\phi(K)^{T}, \quad \phi(\cdot) = \mathrm{elu}(\cdot) + 1 $$

which, by associativity of matrix products (compute $\phi(K)^T V$ first, feature dim $D \ll N$), reduces the cost to $O(N)$.

**Coarse matching.** A score matrix $\mathcal{S}(i,j) = \frac{1}{\tau} \langle \tilde{F}^A_{tr}(i), \tilde{F}^B_{tr}(j) \rangle$ feeds either an optimal-transport layer (as in SuperGlue) or *dual-softmax*:

$$ \mathcal{P}_c(i,j) = \mathrm{softmax}\big(\mathcal{S}(i,\cdot)\big)_j \cdot \mathrm{softmax}\big(\mathcal{S}(\cdot,j)\big)_i $$

Coarse matches are pairs that are mutual nearest neighbours in $\mathcal{P}_c$ with confidence $\geq \theta_c = 0.2$.

**Coarse-to-fine refinement.** For every coarse match, $w \times w = 5 \times 5$ local windows are cropped from the fine feature maps and transformed by a smaller LoFTR module ($N_f = 1$); correlating the centre vector of the query window against the other window yields a matching-probability heatmap whose expectation gives the sub-pixel position $\hat{j}'$.

**Supervision.** $\mathcal{L} = \mathcal{L}_c + \mathcal{L}_f$: negative log-likelihood over ground-truth coarse grid matches (from poses + depth, as in SuperGlue), plus a heatmap-variance-weighted $\ell_2$ loss on the fine offsets:

$$ \mathcal{L}_f = \frac{1}{|\mathcal{M}_f|} \sum_{(\hat{i},\hat{j}')\in\mathcal{M}_f} \frac{1}{\sigma^2(\hat{i})} \big\lVert \hat{j}' - \hat{j}'_{gt} \big\rVert_2 $$

**Cost.** 116 ms per 640×480 pair on an RTX 2080Ti with dual-softmax (130 ms with optimal transport); trained end-to-end from scratch, 24 h on 64 GTX 1080Ti GPUs for the indoor model.

## Results

- **HPatches homographies:** AUC@3px 65.9 vs 53.9 for SuperPoint+SuperGlue, 50.6 for DRC-Net; the margin grows at stricter thresholds.
- **Indoor pose (ScanNet, 1500 test pairs):** LoFTR-DS AUC@5°/10°/20° = 22.06/40.8/57.62 vs 16.16/33.81/51.84 for SuperPoint+SuperGlue and 7.69/17.93/30.49 for DRC-Net — the biggest gains exactly in low-texture, wide-baseline indoor scenes.
- **Outdoor pose (MegaDepth):** LoFTR-DS 52.8/69.19/81.18 vs 42.18/61.16/75.96 for SuperPoint+SuperGlue (13% better at AUC@10°) and 61% better than detector-free DRC-Net at AUC@10°.
- **Visual localization:** at publication, ranked first among published methods on two tracks of the Long-Term Visual Localization benchmark — best on the Aachen v1.1 night-time local-feature track (LoFTR-DS 72.8/88.5/99.0) and best published on InLoc (DUC1 47.5/72.2/84.8, DUC2 54.2/74.8/85.5 with hloc).
- **Ablation:** replacing the LoFTR module with convolutions of comparable parameters drops AUC substantially (14.98 vs 22.06 @5°); DETR-style per-layer positional encoding also hurts.

## Why it matters for SLAM

Indoor SLAM constantly fails where there is nothing to detect — blank walls, floors, repetitive surfaces. LoFTR showed that a global-context matcher can produce correspondences there anyway, and it established the detector-free paradigm that RoMa, EfficientLoFTR, and many others build on. In practice it is a go-to choice for indoor reconstruction, wide-baseline relocalization, and loop-closure verification when sparse matching is too brittle, at the cost of more compute than sparse matchers.

## Related

- [SuperGlue](superglue.md) — the sparse learned-matching counterpart
- [LightGlue](lightglue.md) — fast sparse matcher; the efficiency-focused alternative
- [RoMa](roma.md) — dense matching with foundation-model features
- [SuperPoint](superpoint.md) — the detector-based paradigm LoFTR sidesteps
- [HF-Net](hf-net.md) — visual localization pipeline where detector-free matchers slot in
