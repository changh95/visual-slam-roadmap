# FlowNet 2.0

> Ilg 2017 · [Paper](https://arxiv.org/abs/1612.01925)

**One-line summary** — Stacks multiple FlowNet modules with intermediate warping and adds a dedicated small-displacement sub-network, cutting FlowNet's estimation error by more than 50% and becoming the first deep method to match classical variational optical flow at interactive frame rates.

## Problem

FlowNet demonstrated that optical flow estimation can be cast as a learning problem, but the state of the art in flow *quality* was still defined by traditional variational methods — particularly on small displacements and real-world data, where FlowNet could not compete. Simply making a single FlowNet deeper or wider did not help. The missing ingredient was iterative refinement: classical methods progressively refine a coarse estimate, and FlowNet 2.0 rebuilds that mechanism inside a learnable pipeline.

## Method & architecture

The paper's three contributions form the pipeline:

**1. Dataset schedules.** The order of training data matters: training FlowNetS/FlowNetC on the simple FlyingChairs first and only then fine-tuning on the 3D FlyingThings3D consistently beats training on either alone or on a mixture — the conjecture is that Chairs teaches general color matching before the network develops confusing priors for 3D motion and lighting. Three learning-rate schedules are defined ($S_{\mathit{short}}$ with 600k iterations, $S_{\mathit{long}}$ with 1.2M, and a low-rate fine-tuning schedule $S_{\mathit{fine}}$). Schedule changes alone improved FlowNetS results by ~25% and FlowNetC by ~30%, and showed that FlowNetC (with its correlation layer) beats FlowNetS when trained under equal conditions.

**2. Stacked networks with warping.** A bootstrap FlowNetC receives $I_1, I_2$; every subsequent FlowNetS receives $I_1$, $I_2$, the current flow estimate $w_i = (u_i, v_i)^\top$, the second image warped by it via bilinear interpolation

$$\tilde{I}_{2,i}(x,y) = I_2(x + u_i,\ y + v_i)$$

and the brightness error $e_i = \lVert \tilde{I}_{2,i} - I_1 \rVert$, so each stage only estimates the remaining increment between $I_1$ and $\tilde{I}_{2,i}$. Warping is differentiable, so the stack could train end-to-end, but the best results come from training networks one at a time with earlier ones frozen (stacking *without* warping overfits). Stacks are named by their components — FlowNet2-CSS is FlowNetC followed by two FlowNetS; lower-case letters denote thin variants with 3/8 of the channels. FlowNet2-CSS improves ~30% over the single FlowNet2-C and ~50% over the original FlowNetC; two small networks beat one large one (FlowNet2-ss at 11M weights outperforms FlowNet2-S at 38M).

**3. Small-displacement sub-network and fusion.** Real-world video (e.g. UCF101) has mostly sub-pixel motion, which the existing training data lacks; the authors build ChairsSDHom (Chairs-style data with small displacements and homogeneous backgrounds) and FlowNet2-SD — a FlowNetS variant with the stride-2 removed from the first layer, the 7x7/5x5 kernels replaced by multiple 3x3 kernels, and extra convolutions between the upconvolutions to smooth noise. A small fusion network takes both branches' flows, flow magnitudes, and warped-brightness errors, and outputs the final full-resolution estimate; the whole system is called FlowNet2.

## Results

- FlowNet 2.0 decreases FlowNet's estimation error by more than 50% while being only marginally slower, performing on par with state-of-the-art methods (FlowFields on Sintel; DeepDiscreteFlow on Sintel final after fine-tuning) at interactive frame rates. The fine-tuned model's Sintel test EPE, as listed in the PWC-Net comparison table, is 4.16 clean / 5.74 final.
- A spectrum of variants covers 8 to 140 fps; FlowNet2-s matches the original FlowNet's accuracy while running at 140 fps.
- KITTI: fine-tuning on KITTI2012+2015 reduces the error roughly by a factor of 3; best EPE on KITTI2012 and first rank on the KITTI2015 benchmark among non-stereo methods.
- On real applications — motion segmentation and action recognition — the original FlowNet was not useful, while FlowNet2 is as reliable as state-of-the-art traditional flow at orders of magnitude higher speed, with crisp motion boundaries and robustness to compression artifacts and homogeneous regions.

## Why it matters for SLAM

FlowNet 2.0 was the moment deep optical flow became genuinely usable: accurate enough to trust and fast enough for online pipelines, which made dense flow a realistic ingredient for visual odometry front-ends. Its stack-and-warp iterative refinement paradigm led directly to PWC-Net and ultimately to RAFT's recurrent updates — the mechanism at the heart of today's learned SLAM systems — and its Chairs-then-Things3D curriculum became standard practice for training flow and stereo networks.

## Related

- [FlowNet](flownet.md) — the original end-to-end flow network it refines
- [PWC-Net](pwc-net.md) — distilled the same ideas into a far smaller architecture
- [RAFT](raft.md) — modern successor with all-pairs correlation and recurrent updates
- [FlowFormer](flowformer.md) — Transformer-era continuation of the accuracy race
