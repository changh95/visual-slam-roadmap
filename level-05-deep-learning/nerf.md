# NeRF

> Mildenhall 2020 · [Paper](https://arxiv.org/abs/2003.08934)

**One-line summary** — Represents a scene as a continuous function in an MLP — 3D position plus viewing direction mapping to color and density — rendered with differentiable volume rendering, producing photorealistic novel views from posed images.

## Problem

Novel view synthesis — rendering a complex scene from viewpoints never photographed — had long been attacked with explicit representations (meshes, voxel grids, multi-plane images), which either discretize the scene, cap the achievable resolution through poor time/space scaling, or fail on complicated geometry and view-dependent appearance. NeRF asks whether a scene can instead be stored as a *continuous* volumetric function, optimized directly from a sparse set of input views, with nothing more than photometric supervision through a differentiable renderer.

## Method & architecture

**Representation.** A single fully-connected (non-convolutional) MLP $F_{\Theta}: (\mathbf{x}, \mathbf{d}) \to (\mathbf{c}, \sigma)$ maps a 5D coordinate — location $(x,y,z)$ plus viewing direction — to volume density $\sigma$ and view-dependent RGB radiance $\mathbf{c}$. Architecturally, 8 fully-connected layers (256 channels, ReLU) process $\gamma(\mathbf{x})$ and output $\sigma$ plus a 256-d feature; the feature concatenated with $\gamma(\mathbf{d})$ passes through one 128-channel layer to give RGB. Predicting $\sigma$ from position only enforces multiview-consistent geometry.

**Differentiable volume rendering.** The color of camera ray $\mathbf{r}(t) = \mathbf{o} + t\mathbf{d}$ is the classic volume-rendering integral,

$$C(\mathbf{r}) = \int_{t_n}^{t_f} T(t)\,\sigma(\mathbf{r}(t))\,\mathbf{c}(\mathbf{r}(t), \mathbf{d})\,dt, \qquad T(t) = \exp\Big(-\int_{t_n}^{t} \sigma(\mathbf{r}(s))\,ds\Big),$$

estimated by quadrature over stratified samples $t_i$ (one uniform draw per bin, so the MLP is queried at continuous positions):

$$\hat{C}(\mathbf{r}) = \sum_{i=1}^{N} T_i\,\big(1 - e^{-\sigma_i \delta_i}\big)\,\mathbf{c}_i, \qquad T_i = \exp\Big(-\sum_{j=1}^{i-1} \sigma_j \delta_j\Big), \quad \delta_i = t_{i+1} - t_i .$$

**Positional encoding.** Raw $xyz\theta\phi$ inputs make the MLP smooth away high frequencies, so each coordinate is lifted by $\gamma(p) = \big(\sin(2^0 \pi p), \cos(2^0 \pi p), \ldots, \sin(2^{L-1}\pi p), \cos(2^{L-1}\pi p)\big)$ with $L{=}10$ for $\mathbf{x}$ and $L{=}4$ for $\mathbf{d}$ — a small trick that proved essential.

**Hierarchical sampling.** A coarse and a fine network are optimized together: the coarse network's compositing weights $w_i = T_i(1 - e^{-\sigma_i\delta_i})$, normalized into a piecewise-constant PDF, guide inverse-transform sampling of $N_f$ extra points near surfaces ($N_c{=}64$, $N_f{=}128$).

**Training.** Loss is the total squared error between rendered and true pixel colors for both coarse and fine renders, over batches of 4096 rays; Adam with lr $5\times 10^{-4}$ decayed to $5\times 10^{-5}$; 100–300k iterations per scene (about 1–2 days on a V100). Real-scene camera poses come from COLMAP.

## Results

- Table 1 (PSNR/SSIM/LPIPS): on Realistic Synthetic 360° NeRF scores 31.01 / 0.947 / 0.081 vs LLFF 24.88, NV 26.05, SRN 22.26; on Real Forward-Facing 26.50 / 0.811 / 0.250 vs LLFF 24.13 / 0.798 / 0.212 (LLFF slightly better only on that LPIPS); on Diffuse Synthetic 360° 40.15 vs LLFF 34.38.
- Ablations (Realistic Synthetic): removing positional encoding drops PSNR to 28.77, removing view dependence to 27.66, and a minimalist model without either plus no hierarchy reaches 26.67; with only 25 input images NeRF still beats NV, SRN, and LLFF given 100.
- Storage/time trade-off: 5 MB of network weights per scene vs over 15 GB for one LLFF scene (a ~3000× relative compression), at the cost of ≥12 h training per scene.

## Why it matters for SLAM

NeRF is the foundational work behind the entire neural-implicit SLAM wave: iMAP, NICE-SLAM, Co-SLAM, and NeRF-SLAM all use radiance-field-style map representations optimized online, and the differentiable rendering loss doubles as a tracking objective (invert the renderer to get the camera pose). Even after 3D Gaussian Splatting displaced NeRF for real-time rendering, the core ideas — scene as an optimizable field, photometric supervision through a differentiable renderer, positional-encoding-style input lifting — remain the conceptual basis of modern dense neural mapping.

## Related

- [iMAP](imap.md) — first NeRF-style SLAM system
- [NICE-SLAM](nice-slam.md) — hierarchical feature-grid successor
- [NeRF-SLAM](nerf-slam.md) — radiance fields fused with DROID-SLAM tracking
- [BARF](barf.md) — joint pose and NeRF optimization
- [Co-SLAM](co-slam.md) — joint coordinate/parametric encoding for real-time neural SLAM
