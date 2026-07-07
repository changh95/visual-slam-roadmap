# XFeat
> Potje 2024 · [Paper](https://arxiv.org/abs/2404.19174)

**One-line summary** — An ultra-lightweight learned local feature (CVPR 2024) with compact 64-dim descriptors that runs up to 5× faster than existing deep features — in real time even on a laptop CPU — by keeping spatial resolution high and channel count low, making learned matching practical on embedded hardware.

## Problem
State-of-the-art learned features (SuperPoint, DISK, ALIKE) are accurate but too heavy for the hardware robots actually ship with — drones, AR glasses, mobile robots. The bottleneck is architectural: accurate matching "requires sufficiently large image resolutions", yet feeding high-resolution images through even a small VGG-like backbone inflates compute, since the FLOP count of a convolution layer is $F_{ops}=H_i\cdot W_i\cdot C_i\cdot C_{i+1}\cdot k^2$ — the spatial terms $H_i W_i$ dominate in early layers. XFeat revisits fundamental CNN design choices for detecting, extracting, and matching local features under a hard compute budget.

## Method & architecture
**Featherweight backbone.** From a grayscale image $\mathbf{I}\in\mathbb{R}^{H\times W\times 1}$, six convolutional blocks (23 layers of "basic layers": conv $k\in\{1,3\}$ + ReLU + BatchNorm) halve resolution while *tripling* rather than doubling channels — $\{4,8,24,64,64,128\}$ from $C=4$ up to $C=128$ at $H/32\times W/32$. Starting with only 4 channels keeps the expensive high-resolution early layers minimal; the triple-rate growth restores capacity in cheap low-resolution layers.

**Three heads.** A feature-pyramid fusion of the $\{1/8,1/16,1/32\}$ scales yields a dense 64-dim descriptor map $\mathbf{F}\in\mathbb{R}^{H/8\times W/8\times 64}$, a reliability map $\mathbf{R}$ modeling the probability that $\mathbf{F}_{i,j}$ can be matched confidently, and a *separate* keypoint branch: the image is reshaped into $8\times 8$ cells (64-dim vectors), and fast $1\times1$ convolutions classify the keypoint position among the 64 cell positions plus a dustbin, $\mathbf{K}\in\mathbb{R}^{H/8\times W/8\times 65}$ (SuperPoint-style, but decoupled — joint training degrades semi-dense matching for compact CNNs).

**Semi-dense match refinement.** Instead of a fine-level feature map (LoFTR-style), an MLP predicts pixel offsets from a matched coarse descriptor pair alone: $\mathbf{o}=\text{MLP}(\text{concat}(\mathbf{f}_a,\mathbf{f}_b))$, choosing the offset as

$$(x,y)=\operatorname*{arg\,max}_{i,j\in\{1,\dots,8\}}\mathbf{o}(i,j)$$

where $\mathbf{o}\in\mathbb{R}^{8\times 8}$ holds offset logits — semi-dense matching with no high-resolution features at all.

**Training.** Supervised with pixel-level correspondences on MegaDepth + synthetically warped COCO (6:4 mix, 800×600), with a multi-task loss $\mathcal{L}=\alpha\mathcal{L}_{ds}+\beta\mathcal{L}_{rel}+\gamma\mathcal{L}_{fine}+\delta\mathcal{L}_{kp}$: a dual-softmax NLL over the similarity matrix $\mathbf{S}=\mathbf{F}_1\mathbf{F}_2^{\mathsf T}$ for descriptors, an L1 loss $\mathcal{L}_{rel}=|\sigma(\mathbf{R}_1)-\bar{\mathbf{R}}_1\odot\bar{\mathbf{R}}_2|+|\sigma(\mathbf{R}_2)-\bar{\mathbf{R}}_1\odot\bar{\mathbf{R}}_2|$ tying reliability to dual-softmax confidence, NLL over offset logits, and keypoints distilled from ALIKE-tiny. Training converges in 36 h on one RTX 4090 using 6.5 GB VRAM. Inference: sparse mode (XFeat, 4,096 keypoints scored by $\mathbf{K}_{i,j}\cdot\mathbf{R}_{i,j}$ + mutual-nearest-neighbor) or semi-dense mode (XFeat*, top-10k reliable features + offset refinement).

## Results
- **MegaDepth-1500 relative pose** (LO-RANSAC, CPU FPS on i5-1135G7 @ VGA): XFeat 42.6 AUC@5° at 27.1 FPS vs SuperPoint 37.3 at 3.0 FPS (9× speedup) and ALIKE 49.4 at 5.3 FPS (5× speedup). XFeat* reaches 50.2/65.4/77.1 AUC@5°/10°/20° with 1885 inliers at 19.2 FPS — beating DISK* (55.2/66.8/75.3 at 1.2 FPS, a 16× speedup) at the looser thresholds and in MIR (0.74 vs 0.71).
- **ScanNet-1500 (indoor, no retraining)**: XFeat/XFeat* get 16.7/18.4 AUC@5° vs SuperPoint 12.5 and DISK 9.6/11.3 — better generalization; DISK and ALIKE show landmark-dataset bias.
- **HPatches homography**: MHA@3 of 95.0 (illumination) and 68.6 (viewpoint), on par with the most accurate descriptors.
- **Vs learned matchers**: XFeat* at 1.33 pairs/s on CPU vs LoFTR at 0.06 (22× faster), trading accuracy (50.2 vs 68.3 AUC@5°) for speed; beats Patch2Pix (47.8) on both.
- **Embedded**: on a 28-dollar Orange Pi Zero 3 (Cortex-A53), XFeat runs 1.8 FPS vs SuperPoint 0.16 and ALIKE 0.58 — the only learned method above 1 FPS.

## Why it matters for SLAM
Learned features had clearly surpassed hand-crafted ones (ORB, SIFT) in robustness, but their compute cost kept them out of real-time SLAM front-ends on embedded platforms. XFeat is the point where learned features became cheap enough to drop into a SLAM pipeline running on the kind of hardware robots actually ship with. Paired with a lightweight matcher such as LightGlue, it enables a full learned front-end (detection, description, matching) at frame rate on edge devices.

## Related
- [SuperPoint](superpoint.md) — the standard learned feature XFeat is benchmarked against.
- [LightGlue](lightglue.md) — efficient learned matcher commonly paired with XFeat.
- [LoFTR](loftr.md) — detector-free dense matching alternative that XFeat's semi-dense mode approximates at far lower cost.
- [DISK](disk.md) — accurate but heavier learned feature, illustrating the accuracy/speed trade-off.
- [Learned vs hand-crafted](learned-vs-hand-crafted.md) — the surrounding design debate.
- [Edge deployment](../level-02-getting-familiar/edge-deployment.md) — the deployment context XFeat is designed for.
