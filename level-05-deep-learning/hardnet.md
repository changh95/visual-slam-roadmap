# HardNet

> Mishchuk 2017 · [Paper](https://arxiv.org/abs/1705.10872)

**One-line summary** — Learns a compact 128-dim local patch descriptor by maximizing the margin between the matching pair and the hardest negative within each batch, showing that sampling strategy beats loss and architecture complexity.

## Problem

Classical descriptors like SIFT are hand-crafted and limited in discriminative power under strong appearance change, yet studies of the time showed SIFT variants still *beating* learned descriptors (MatchNet, DeepCompare, TFeat) in real image matching and 3D reconstruction — those methods trained with contrastive or triplet losses over *randomly* sampled negatives, wasting most gradients on pairs already easy to separate. HardNet's starting point is Lowe's matching criterion for SIFT (the first-to-second-nearest-neighbor ratio test): a good descriptor is one whose correct match is closer than its *closest incorrect* match, so that is exactly what training should optimize.

## Method & architecture

**Hardest-in-batch sampling.** A batch $\mathcal{X}=(A_i,P_i)_{i=1..n}$ of matching patch pairs (anchor, positive; exactly one pair per 3D point) is passed through the network, and the full $n \times n$ L2 distance matrix is computed on GPU, with

$$d(a_i,p_j)=\sqrt{2-2a_ip_j}$$

for unit-length descriptors. For each pair, the closest non-matching descriptor is found in both directions: $p_{j_{min}}$ with $j_{min}=\arg\min_{j\neq i} d(a_i,p_j)$, and $a_{k_{min}}$ with $k_{min}=\arg\min_{k\neq i} d(a_k,p_i)$. The harder of the two forms the triplet.

**Triplet margin loss.** The $n$ hardest triplets feed a margin-1 loss:

$$L=\frac{1}{n}\sum_{i=1}^{n}\max\Bigl(0,\;1+d(a_i,p_i)-\min\bigl(d(a_i,p_{j_{min}}),\,d(a_{k_{min}},p_i)\bigr)\Bigr)$$

Only a two-stream siamese network is needed (not three), saving ~30% memory over standard triplet training; the only overhead vs random sampling is the distance matrix and its row/column minima.

**Architecture.** Identical to L2Net: a fully-convolutional net on $32\times32$ mean/std-normalized grayscale patches, spatial size reduced by strided convolutions (no pooling — it hurt performance), batch norm + ReLU after every layer except the last, dropout before the final convolution, output L2-normalized to a **128-D unit-length descriptor** — deliberately SIFT-compatible. Unlike L2Net, no auxiliary losses (no deep supervision, no descriptor-correlation penalty) are needed; no significant overfitting was observed.

**Training.** UBC Phototour (Brown) dataset — Liberty/Notre Dame/Yosemite, ~400k DoG patches each — trained on one subset (Liberty, standard protocol), SGD with weight decay. Performance improves with batch size as the negative pool grows, saturating beyond 512.

## Results

- **Brown dataset patch verification** (FPR at 95% recall, lower is better): HardNet+ reaches **1.51 mean FPR95** vs L2Net+ 2.23, TFeat-M* 6.64, and SIFT 26.55 — an order of magnitude over hand-crafted.
- **Ablation** (HPatches matching, mean mAP): hardest-in-batch achieves 0.482 with the triplet margin loss vs 0.346 for classical hard-negative mining + correlation penalty and 0.286 for random sampling + penalty; random and classical mining *without* the penalty simply overfit. The sampling scheme, not the loss (softmin/triplet/contrastive all work), is the main reason for HardNet's performance.
- **HPatches**: HardNet outperforms L2Net+ on matching and retrieval, with the largest gains in the Hard and Tough geometric-noise setups; retrieval mAP degrades only slightly as distractors grow to 10k+, where TFeat drops below SIFT.
- **Wide-baseline stereo (W1BS, MODS matcher)**: on cross-domain datasets (SymB, GDB, WxBS, LTLL) HardNet+ matches or beats RootSIFT and other learned descriptors despite never being trained on cross-domain data.
- **Image retrieval**: with BoW+SV+QE, HardNet++ reaches 84.5 mAP on Oxford5k and 79.1 on Paris6k (1M vocabulary); the HardNet++–HQE variant scores 86.8/88.3 (single/multiple assignment) on Oxford5k — the best reported with an independently learned vocabulary at the time.

## Why it matters for SLAM

HardNet descriptors became a popular drop-in replacement for SIFT in SfM and SLAM pipelines: same 128-dim interface, better robustness to appearance change. More influentially, its hardest-in-batch mining became the standard training recipe for descriptor learning, adopted by SOSNet, HyNet, and the descriptor branches of joint detector-descriptor networks like DISK. It marks the "learned descriptors on classical keypoints" step in the evolution toward fully learned front-ends.

## Related

- [SuperPoint](superpoint.md) — joint detector + descriptor successor paradigm
- [KeyNet](keynet.md) — learned detector commonly paired with HardNet
- [DISK](disk.md) — end-to-end feature learning influenced by HardNet's loss design
- [R2D2](r2d2.md) — adds reliability-aware detection to descriptor learning
- [Keypoints](../level-02-getting-familiar/keypoints.md) — classical feature background these methods replace
- [2D-2D correspondence](../level-02-getting-familiar/2d-2d-correspondence.md) — the matching problem descriptors exist to solve
