# World model

A **world model** is a learned generative model of environment dynamics: given the current state (and optionally an action), it predicts what happens next. Formally, it approximates something like

$$s_{t+1} \sim p_\theta(s_{t+1} \mid s_t, a_t)$$

where the "state" may be raw pixels, a latent embedding, or discrete tokens, and the "action" may be a robot command, a steering input, or nothing at all (pure video prediction). Because the model can be *rolled out* — fed its own predictions to simulate several steps ahead — it functions as an internal simulator: an agent can imagine the consequences of candidate actions and plan without touching the real world or a hand-built physics engine.

Modern large-scale world models are typically built from the same machinery as language and video generation:

- **Tokenized autoregressive models** (e.g., GAIA-1 for driving): video frames, text, and actions are encoded into discrete tokens, and a GPT-style transformer is trained with next-token prediction. Varying the action tokens at inference answers "what would happen if I brake here?"
- **Diffusion-based video models** (e.g., Sora built on the Diffusion Transformer): trained only to generate plausible video, yet exhibiting emergent 3D consistency — object permanence, coherent camera motion — suggesting that generation at scale forces an implicit model of the world.
- **World foundation model platforms** (e.g., NVIDIA Cosmos): pre-trained prediction and transfer models intended as reusable infrastructure for Physical AI, including synthetic data generation for training autonomous vehicles and robots.

The key claim behind all of these is that *dynamics can be learned from data* — traffic behavior, contact physics, lighting — rather than hand-coded, and that models trained on enough raw video acquire structured knowledge (road topology, agent behavior, scene geometry) without explicit supervision.

It is useful to contrast a world model with the map a SLAM system builds:

| | SLAM map | World model |
|---|---|---|
| Encodes | Where surfaces/landmarks *are* (metric geometry) | How the world *changes* (dynamics) |
| Nature | Explicit, correctable (loop closure) | Implicit, learned, generative |
| Strength | Metric precision, cheap queries | Prediction, imagination of unseen futures |
| Weakness | Static-world assumption, no prediction | Expensive, hallucination-prone, weak metric guarantees |

## Why it matters for SLAM

World models and SLAM are converging answers to complementary questions — "where am I and what is here?" versus "what happens next?" A plausible future Spatial AI stack uses SLAM for global localization and metrically accurate mapping while a world model handles local prediction and planning ("simulate the next few seconds under each candidate action, anchored to my current map"). World models also feed SLAM research indirectly: they generate diverse synthetic sensor data for training learned SLAM components, and their emergent 3D consistency raises a live research question — how much of a "map" is already latent inside a large video model?

## Related

- [GAIA-1](gaia-1.md)
- [Sora / DiT](sora-dit.md)
- [NVIDIA Cosmos](nvidia-cosmos.md)
- [WorldVLA](worldvla.md)
- [Spatial AI](spatial-ai.md)

[Back to Level 11](../README.md#level-11-world-models--spatial-ai)
