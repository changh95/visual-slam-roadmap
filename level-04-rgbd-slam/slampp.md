# SLAM++

> Salas-Moreno 2013 · [Paper](https://ieeexplore.ieee.org/document/6619022)

**One-line summary** — The first object-oriented SLAM system: the map is an explicit graph of 6-DoF object poses built by real-time 3D object recognition "in the loop", giving dense predictive power at a fraction of the storage of raw-geometry maps.

## Problem

Before SLAM++, real-time SLAM systems operated on low-level primitives — points, lines, patches, or non-parametric surfaces such as depth maps — which must be robustly matched, geometrically transformed, and optimised. This wastes enormous computation and ignores domain knowledge: many indoor scenes consist of repeated, domain-specific objects and structures (chairs, tables, monitors). If prior knowledge of these objects is exploited *in the loop of SLAM operation itself*, object recognition from depth data can replace raw geometry processing — yielding compact, semantically meaningful maps, strong loop-closure constraints, and dense surface prediction from an object graph.

## Method & architecture

The pipeline (Fig. 2 of the paper): live frame surface measurement (vertex map $\mathcal{D}_l$ + normal map $\mathcal{N}_l$) → **(1)** live camera pose estimation by ICP against a dense multi-object scene prediction rendered from the current SLAM graph $\mathcal{G}$ → **(2)** object detection and insertion into the graph → **(3)** pose-graph optimisation → **(4)** surface rendering for the next prediction and for active object search.

- **Object database**: each repeated object is scanned once with KinectFusion, a mesh is extracted by marching cubes, cleaned up, and stored with a canonical coordinate frame.
- **Real-time object recognition (GPU)**: following Drost et al., Point-Pair Features (PPFs) — 4D descriptors of relative position/normals of oriented point pairs — vote in a Generalised-Hough parameter space. Votes are packed into 64-bit codes and accumulated by parallel sort+reduction on the GPU; building the global model description takes under 5 ms for 160K PPFs. Detected poses are erroneous within about ±30° rotation and ±50 cm translation, so each candidate is refined and gated by a second ICP estimation before insertion.
- **Camera tracking against the object graph**: the camera-to-model transform is estimated by iteratively minimising a point-to-plane error over all valid pixels $u \in \Omega$ of the live depth map,

$$E_c(\mathbf{x}) = \sum_{u\in\Omega} \psi\big(e(u,\mathbf{x})\big), \qquad e(u,\mathbf{x}) = \mathcal{N}_r(u')^\top\big(\exp(\hat{\mathbf{x}})\,\hat{v}_l(u) - v_r(u')\big),$$

  where $\mathbf{x}\in\mathbb{R}^6$ is an incremental twist, $v_r, \mathcal{N}_r$ are the predicted vertex/normal maps, $u'$ the projectively-associated pixel, and $\psi$ a robust Huber penalty. Gauss-Newton normal equations ($6\times6$, Cholesky) run for up to 10 iterations. Tracking against the *complete, high-quality* multi-object prediction — unlike KinectFusion's partial model — also enables masking already-explained pixels so object search focuses only on undescribed regions ("active search").
- **Graph optimisation**: the world is a graph of historical camera poses $T_{wi}$ and object poses $T_{wo_j}$ in $\mathbf{SE}(3)$, with 6-DoF camera-object ICP measurements $Z_{i,o_j}$ and camera-camera constraints $Z_{i,i+1}$:

$$E_m = \sum_{Z_{i,o_j}} \big\lVert \log\big(Z_{i,o_j}^{-1} \cdot T_{wi}^{-1} \cdot T_{wo_j}\big) \big\rVert_{\Sigma_{i,o_j}} + \sum_{Z_{i,i+1}} \big\lVert \log\big(Z_{i,i+1}^{-1} \cdot T_{wi}^{-1} \cdot T_{wi+1}\big) \big\rVert_{\Sigma_{i,i+1}},$$

  with $\lVert\mathbf{x}\rVert_\Sigma := \mathbf{x}^\top\Sigma^{-1}\mathbf{x}$ the Mahalanobis distance, $\log(\cdot)$ the $\mathbf{SE}(3)$ log map, and inverse covariances approximated by the ICP Hessian $\Sigma^{-1} = J^\top J$. Solved with Levenberg-Marquardt and a sparse Cholesky solver (g2o).
- **Structural priors**: a unary ground-plane constraint per object augments the energy ($E_{m\&p}$), pinning objects to a common plane detected from the first observation.
- **Relocalisation and large loop closure**: a new local graph is tracked after loss; once it contains at least 3 objects it is matched against the long-term graph, treating both graphs as meshes of oriented points (object positions as vertices, object x-axes as normals) fed through the same PPF recognition machinery. Moved objects that fail ICP consistency gating are marked invalid so they do not corrupt the graph.

## Results

- Mapped a large common room of size 15×10×3 m in a real-time run lasting around 10 minutes, including loop closures and relocalisations after lost tracking; **34 object instances** (two chair types, two round-table types) were mapped, constrained only by the ground-plane prior.
- System statistics for a 10×6×3 m room on a gaming laptop: **20 fps**, 132 camera poses, 35 objects from 5 object classes, 338 graph edges.
- Memory: **350 KB** graph + **20 MB** object database, versus **1.4 GB** for a KinectFusion TSDF of the same volume (4 bytes/voxel, 128 voxels/m) — an approximate compression ratio of **1/70** with similar predictive power.
- Demonstrated moved-object detection (inconsistent objects flagged and excluded) and context-aware AR: virtual characters navigate the object map and find sitting places without scanning a whole room.

## Why it matters for SLAM

SLAM++ opened the research direction of object-level SLAM, showing that maps built from semantic entities can be orders of magnitude more compact than raw geometry while enabling loop closure, relocalisation, and scene understanding at the object level. Its main limitation — a pre-built database of scanned instances — is exactly what its lineage removed: Fusion++ discovers objects on the fly with Mask R-CNN, MoreFusion reasons about multi-object 6D poses, and NodeSLAM and DSP-SLAM replace meshes with learned shape priors. Its core insight, that semantic entities make stronger map elements than raw geometry, resurfaces in modern 3D scene-graph systems.

## Related

- [Fusion++](fusionpp.md)
- [MoreFusion](morefusion.md)
- [DSP-SLAM](dsp-slam.md)
- [KinectFusion](kinectfusion.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)
