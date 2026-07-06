# NVIDIA Cosmos

> NVIDIA 2025 · [Paper](https://github.com/NVIDIA/Cosmos)

**One-line summary** — Cosmos is NVIDIA's World Foundation Model platform for Physical AI: a suite of pre-trained generative world models, tokenizers, and pipelines that produce physically plausible synthetic video/sensor data for training autonomous vehicles and robots.

## Key ideas

- **World foundation models as infrastructure**: Just as foundation language models became reusable infrastructure for NLP, Cosmos positions pre-trained, fine-tunable world models as shared infrastructure for autonomy — developers adapt a general world model to their own robots and driving fleets instead of training from scratch.
- **A platform, not a single model**: Cosmos ships a family of components, including world models for future prediction conditioned on current observations (and actions), models for transferring simulation/synthetic renderings toward photorealistic outputs, and efficient video tokenizers that convert raw visual data into compact token sequences for generative training.
- **Synthetic data for rare scenarios**: Real-world collection of dangerous or rare cases (adverse weather, near-collisions, sensor degradation) is expensive and safety-limited; a generative world model can synthesize diverse, controllable variations of such scenarios on demand.
- **Physical plausibility focus**: Unlike general text-to-video systems, the goal is data whose dynamics are consistent enough with physics to be useful for training embodied systems, with pre-training on large curated mixes of internet video, simulation, and real driving/robotics data.
- **Open weights and tooling**: Models and code are released openly (GitHub/Hugging Face), making it one of the most accessible entry points into world-model research.

## Why it matters for SLAM

Cosmos represents the industrialization of the world-model idea pioneered by systems like GAIA-1: vertically integrated hardware, simulation (Omniverse), and foundation models for Physical AI. For SLAM, its most direct relevance is training-data generation — synthetic multi-sensor sequences can augment scarce real data for learned SLAM components — and its sim-to-real transfer capability addresses the domain gap that limits SLAM systems trained in simulation.

## Related

- [World model](world-model.md)
- [GAIA-1](gaia-1.md)
- [Sora / DiT](sora-dit.md)
- [World Labs / Marble](world-labs-marble.md)

[Back to Level 11](../README.md#level-11-world-models--spatial-ai)
