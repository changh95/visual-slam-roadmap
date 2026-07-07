# LERF

> Kerr 2023 · [Paper](https://arxiv.org/abs/2303.09553)

**One-line summary** — Language Embedded Radiance Fields ground CLIP features inside a NeRF via volume rendering, enabling pixel-aligned, zero-shot 3D queries from open-ended natural-language prompts.

## Problem

Humans refer to 3D locations through language covering "a vast range of properties: visual appearance, semantics, abstract associations, or actionable affordances" — "the yellow mug", "something to write with". CLIP can score such prompts against *images*, but it is "inherently a global image embedding and not conducive to pixel-aligned feature extraction": one embedding per crop, no 3D structure. Prior open-vocabulary 3D work leaned on region proposals, masks, or fine-tuned detectors (LSeg, OWL-ViT), restricting queries to categories those detectors were trained on. LERF asks how to ground *raw* CLIP embeddings volumetrically in a NeRF so arbitrary language resolves to 3D locations.

## Method & architecture

- **A field over volumes, not points.** Querying CLIP at a single 3D point is ambiguous, so LERF learns a field $F_{\mathrm{lang}}(\vec{x}, s) \in \mathbb{R}^{d}$ over *volumes*: position $\vec{x}$ plus a physical scale $s$ (side length of a cube centered at $\vec{x}$). The output is defined as the average CLIP embedding, across training views, of image crops containing that volume. The field is view-independent, so multiple views average into the same embedding.
- **Volume rendering of language.** Along a ray $\vec{r}(t) = \vec{o} + t\vec{d}$, the scale grows with distance, $s(t) = s_{\mathrm{img}} \cdot f_{xy} / t$ (a frustum), and embeddings are composited with the standard NeRF weights $w(t)$ from $T(t) = \int_t \exp(-\sigma(s)\,ds)$, $w(t) = \int_t T(t)\,\sigma(t)\,dt$:

$$\hat{\phi}_{\mathrm{lang}} = \int_t w(t)\, F_{\mathrm{lang}}\big(r(t), s(t)\big)\, dt, \qquad \phi_{\mathrm{lang}} = \hat{\phi}_{\mathrm{lang}} \big/ \lVert \hat{\phi}_{\mathrm{lang}} \rVert .$$

- **Multi-scale CLIP supervision.** A precomputed image pyramid of CLIP embeddings over crops (scales $s_{\min}=0.05$ to $s_{\max}=0.5$ in 7 steps, 50% overlap) supervises each rendered frustum; ground truth $\phi_{\mathrm{lang}}^{\mathrm{gt}}$ is trilinearly interpolated from the 4 nearest crops at the two adjacent scales. The loss maximizes cosine similarity:

$$L_{\mathrm{lang}} = -\lambda_{\mathrm{lang}}\, \phi_{\mathrm{lang}} \cdot \phi_{\mathrm{lang}}^{\mathrm{gt}}, \qquad \lambda_{\mathrm{lang}} = 0.01 .$$

- **DINO regularization.** A second head $F_{\mathrm{dino}}(\vec{x})$ predicts pixel-aligned DINO features (MSE loss, no scale input). DINO is never used at inference; sharing a backbone with the CLIP head regularizes the language field, fixing patchy, outlier-prone relevancy maps in sparsely viewed regions.
- **Two separate hashgrids.** Language optimization "should not influence the distribution of density": one multi-resolution hashgrid (Instant-NGP style, 32 levels, table size $2^{21}$) feeds CLIP/DINO MLPs; a separate Nerfacto field handles color/density. $L_{\mathrm{lang}}$ and $L_{\mathrm{dino}}$ gradients never touch the NeRF outputs.
- **Querying.** A text prompt $\phi_{\mathrm{quer}}$ is scored against canonical phrases ("object", "things", "stuff", "texture") via a pairwise softmax relevancy score

$$\min_i \; \frac{\exp(\phi_{\mathrm{lang}} \cdot \phi_{\mathrm{quer}})}{\exp(\phi_{\mathrm{lang}} \cdot \phi_{\mathrm{canon}}^{i}) + \exp(\phi_{\mathrm{lang}} \cdot \phi_{\mathrm{quer}})},$$

  and the scale $s$ is auto-selected by sweeping 0–2 m in 30 increments and keeping the highest-scoring one. Samples seen by fewer than 5 training views are discarded.

## Results

- **Setup**: 13 in-the-wild handheld scenes (grocery store, kitchen, bookstore, teatime, figurines...) captured with Polycam on an iPhone at 994×738; OpenCLIP ViT-B/16 (LAION-2B); 30k steps ≈ 45 min on one A100 (~20 GB), usable results at 6k steps (8 min); querying is interactive/real-time in the Nerfstudio viewer.
- **Localization** (72 labeled objects across 5 scenes; success = highest-relevancy pixel inside the ground-truth box): LERF **80.3%** overall vs. OWL-ViT 54.8% and LSeg distilled into 3D (DFF) 18.0%. Per scene: waldo_kitchen 81.5/42.6/13.0, bouquet 91.7/66.7/50.0, teatime 93.8/75.0/28.1, figurines 79.5/38.5/8.9 (LERF/OWL-ViT/LSeg); OWL-ViT wins only on ramen (92.5 vs 62.5).
- **Existence determination** (81 long-tail queries over 5 scenes): precision–recall curves show LSeg matches LERF only on in-distribution COCO labels and collapses on long-tail queries.
- **Ablations**: removing DINO degrades relevancy-map smoothness and boundaries; single-scale training (fixed 15% crop) fails on both large-context ("espresso machine") and small ("creamer pods") queries.
- **Limitations**: CLIP bag-of-words behavior ("not red" ≈ "red"), false positives on visually similar objects (zucchini vs other green vegetables), needs calibrated NeRF-quality multi-view capture.

## Why it matters for SLAM

LERF established the paradigm of embedding vision-language features directly into a 3D scene representation — the semantic layer of Spatial AI: maps you can *talk to*. It directly inspired language-embedded Gaussian splatting (LEGS, LangSplat) and complements fusion-style approaches like ConceptFusion; its multi-scale CLIP + DINO recipe became the default for distilling 2D vision-language features into 3D fields. For robotics, "find something to write with" resolved to a 3D location is exactly what turns a SLAM map into an actionable world model.

## Related

- [LEGS](legs.md)
- [ConceptFusion](conceptfusion.md)
- [OpenScene](openscene.md)
- [NeRF](nerf.md)
- [CLIP](../level-11-world-models-spatial-ai/clip.md)
