# FlowNet

> Dosovitskiy 2015 · [Paper](https://arxiv.org/abs/1504.06852)

**One-line summary** — First end-to-end CNN for optical flow estimation, introducing the correlation layer and the synthetic Flying Chairs training dataset that became standard across the field.

## Problem

By 2015 CNNs had transformed recognition tasks, but optical flow was not among their successes: variational methods in the Horn-Schunck lineage (DeepFlow, EpicFlow) still ruled, at seconds-to-minutes per frame. Flow differs fundamentally from prior CNN applications — it requires not just per-pixel localization but *matching* features between two images. Two obstacles blocked learning it: no one knew what architecture could express dense two-frame correspondence, and no dataset had dense ground-truth flow at CNN scale (true correspondences for real scenes are nearly impossible to obtain; Sintel, the largest, had only 1,041 training pairs). FlowNet attacked both.

## Method & architecture

Two encoder-decoder architectures, each with nine convolutional layers (stride 2 in six of them, ReLU after each, no fully-connected layers so input size is arbitrary; filters shrink from $7\times7$ to $5\times5$ to $3\times3$ while channels roughly double at each stride-2 layer):

- **FlowNetSimple** stacks both images into a 6-channel input and lets a generic network learn how to extract motion by itself.
- **FlowNetCorr** processes the two images in separate identical streams, then compares their feature maps $\mathbf{f}_1,\mathbf{f}_2:\mathbb{R}^2\to\mathbb{R}^c$ with an explicit **correlation layer** — the paper's key architectural contribution. The correlation of patches centered at $\mathbf{x}_1$ and $\mathbf{x}_2$ is

$$c(\mathbf{x}_1,\mathbf{x}_2)=\sum_{\mathbf{o}\in[-k,k]\times[-k,k]}\langle \mathbf{f}_1(\mathbf{x}_1+\mathbf{o}),\,\mathbf{f}_2(\mathbf{x}_2+\mathbf{o})\rangle$$

  for patch size $K:=2k+1$ — structurally one step of a convolution, but convolving *data with data*, so it has no trainable weights. Comparing all $w^2 h^2$ patch pairs is intractable, so displacements are capped at $d$ (neighborhood $D:=2d+1$) with strides $s_1,s_2$, and relative displacements are organized as channels, giving a $w\times h\times D^2$ output. Chosen parameters: $k{=}0$, $d{=}20$, $s_1{=}1$, $s_2{=}2$.

**Refinement**: 'upconvolutional' layers (unpooling + convolution) expand the coarse features; at each step the upconvolved features are concatenated with the corresponding contractive-part feature maps and an upsampled coarser flow prediction, doubling resolution 4 times to quarter resolution, then bilinear upsampling to full size. An optional variational refinement ('+v') runs 20 coarse-to-fine iterations of a matching-free variational solver plus 5 full-resolution iterations, with boundary-respecting smoothness $\alpha=\exp(-\lambda b(x,y)^{\kappa})$.

**Training**: loss is the endpoint error (EPE — Euclidean distance between predicted and ground-truth flow, averaged over pixels); Adam ($\beta_1{=}0.9$, $\beta_2{=}0.999$), batch 8, lr $10^{-4}$ halved every 100k iterations after 300k (FlowNetCorr needs a warm-up from $10^{-6}$ to avoid exploding gradients). Data is the purpose-built **Flying Chairs** set: 809 rendered chair types (62 views each) affinely moved over 964 Flickr backgrounds, with displacement statistics matched to Sintel — 22,872 image pairs with exact dense flow. Aggressive online augmentation (translation ±20%, rotation ±17°, scaling 0.9–2.0, noise, brightness/contrast/gamma/color) is still crucial.

## Results

- Trained *only* on unrealistic Flying Chairs, the networks generalize to real data, beating LDOF: Sintel Clean test EPE 7.28 (FlowNetC) / 7.42 (FlowNetS) vs LDOF 7.56; after Sintel fine-tuning + variational refinement, FlowNetS+ft+v reaches 7.22 on Sintel Final test — on par with DeepFlow (7.21) — and 7.6 on KITTI test vs EPPM 9.2 and LDOF 12.4.
- On the Flying Chairs test set the nets beat all classical methods: FlowNetC EPE 2.19 vs EpicFlow 2.94 and DeepFlow 3.53 — and there variational refinement *hurts*, hinting networks would win elsewhere too given realistic training data.
- Runtime 0.08 s (FlowNetS) / 0.15 s (FlowNetC) per frame on a GTX Titan — 5 to 10 fps at full Sintel resolution, versus 16–17 s per frame (CPU) for EpicFlow/DeepFlow; best accuracy among real-time methods.
- Ablations: dropping augmentation costs ~2 px EPE on Sintel; training on Sintel alone is ~1 px worse than Chairs-pretraining + fine-tuning. FlowNetC overfits slightly more and struggles with very large displacements (s40+ error 48 px vs 43.3 px for FlowNetS+ft) because the correlation's displacement cap limits detectable motion.

## Why it matters for SLAM

FlowNet launched the entire deep optical flow field, whose descendants (RAFT and its variants) now serve as the dense correspondence engines inside learned visual odometry and SLAM systems such as DROID-SLAM. Its two core artifacts remain load-bearing a decade later: the correlation layer (reused by PWC-Net, RAFT, and essentially every later flow network) and the synthetic-data recipe — train on rendered data with exact ground truth, evaluate on Sintel/KITTI — that FlyingThings3D, AutoFlow, and Kubric all follow.

## Related

- [FlowNet 2.0](flownet-2-0.md) — stacked refinement that reached classical-method accuracy
- [PWC-Net](pwc-net.md) — compact pyramid/warping/cost-volume successor
- [RAFT](raft.md) — all-pairs correlation architecture that superseded this lineage
- [FlowNet3D](flownet3d.md) — the same idea transplanted to 3D point clouds
