# ACE-G

> Bruns 2025 · [Paper](https://arxiv.org/abs/2510.11605)

**One-line summary** — Splits scene coordinate regression into a scene-agnostic cross-attention regressor and a scene-specific "map code", pre-training the regressor on tens of thousands of scenes with an explicit mapping-to-query objective so relocalization generalizes to query conditions unseen during mapping (ICCV 2025).

## Problem

After minutes of scene-specific training, SCR models estimate camera poses of query images with high accuracy — yet they still fall short of the generalization of classical feature-matching approaches. When imaging conditions of query images (lighting, viewpoint) differ too much from the training views, SCR models fail. This is an *inherent* limitation of previous SCR frameworks: their training objective is to encode the training views in the weights of the coordinate regressor itself, so the regressor overfits to the training views *by design*.

## Method & architecture

ACE consists of a scene-agnostic convolutional image encoder plus a scene-specific MLP head. ACE-G replaces that MLP with a *scene-agnostic coordinate regressor* $f_\theta$ conditioned on a *scene-specific map code* $\mathcal{C} = \{\mathbf{c}_i \in \mathbb{R}^{D_\text{map}}\}$:

$$f_\theta : \mathbb{R}^{D_\text{feat}} \times \mathcal{P}\big(\mathbb{R}^{D_\text{map}}\big) \to \mathbb{R}^3, \qquad (\mathbf{e}, \mathcal{C}) \mapsto \mathbf{y},$$

where $\mathbf{e}$ is a patch embedding from a DINOv2 image encoder and $\mathbf{y}$ the predicted scene coordinate. The regressor is a stack of $N$ cross-attention-only transformer blocks — patch embeddings act as query tokens, the map embeddings as keys/values (no positional encodings, so the map code is permutation-invariant) — followed by a 2-layer MLP that outputs $\mathbf{y}$ and a Laplace uncertainty $\sigma_y$.

**Mapping/query pre-training.** The training set is a collection of tuples of *mapping* buffers $\mathcal{M}_i$ and disjoint *query* buffers $\mathcal{Q}_i$ (different viewpoints, lighting, object placement) with ground-truth coordinates. Training alternates two kinds of iterations:

- *Mapping iterations* jointly optimize the network $\theta$ and the map codes $\mathcal{G}$ on mapping buffers, using a Laplace negative log-likelihood:

$$\theta^\ast, \mathcal{G}^\ast = \arg\min_{\theta, \mathcal{G}} \; \mathbb{E}_{\mathcal{M}}\left[ \log\tilde{\sigma}_{y} + \sqrt{2}\,\frac{\lVert \tilde{\mathbf{y}} - \mathbf{y} \rVert}{\tilde{\sigma}_{y}} \right]$$

- *Query iterations* minimize the same loss on query buffers but update **only** $\theta$, with map codes frozen — explicitly forcing the regressor to generalize from mapping data (stored in the map codes) to unseen query views.

The network is updated only in every 10th iteration (map codes in the other 9), and scenes are repeatedly re-mapped from scratch from an active pool to avoid overfitting to particular map codes. Pre-training uses tens of thousands of scans: ScanNet (1201), ScanNet++ (199), ARKitScenes (4520), MapFree (2×400), BlendedMVS (462) and WildRGBD (22359).

**New scene mapping.** Only a randomly-initialized map code is optimized, minimizing the uncertainty-weighted NLL of the *2D reprojection error* $\log\tilde{\sigma}_{x} + \sqrt{2}\,\lVert \tilde{\mathbf{x}} - \mathbf{x} \rVert / \tilde{\sigma}_{x}$ — so no ground-truth 3D is needed at mapping time, and mapping still takes minutes as in ACE.

**Relocalization.** A single forward pass yields 2D-3D correspondences with uncertainties; correspondences are prefiltered with an adaptive threshold $\sigma_\text{thresh} = f \cdot Q_p(\Sigma)$ (lowest $p$-quantile of uncertainties, $p{=}0.1$, $f{=}2.0$) and passed to PnP + RANSAC — the same output interface as classic SCR.

## Results

- **Indoor-6** (% of frames within 5°/25 cm, median cm/°, averaged over scenes): in the 5-minute-mapping group ACE-G scores **95 / 4.5 / 0.8** vs DINO-ACE (ACE head on DINOv2 features) 91 / 5.6 / 1.0 and original ACE 70 / 11.0 / 1.8 — so both the DINOv2 features and the query-pretrained regressor contribute. With 25 min of mapping, ACE-G reaches 96 / 3.7 / 0.7, on par with GLACE (93 / 3.5 / 0.6), with a 12 MB map vs ~5 GB for MASt3R+Kapture (94 / 2.5 / 0.5, 5–10 h mapping).
- **RIO10** (rescanned scenes with changed object arrangements; avg median error): ACE-G 41.1 cm / 13.8° vs DINO-ACE 83.8 / 15.9 and ACE 358.4 / 58.7 — median error stays below 1 m on every scene, while MASt3R fails to pose >50% of images on some scenes.
- **Cambridge Landmarks** (outdoor, out-of-distribution w.r.t. the indoor-heavy pre-training): ACE-G (25.3 cm / 0.4° avg) improves notably over DINO-ACE but trails GLACE (13.5 cm / 0.3°) and is slightly worse than ACE — the honest limit of current pre-training coverage.

## Why it matters for SLAM

The SCR lineage has been steadily removing deployment costs: DSAC made SCR trainable end-to-end, ACE cut per-scene training to minutes, ACE Zero removed the need for known poses, and ACE-G attacks the remaining weakness — the by-design overfitting of the scene-specific regressor. Generalizable relocalization matters for consumer AR and robotics at fleet scale, where per-scene optimization is operationally expensive. It also parallels the broader Level 5 trend of replacing per-scene optimization with feed-forward inference from large pretrained models.

## Related

- [ACE](ace.md)
- [ACE Zero](ace-zero.md)
- [DSAC\*](dsac-star.md)
- [ACE-SLAM](ace-slam.md)
