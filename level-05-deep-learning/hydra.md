# Hydra

> Hughes (MIT SPARK) 2022 · [Paper](https://arxiv.org/abs/2201.13360)

**One-line summary** — First real-time Spatial Perception System that incrementally builds a hierarchical 3D scene graph (mesh → objects → places → rooms → building) from sensor data and optimizes all layers simultaneously when loop closures occur.

## Problem

3D scene graphs had just emerged as a powerful high-level representation — a layered graph whose nodes are spatial concepts at multiple abstraction levels — but prior systems built them offline: Kimera's 3D Dynamic Scene Graphs and Armeni et al. take minutes of batch processing, rely on an ESDF of the *entire* environment (whose memory scales poorly), and would have to rebuild the graph from scratch after every loop closure. How to build such a "mental model" in real time onboard a robot was, in the authors' words, uncharted territory — including what loop closure even means for a scene graph, since correcting the trajectory must consistently correct every layer above the mesh.

## Method & architecture

**Layers 1–3, incrementally, inside an active window.** Hydra spatially windows the Voxblox TSDF/ESDF to a user-set radius (8 m) around the robot, bounding memory. Within the window: marching cubes extracts the metric-semantic mesh while labeling zero-crossing "parent" voxels; objects are formed by per-class Euclidean clustering of mesh vertices (centroid + bounding box, merged with existing nodes when a centroid falls inside another's box); places are extracted from the Generalized Voronoi Diagram — the voxels equidistant to at least 2 obstacles, obtained as a byproduct of the ESDF brushfire update — and incrementally sparsified into a graph (nodes at voxels with $\geq 4$ basis points or corner templates; edges by flood-fill labeling, with splitting where straight-line edges deviate from the GVD). This runs in constant time regardless of environment size.

**Layer 4: rooms from topology.** Dilating obstacles by a distance $\delta$ closes doors and disconnects rooms; since each place node stores its obstacle distance, dilation maps directly onto the places subgraph ${\cal G}_{p}$. Hydra sweeps 10 dilation distances in $[0.45, 1.2]$ m, counts connected components of each pruned graph ${\cal G}_{p,\delta}$, takes the median count $n_{r}$, selects the largest ${\cal G}_{p,\delta^{\star}}$ with $n_{r}$ components, and assigns leftover nodes by greedy modularity-based community detection seeded with those components — milliseconds instead of batch ESDF processing.

**Hierarchical loop closures.** Each agent (keyframe) node carries a descriptor hierarchy: DBoW2 appearance words, a histogram of nearby object labels, and a histogram of nearby place obstacle-distances. Detection walks *top-down* (places → objects → appearance); verification walks *bottom-up*, first RANSAC on visual features, then TEASER++ registration of matched objects if vision fails — so viewpoint- or illumination-breaking matches can still verify semantically.

**Scene graph optimization.** The frontend assembles the full graph and subsamples the mesh into control points (octree vertex clustering). The backend forms an embedded deformation graph — agent pose graph + mesh control points + minimum spanning tree of places, connected via inter-layer edges — and, using the rigid-transform reformulation, solves it as pose-graph optimization with the GNC solver in GTSAM, which also rejects outlier loop closures. The remaining mesh is re-interpolated, object centroids/boxes recomputed, overlapping nodes merged (places within 0.4 m; objects with same label and box containment), and rooms re-detected. Room accuracy is scored voxel-wise as

$$\text{Precision}=\frac{1}{|R_{e}|}\sum_{r_{e}\in R_{e}}\max_{r_{g}\in R_{g}}\frac{|r_{g}\cap r_{e}|}{|r_{e}|},\qquad \text{Recall}=\frac{1}{|R_{g}|}\sum_{r_{g}\in R_{g}}\max_{r_{e}\in R_{e}}\frac{|r_{e}\cap r_{g}|}{|r_{g}|}$$

**Thinking fast and slow.** Hydra parallelizes frame-rate early perception (feature tracking, segmentation), sub-second mid-level modules (mesh, objects, places, frontend), and slow high-level modules (loop closure, backend optimization, room detection) — all on CPU except the 2D segmentation network.

## Results

- Evaluated on uHumans2 (simulated apartment, office, subway) and the real SidPac dataset (Kinect Azure + RealSense T265, two multi-floor recordings averaging ~400 m traversals).
- Given ground-truth poses, Hydra's online graph is comparable to the batch offline baseline: 80–100% of objects found/correct and sub-25 cm place position error.
- The scene-graph loop closures (SG-LC) yield roughly **2x as many loop closures within 10 cm and 1 degree error** as a permissive vision-based DBoW2+ORB baseline, and substantially better object accuracy than vision-based loop closures on the large SidPac scenes.
- Room segmentation: on SidPac floors 3–4 Kimera collapses to 0.88 precision / **0.06 recall** (segmenting 2 of 10 rooms) while Hydra maintains consistent precision and recall, including on multi-floor scenes.
- Runtime: the batch baseline grows past 40 s per update on moderate scenes; Hydra's mid-level cost stays flat. On an Nvidia Xavier NX: objects $75\pm 35$ ms, places $33\pm 6$ ms, rooms $55\pm 41$ ms against a 5 Hz keyframe-rate target.

## Why it matters for SLAM

Hydra turned the 3D Dynamic Scene Graph from an offline construction into a real-time spatial perception system, and its embedded-deformation-graph backend is the first algorithm to optimize an entire scene graph — mesh, places, objects, rooms — jointly with the trajectory, generalizing pose-graph optimization to hierarchical maps. Its 5-layer hierarchy became the de facto Spatial AI representation and the foundation of the MIT SPARK ecosystem — Hydra-Multi (multi-robot), Clio (task-driven open-set graphs), Khronos (spatio-temporal dynamics) — enabling robots to take language commands at multiple abstraction levels.

## Related

- [Kimera / 3D Dynamic Scene Graph](kimera-3d-dynamic-scene-graph.md) — the scene-graph concept Hydra makes real-time
- [Hydra-Multi](hydra-multi.md) — multi-robot extension
- [Clio](clio.md) — task-driven open-set scene graphs
- [Khronos](khronos.md) — spatio-temporal extension for dynamic scenes
- [ConceptGraphs](conceptgraphs.md) — open-vocabulary 3D scene graphs
- [GNC](gnc.md) — the robust solver used in the scene-graph backend
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md) — the classical machinery the deformation-graph correction extends
