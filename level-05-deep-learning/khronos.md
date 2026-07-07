# Khronos

> Schmid (MIT SPARK) 2024 · [Paper](https://arxiv.org/abs/2402.13817)

**One-line summary** — Unified spatio-temporal metric-semantic SLAM that extends the Hydra scene-graph line to dynamic environments by tracking the full history of objects: when they appeared, moved, or were removed.

## Problem

Dynamic SLAM research has made large strides toward estimating the robot pose accurately in changing environments, but much less emphasis has been put on building dense *spatio-temporal* representations of the environment itself. Long-term autonomy requires reasoning over both short-term dynamics (a person walking by) and long-term changes (furniture rearranged between visits), and the two literatures — moving-object tracking and change detection — had been disconnected. Khronos defines the Spatio-temporal Metric-semantic SLAM (SMS) problem: at every current time $T$, estimate the state of the scene at *all* previous times $t \leq T$.

## Method & architecture

The scene is a set of objects $O_i^t = \{\Omega_i^t,\ T_{WO_i}^t,\ L_i\}$ (surface, pose, semantic label; the background is one static object $O_{BG}$), observed through surface measurements $Z$ and odometry $\Phi$. SMS is posed as MAP estimation:

$$O^{\star}, X^{\star} = \arg\max_{O,X}\ \mathbb{P}(O, X \mid Z, \Phi).$$

This is intractable directly — disagreements between measurements and map can stem from noise, drift, motion, *or* change. The key assumption is **spatio-temporal local consistency**: over short intervals $\tau$, both state-estimation error and scene change are small. This lets Khronos introduce latent **object fragments** $Y_k = \{\Omega_k,\ T_{RY_k},\ L_k\}$ — partial views of an object accumulated over a locally-consistent time window — and factorize the problem (Eq. 16):

$$\mathbb{P}(O, X, Y, A \mid Z, \Phi) = \underbrace{\prod_i \mathbb{P}(O_i \mid \bar{Y}_i, X)}_{\text{fragment reconciliation}}\ \underbrace{\mathbb{P}(X, A \mid Y, \Phi)}_{\text{SLAM}}\ \underbrace{\prod_k \mathbb{P}(Y_k \mid \bar{Z}_k, \bar{\Phi}_k)}_{\text{local estimation}},$$

where $A$ associates fragments to objects. Short-term dynamics live entirely in the fast local term; long-term changes live in the slower global terms. The system has three components:

- **Active window (local estimation).** Incremental TSDF fusion reconstructs the background mesh $\Omega_{BG}$; per-frame candidate objects come from semantic masks plus geometric motion detection (points falling into previously observed free space must be dynamic). Observations are greedily associated to object hypotheses by volumetric IoU; hypotheses with fewer than $\tau_Z = 15$ observations, or "dynamic" ones that moved less than $\tau_D = 1$ m, are rejected. Static objects become adaptive-resolution meshes, dynamic ones sequences of point clouds.
- **Global optimization.** A deformation graph over robot poses $X$, mesh control points $P_M$, and fragment poses $T_{WY_k}$ (each tied to the poses where it was first/last observed) is solved as robust pose-graph optimization with binary switches $\omega_{ij}$ for candidate edges (fragment-fragment associations $\mathcal{E}_{YY}$ and loop closures $\mathcal{E}_{LC}$):

$$\mathcal{T}^{*} = \arg\min_{\mathbf{T}_1,\dots,\mathbf{T}_n,\ \omega_{ij}\in\{0,1\}} \sum_{(i,j)\in\mathcal{E}_{obs}} \lVert \mathbf{T}_i^{-1}\mathbf{T}_j \boxminus \bar{\mathbf{T}}_{ij} \rVert^2_{\Lambda_{ij}} + \sum_{(i,j)\in\mathcal{E}_{can}} \Big( \omega_{ij} \lVert \mathbf{T}_i^{-1}\mathbf{T}_j \boxminus \bar{\mathbf{T}}_{ij} \rVert^2_{\Lambda_{ij}} + (1-\omega_{ij})\,\bar{c}^2 \Big).$$

- **Reconciliation (change detection).** A "library of rays" stores, for each background vertex $\mathbf{p}_v$, the robot position $\mathbf{p}_r$ that observed it. Querying a fragment surface point $\mathbf{p}_q$ against nearby rays gives its off-ray distance $d_r = \lVert (\mathbf{p}_q - \mathbf{p}_r) \times (\mathbf{p}_r - \mathbf{p}_v) \rVert / \lVert \mathbf{p}_q - \mathbf{p}_r \rVert$ and depth $d_d$ along the ray: shorter depths are *evidence of absence*, similar depths (within 30 cm) evidence of presence. An object's appearance/disappearance time is estimated as the middle of the window between the last absence and first presence evidence (minimum-expected-error under a uniform prior).

## Results

Evaluated on two photo-realistic TESSE-simulated scenes with dense spatio-temporal ground truth — **Apartment** (87 s, ~39 m, 64 static + 10 dynamic objects, 6 long-term changes) and **Office** (217 s, ~181 m, 196 objects, 6 dynamic, 8 changes) — each with both GT poses and Kimera VIO odometry, against Hydra, Dynablox, and Panoptic Mapping (all at 8 cm resolution, 5 m range):

- **Apartment (GT poses), F1 scores:** background reconstruction 91.2 (Hydra 87.7, Dynablox 86.2, Panoptic Mapping 70.3); objects 75.3 (Hydra 42.3, Panoptic Mapping 64.3); dynamic objects 84.1 (Dynablox 61.3); changes 64.6 (Panoptic Mapping 56.1).
- **Office with drifting Kimera odometry:** Khronos keeps the best background (F1 67.6) and object (F1 73.1) scores; Panoptic Mapping's change-detection precision collapses (9.6 vs Khronos 25.8) without Khronos's joint spatio-temporal optimization and deformable change detection.
- **Segmentation-agnostic:** swapping GT semantics for an open-set SAM + CLIP frontend maintains high performance (Apartment GT poses: changes F1 64.4 vs 64.6).
- **Real robots:** on a Jackal UGV (mezzanine scene) and a Boston Dynamics Spot across an entire university-building floor, Khronos correctly captures orchestrated object appearances/disappearances and short-term motion (people, a pushed cart).
- **Real time:** active-window frame processing takes 45.5 ± 9.2 ms (22.2 FPS average) with approximately constant time complexity thanks to the factorization.

## Why it matters for SLAM

Almost all classical SLAM assumes a static world, which breaks down in long-term operation in homes, warehouses, and offices where objects constantly move. Khronos reframes dynamics as something to be *modeled and remembered* rather than filtered out, and its fragment factorization shows how to do so in real time: sensing noise, robot drift, motion, and scene change each get their own term. It is a key building block for long-term autonomy on top of the Kimera → Hydra lineage of metric-semantic scene graphs.

## Related

- [Hydra](hydra.md) — the real-time scene-graph system Khronos extends
- [Clio](clio.md) — task-driven open-set scene graphs from the same lab
- [Kimera / 3D Dynamic Scene Graph](kimera-3d-dynamic-scene-graph.md) — origin of the dynamic scene graph idea
- [SAM 2](sam-2.md) — video segmentation useful for tracking dynamic entities
- [DynaSLAM](../level-03-monocular-slam/dynaslam.md) — the classical "filter dynamics out" approach Khronos moves beyond
- [Robust pose-graph optimization](../level-02-getting-familiar/robust-pose-graph-optimization.md) — the switchable-constraint machinery behind Eq. 17
