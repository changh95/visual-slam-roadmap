# Point-SLAM

> Sandström 2023 · [Paper](https://arxiv.org/abs/2304.04278)

**One-line summary** — Anchors neural features in a dynamically growing point cloud rather than fixed grids, adapting representation density to scene detail for efficient dense neural SLAM.

## Problem

Grid-based neural SLAM (NICE-SLAM, Vox-Fusion) anchors scene features in a sparse grid at resolutions fixed in advance and uniform in space: memory is wasted on empty or featureless regions while detailed areas may be under-resolved, and scene bounds must be specified beforehand. Point-SLAM instead anchors the features of the neural scene representation "in a point cloud that is iteratively generated in an input-dependent, data-driven manner" (abstract), so representation capacity follows the information density of the input — the paper's driving question: can point-based neural scene representations serve *both* tracking and mapping in real-time-capable SLAM?

## Method & architecture

**Neural point cloud**: $P=\{(p_i, f^{g}_i, f^{c}_i)\mid i=1,\dots,N\}$ — each point carries a geometric and a colour feature descriptor in $\mathbb{R}^{32}$. During each mapping phase, $X$ uniformly sampled pixels plus $Y$ pixels from the top-$5Y$ colour-gradient pixels are unprojected using the sensor depth; if no existing point lies within search radius $r$, three points are added along the ray at depths $(1-\rho)D$, $D$, $(1+\rho)D$ (a depth-noise-aware update band). The cloud grows with exploration but converges to a bounded set — no scene bounds needed.

**Dynamic resolution**: the search radius shrinks where image texture is high, via a clamped linear map of the colour gradient magnitude $\nabla I(u,v)$:

$$r(u,v)=\begin{cases}r_l & \text{if }\nabla I(u,v)\geq g_u\\ \beta_1\nabla I(u,v)+\beta_2 & \text{if } g_l\leq\nabla I(u,v)\leq g_u\\ r_u & \text{if }\nabla I(u,v)\leq g_l\end{cases}$$

so fine detail gets dense points while flat regions are compressed ($g_l=0.01$, $g_u=0.15$ in practice).

**Rendering**: because points exist only near surfaces, just 5 samples per ray between $(1-\rho)D$ and $(1+\rho)D$ suffice — versus 48 for NICE-SLAM, which must carve free space. Occupancy and colour are decoded as $\mathrm{o}_i=h(x_i,P^{g}(x_i))$ and $\mathbf{c}_i=g_\xi(x_i,P^{c}(x_i))$ (NICE-SLAM's architecture; the geometric decoder is pre-trained and frozen), where features are aggregated from the 8 nearest neighbours within $2r$ by inverse-squared-distance weighting:

$$P^{g}(x_i)=\sum_k \frac{w_k}{\sum_k w_k} f^{g}_k \quad\text{with}\quad w_k=\frac{1}{\|p_k-x_i\|^{2}},$$

colour features passing first through a small relative-position MLP $F_\theta$. Ray termination weights $\alpha_i=\mathrm{o}_{\mathbf{p}_i}\prod_{j=1}^{i-1}(1-\mathrm{o}_{\mathbf{p}_j})$ give rendered depth $\hat{D}=\sum_i\alpha_i z_i$, colour $\hat{I}=\sum_i\alpha_i\mathbf{c}_i$, and depth variance $\hat{S}_D$.

**Mapping and tracking** share this one representation. Mapping minimises $\mathcal{L}_{map}=\sum_m |D_m-\hat{D}_m|_1+\lambda_m|I_m-\hat{I}_m|_1$ over features and colour-decoder weights (depth-only for the first 40% of iterations), with keyframe pixels regularising as in NICE-SLAM and mapping iterations scaled adaptively by the number of newly added points. Tracking optimises $\{\mathbf{R},\mathbf{t}\}$ from a constant-speed initialisation with the variance-normalised loss

$$\mathcal{L}_{track}=\sum_{m=1}^{M_t}\frac{|D_m-\hat{D}_m|_1}{\sqrt{\hat{S}_D}}+\lambda_t |I_m-\hat{I}_m|_1.$$

A per-image latent fed to a shared exposure MLP outputs an affine colour correction for exposure-varying scenes.

## Results

- **Replica reconstruction (avg of 8 scenes)**: Depth L1 0.44 cm and F1 89.77% (precision 96.99, recall 83.59, 1 cm threshold) — vs NICE-SLAM 2.97 cm / 43.86%, Vox-Fusion* 2.46 / 52.20%, and ESLAM 1.18 cm Depth L1.
- **Replica tracking**: average ATE RMSE 0.52 cm vs ESLAM 0.63, Vox-Fusion* 3.09, NICE-SLAM 1.06.
- **ScanNet tracking (10 scenes)**: average ATE RMSE 10.08 cm vs NICE-SLAM 10.58 and Vox-Fusion* 18.90; rendering and mesh quality on TUM RGB-D and ScanNet are qualitatively sharper than NICE-SLAM (metrics: PSNR/SSIM/LPIPS rendered every 5th frame, averaged over 3 seeds).
- **Cost**: mapping ~9.2 s/frame at default settings; the adaptive-iteration scheme can cut this to 2.36 s (+406% speed) with only ~10% tracking, 23% depth-L1, 3% F-score, 6% PSNR degradation. Accuracy comes at heavier per-frame optimisation than Co-SLAM/ESLAM.

## Why it matters for SLAM

Point-SLAM brought adaptive density control to neural implicit SLAM: representation capacity goes where the scene needs it, instead of being wasted on empty space — and with no free-space carving, ray sampling collapses from dozens of samples to five. It bridged classical point-cloud mapping with neural implicit methods and achieved among the best reconstruction quality of the NeRF-style SLAM generation. The idea of an explicit, adaptively densified set of feature-carrying primitives foreshadowed 3D Gaussian Splatting SLAM.

## Related

- [NICE-SLAM](nice-slam.md)
- [Co-SLAM](co-slam.md)
- [ESLAM](eslam.md)
- [SplaTAM](splatam.md)
- [iMAP](imap.md)
