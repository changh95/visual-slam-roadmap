# NICER-SLAM

> Zhu 2024 · [Paper](https://arxiv.org/abs/2302.03594)

**One-line summary** — An RGB-only neural implicit SLAM system that jointly optimises camera poses and a hierarchical SDF map, replacing the missing depth sensor with monocular depth/normal priors, optical flow, and a warping loss — reconstruction competitive with RGB-D systems.

## Problem

Neural implicit SLAM systems "either rely on RGB-D sensors, or require a separate monocular SLAM approach for camera tracking and do not produce high-fidelity dense 3D scene reconstruction" (abstract). RGB-only SLAM is harder for three reasons the paper spells out: depth ambiguity (many correspondences match the colours, especially without texture), less localised surface estimation, and a less constrained, slower-converging optimisation. The question posed: can a *unified* dense SLAM system use one neural implicit representation for both tracking and mapping from a monocular RGB video?

## Method & architecture

**Hierarchical SDF + colour representation.** A coarse dense voxel grid ($32^3$, 32-dim features) with a small MLP $f^{\text{coarse}}$ gives a base SDF; multi-resolution fine grids ($L=8$ levels, resolutions $R_l = \lfloor R_{\min} b^{l} \rfloor$ geometrically spaced from $R_{\min}=32$ to $R_{\max}=128$) with $f^{\text{fine}}$ predict a residual, so the final SDF is

$$\hat{s} = s^{\text{coarse}} + \Delta s.$$

Colour uses its own multi-resolution grid ($L=16$, up to $R_{\max}=2048$) and decoder $\hat{\mathbf{c}} = f^{\text{color}}\bigl(\mathbf{x}, \hat{\mathbf{n}}, \gamma(\mathbf{v}), \mathbf{z}^{\text{coarse}}, \mathbf{z}^{\text{fine}}, \{\Phi^{\text{color}}_l(\mathbf{x})\}\bigr)$, conditioned on the SDF-derived normal $\hat{\mathbf{n}}$ and view direction $\mathbf{v}$.

**Volume rendering with locally adaptive SDF-to-density.** SDF samples become densities via the VolSDF transform $\sigma_\beta(s)$ (scaled exponential for $s\le 0$, $\frac{1}{\beta}\bigl(1-\frac{1}{2}\exp(-\frac{s}{\beta})\bigr)$ for $s>0$), then colour/depth/normal are alpha-composited: $\hat{C} = \sum_{i=1}^{N} T_i \alpha_i \hat{\mathbf{c}}_i$ with $\alpha_i = 1-\exp(-\sigma_i\delta_i)$, $T_i = \prod_{j=1}^{i-1}(1-\alpha_j)$. Instead of VolSDF's single global $\beta$, a per-voxel ($64^3$) sample counter $T_p$ sets sharpness locally:

$$\beta = c_0 \cdot \exp(-c_1 \cdot T_p) + c_2,$$

so well-observed regions render crisp surfaces while barely-seen ones stay soft.

**Losses replace the depth sensor.** Mapping minimises

$$\mathcal{L} = \mathcal{L}_{\text{rgb}} + 0.5\,\mathcal{L}_{\text{warp}} + 0.001\,\mathcal{L}_{\text{flow}} + 0.1\,\mathcal{L}_{\text{depth}} + 0.05\,\mathcal{L}_{\text{normal}} + 0.1\,\mathcal{L}_{\text{eikonal}},$$

where $\mathcal{L}_{\text{warp}}$ compares each pixel's colour with its reprojection into nearby keyframes through the rendered depth; $\mathcal{L}_{\text{flow}}$ matches induced correspondences to GMFlow optical flow; the monocular depth loss is scale/shift invariant, $\mathcal{L}_{\text{depth}} = \sum_{\mathbf{r}} \lVert (w\hat{D}(\mathbf{r})+q) - \bar{D}(\mathbf{r})\rVert^2$ with $w,q$ solved per image in closed form; $\mathcal{L}_{\text{normal}}$ imposes L1 + angular consistency with predicted monocular normals; and the Eikonal term $\sum_{\mathbf{x}}(\lVert\nabla\hat{s}(\mathbf{x})\rVert_2 - 1)^2$ regularises the SDF.

**System.** Mapping runs every 5 frames in three stages (coarse only; + fine grids after 25% of iterations; local BA after 75%, jointly optimising poses of half of $K=16$ selected frames), sampling $M=8096$ rays. Tracking runs every frame in parallel, optimising only the current pose with the RGB loss over $M_t=1024$ pixels for 100 iterations. Per-iteration cost: 496 ms mapping, 147 ms tracking on an A100. Meshes come from marching cubes at $512^3$.

## Results

- **Replica reconstruction**: avg Accuracy 3.65 cm, Completion 4.16 cm, Completion Ratio 79.37%, Normal Consistency 90.27% — far ahead of the RGB baselines DROID-SLAM (5.50 / 12.29 cm, 63.62%) and COLMAP (8.69 / 12.12 cm, 67.62%), and on par with RGB-D NICE-SLAM (3.87 / 3.87 cm, 82.41%).
- **Replica tracking (ATE RMSE)**: 1.88 cm avg — on par with RGB-D NICE-SLAM (1.95 cm) without any depth input, though DROID-SLAM remains far more accurate (0.33 cm; 0.70 cm without final global BA/loop closure).
- **Novel view synthesis (Replica)**: extrapolated views 23.93 dB PSNR / 0.857 SSIM / 0.201 LPIPS, beating even the RGB-D systems NICE-SLAM (23.26 dB) and Vox-Fusion (21.98 dB); interpolated 25.41 dB.
- **7-Scenes** (low-res, motion-blurred real data): tracking 8.55 cm avg vs DROID-SLAM 5.66 cm, but more robust than COLMAP (11.14) and DROID-SLAM without global BA (10.87), and visibly sharper reconstructions; monocular priors carry it through the textureless/reflective pumpkin scene where those baselines fail.
- Ablations: removing the monocular depth or normal loss degrades both mapping and tracking significantly — the priors, not the RGB loss, are what disambiguate the optimisation.

## Why it matters for SLAM

NICER-SLAM showed that unified neural implicit SLAM does not fundamentally depend on depth sensors: priors from monocular depth/normal networks plus flow and warping consistency can substitute for direct depth supervision, at the cost of tracking accuracy versus specialised odometry. This broadened dense neural SLAM to plain monocular cameras, and its recipe — monocular geometric cues, flow consistency, locally adaptive SDF rendering — reappears throughout later RGB-only neural and Gaussian SLAM systems such as MonoGS.

## Related

- [NICE-SLAM](nice-slam.md)
- [NeRF-SLAM](nerf-slam.md)
- [MonoGS](monogs.md)
- [DPT](dpt.md)
- [MiDaS](midas.md)
- [RAFT](raft.md)
