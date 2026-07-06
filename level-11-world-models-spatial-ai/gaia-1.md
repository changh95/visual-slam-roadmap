# GAIA-1

> Wayve 2023 · [Paper](https://arxiv.org/abs/2309.17080)

**One-line summary** — GAIA-1 ("Generative AI for Autonomy") is a generative world model that takes video, text, and ego-vehicle actions as input and generates realistic future driving scenarios with fine-grained control over ego-vehicle behavior, learning the implicit rules of road behavior from raw driving data.

## Key ideas

- **World modeling as sequence modeling**: Video frames (via a VQGAN-style discrete tokenizer), text descriptions, and discretized ego-vehicle actions are all mapped into one token sequence, and a GPT-style decoder-only Transformer is trained with the standard causal language-modeling loss $\mathcal{L} = -\sum_i \log p_\theta(s_i \mid s_{<t})$.
- **Action-conditioned future generation**: At inference the model rolls out future video tokens conditioned on past observations and candidate future actions — "what happens if I brake here?" or "what if I change lanes?" — making it a learned, queryable driving simulator.
- **Emergent world properties**: Without explicit supervision, the model captures road layout and scene structure, plausible behavior of other agents, contextual responses to text-described conditions, and geometrically consistent scenes across generated frames.
- **Scale matters**: Trained on a large fleet-collected UK driving dataset, GAIA-1 shows that world-model quality improves with data and model scale, mirroring language-model scaling behavior.

## Why it matters for SLAM

GAIA-1 established the template for "world model as simulator" in autonomous driving: instead of hand-crafted physics and behavior rules (CARLA-style simulators), dynamics are learned from raw data and queried generatively to produce diverse synthetic training scenarios. It directly inspired subsequent world foundation models such as NVIDIA Cosmos. For SLAM researchers, it poses the central Spatial AI question of how explicit metric maps should connect with implicit learned dynamics — e.g., using SLAM for localization while a world model imagines short-horizon futures for planning.

## Related

- [World model](world-model.md)
- [Sora / DiT](sora-dit.md)
- [NVIDIA Cosmos](nvidia-cosmos.md)
- [WorldVLA](worldvla.md)

[Back to Level 11](../README.md#level-11-world-models--spatial-ai)
