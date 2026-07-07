# DeDoDe

> Edstedt 2024 · [Paper](https://arxiv.org/abs/2308.08479)

**One-line summary** — DeDoDe ("Detect, Don't Describe — Describe, Don't Detect") decouples keypoint detection from description, training the detector directly for 3D consistency from large-scale SfM tracks and the descriptor separately for mutual-nearest-neighbour matchability.

## Problem

The core difficulty in learned keypoint detection is the learning objective: what makes a pixel a "good" keypoint? Previous learning-based methods (SuperPoint, DISK, SiLK) jointly learn descriptors with keypoints and treat detection as binary classification on descriptor mutual nearest neighbours — a proxy task that is "not guaranteed to produce 3D-consistent keypoints" and that ties the keypoints to one specific descriptor, complicating downstream usage. DeDoDe instead learns keypoints directly from 3D consistency, and gains compatibility (keypoints usable with arbitrary matchers) and modularity as side effects.

## Method & architecture

**Detector objective.** A network $f_\theta(x|I)$ outputs a log-density over the image, trained to maximize the likelihood of "good" keypoints:

$$\max_{\theta}\sum_{j=1}^{|\mathcal{D}|}\sum_{i=1}^{K^{j}} f_{\theta}(x_i^j|I^j)-\log Z_{\theta}(I^j), \qquad Z_{\theta}(I^j)=\sum_{x^j\in I^j}\exp(f_{\theta}(x^j|I^j)).$$

The "ground truth" is SIFT detections that survived MegaDepth SfM reconstruction as 3D tracks. Since each image sees only a fraction of its tracks, pairs $(I^{\mathcal{A}}, I^{\mathcal{B}})$ are sampled and the union of covisible detections (via MVS depth) is used.

**Smooth two-view prior.** Dirac deltas at track detections are blurred with a Gaussian ($\sigma=0.5$ px) plus a small uniform constant, warped across views with depth, and multiplied: $p^{\mathcal{A}}_{\rm kp}\propto\tilde{p}_{\rm kp}^{\mathcal{A}}\cdot\tilde{p}_{\rm kp}^{\mathcal{B}\to\mathcal{A}}$ — peaking on tracks detected in *both* images.

**Semi-supervised posterior + top-k target.** Because the base detector has insufficient recall, the prior is conditioned on the network's own predictions, $p\propto p_{f_\theta}\cdot p_{\rm kp}$, letting DeDoDe discover keypoints SIFT missed. The target is binarized at the top $k=\text{batchsize}\cdot 1024$ detections (avoiding degenerate solutions), giving $\mathcal{L}_{\rm detection}={\rm CE}(p_{f_\theta}, p_{\text{top-}k})$, plus a coverage regularizer $\mathcal{L}_{\rm coverage}={\rm CE}(\mathcal{N}(0,\sigma^2)*p_{f_\theta},\,\mathcal{N}(0,\sigma^2)*p_{\rm MVS})$ with $\sigma=12.5$ px so detections avoid unmatchable regions (e.g. sky). Inference simply takes the top-$K$ points, with no non-max suppression.

**Descriptor, trained separately.** A second network $\mathbf{g}_\theta$ (no shared weights) maximizes the symmetric log-likelihood $\ell_{g_\theta}=\log p_{g_\theta}(x^{\mathcal{A}}|x^{\mathcal{B}})+\log p_{g_\theta}(x^{\mathcal{B}}|x^{\mathcal{A}})$, where $p_{g_\theta}$ is a softmax over inner products of 256-dim normalized descriptions (temperature $1/20$) — evaluated *at trained DeDoDe keypoints* ($K=5000$ per image), so the intractable normalizer of joint methods disappears.

**Architecture.** Both nets use an ImageNet-pretrained VGG-19 encoder (strides 1–8, channels 64–512) with DKM-style depthwise-convolution refiner decoders that residually refine a dense logit/description grid across scales. **DeDoDe-G** adds frozen DINOv2 features at stride 14 with an extra decoder stage (dim 768). Detector: 100k steps, batch 8, 512×512, ~30 h on one A100; descriptor ~24 h; SotA evaluation at 784×784.

## Results

- **MegaDepth-1500 relative pose (MNN matching)**: DeDoDe-B 49.4 / 65.5 / 77.7 AUC@5°/10°/20° and DeDoDe-G 52.8 / 69.7 / 82.0 — vs DISK 35.0, SiLK 39.9, ALIKED 41.9, SuperPoint 31.7 at AUC@5° (gains of +17.8 over DISK, +12.9 over SiLK, +10.9 over ALIKED); DeDoDe-G matches LoFTR (52.8) with plain nearest-neighbour matching.
- **IMC2022 (hidden test set, 30k keypoints)**: DeDoDe-B 72.9, DeDoDe-G 75.8 mAA@10 — vs DISK 64.8, SiLK 68.5 (+7.4), competitive with SuperPoint+SuperGlue (72.4).
- **Detector repeatability (MegaDepth, 10k kpts, 0.1% threshold)**: DeDoDe 40.1 vs DISK* 32.6, ALIKED* 26.4, SiLK 21.2.
- **Component swaps**: SIFT/DeDoDe-B (41.1 AUC@5°) and DISK/DeDoDe-B (41.5) both beat the original SIFT (36.5) and DISK (35.0) pipelines — but trail full DeDoDe by ~8 points, showing detector and descriptor each contribute.
- **Ablation**: removing the coverage loss drops repeatability@0.1% from 37.1 to 29.7; supervising directly on the prior (no posterior/top-k) drops it to 34.8.

## Why it matters for SLAM

Keypoint quality bounds everything downstream in feature-based SLAM: triangulation, BA, relocalization. DeDoDe's insight — supervise detection with 3D consistency rather than descriptor-matching proxies — gives keypoints that survive wide baselines and viewpoint change, which is exactly what long-term SLAM and mapping need. It also exemplifies the modern trend of decomposing the learned front-end into independently optimized, composable pieces that plug into matchers (e.g., LightGlue) and localization stacks.

## Related

- [SuperPoint](superpoint.md)
- [DISK](disk.md)
- [R2D2](r2d2.md)
- [LightGlue](lightglue.md)
- [RoMa](roma.md) — same group; frozen DINOv2 features used in DeDoDe-G
- [Foundation models](foundation-models.md)
