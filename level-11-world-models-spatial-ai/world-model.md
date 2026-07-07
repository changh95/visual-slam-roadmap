# World model

A **world model** is a learned generative model of environment dynamics: given the current state (and optionally an action), it predicts what happens next. Formally, it approximates something like

$$s_{t+1} \sim p_\theta(s_{t+1} \mid s_t, a_t)$$

where the "state" may be raw pixels, a latent embedding, or discrete tokens, and the "action" may be a robot command, a steering input, or nothing at all (pure video prediction). Because the model can be *rolled out* — fed its own predictions to simulate several steps ahead — it functions as an internal simulator: an agent can imagine the consequences of candidate actions and plan without touching the real world or a hand-built physics engine.

## Lineage: from latent imagination to internet scale

The idea has two roots. In reinforcement learning, the "world models" line (Ha & Schmidhuber's *World Models*, then the Dreamer family) trains a compact latent dynamics model of a specific environment and learns behaviors *inside the model's imagination* — planning in latent space is orders of magnitude cheaper than acting in the environment. The recent wave keeps the concept but changes the scale and the machinery: modern world models are built from the same token/diffusion machinery as language and video generation and trained on internet- or fleet-scale video.

- **Tokenized autoregressive models** (e.g., GAIA-1 for driving): video frames, text, and ego actions are encoded into discrete tokens and a GPT-style transformer is trained with next-token prediction. Varying the action tokens at inference answers "what would happen if I brake here?" — and the model learns road topology, lane geometry, and agent behavior without explicit supervision.
- **Diffusion-based video models** (e.g., Sora built on the Diffusion Transformer): trained only to generate plausible video, yet exhibiting emergent 3D consistency — object permanence, coherent camera motion — suggesting that generation at scale forces an implicit model of the world.
- **World foundation model platforms** (e.g., NVIDIA Cosmos): pre-trained prediction and transfer models intended as reusable infrastructure for Physical AI, including synthetic data generation for training autonomous vehicles and robots.
- **Unified world-model + policy** (e.g., WorldVLA): action tokens and future observation tokens are generated in one autoregressive sequence, so the policy and the dynamics model are the same network — rollouts in "imagination" can score candidate action sequences before execution, model-predictive control with a generative model.

The key claim behind all of these is that *dynamics can be learned from data* — traffic behavior, contact physics, lighting — rather than hand-coded, and that models trained on enough raw video acquire structured knowledge of how the world evolves.

## What a world model is not

It is useful to contrast a world model with the map a SLAM system builds:

| | SLAM map | World model |
|---|---|---|
| Encodes | Where surfaces/landmarks *are* (metric geometry) | How the world *changes* (dynamics) |
| Nature | Explicit, correctable (loop closure) | Implicit, learned, generative |
| Strength | Metric precision, cheap queries | Prediction, imagination of unseen futures |
| Weakness | Static-world assumption, no prediction | Expensive, hallucination-prone, weak metric guarantees |

Two practical caveats follow from the right-hand column. First, **hallucination**: a generative model produces *plausible* futures, not guaranteed ones, so using rollouts for safety-critical planning requires grounding (which explicit maps can provide). Second, **cost**: querying a SLAM map is nearly free; rolling out a billion-parameter video model is not — which is why proposed hybrid architectures reserve the world model for short-horizon local prediction.

## Using a world model: planning by imagination

The canonical usage pattern is model-predictive control (MPC) with a learned model. At each control step:

1. **Encode** the current observation into the model's state $s_t$ (tokens or a latent).
2. **Sample** $K$ candidate action sequences $a_{t:t+H}^{(1)}, \dots, a_{t:t+H}^{(K)}$ over a short horizon $H$.
3. **Roll out** each candidate through the model: $\hat{s}_{t+1:t+H}^{(k)} \sim p_\theta(\cdot \mid s_t, a_{t:t+H}^{(k)})$ — no real-world interaction, no hand-built simulator.
4. **Score** each imagined trajectory against the goal (task reward, distance-to-goal, collision checks).
5. **Execute** the first action of the best sequence, observe, and repeat.

This is exactly the loop WorldVLA runs with its autoregressive rollouts, and the loop the Dreamer family runs in latent space. The quality of the plan is bounded by the fidelity of step 3 — which is why so much current effort goes into scale (GAIA-1, Cosmos) and into grounding rollouts against explicit geometry.

## Why it matters for SLAM

World models and SLAM are converging answers to complementary questions — "where am I and what is here?" versus "what happens next?" A plausible future Spatial AI stack uses SLAM for global localization and metrically accurate mapping while a world model handles local prediction and planning ("simulate the next few seconds under each candidate action, anchored to my current map"). World models also feed SLAM research indirectly: they generate diverse synthetic sensor data for training learned SLAM components (the explicit goal of platforms like Cosmos), and their emergent 3D consistency raises live research questions — how much of a "map" is already latent inside a large video model, and can prediction-observation mismatch serve as a learned alternative to geometric loop closure?

## Related

- [GAIA-1](gaia-1.md)
- [Sora / DiT](sora-dit.md)
- [NVIDIA Cosmos](nvidia-cosmos.md)
- [WorldVLA](worldvla.md)
- [Spatial AI](spatial-ai.md)
