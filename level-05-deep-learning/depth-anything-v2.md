# Depth Anything V2

> Yang 2024 · [Paper](https://arxiv.org/abs/2406.09414)

**One-line summary** — Depth Anything V2 produces much finer and more robust monocular depth than V1 through three practices: train the teacher only on synthetic images, scale up the teacher, and teach students through large-scale pseudo-labeled real images.

## Problem

Depth Anything V1 generalized impressively, but its teacher was trained on labeled *real* images whose depth labels are noisy and coarse — systematically wrong at object boundaries, thin structures, and transparent or reflective surfaces, because real depth sensors fail exactly there. Synthetic renderings have pixel-perfect depth but introduce a synthetic-to-real domain gap. V2 asks how to get synthetic-label precision without paying the domain-gap penalty — "without pursuing fancy techniques", as the abstract puts it.

## Key ideas

- **Practice 1 — synthetic-only labels.** Replace *all* labeled real images with synthetic images for training the teacher: rendered depth is dense, sharp at edges, and correct for transparent and reflective materials where sensor ground truth is garbage.
- **Practice 2 — scale up the teacher.** The domain gap of synthetic-only training is absorbed by giving the teacher much larger capacity; only a sufficiently big model can bridge synthetic training and real-world inference reliably.
- **Practice 3 — pseudo-labeled real bridge.** Students are taught "via the bridge of large-scale pseudo-labeled real images": the big synthetic-trained teacher labels massive real imagery, and the students train on those pseudo-labels — inheriting synthetic precision while seeing real-image statistics. Schematically: synthetic labels → big teacher → pseudo-labeled real images → students.
- **Full model family.** Models range from 25M to 1.3B parameters to support extensive scenarios; metric-depth variants come from fine-tuning with metric labels.
- **Better evaluation.** Citing "limited diversity and frequent noise in current test sets", the authors also built a versatile evaluation benchmark with precise annotations and diverse scenes.

## Results & impact

- Compared with the latest Stable-Diffusion-based estimators (e.g., Marigold-style models), V2 is "significantly more efficient (more than 10x faster) and more accurate" (abstract) — foundation-model quality at discriminative-model speed.
- Depth maps are visibly finer and more robust than V1's, especially at edges and on transparent/reflective surfaces, and it quickly became a default monocular depth backbone in SLAM and reconstruction systems (venue: NeurIPS 2024).
- The synthetic-data-first recipe reshaped how the community sources supervision for geometric tasks: precision from rendering, realism from pseudo-labeled real data.

## Why it matters for SLAM

Sharp, edge-preserving depth matters directly for SLAM: crisp object boundaries mean cleaner TSDF/Gaussian maps and less depth bleeding across silhouettes, and the small variants run in real time on modest hardware. When a modern dense SLAM paper says "we use a monocular depth prior", it very often means Depth Anything V2 — making its failure modes and its relative-vs-metric distinction essential working knowledge.

## Related

- [Depth Anything](depth-anything.md)
- [Marigold](marigold.md)
- [Metric3D](metric3d.md)
- [MiDaS](midas.md)
- [Align3R](align3r.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
