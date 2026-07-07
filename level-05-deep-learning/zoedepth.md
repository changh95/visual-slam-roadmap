# ZoeDepth
> Bhat 2023 · [Paper](https://arxiv.org/abs/2302.12288)

**One-line summary** — Combines relative-depth pre-training (MiDaS/DPT style) with a lightweight Metric Bins Module to produce zero-shot *metric* depth, giving monocular SLAM a depth prior with absolute scale.

## Problem
Monocular depth research had split into two camps: *relative* depth models (MiDaS, DPT) that generalize across domains but output depth only up to an unknown scale and shift, and *metric* depth models that predict absolute distances but overfit to the single camera/dataset they were trained on. SLAM needs both properties at once — meters, everywhere. Training a single metric model across datasets with very different depth scales (indoor ~10 m vs. outdoor ~80 m) usually deteriorates performance or diverges outright.

## Method & architecture

**Two-stage training.** Stage 1 pre-trains a MiDaS-style encoder-decoder (DPT architecture with a BEiT384-L transformer encoder) for relative depth on the M12 mix of 12 datasets using the scale-shift-invariant multi-task loss. Stage 2 attaches one or more lightweight metric heads (each <1% of the backbone's parameters) to the decoder and fine-tunes end-to-end on metric datasets (NYU Depth v2 and/or KITTI).

**Metric bins module.** The head hooks into the bottleneck plus four decoder levels (at 1/32, 1/16, 1/8, 1/4, 1/2 resolution). Following the adaptive-bins idea, depth at pixel $i$ is a probability-weighted combination of per-pixel bin centers $c_i(k)$:

$$d(i) = \sum_{k=1}^{N_{total}} p_i(k)\, c_i(k)$$

Unlike LocalBins (which starts with few seed bins and *splits* them at each decoder layer), ZoeDepth predicts all $N_{total}=64$ bin centers at the bottleneck and *adjusts* them at each decoder level with **attractor layers**: an MLP predicts $n_a$ attractor points $\{a_k\}$ per pixel, and each bin center moves by $c_i' = c_i + \Delta c_i$ with the inverse attractor

$$\Delta c_i = \sum_{k=1}^{n_a} \frac{a_k - c_i}{1 + \alpha |a_k - c_i|^{\gamma}}$$

where $\alpha, \gamma$ set attractor strength and $\{n_a^l\} = \{16, 8, 4, 1\}$ across decoder layers. Attracting is contracting (refinement without the sum-of-widths constraints splitting imposes).

**Log-binomial probabilities.** Because bins are ordered, the probability over bins is not a plain softmax but a binomial distribution with predicted mode $q$ and temperature $t$:

$$p(k; N, q) = \binom{N}{k} q^k (1-q)^{N-k}$$

computed in log space with Stirling's approximation and normalized by $\mathrm{softmax}(\log(p_k)/t)$, preserving unimodality. Pixel supervision uses the scale-invariant log loss.

**Domain heads + router.** Separate metric heads act as indoor/outdoor experts over a shared backbone; a router MLP on bottleneck features picks the head per image. Three variants — labeled, trained, and auto router — allow deployment without any scene-type labels at inference.

## Results

On the NYU Depth v2 benchmark: ZoeD-X-N (no relative pre-training) reaches REL 0.082, beating the prior SOTA NeWCRFs (REL 0.095) by 13.7% — validating the metric-bins design alone. ZoeD-M12-N (M12 pre-training, NYU fine-tuning) reaches REL 0.075, a total 21% improvement over NeWCRFs. Trained jointly on NYU + KITTI, the flagship two-head ZoeD-M12-NK holds REL 0.077 on NYU (only 2.6% off the NYU-only model), whereas NeWCRFs degrades ~15% (0.095 to 0.109) and AdaBins/PixelBins fail to converge in the joint setting; the single-head variant drops only 8% (0.081). In zero-shot transfer to eight unseen datasets, ZoeD-M12-NK improves the mean relative metric (mRI over $\delta_1$, REL, RMSE vs. NeWCRFs) by 5.3% (HyperSim) to 46.3% (DIODE Indoor) indoors and by 7.8% (Virtual KITTI 2) up to 976.4% (~11x, DIML Outdoor) outdoors, losing only on DDAD (−12.8%). Code and pre-trained models are public.

## Why it matters for SLAM
Monocular SLAM is scale-ambiguous; relative-depth networks like MiDaS cannot fix that because their output is only defined up to an affine transform. ZoeDepth was the first practical model to deliver metric depth zero-shot across domains, so a single network can supply scale for monocular SLAM initialization, densification, or scale-drift correction. Its relative-then-metric training paradigm was adopted by successors such as Metric3D and Depth Anything, making ZoeDepth a key link between the relative-depth foundation models and metric-scale robotics use.

## Related
- [MiDaS](midas.md) — the multi-dataset relative-depth backbone and training recipe.
- [DPT](dpt.md) — the ViT-based dense prediction architecture ZoeDepth builds on.
- [Metric3D](metric3d.md) — alternative canonical-camera route to zero-shot metric depth.
- [Depth Anything](depth-anything.md) — scaling up depth foundation models; uses the ZoeDepth framework for its metric fine-tuning.
- [Depth from sensor](../level-04-rgbd-slam/depth-from-sensor.md) — what metric depth networks aim to replace or complement.
- [Scale ambiguity](../level-03-monocular-slam/scale-ambiguity.md) — the monocular SLAM problem a metric depth prior addresses.
