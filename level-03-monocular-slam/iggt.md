# IGGT

> Li 2025 · [Paper](https://arxiv.org/abs/2510.22706)

**One-line summary** — An instance-grounded geometry transformer that unifies feed-forward 3D reconstruction with instance-level scene understanding in a single model, instead of bolting semantics onto a separately reconstructed map.

## Key ideas

- **Unified geometry + understanding**: most pipelines first reconstruct geometry (SfM, pointmap regressors like DUSt3R/VGGT) and then attach semantics from 2D models in a post-hoc step. IGGT trains one large transformer to produce both spatial reconstruction and instance-level contextual features together.
- **Feed-forward, VGGT-style inference**: like other geometry foundation models, it maps a set of input images directly to 3D outputs in a forward pass, rather than running per-scene optimisation.
- **Instance grounding**: the model's representation groups geometry by object instance consistently across views, so the resulting 3D reconstruction can be clustered into coherent instances rather than an undifferentiated point set.
- **Bridge to open-vocabulary understanding**: instance-grounded features are designed to connect with vision-language models, enabling instance-level querying of the reconstructed scene.

## Why it matters for SLAM

The trajectory of the DUSt3R/VGGT family is toward foundation models that give SLAM systems dense geometry for free; IGGT extends that trend to *what* is in the scene, not just where surfaces are. For Spatial AI applications — robot manipulation, semantic navigation, AR — a map segmented into 3D-consistent object instances is far more actionable than raw geometry, and doing it in one unified model avoids the inconsistencies of stitching 2D segmentations onto 3D maps.

## Related

- [VGGT](vggt.md)
- [DUSt3R](dust3r.md)
- [VGGT-SLAM](vggt-slam.md)
- [ConceptFusion](conceptfusion.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
