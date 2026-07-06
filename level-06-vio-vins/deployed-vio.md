# Deployed VIO

The highest-volume SLAM systems in the world are not research codebases — they are the VIO stacks inside consumer XR and mobile devices. Meta Quest headsets, Apple's ARKit (iPhone/iPad, Vision Pro), and Google's ARCore each run visual-inertial tracking on hundreds of millions of devices. They are worth studying as case studies because their constraints differ sharply from the benchmarks that academic systems optimize for.

**What a commercial XR stack looks like.** The common recipe is inside-out tracking: multiple wide-FoV grayscale cameras (headsets typically use several; phones use one) plus one or more IMUs, fused in a tightly-coupled estimator. Headsets additionally track hand-held controllers and (on recent devices) hands. Phone AR frameworks like ARKit and ARCore expose the VIO output as 6-DoF camera poses plus sparse feature points, plane detections, and persistent anchors to app developers.

**What deployment changes about the problem:**

- **Robustness beats accuracy.** A benchmark cares about RMSE; a headset cares that tracking *never* visibly fails — across dark bedrooms, blank walls, mirrors, moving trains, and users who shake their heads violently. Enormous engineering goes into degraded-mode behavior, fast relocalization, and graceful fallback (e.g., 3-DoF rotational tracking) rather than peak accuracy.
- **Latency and power are hard constraints.** Motion-to-photon latency must stay low enough (combined with prediction and reprojection) to avoid motion sickness, and the whole stack must run continuously within a mobile power budget, sharing the SoC with rendering. This drives lightweight front-ends, fixed-point/DSP implementations, and careful thread scheduling.
- **Calibration at scale.** Millions of units mean per-device factory calibration plus *online* refinement of camera-IMU extrinsics, intrinsics, and time offset — devices deform with temperature and drops. Online calibration, a research topic in OpenVINS-era papers, is table stakes in production.
- **Mapping is a product feature.** Persistent anchors, shared/cloud anchors for multi-user AR, and headset "roomscale" boundaries are map reuse and relocalization problems — the deployed cousins of loop closure and multi-session mapping.
- **Privacy and safety constraints** shape what can be stored or uploaded: maps are typically abstracted (feature descriptors, not photos) and processed on-device where possible.

Public technical detail is limited (these are proprietary systems), but the broad architecture — multi-camera + IMU tightly-coupled estimation with sliding-window optimization or filtering, plus a relocalization/mapping layer — matches the open literature this level covers.

## Why it matters for SLAM
Deployed VIO is proof that the material in this level is not academic: MSCKF-style filtering, preintegration, online calibration, and observability-aware design are exactly what ships in consumer devices. Studying the deployment constraints (robustness, latency, power, calibration drift) tells you which research problems industry actually pays for — and explains design choices in open systems written by authors who came from or went to these teams.

## Related
- [Tightly-coupled vs Loosely-coupled](tightly-coupled-vs-loosely-coupled.md) — the architecture deployed stacks use.
- [MSCKF](msckf.md) — the efficient filtering approach suited to embedded compute budgets.
- [OpenVINS](openvins.md) — open-source system with the online calibration machinery production stacks need.
- [OKVIS](okvis.md) — keyframe sliding-window VIO from an era of early AR/MAV deployment work.
- [maplab](maplab.md) — multi-session mapping and relocalization, the research analogue of persistent anchors.

[Back to Level 6](../README.md#level-6-vio--vins)
