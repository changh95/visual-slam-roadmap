# RT-2

> Brohan (DeepMind) 2023 · [Paper](https://arxiv.org/abs/2307.15818)

**One-line summary** — RT-2 represents robot actions as text tokens and co-fine-tunes a large vision-language model on both web-scale vision-language data and robot trajectories, transferring internet knowledge into robotic control and coining the term "vision-language-action" (VLA) model.

## Problem

Traditional robot learning is data-hungry and brittle: the most capable language and vision-language models are trained on billions of tokens and images from the web — an amount unlikely to be matched with robot data in the near future. Prior attempts to bring LLMs/VLMs into robotics mostly used them as high-level planners parsing commands into primitives executed by separate low-level controllers, which never benefit from web knowledge. RT-2 asks: can large pretrained vision-language models be integrated *directly into low-level robotic control* to boost generalization and enable emergent semantic reasoning?

## Method & architecture

- **Backbones**: two pre-trained VLMs are adapted into VLAs — **PaLI-X** (5B and 55B) and **PaLM-E** (12B), giving RT-2-PaLI-X and RT-2-PaLM-E. Both take images plus text and emit token sequences; no new parameters or action heads are added.
- **Actions as text tokens**: the action space is the 6-DoF positional and rotational displacement of the end-effector, plus gripper extension and a discrete episode-termination command. Each continuous dimension is discretized into 256 uniform bins, so an action becomes 8 integers, concatenated into a single string:

$$\text{“terminate} \enspace \Delta\text{pos}_{x} \enspace \Delta\text{pos}_{y} \enspace \Delta\text{pos}_{z} \enspace \Delta\text{rot}_{x} \enspace \Delta\text{rot}_{y} \enspace \Delta\text{rot}_{z} \enspace \text{gripper-extension”}$$

  e.g. `"1 128 91 241 5 101 127"`. For PaLI-X, integers up to 1000 already have unique tokens; for PaLM-E, the 256 least-frequently-used tokens are overwritten as action tokens (a form of symbol tuning). Robot data is cast in VQA format: *"Q: what action should the robot take to [instruction]? A:"* followed by the action string.
- **Co-fine-tuning**: the key training recipe — the VLM is fine-tuned on a *mixture* of the original web-scale vision-language tasks (VQA, captioning, interleaved image-text) and RT-1's robot demonstrations (13 robots over 17 months in an office-kitchen environment), with robot data up-weighted per batch. This preserves web concepts instead of overwriting them with robot data.
- **Constrained decoding**: when prompted with a robot task, sampling is restricted to valid action tokens; on vision-language tasks the full vocabulary remains available.
- **Real-time inference**: the models run in a multi-TPU cloud service queried over the network — the 55B model at 1-3 Hz, the 5B model at ~5 Hz — the largest model used for direct closed-loop robotic control at the time by over an order of magnitude.
- **Chain-of-thought variant**: RT-2-PaLM-E is fine-tuned for a few hundred steps on data augmented with a "Plan:" step (e.g. *"Instruction: I'm hungry. Plan: pick rxbar chocolate. Action: 1 128 124 136 121 158 111 255"*), bridging visual reasoning and action generation.

## Results

Evaluated over ~6,000 real-robot trials on a 7-DoF mobile manipulator:

- **Seen tasks vs generalization**: on 200+ seen instructions RT-2 performs similarly to RT-1, but on 280+ unseen-object/background/environment tasks both RT-2 instantiations average roughly **2x the success rate of RT-1 and MOO and ~6x the other baselines** (VC-1, R3M).
- **Emergent capabilities** (symbol understanding, reasoning, human recognition — none present in robot data): RT-2-PaLI-X-55B averages **60%** success vs RT-1's 17% and VC-1's 11% — a ~3x improvement; RT-2-PaLM-E-12B averages 40% but is stronger on math-style reasoning.
- **Ablations**: training from scratch is very poor even at 5B; co-fine-tuning beats robot-only fine-tuning at every size; 55B generalizes better than 5B.
- **Language-Table (open-source sim)**: RT-2-PaLI-3B scores **90 ± 10** vs RT-1's 74 ± 13, LAVA's 77 ± 4, and BC-Zero's 72 ± 3.
- **Limitation**: no new *motions* emerge — physical skills stay within the robot-data distribution; the web knowledge changes how skills are deployed, not which skills exist.

## Why it matters for SLAM

RT-2 established the actions-as-tokens VLA paradigm that OpenVLA, NaVILA, WorldVLA, and most subsequent robot foundation models adopted, and it demonstrated that web-scale pretraining genuinely transfers to embodied control. For SLAM researchers, it frames the key open question of the Spatial AI era: if web knowledge lets a policy generalize to novel objects, can SLAM-style spatial knowledge (metric maps, persistent geometry) be injected the same way to generalize across novel environments and long-horizon navigation?

## Related

- [OpenVLA](openvla.md)
- [VLM vs VLA](vlm-vs-vla.md)
- [LLaVA](llava.md)
- [WorldVLA](worldvla.md)
- [NaVILA](navila.md)
