# ACE

> Brachmann 2023 · [Paper](https://arxiv.org/abs/2305.14059)

**One-line summary** — Accelerated Coordinate Encoding reduced scene coordinate regression training from hours to about 5 minutes per scene by splitting the network into a scene-agnostic pretrained encoder and a tiny scene-specific MLP head.

## Problem

Learning-based visual relocalizers exhibit leading pose accuracy, but require hours or days of training — and since training must happen again on each new scene, long training times made learning-based relocalization impractical for most applications despite its promise of high accuracy. The mapping phase, not the query phase, was the deployment bottleneck: DSAC\*, the state-of-the-art SCR pipeline, needs 15 hours on a premium GPU to map one scene.

## Method & architecture

**Setup.** As in the DSAC line, pose comes from $\mathbf{h}=g(\mathcal{C})$, where $g$ is a PnP + RANSAC solver (64 hypotheses, 10 px inlier threshold, LM refinement) and $\mathcal{C}=\{(\mathbf{x}_i,\mathbf{y}_i)\}$ are 2D-3D correspondences predicted by a scene coordinate regressor $\mathbf{y}_{i}=f(\mathbf{p}_{i};\mathbf{w})$ operating on image patches $\mathbf{p}_i$. ACE keeps this entirely — its contribution is making the training of $f$ two orders of magnitude faster.

**Backbone/head split.** The regressor is factored as

$$f(\mathbf{p}_{i};\mathbf{w})=f_{\text{H}}(\mathbf{f}_{i};\mathbf{w}_{\text{H}}),\quad\text{with}\quad \mathbf{f}_{i}=f_{\text{B}}(\mathbf{p}_{i};\mathbf{w}_{\text{B}}),$$

where $f_{\text{B}}$ is a scene-agnostic convolutional backbone (first 10 layers of the DSAC\* design, 512-D features, pretrained once on 100 ScanNet scenes with 100 parallel heads for a week — 11 MB, frozen at deployment) and $f_{\text{H}}$ is a scene-specific 512-wide MLP head of 1x1 convolutions — the 4 MB head *is* the map.

**Gradient decorrelation — the key idea.** Standard SCR training feeds one image per iteration, so all patch gradients are highly correlated. Because the MLP head needs no spatial context, ACE instead precomputes a training buffer of 8M backbone features (with pixel position, intrinsics, and ground-truth pose) in the first minute, then shuffles it every epoch and builds batches of 5120 features drawn from thousands of different mapping views. Each parameter update thus optimizes across the whole scene simultaneously — decorrelated gradients tolerate very high learning rates (AdamW, one-cycle schedule between $5\cdot10^{-4}$ and $5\cdot10^{-3}$) and converge in 16 epochs / 4 minutes.

**Curriculum instead of end-to-end training.** Costly backprop through a differentiable pose solver (half of DSAC\*'s training time for 10% of its updates) is replaced by a curriculum over the pixel-wise reprojection loss: valid predictions optimize a $\tanh$-clamped reprojection error

$$\hat{e}_{\bm{\pi}}(\mathbf{x}_{i},\mathbf{y}_{i},\mathbf{h}^{*}_{i})=\tau(t)\,\tanh\left(\frac{e_{\bm{\pi}}(\mathbf{x}_{i},\mathbf{y}_{i},\mathbf{h}^{*}_{i})}{\tau(t)}\right),\qquad \tau(t)=w(t)\,\tau_{\text{max}}+\tau_{\text{min}},\;\; w(t)=\sqrt{1-t^{2}},$$

with the threshold shrinking from $\tau_{\text{max}}{=}50$ px to $\tau_{\text{min}}{=}1$ px over training progress $t$ — the network burns in on reliable structure and abandons predictions RANSAC would reject anyway. Invalid predictions regress toward a dummy coordinate at 10 m depth. Training runs in fp16; the head predicts homogeneous coordinates $(x,y,z,w)$ with a softplus w-clip, which consistently helps on hard scenes. No depth, no 3D model — only posed RGB.

## Results

- **Headline**: same accuracy as much slower SCR predecessors in less than 5 minutes of per-scene training — up to **300x faster mapping** than state-of-the-art SCR, with 4 MB maps (DSAC\*: 15 h, 28 MB; hLoc stores ~3.3 GB per 7Scenes scene, ~800 MB on Cambridge).
- **7Scenes / 12Scenes** (5 cm/5° threshold, both SLAM and SfM ground truth): ACE is the only approach combining top accuracy, under 10 minutes of mapping, and under 10 MB per scene — on par with DSAC\* (Table 1). ~80% accuracy is already reached after a single epoch (75 s); 2.5 MB heads still exceed 95% on 7Scenes.
- **Cambridge Landmarks**: ACE performs reasonably at 4 MB; the "Poker" ensemble of four ACE heads outperforms DSAC\* on average median error while remaining far leaner in mapping time and storage.
- **Wayspots** (new 10-scene outdoor benchmark from phone scans with Map-free-style SfM ground truth, 10 cm/5°): ACE outperforms DSAC\* on average while mapping two orders of magnitude faster.
- **Hardware**: on a budget T4 GPU ACE slows down only ~10%, while DSAC\* mapping doubles to ~30 h — mapping cost and energy drop by two orders of magnitude.

## Why it matters for SLAM

ACE turned scene coordinate regression from a research curiosity into a deployable relocalization tool: a compact, implicit, privacy-friendly scene representation (no images or point clouds stored) you can train on-site in minutes from nothing but posed RGB — exactly what phone-scale visual odometry provides. It is the foundation of an active lineage — ACE Zero removes the need for known poses, ACE-G targets generalization without per-scene fine-tuning, and ACE-SLAM pushes the representation into a real-time SLAM loop where the network weights are the map.

## Related

- [DSAC](dsac.md)
- [DSAC\*](dsac-star.md)
- [ACE Zero](ace-zero.md)
- [ACE-G](ace-g.md)
- [ACE-SLAM](ace-slam.md)
