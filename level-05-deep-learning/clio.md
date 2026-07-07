# Clio

> Maggio (MIT SPARK) 2024 · [Paper](https://arxiv.org/abs/2404.13696)

**One-line summary** — Clio builds real-time, task-driven open-set 3D scene graphs: given tasks in natural language, it clusters 3D primitives with an incremental Agglomerative Information Bottleneck so the map retains only the objects and regions — at the granularity — the tasks need.

## Problem

Class-agnostic segmentation (SAM) plus open-set embeddings (CLIP) mean robot maps are no longer restricted to tens or hundreds of classes — they can contain "a plethora of objects and countless semantic variations". That raises the question the paper poses directly: what is the right granularity for the objects and semantic concepts the robot has to include in its map? A robot moving a piano should map it as one object; a robot playing it needs the keys; a robot tuning it needs strings and pins. Prior open-set pipelines implicitly pick a granularity by tuning segment-association thresholds; Clio argues the choice is intrinsically task-dependent and should be made by the mapping system itself.

## Method & architecture

**Information Bottleneck formulation.** The task list $Y$ (natural-language instructions embedded with CLIP) and the task-agnostic primitives $X$ (3D object segments and obstacle-free places) define a compression problem: find task-relevant clusters $\tilde{X}$, i.e. an assignment $p(\tilde{x}|x)$, solving

$$\min_{p(\tilde{x}|x)}\; I(X;\tilde{X})-\beta I(\tilde{X};Y)$$

which compresses $X$ while preserving mutual information with the tasks, with $\beta$ trading compression against task relevance.

**Agglomerative IB.** Clusters are initialized to the primitives; at each step the pair of *adjacent* clusters with the smallest merge weight

$$d_{ij}=\big(p(\tilde{x}_{i})+p(\tilde{x}_{j})\big)\cdot D_{\mathrm{JS}}\big[p(y|\tilde{x}_{i}),\,p(y|\tilde{x}_{j})\big]$$

is merged ($D_{\mathrm{JS}}$ = Jensen-Shannon divergence), stopping when the fractional information loss

$$\delta(k)=\frac{I(\tilde{X}_{k};Y)-I(\tilde{X}_{k-1};Y)}{I(X;Y)}$$

exceeds a threshold $\bar{\delta}$. The task-relevance distribution $p(y|x_{i})$ comes from cosine similarities $\phi(f_{x_{i}},f_{t_{j}})$ between the CLIP embedding of each primitive and each task, augmented with a *null task* scored $\alpha=0.23$: primitives most similar to the null task are pre-pruned as background, and only the top-$k$ task similarities are kept (re-weighted) to emphasize ranking.

**Incremental IB.** Since clustering decomposes over connected components of the primitive graph, and $\delta(k)$ is computable per component, only components touched by new measurements are re-clustered — so complexity does not grow with environment size, enabling online operation.

**System.** The *frontend* runs FastSAM + CLIP on the RGB-D stream, temporally associating segments into 3D object primitive tracks (cosine similarity $\geq\theta_{\text{track}}$, 3D IoU $\geq\gamma$, following Khronos) and builds Hydra's GVD-based places subgraph, assigning each place the average CLIP embedding of all images its centroid is visible from. The *backend* runs incremental Agglomerative IB over the object-primitive graph (edges = overlapping bounding boxes) to produce task-relevant objects, and over the places graph to cluster places into semantic regions; every node keeps its CLIP embedding, so the graph stays language-queryable.

## Results

- **Open-set object retrieval** on three self-collected annotated scenes (Office, Apartment, Cubicle with 27/28/18 target objects): Clio-batch/Clio-online rank first or second in nearly every metric, with F1 0.55–0.80 (batch) vs task-informed ConceptGraphs 0.39–0.55 and task-agnostic ConceptGraphs 0.25–0.39.
- **Compactness**: Clio maps 48–131 objects where its own un-clustered frontend (Clio-Prim) keeps 1070–1880 — an order of magnitude compression from the IB clustering — while *improving* retrieval accuracy.
- **Speed**: ~0.23–0.31 s per frame, about 6x faster than ConceptGraphs (2.0–8.1 s), running online; a fifth dataset covers a five-floor university building.
- **Closed-set sanity check** (Replica, 8 scenes): Clio-batch reaches 37.95 mAcc / 36.98 F-mIOU vs ConceptGraphs 40.63 / 35.95 — task-driven clustering does not degrade closed-set performance.
- **Regions**: with room labels as tasks, Clio (average embedding) beats Hydra's purely geometric room segmentation on the semantically defined Office (F1 0.76 vs 0.70) and Building (0.81 vs 0.78) scenes, while geometric Hydra wins on the geometrically distinct Apartment (0.90 vs 0.69).
- **Robot demo**: real-time onboard mapping on a Boston Dynamics Spot with an arm; language-prompted grasping over 7 trials, navigating via Dijkstra over the place graph to the highest-similarity object.

## Why it matters for SLAM

Clio marks the shift from "map everything at fixed semantic granularity" to "map what the task needs" — a key idea as SLAM merges with embodied AI. Its IB formulation gives the granularity question a principled information-theoretic footing rather than a threshold-tuning one, and the incremental per-component solver shows that foundation-model semantics (FastSAM, CLIP) can live inside a real-time metric-semantic mapping stack on onboard compute. For language-driven robots, a task-conditioned scene graph keeps maps compact while remaining sufficient for planning and manipulation.

## Related

- [Kimera / 3D Dynamic Scene Graph](kimera-3d-dynamic-scene-graph.md)
- [Hydra](hydra.md)
- [ConceptGraphs](conceptgraphs.md)
- [Khronos](khronos.md) — supplies Clio's object-primitive frontend
- [CLIP](../level-11-world-models-spatial-ai/clip.md)
- [SAM](sam.md)
