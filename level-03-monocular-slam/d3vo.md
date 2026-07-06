# D3VO

> Yang 2020 · [Paper](https://arxiv.org/abs/2003.01060)

**One-line summary** — Integrated three deep networks — depth, pose, and aleatoric uncertainty — into the DSO-style direct VO framework, leveraging learned priors while keeping the geometric rigour of photometric bundle adjustment.

## Key ideas

- **Deep depth**: a self-supervised monocular depth network provides depth priors that initialise the inverse depths in the direct VO backend, improving convergence and supplying scale.
- **Deep pose**: a pose network predicts relative pose priors that initialise and constrain tracking, helping in textureless or degenerate regions where photometric alignment struggles.
- **Deep aleatoric uncertainty**: a learned per-pixel uncertainty map weights the photometric residuals, downweighting pixels the network predicts to be unreliable (e.g. non-Lambertian surfaces, moving objects).
- **Priors + optimisation, not priors instead of optimisation**: all three networks feed into a classical direct sliding-window bundle adjustment rather than replacing it.

## Why it matters for SLAM

D3VO is the culmination of the "deep priors inside a direct VO backend" line that runs CNN-SLAM → DVSO → D3VO: each step incorporated more learned quantities into the classical pipeline. It showed convincingly that deep networks and geometric optimisation are complementary rather than competing, achieving strong monocular VO results on standard benchmarks, and its uncertainty-weighted residual design became an influential pattern in later hybrid systems.

## Related

- [DSO](dso.md)
- [DVSO](dvso.md)
- [CNN-SLAM](cnn-slam.md)
- [MonoDepth](../level-05-deep-learning/monodepth.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
