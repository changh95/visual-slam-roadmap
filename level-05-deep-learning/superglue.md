# SuperGlue

> Sarlin 2020 · [Paper](https://arxiv.org/abs/1911.11763)

**One-line summary** — Graph Neural Network feature matcher that uses self- and cross-attention plus differentiable Sinkhorn optimal transport (with a dustbin for unmatched points) to replace brittle nearest-neighbor matching.

## Problem

Classical feature matching is a pipeline of hand-designed heuristics: nearest-neighbor search in descriptor space, ratio test, mutual check, then RANSAC to clean up. Each descriptor is compared independently — no reasoning about the other keypoints, the scene's geometry, or which points are simply *not visible* in the other image. Under strong viewpoint change, repetitive structure, or partial overlap, this collapses. SuperGlue reframes matching itself as a learnable optimization problem: jointly find correspondences *and* reject non-matchable points, exploiting two physical constraints — a keypoint has at most one correspondence, and some keypoints are unmatched due to occlusion or detector failure.

## Method & architecture

Given images $A, B$ with $M$ and $N$ local features (position $\mathbf{p}_i := (x, y, c)_i$ with detection confidence $c$, and descriptor $\mathbf{d}_i \in \mathbb{R}^D$, e.g. SuperPoint or SIFT), SuperGlue predicts a partial soft assignment $\mathbf{P} \in [0,1]^{M \times N}$ with $\mathbf{P}\mathbf{1}_N \leq \mathbf{1}_M$ and $\mathbf{P}^\top \mathbf{1}_M \leq \mathbf{1}_N$. Two blocks:

**1. Attentional Graph Neural Network.** A keypoint encoder embeds position into the descriptor so appearance and layout are reasoned about jointly:

$$ {}^{(0)}\mathbf{x}_i = \mathbf{d}_i + \mathrm{MLP}_{\mathrm{enc}}(\mathbf{p}_i) $$

All keypoints of both images form one complete *multiplex* graph with self edges (within an image) and cross edges (across images). A residual message-passing update runs for $L$ layers, alternating self and cross edges:

$$ {}^{(\ell+1)}\mathbf{x}_i^A = {}^{(\ell)}\mathbf{x}_i^A + \mathrm{MLP}\big(\big[{}^{(\ell)}\mathbf{x}_i^A \,\Vert\, \mathbf{m}_{\mathcal{E}\rightarrow i}\big]\big) $$

The message is attentional aggregation, $\mathbf{m}_{\mathcal{E}\rightarrow i} = \sum_{j} \alpha_{ij} \mathbf{v}_j$ with weights $\alpha_{ij} = \mathrm{Softmax}_j(\mathbf{q}_i^\top \mathbf{k}_j)$ over the edge set — self-attention lets a keypoint attend to salient points in its own image, cross-attention to candidate matches in the other image. Final matching descriptors are linear projections $\mathbf{f}_i^A = \mathbf{W}\,{}^{(L)}\mathbf{x}_i^A + \mathbf{b}$.

**2. Optimal matching layer.** Pairwise scores are inner products $\mathbf{S}_{i,j} = \langle \mathbf{f}_i^A, \mathbf{f}_j^B \rangle$. The score matrix is augmented with a dustbin row and column filled with a single learnable scalar $z$, so occluded/undetected points are explicitly assigned. The entropy-regularized optimal transport problem is solved with $T$ differentiable Sinkhorn iterations (iterative row/column normalization of $\exp(\bar{\mathbf{S}})$), yielding $\bar{\mathbf{P}}$; dropping the dustbins recovers $\mathbf{P}$.

**Supervision.** Negative log-likelihood over ground-truth matches $\mathcal{M}$ (from poses + depth or homographies) and unmatched sets $\mathcal{I}, \mathcal{J}$:

$$ \mathrm{Loss} = -\sum_{(i,j)\in\mathcal{M}} \log \bar{\mathbf{P}}_{i,j} - \sum_{i\in\mathcal{I}} \log \bar{\mathbf{P}}_{i,N+1} - \sum_{j\in\mathcal{J}} \log \bar{\mathbf{P}}_{M+1,j} $$

**Details:** $D = 256$, $L = 9$ layers of 4-head attention, $T = 100$ Sinkhorn iterations, 12M parameters; a forward pass averages 69 ms (15 FPS) per indoor pair on a GTX 1080 GPU. Match confidence threshold 0.2 at test time.

## Results

- **Homography estimation** (synthetic homographies over the Oxford/Paris 1M distractor images): 98.3% recall and 90.7% precision; AUC 65.85 with plain DLT vs 53.67 with RANSAC — correspondences so clean that a non-robust least-squares solver beats RANSAC. NN matching gets 0.00 DLT AUC; OANet 52.29.
- **Indoor pose (ScanNet, 1500 wide-baseline test pairs):** SuperPoint+SuperGlue pose AUC@5°/10°/20° = 16.16/33.81/51.84 vs 11.76/26.90/43.85 for SuperPoint+OANet and 9.43/21.53/36.40 for NN+mutual; precision 84.4%. With SIFT: 6.71/15.70/28.67, up to 10× more correct matches than ratio-test matching.
- **Outdoor pose (PhotoTourism):** SuperPoint+SuperGlue AUC@5°/10°/20° = 34.18/50.32/64.16 vs 21.03/34.08/46.88 for OANet; precision 84.9%. SIFT+SuperGlue 23.68/36.44/49.44 vs 15.19/24.72/35.30 for ratio test.
- **Ablation:** the GNN explains most of the gains; backpropagating into SuperPoint descriptors lifts AUC@20° from 51.84 to 53.38, showing the path toward end-to-end learning.

## Why it matters for SLAM

SuperGlue changed the front-end recipe for hard association problems: SuperPoint + SuperGlue became the dominant baseline for visual localization, wide-baseline loop closure, and mapping via the hloc pipeline. For SLAM specifically, it made relocalization work across day/night and strong viewpoint changes where descriptor-distance matching collapses. The paper itself frames this learnable middle-end as "a major milestone towards end-to-end deep SLAM". Its cost — full attention over all keypoints every frame — motivated LightGlue, the efficient successor now standard in real-time settings.

## Related

- [SuperPoint](superpoint.md) — the detector/descriptor it usually matches
- [LightGlue](lightglue.md) — faster adaptive successor
- [LoFTR](loftr.md) — detector-free dense alternative
- [HF-Net](hf-net.md) — the hierarchical localization pipeline built around it
- [hloc](hloc.md) — the localization toolbox where it is the standard matcher
