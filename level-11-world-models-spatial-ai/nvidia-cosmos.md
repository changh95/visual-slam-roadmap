# NVIDIA Cosmos

> NVIDIA 2025 · [Paper](https://github.com/NVIDIA/Cosmos)

**One-line summary** — Cosmos is NVIDIA's World Foundation Model platform for Physical AI: a suite of pre-trained generative world models, tokenizers, and pipelines that produce physically plausible synthetic video/sensor data for training autonomous vehicles and robots.

## Problem

Training autonomous systems requires vast amounts of diverse sensor data, including rare and dangerous scenarios — construction zones, adverse weather, near-collisions, sensor degradation — that are exactly the cases hardest and least safe to collect in the real world. Simulators can synthesize such cases but suffer a sim-to-real appearance and dynamics gap. Cosmos bets that a *world foundation model* — a large pre-trained generative model of how visual scenes evolve — can generate photorealistic, physically plausible scenarios on demand and be fine-tuned to any specific Physical AI application.

## Key ideas

- **World foundation models as infrastructure**: just as foundation language models became reusable infrastructure for NLP, Cosmos positions pre-trained, fine-tunable world models as shared infrastructure for autonomy — developers adapt a general world model to their own robots and driving fleets instead of training from scratch.
- **A platform, not a single model**: Cosmos ships a family of components — world models for *future prediction* conditioned on current observations (and optionally actions); *transfer* models that move simulation or synthetic renderings toward photorealistic outputs (a learned sim-to-real bridge); and efficient video *tokenizers* that compress raw visual data into compact token sequences for generative training.
- **Physical plausibility as the design goal**: unlike general-purpose text-to-video systems judged on aesthetics, the target is data whose dynamics are consistent enough with physics to be useful for training embodied systems — object permanence, coherent motion, and plausible interaction outcomes matter more than cinematic quality.
- **Scaled, curated pre-training**: models are pre-trained on large curated mixes of internet video plus simulation and real driving/robotics data, then adapted via fine-tuning to customer-specific domains (a particular robot embodiment, a particular sensor rig or fleet).
- **Open weights and tooling**: models and code are released openly (GitHub/Hugging Face), making Cosmos one of the most accessible entry points into world-model research and a de facto baseline platform for Physical AI data generation.

## Results & impact

Cosmos turned the "world model as data factory" idea demonstrated by GAIA-1 into a broadly available product line integrated with NVIDIA's simulation (Omniverse) and hardware stack, and it is widely used as a starting point for synthetic data generation and world-model fine-tuning in robotics and AV development. As a fast-moving industrial platform without a single canonical results table, this note deliberately stays qualitative; consult the Cosmos technical reports on the linked repository for current model variants and benchmarks.

## Why it matters for SLAM

Cosmos represents the industrialization of the world-model idea pioneered by systems like GAIA-1: vertically integrated hardware, simulation (Omniverse), and foundation models for Physical AI. For SLAM, its most direct relevance is training-data generation — synthetic multi-sensor sequences can augment scarce real data for learned SLAM components — and its sim-to-real transfer capability addresses the domain gap that limits SLAM systems trained in simulation.

## Related

- [World model](world-model.md)
- [GAIA-1](gaia-1.md)
- [Sora / DiT](sora-dit.md)
- [World Labs / Marble](world-labs-marble.md)

[Back to Level 11](../README.md#level-11-world-models--spatial-ai)
