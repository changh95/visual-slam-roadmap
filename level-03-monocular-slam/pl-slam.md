# PL-SLAM

> Pumarola 2017 · [Paper](https://www.albertpumarola.com/research/pl-slam/index.html)

**One-line summary** — Extends ORB-SLAM with line segment features alongside points — lines parameterised by their 3D endpoints so they plug into the point machinery — plus a novel line-only map initialisation, for robust monocular SLAM in low-texture man-made environments.

## Problem

Low-textured scenes are "one of the main Achilles heels" of point-based geometric vision: ORB-SLAM is prone to fail on poorly textured video or when feature points temporarily vanish due to motion blur — situations common in man-made scenarios. Such scenes still contain reliable line-based primitives (city scenes, "Manhattan worlds"), but line detectors and parameterisations are less established than point ones, pose-from-lines is less reliable and sensitive to partial occlusion, and standard SLAM cannot even bootstrap its map without point correspondences.

## Method & architecture

PL-SLAM keeps ORB-SLAM's three-thread architecture — Tracking, Local Mapping, Loop Closing — and threads line operations through detection, triangulation, matching, culling, relocalisation, and optimisation. Loop *detection* remains point-only, since matching lines across the whole map is too expensive.

- **Detection & matching**: LSD extracts segments in $O(n)$; lines are matched to map lines with a relational-graph strategy combining Line Band Descriptors (LBD) appearance with pairwise geometric consistency. Lines seen from fewer than 3 viewpoints, or in under 25% of the frames where they should be visible, are culled.
- **Endpoint parameterisation & line reprojection error**: following Vakhitov et al., a 3D line is its endpoints $P,Q\in\mathbb{R}^3$. From detected homogeneous 2D endpoints $p^h_d,q^h_d$ the normalised line coefficients are $l=\frac{p^h_d\times q^h_d}{\lVert p^h_d\times q^h_d\rVert}$, and the line reprojection error is the sum of point-to-line distances of the projected endpoints:

$$E_{line}(P,Q,l,\theta,K)=E^2_{pl}(P,l,\theta,K)+E^2_{pl}(Q,l,\theta,K),\qquad E_{pl}(P,l,\theta,K)=l^{\top}\pi(P,\theta,K)$$

  where $\pi$ projects with camera pose $\theta=\{R,t\}\in SE(3)$ and intrinsics $K$. This error is constant under shifts of $P,Q$ along the 3D line, which acts as implicit regularisation and lets the non-minimal parameterisation live safely inside BA.
- **Joint BA cost**: with point error $e_{i,j}=x_{i,j}-\tilde{x}_{i,j}$ and line-endpoint errors $e^{\prime}_{i,j}=(\tilde{l}_{i,j})^{\top}(K^{-1}p^{h}_{i,j})$, $e^{\prime\prime}_{i,j}=(\tilde{l}_{i,j})^{\top}(K^{-1}q^{h}_{i,j})$, BA minimises

$$C=\sum_{i,j}\rho\left(e_{i,j}^{\top}\Omega_{i,j}^{-1}e_{i,j}+e^{\prime\top}_{i,j}\Omega^{\prime-1}_{i,j}e^{\prime}_{i,j}+e^{\prime\prime\top}_{i,j}\Omega^{\prime\prime-1}_{i,j}e^{\prime\prime}_{i,j}\right)$$

  with Huber cost $\rho$ and covariances $\Omega$ tied to the detection scale.
- **Relocalisation**: EPnP is replaced by EPnPL, which minimises the detected-line reprojection error and shifts detected endpoints along the line to match projected model endpoints, giving robustness to occlusion and mis-detection.
- **Line-only initialisation**: assuming small, constant rotation across three consecutive frames ($R_1=R^{\top}$, $R_2=I$, $R_3=R$), each tracked line gives the constraint $l_{2}^{\top}\left((R^{\top}l_{1})\times(Rl_{3})\right)=0$. With a first-order rotation $R\approx I+[\mathbf{r}]_{\times}$, three matched lines give three quadratic equations in $r_1,r_2,r_3$, solved by an adapted Kukelova polynomial solver (up to 8 solutions); translations $t_1,t_3$ then follow linearly from trifocal-tensor equations. Five line correspondences suffice in total.

## Results

On the TUM RGB-D benchmark (ATE RMSE in cm, median of 5 runs), PL-SLAM "consistently improves the trajectory accuracy of ORB-SLAM in all sequences": f1_xyz 1.21 vs 1.38, f2_xyz 0.43 vs 0.54, f3_long_office 1.97 vs 4.05, f2_desk_person 1.99 vs 5.95, f3_sit_xyz 0.066 vs 0.08, f3_walk_halfsph 1.60 vs 2.09. It is best in all but two sequences (PTAM slightly ahead there), but PTAM lost track in 5 of 12 sequences, LSD-SLAM in 3, RGBD-SLAM in 7. The line-only initialisation even bootstraps f3_nstr_tex_far, where the classic homography/essential initialisation detects an ambiguity and cannot start; it fails only under large inter-frame rotations. The polynomial solver is numerically stable (errors around 1e-15). Cost: tracking runs at 20 Hz vs ORB-SLAM's 50 Hz and local mapping at 3 Hz vs 7 Hz (local BA 218.25 vs 118.5 ms) — near real time on a standard i7 CPU.

## Why it matters for SLAM

PL-SLAM showed that adding line features meaningfully improves accuracy — not just in low-texture scenes where points vanish, but systematically across well-textured sequences too — while reusing almost the entire point-based pipeline thanks to the endpoint parameterisation. Its line-based three-view initialisation removed the last hard dependency on point correspondences for bootstrapping. Later point-line systems (including the stereo PL-SLAM of Gomez-Ojeda and line-assisted VIO such as AirVO) built on the same points-plus-lines philosophy.

## Related

- [ORB-SLAM](orb-slam.md)
- [Pop-up SLAM](pop-up-slam.md)
- [CubeSLAM](cubeslam.md)
- [AirVO](../level-06-vio-vins/airvo.md)
- [Edge detector](../level-01-beginner/edge-detector.md)
