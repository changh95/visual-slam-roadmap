# Spatial AI

**Spatial AI** is the term — popularized by Andrew Davison's *FutureMapping* papers — for the convergence of SLAM-style geometric understanding with semantic scene understanding and learned world representations. The vision: a robot or device should not merely estimate a trajectory and a point cloud, but maintain a persistent, general-purpose representation of the space around it — geometry, objects, semantics, and dynamics together — that any downstream task (navigation, manipulation, AR, human interaction) can query.

The idea reframes SLAM's goal. Classical SLAM answers "where am I, and where are the surfaces?" Spatial AI asks the questions that come next:

- **What** are the things in the map (objects, rooms, affordances), not just where surface points lie?
- **How** should the representation be stored so it stays useful over hours and days — compact, updatable, and shared across tasks?
- **What computation and hardware** does real-time spatial perception need (Davison's FutureMapping 2 examines graph processors and non-von-Neumann hardware for this)?
- **How much should be learned?** Learned components (depth priors, semantic features, generative models) increasingly replace or augment hand-built geometry.

You can see the field converging on this vision from several directions. Semantic and object-level SLAM (SemanticFusion, Kimera and 3D dynamic scene graphs, Hydra) enriches maps with labels, objects, and hierarchical structure — rooms, places, agents. Open-vocabulary perception (CLIP-based maps such as ConceptFusion and LERF) makes maps *queryable with language*. And world models and VLMs/VLAs approach the same goal from the learning side: implicit spatial knowledge acquired at internet scale, with little or no explicit geometry.

A useful way to hold it together is as a stack:

$$\text{Perceive} \xrightarrow{\text{SLAM}} \text{Map + Pose} \xrightarrow{\text{VLM / scene graphs}} \text{Scene understanding} \xrightarrow{\text{VLA / planning}} \text{Action}$$

Spatial AI is the claim that these layers should be co-designed around a shared spatial representation, rather than bolted together. The open problems at this interface — language-queryable real-time maps, generative completion of unobserved regions, SLAM maps as structured memory for VLAs, learned alternatives to geometric loop closure — define much of the current research frontier.

## Why it matters for SLAM

Spatial AI is the "why" behind most of the modern roadmap: it explains the field's movement from sparse point maps toward dense, semantic, hierarchical, and learned representations. For anyone planning a research or engineering career in SLAM, it is the framing that connects the geometry levels of this roadmap to the foundation-model level — the boundary between SLAM and broader AI is dissolving, and the most valuable practitioners will be fluent in both the geometric foundations and the learned representations.

## Related

- [FutureMapping 1](../level-05-deep-learning/futuremapping-1.md)
- [FutureMapping 2](../level-05-deep-learning/futuremapping-2.md)
- [Kimera / 3D Dynamic Scene Graph](../level-05-deep-learning/kimera-3d-dynamic-scene-graph.md)
- [World model](world-model.md)
- [CLIP](clip.md)

[Back to Level 11](../README.md#level-11-world-models--spatial-ai)
