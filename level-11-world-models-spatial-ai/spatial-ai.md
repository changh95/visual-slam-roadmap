# Spatial AI

**Spatial AI** is the term — popularized by Andrew Davison's *FutureMapping* papers — for the convergence of SLAM-style geometric understanding with semantic scene understanding and learned world representations. The vision: a robot or device should not merely estimate a trajectory and a point cloud, but maintain a persistent, general-purpose representation of the space around it — geometry, objects, semantics, and dynamics together — that any downstream task (navigation, manipulation, AR, human interaction) can query.

## Reframing SLAM's goal

Classical SLAM answers "where am I, and where are the surfaces?" Spatial AI asks the questions that come next:

- **What** are the things in the map (objects, rooms, affordances), not just where surface points lie?
- **How** should the representation be stored so it stays useful over hours and days — compact, updatable, and shared across tasks?
- **What computation and hardware** does real-time spatial perception need (Davison's FutureMapping 2 examines graph processors and non-von-Neumann hardware for this)?
- **How much should be learned?** Learned components (depth priors, semantic features, generative models) increasingly replace or augment hand-built geometry.

## Converging from three directions

You can see the field converging on this vision from several directions, each of which occupies part of this roadmap:

- **Semantic and object-level SLAM** (SemanticFusion, Kimera and 3D dynamic scene graphs, Hydra) enriches maps with labels, objects, and hierarchical structure — rooms, places, agents — turning a surface model into a queryable scene model.
- **Open-vocabulary perception** makes maps *queryable with language*: LERF embeds CLIP features into a radiance field so any text query retrieves a 3D relevance map; ConceptFusion and OpenFusion maintain dense CLIP-feature maps online (the SLAM counterpart of LERF); OpenMask3D-style methods attach open-vocabulary features to 3D segments. The pattern is consistent — *SLAM provides the 3D geometry; VLMs provide the semantics; together they produce open-vocabulary 3D scene understanding.*
- **World models and VLMs/VLAs** approach the same goal from the learning side: implicit spatial knowledge acquired at internet scale, with little or no explicit geometry — and, in the VLA case, direct coupling of perception to action.

## The convergence stack

A useful way to hold it together is as a stack:

$$\text{Perceive} \xrightarrow{\text{SLAM}} \text{Map + Pose} \xrightarrow{\text{VLM / scene graphs}} \text{Scene understanding} \xrightarrow{\text{VLA / planning}} \text{Action}$$

Spatial AI is the claim that these layers should be *co-designed* around a shared spatial representation, rather than bolted together. Two design patterns compete:

- **Modular**: each layer keeps its specialization — SLAM provides the geometric backbone with metric precision and loop-closure correctability; VLMs interpret; VLAs (or classical planners) act on top.
- **End-to-end**: a single learned system (WorldVLA-style, some RT-2 configurations) skips explicit geometry entirely.

The right answer likely depends on the task: precise manipulation and long-horizon navigation in known spaces favor explicit SLAM; open-world instruction following may favor end-to-end approaches. Most current VLAs have no metric memory at all — which is precisely where SLAM still earns its keep.

## Open problems at the SLAM–foundation-model interface

These currently define much of the research frontier:

1. **Language-queried SLAM maps** — incorporating CLIP/SigLIP features into real-time SLAM (ConceptFusion, OpenFusion, LERF) for semantic scene queries.
2. **SLAM-grounded VLAs** — using SLAM-maintained metric maps as structured memory for VLAs, enabling long-horizon navigation with metric precision.
3. **Generative map completion** — using generative priors to hallucinate plausible geometry in unobserved map regions.
4. **World-model loop closure** — using learned video prediction to detect when predicted and observed scenes diverge, a learned alternative to geometric loop closure.
5. **Foundation-model map priors** — using 3D world-generation models as SLAM initialization for novel environments.

## Why it matters for SLAM

Spatial AI is the "why" behind most of the modern roadmap: it explains the field's movement from sparse point maps toward dense, semantic, hierarchical, and learned representations. For anyone planning a research or engineering career in SLAM, it is the framing that connects the geometry levels of this roadmap to the foundation-model level — the boundary between SLAM and broader AI is dissolving, and the most valuable practitioners will be fluent in both the geometric foundations and the learned representations.

## Related

- [FutureMapping 1](../level-05-deep-learning/futuremapping-1.md)
- [FutureMapping 2](../level-05-deep-learning/futuremapping-2.md)
- [Kimera / 3D Dynamic Scene Graph](../level-05-deep-learning/kimera-3d-dynamic-scene-graph.md)
- [Hydra](../level-05-deep-learning/hydra.md)
- [World model](world-model.md)
- [VLM vs VLA](vlm-vs-vla.md)
- [CLIP](clip.md)
