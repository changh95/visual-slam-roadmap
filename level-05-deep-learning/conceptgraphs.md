# ConceptGraphs

> Gu 2023 · [Paper](https://arxiv.org/abs/2309.16650)

**One-line summary** — ConceptGraphs builds open-vocabulary 3D scene graphs by fusing 2D foundation-model outputs (SAM segments, CLIP embeddings) into 3D object nodes and using an LLM to infer inter-object relations, yielding language-queryable maps for planning.

## Problem

Robots need a 3D world representation that is semantically rich yet compact and efficient for task-driven perception and planning. Recent attempts to inject vision-language features into 3D maps produce per-point feature vectors, which "do not scale well in larger environments, nor do they contain semantic spatial relationships between entities" — while traditional closed-set scene graphs are locked to predefined label sets. ConceptGraphs targets an open-vocabulary representation that is object-centric, graph-structured, and buildable without collecting 3D training data or fine-tuning any model.

## Method & architecture

Given posed RGB-D frames $I_t = \langle I_t^{\text{rgb}}, I_t^{\text{depth}}, \theta_t \rangle$, ConceptGraphs incrementally builds a scene graph $\mathcal{M}_t = \langle \mathbf{O}_t, \mathbf{E}_t \rangle$ whose nodes $\mathbf{o}_j$ each carry a 3D point cloud $\mathbf{p}_{o_j}$ and a fused semantic feature $\mathbf{f}_{o_j}$:

- **Class-agnostic segmentation + embedding.** SAM produces masks $\mathbf{m}_{t,i}$ per frame; each masked crop is embedded with the CLIP image encoder to get a unit feature $\mathbf{f}_{t,i}$; each mask is back-projected to 3D, denoised with DBSCAN, and transformed to the map frame.
- **Multi-view object association.** Every new detection is scored against overlapping map objects with a combined geometric + semantic similarity

  $$\phi(i,j) = \phi_{\text{sem}}(i,j) + \phi_{\text{geo}}(i,j), \qquad \phi_{\text{sem}}(i,j) = \tfrac{1}{2}\mathbf{f}_{t,i}^{\top}\mathbf{f}_{o_j} + \tfrac{1}{2},$$

  where $\phi_{\text{geo}}(i,j) = \mathrm{nnratio}(\mathbf{p}_{t,i}, \mathbf{p}_{o_j})$ is the fraction of detection points with a map-object nearest neighbor within $\delta_{\text{nn}}$. Greedy assignment matches each detection to the highest-scoring object; if no score exceeds $\delta_{\text{sim}}$, a new object is instantiated.
- **Object fusion.** On a match, the node feature is updated by a running average $\mathbf{f}_{o_j} = (n_{o_j} \mathbf{f}_{o_j} + \mathbf{f}_{t,i}) / (n_{o_j} + 1)$ (with $n_{o_j}$ the association count) and the point clouds are merged and down-sampled.
- **Node captioning.** Crops from the 10 best views of each object go to an LVLM (LLaVA) prompted to "describe the central object in the image"; an LLM (GPT-4) summarizes the 10 rough captions into one coherent caption per node.
- **Edge inference.** 3D bounding-box IoU between all node pairs gives a dense similarity graph, pruned to a minimum spanning tree; for each MST edge, an LLM is given the two captions + 3D locations and outputs a relation label (e.g. "a on b") with reasoning — producing open-vocabulary edges no trained relation model could.
- **Planning interface.** Each node is serialized as JSON (caption + 3D bounding box); given a language query, an LLM picks the most relevant object and hands its pose to the downstream grasping/navigation pipeline. Implementation: voxel size and $\delta_{\text{nn}}$ of 2.5 cm, $\delta_{\text{sim}} = 1.1$; a detector variant (CG-D) uses RAM tags + Grounding DINO boxes instead of SAM-only proposals.

## Results

- **Scene-graph quality (Replica, human evaluation on AMT):** node captions are judged correct about 70% of the time (most errors traced to the LVLM), while edge relation labels reach roughly 90% accuracy on average; only 0–5 duplicate object detections per scene.
- **Open-vocabulary 3D semantic segmentation (Replica, ConceptFusion protocol):** ConceptGraphs scores 40.63 mAcc / 35.95 F-mIoU and CG-D 38.72 / 35.82, versus ConceptFusion 24.16 / 31.31 and ConceptFusion+SAM 31.53 / 38.70 — comparable or better with a much smaller memory footprint (privileged fine-tuned baselines: e.g. OpenSeg 41.19 / 53.74).
- **Text-query retrieval (R@1):** on Replica, LLM-based retrieval beats CLIP on negation queries 0.80 vs 0.26; on a real lab scan the LLM achieves 1.00 across descriptive, affordance, and negation queries where CLIP scores 0.00 on negation.
- **Robot demos:** language-driven navigation on a Clearpath Jackal (VLP-16 + RealSense D435i), open-vocabulary pick-and-place on a Boston Dynamics Spot ("cuddly quacker" → duck plush), LLM-inferred traversability for pushing through clutter, and particle-filter localization + map updates in AI2Thor.

## Why it matters for SLAM

ConceptGraphs showed that 2D foundation models can be lifted into 3D by ordinary multi-view association — no new 3D networks required — turning a SLAM system's posed RGB-D stream into a language-queryable object map. It established the now-standard SAM + CLIP + LLM recipe for open-vocabulary robot mapping, and together with per-point approaches (ConceptFusion, LERF, OpenScene) it framed the design space of open-vocabulary 3D maps: dense features vs object-centric graphs. As SLAM's output increasingly feeds language-driven planners, graph-structured open-set maps like this define what a "semantic map" means in modern Spatial AI.

## Related

- [SAM](sam.md)
- [CLIP](../level-11-world-models-spatial-ai/clip.md)
- [ConceptFusion](conceptfusion.md)
- [Hydra](hydra.md)
- [Clio](clio.md)
- [OpenScene](openscene.md)
- [Grounding DINO](grounding-dino.md)
