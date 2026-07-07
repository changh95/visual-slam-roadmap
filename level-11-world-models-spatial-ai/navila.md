# NaVILA

> Cheng 2024 · [Paper](https://arxiv.org/abs/2412.04453)

**One-line summary** — NaVILA extends the vision-language-action paradigm from tabletop manipulation to legged-robot navigation, pairing a vision-language model with a low-level locomotion policy so a robot can follow natural-language instructions through real 3D environments.

## Problem

Vision-and-Language Navigation (VLN) with legged robots is attractive twice over: language is a flexible way for humans to command robots, and legs let the robot traverse challenging, cluttered scenes that defeat wheeled bases. But it is non-trivial to translate a human language instruction *all the way down* to low-level leg joint actions — the gap between "go past the sofa into the kitchen" and 12+ joint torques at high control rates is far wider than the gap VLAs bridge for tabletop end-effector control.

## Key ideas

- **A 2-level framework**: NaVILA unifies a vision-language-action model with locomotion skills, rather than asking one network to do everything. The VLA handles semantic instruction following; a separate locomotion policy handles the body.
- **Language as the action interface**: instead of directly predicting low-level actions, the VLA first generates *mid-level actions with spatial information expressed in language* — e.g., "moving forward 75cm." This textual command becomes the input to the lower level. Language is human-readable, keeps the VLA in its native output space, and is naturally embodiment-agnostic.
- **RL locomotion policy for execution**: a visual locomotion policy trained with reinforcement learning consumes the mid-level command and produces joint-level control, absorbing terrain adaptation and balance. The VLA therefore never needs raw motor data for training.
- **Decoupled generalization**: because the locomotion policy owns the embodiment-specific control problem, the same high-level vision-language navigation model can drive different robots — the roadmap's framing of "legged/wheeled-robot VLA" — including terrain such as stairs and clutter that wheeled platforms cannot handle.
- **Better benchmarks**: beyond existing VLN benchmarks, the authors built new benchmarks on IsaacLab featuring more realistic scenes, genuine low-level control (not teleport-style discrete moves), and accompanying real-world robot experiments.

## Results & impact

NaVILA substantially improves over previous approaches on existing VLN benchmarks, and shows the same advantages on the newly developed IsaacLab benchmarks with realistic scenes and low-level control. The approach was also demonstrated in real-world robot experiments, making it one of the first convincing demonstrations that the VLA paradigm extends from manipulation to whole-robot navigation on legged platforms. (Specific benchmark numbers are in the paper; only qualitative claims are reproduced here.)

## Why it matters for SLAM

NaVILA is a concrete example of the foundation-model challenge to classical SLAM-based navigation stacks: it replaces the explicit map-build-then-plan pipeline with an instruction-conditioned policy. At the same time, its hierarchical design shows where SLAM still fits — metric localization, geometric memory, and safety layers are complementary to a VLA's semantic instruction following, and hybrid systems that give VLAs SLAM-grounded spatial memory are an active research direction.

## Related

- [RT-2](rt-2.md)
- [OpenVLA](openvla.md)
- [LLaVA](llava.md)
- [VLM vs VLA](vlm-vs-vla.md)
- [Spatial AI](spatial-ai.md)

[Back to Level 11](../README.md#level-11-world-models--spatial-ai)
