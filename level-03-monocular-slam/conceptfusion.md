# ConceptFusion

> Jatavallabhula (MIT) 2023 · [Paper](https://arxiv.org/abs/2302.07241)

**One-line summary** — Fuses pixel-aligned foundation-model features (CLIP, AudioCLIP) into dense SLAM point maps with the same weighted-averaging used for depth and color, yielding zero-shot open-vocabulary and multimodal (text / image / click / audio) queries over 3D maps without any training or finetuning.

## Problem

Most approaches that attach semantics to 3D maps are closed-set: they reason only over a finite label set fixed at training time, and the map can be queried only with class labels or, at best, text. Foundation models understand open-set concepts across modalities but consume whole images and emit a *single* image-level vector — no pixel alignment — while models finetuned for pixel alignment (LSeg, OpenSeg) *forget* long-tailed concepts during finetuning: their backbone CLIP knows "diet coke" and "lysol", but the finetuned versions can no longer retrieve them. ConceptFusion asks how to get pixel-aligned, forgetting-free open-set features into a 3D map, zero-shot.

## Method & architecture

- **Map representation**: an unordered point set; point $k$ stores position $\overline{v}_k\in\mathbb{R}^3$, normal $\overline{n}_k$, confidence count $\bar{c}_k$, optional color, and a concept vector $f^{P}_k$. The system is built on the gradSLAM implementation of PointFusion dense SLAM; odometry and mapping run at frame rate (15 Hz), feature extraction offline (10-15 s/image on an RTX 3090).
- **Pixel-aligned features (the core contribution)**: for image $X$, a class-agnostic instance segmenter (Mask2Former or SAM) proposes $R$ regions. The global embedding is $f^{G}=\mathcal{F}(X)$; each region's bounding box gives a local embedding $f^{L}_i=\mathcal{F}(\mathrm{bbox}(r_i))$. Each region's feature mixes global context and local detail, weighted by how typical the region is: cosine similarity to the global feature $\phi_i=\langle f^{L}_i, f^{G}\rangle$ and average similarity to the other regions $\bar{\varphi}_i=\frac{1}{R}\sum_{j\neq i}\varphi_{ij}$ combine in a softmax

$$w_i=\frac{\exp\big((\phi_i+\bar{\varphi}_i)/\tau\big)}{\sum_{i=1}^{R}\exp\big((\phi_i+\bar{\varphi}_i)/\tau\big)}, \qquad f^{P}_i = w_i f^{G} + (1-w_i) f^{L}_i$$

with $\tau=1$; $f^{P}_i$ is normalized and assigned to the pixels of $r_i$. No finetuning means no forgetting — the unmodified CLIP feature space is preserved.
- **Multi-view fusion into 3D**: exactly the logic used for depth/color. For each pixel with a corresponding map point:

$$f^{P}_{k,t} \leftarrow \frac{\bar{c}_k f^{P}_{k,t-1} + \alpha f^{P}_{u,v,t}}{\bar{c}_k + \alpha}, \qquad \bar{c}_k \leftarrow \bar{c}_k + \alpha$$

where $\alpha=e^{-\gamma^{2}/2\sigma^{2}}$ weights by normalized radial distance $\gamma$ from the camera center ($\sigma=0.6$).
- **Querying**: per-point score $s_k=\langle f_k, q_{\text{mode}}\rangle$ (cosine similarity), where $q_{\text{mode}}$ comes from the matching encoder — CLIP text encoder, image-level CLIP embedding, AudioCLIP for sound, or simply the fused feature at a clicked point. Thresholding/NMS/clustering yield 3D regions of interest.
- **3D spatial comparators**: composable modules (HowFar, IsToTheLeft/Right, OnTopOf, Under) over query results; an LLM optionally parses "how far is the refrigerator from the television" into howFar over the two query terms.

## Results

- **UnCoCo** (new dataset: 78 tabletop objects, 20 RGB-D sequences, 12,075 frames, >500K queries across modalities). Structured text queries: 3D mIoU **0.446** vs OpenSeg-3D 0.289, LSeg-3D 0.128, MaskCLIP-3D 0.091 (acc@IoU0.25: 69.44% vs 36.11%). Unstructured text: 0.378 vs 0.153. Image queries: 0.331 vs 0.134 (LSeg-3D). Audio queries: 64.29% / 66.67% accuracy (source-ambiguous / ecological) vs 23.81% / 22.22% for a privileged AudioCLIP baseline.
- **Open-set semantic segmentation**: ScanNet mAcc 0.63 / f-mIoU 0.58 — far above the zero-shot MaskCLIP (0.24/0.28) and competitive with privileged finetuned LSeg (0.70/0.63); SemanticKITTI 0.79/0.78. The abstract's headline: retains long-tailed concepts "by more than 40% margin on 3D IoU" over supervised approaches.
- **Ablations** (ScanNet): global-CLIP-only 0.35/0.48, local-only 0.43/0.33, without the uniqueness term 0.55/0.46, full 0.63/0.58; swapping Mask2Former for SAM lifts Replica scores from 24.16/31.31 to 31.53/38.70.
- **3D spatial reasoning** (100 ScanRefer queries): distance 84%, relative position 76%, support 96%, containment 72% — the 2.5D single-image baseline collapses on distance (32%) and relative position (28%) since the referenced objects were never co-observed.
- **Real robots**: zero-shot tabletop rearrangement with a UR5e ("push baymax to the right"), and text-driven autonomous navigation on a drive-by-wire vehicle over a 4,000 m² urban map (LeGO-LOAM localization, open-set text goals like "football field").
- Stated limitations: memory (high-dimensional embedding per point over millions of points), foreground-centric features lacking compositionality/negation, and inherited foundation-model biases.

## Why it matters for SLAM

ConceptFusion pioneered open-set multimodal 3D mapping and established the now-standard paradigm: 2D foundation-model features + classical multi-view fusion, no 3D training at all. It is a key bridge between classical SLAM and Spatial AI — the same map that localizes the robot answers "where is something I can use to open this bottle?". Its memory cost (a full embedding per point) is precisely the problem later systems attack: LERF/LEGS with implicit feature fields, OpenGS-SLAM with discrete labels, ConceptGraphs with object-level nodes.

## Related

- [LERF](lerf.md)
- [OpenScene](openscene.md)
- [LEGS](legs.md)
- [ConceptGraphs](../level-05-deep-learning/conceptgraphs.md)
- [CLIP](../level-11-world-models-spatial-ai/clip.md)
- [Foundation models](../level-05-deep-learning/foundation-models.md)
