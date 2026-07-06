# NaVILA

> Cheng 2024 · [Paper](https://arxiv.org/abs/2412.04453)

**One-line summary** — NaVILA extends the vision-language-action paradigm from tabletop manipulation to legged-robot navigation, pairing a vision-language model with a low-level locomotion policy so a robot can follow natural-language instructions through real 3D environments.

## Key ideas

- **VLA for navigation, not manipulation**: Prior VLAs (RT-2, OpenVLA) output end-effector commands for largely static tabletop scenes. Navigation requires long-horizon reasoning through large spaces and whole-body locomotion — a qualitatively different action space.
- **Hierarchical action decomposition**: The vision-language model reasons from egocentric images and language instructions and issues mid-level navigation commands (direction, distance/speed of motion), while a separately trained low-level locomotion controller turns those commands into joint-level control. This decoupling lets the VLA be trained without raw motor data.
- **Legged and wheeled embodiments**: Because the locomotion policy absorbs the embodiment-specific control problem, the same high-level vision-language navigation model can drive robots that walk or roll, including terrain (stairs, clutter) that wheeled bases cannot handle.
- **Mapless semantic navigation**: The system follows instructions like "go to the kitchen" directly from egocentric observations, collapsing the classical perception-map-plan-control pipeline into a learned policy with language in the loop.

## Why it matters for SLAM

NaVILA is a concrete example of the foundation-model challenge to classical SLAM-based navigation stacks: it replaces the explicit map-build-then-plan pipeline with an instruction-conditioned policy. At the same time, its hierarchical design shows where SLAM still fits — metric localization, geometric memory, and safety layers are complementary to a VLA's semantic instruction following, and hybrid systems that give VLAs SLAM-grounded spatial memory are an active research direction.

## Related

- [RT-2](rt-2.md)
- [OpenVLA](openvla.md)
- [VLM vs VLA](vlm-vs-vla.md)
- [Spatial AI](spatial-ai.md)

[Back to Level 11](../README.md#level-11-world-models--spatial-ai)
