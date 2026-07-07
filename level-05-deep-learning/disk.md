# DISK

> Tyszkiewicz 2020 · [Paper](https://arxiv.org/abs/2006.13566)

**One-line summary** — Trains a joint keypoint detector and descriptor end-to-end with policy gradients, treating discrete keypoint selection as a stochastic policy whose reward is the number of correct downstream matches.

## Problem

Local feature frameworks are difficult to learn end-to-end because of the discreteness inherent to selecting and matching sparse keypoints: NMS and top-$k$ selection are non-differentiable. Prior methods worked around this with proxy losses or inexact approximations — SuperPoint's homographic adaptation, R2D2's reliability maps, or descriptor-space assumptions — none of which directly optimizes what actually matters: the number of correct matches. DISK (DIScrete Keypoints) instead leverages reinforcement learning with a probabilistic model expressive enough to keep training and inference regimes close, while converging reliably from scratch.

## Method & architecture

A U-Net (4 down/up blocks, 1.1M parameters, receptive field 219×219) maps an image $I$ to a detection heatmap $K$ plus a dense $N{=}128$-dimensional descriptor map. Everything downstream is defined as distributions so that gradients of expected reward can be estimated.

**Feature distribution.** The heatmap is split into $h \times h$ grid cells ($h{=}8$); at most one feature is sampled per cell $u$ with heatmap crop $K^u$. A pixel $\mathbf{p}$ is proposed with relative probability and then accepted with absolute probability, giving

$$ P(\mathbf{p} \mid K^u) = \mathrm{softmax}(K^u)_\mathbf{p} \cdot \sigma(K^u_\mathbf{p}) $$

where $\sigma$ is a sigmoid. Accepted locations take the $\ell_2$-normalized descriptor at that pixel. At inference, softmax becomes argmax and the sigmoid a sign function, plus NMS over the heatmap.

**Match distribution.** Cycle-consistent matching is relaxed: with descriptor distance matrix $\mathbf{d}$, forward matches are drawn from $P_{A \to B}(j \mid \mathbf{d}, i) = \mathrm{softmax}(-\tau\, \mathbf{d}(i,\cdot))_j$ (reverse analogously from columns), and $i \leftrightarrow j$ match iff both directions are sampled. The match probability has closed form $P(i \leftrightarrow j) = P_{A \to B}(j \mid \mathbf{d}, i) \cdot P_{B \to A}(i \mid \mathbf{d}, j)$, so matching adds **no variance** to the gradient estimate — key to stable convergence.

**Reward.** $R(M_{AB}) = \sum_{(i,j)} r(i \leftrightarrow j)$ with $\lambda_{\mathrm{tp}} = 1$ for correct matches (both points within $\epsilon$ px of their depth-based reprojections), $\lambda_{\mathrm{fp}} = -0.25$ for incorrect ones, neutral for "plausible" matches (no depth, but epipolar distance below $\epsilon$), plus a small per-keypoint penalty $\lambda_{\mathrm{kp}} = -0.001$ to discourage unmatchable clutter.

**Gradient estimator (REINFORCE-style, exact over matches).** With $F_A, F_B$ sampled from the feature distributions:

$$ \nabla_\theta \mathbb{E}_{M_{AB}} R(M_{AB}) = \mathbb{E}_{F_A, F_B} \sum_{i,j} P(i \leftrightarrow j \mid F_A, F_B, \theta_M)\, r(i \leftrightarrow j)\, \nabla_\theta \Gamma_{ij} $$

$$ \Gamma_{ij} = \log P(i \leftrightarrow j \mid F_A, F_B, \theta_M) + \log P(F_{A,i} \mid A, \theta_F) + \log P(F_{B,j} \mid B, \theta_F) $$

**Training.** MegaDepth subset (135 scenes, 63k images, COLMAP poses/depth); triplets of co-visible images give three pairs per batch element; images at 768 px; Adam, lr $10^{-4}$; $\lambda_{\mathrm{fp}}$ and $\lambda_{\mathrm{kp}}$ annealed from 0 over the first 5 epochs so the randomly initialized network is not driven to detect nothing.

## Results

- **Image Matching Challenge 2020** (9 withheld test scenes, mAA at 10°): in the 2k-features category DISK reaches stereo mAA 0.5132 and multiview mAA 0.7271, beating all leaderboard methods by 9.4% and 6.7% relative respectively, with ~50% more RANSAC inliers; at 8k features, stereo 0.5585 and multiview 0.7502, above all baselines and just below the top three tuned submissions. Among learned-matcher submissions, DISK with plain $\ell_2$ matching places #2 behind only SuperGlue.
- **HPatches:** state-of-the-art MMA — #1 on viewpoint scenes, #2 on illumination (behind DELF), outperforming its closest competitor Reinforced Feature Points by 12% relative on AUC up to 5 px.
- **ETH-COLMAP SfM benchmark:** more landmarks than SIFT with longer tracks and comparable reprojection error; an uncapped run on "Fountain" yields 67k landmarks.
- Features can be extracted very densely while remaining discriminative, and DISK is robust to the in-plane rotations seen in training but degrades under large unseen rotations (fixable with augmentation).

## Why it matters for SLAM

DISK proved that optimizing matching success directly beats hand-designed proxy losses, and it became one of the standard learned front-end features alongside SuperPoint and R2D2. Its uniform spatial distribution of keypoints benefits SLAM systems that need constraints across the whole image, and it is supported as a feature backbone in LightGlue, making it a plug-and-play choice in the hloc localization pipeline.

## Related

- [SuperPoint](superpoint.md) — self-supervised joint detector/descriptor alternative
- [R2D2](r2d2.md) — reliability-aware detection, another answer to "where to detect"
- [HardNet](hardnet.md) — the descriptor-loss design lineage DISK builds on
- [LightGlue](lightglue.md) — matcher with native DISK support
- [hloc](hloc.md) — localization pipeline where DISK can drop in
- [DeDoDe](dedode.md) — later rethink that decouples detection from description
