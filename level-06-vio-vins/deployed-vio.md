# Deployed VIO

The highest-volume SLAM systems in the world are not research codebases — they are the VIO stacks inside consumer XR and mobile devices. Meta Quest headsets, Apple's ARKit (iPhone/iPad, Vision Pro), and Google's ARCore each run visual-inertial tracking on hundreds of millions of devices. They are worth studying as case studies because their constraints differ sharply from the benchmarks that academic systems optimize for.

## What a commercial XR stack looks like

The common recipe is inside-out tracking:

- **Sensors**: multiple wide-FoV grayscale cameras (headsets typically use several; phones use one) plus one or more IMUs, hardware-synchronized.
- **Estimator**: a tightly-coupled visual-inertial estimator — sliding-window optimization or filtering — running continuously on-device.
- **Extras on headsets**: tracking of hand-held controllers and (on recent devices) hands, layered on top of the head-pose estimate.
- **Developer surface**: phone AR frameworks like ARKit and ARCore expose the VIO output as 6-DoF camera poses plus sparse feature points, plane detections, tracking-quality state, and persistent anchors.

Public technical detail is limited (these are proprietary systems), but the broad architecture — multi-camera + IMU tightly-coupled estimation with a relocalization/mapping layer — matches the open literature this level covers.

## Benchmark priorities vs product priorities

| | Academic benchmark | Shipped device |
|---|---|---|
| Primary metric | trajectory RMSE | perceived tracking failures per hour |
| Environment | curated datasets | every bedroom, office, train, and mirror |
| Compute | desktop CPU/GPU | shared mobile SoC, hard power budget |
| Calibration | done offline, assumed correct | drifts with temperature and drops; refined online |
| Initialization | expert-recorded excitation | whatever motion an untrained user provides |
| Failure handling | sequence excluded / reported | must degrade gracefully, recover invisibly |

## What deployment changes about the problem

- **Robustness beats accuracy.** A benchmark cares about RMSE; a headset cares that tracking *never* visibly fails — across dark bedrooms, blank walls, mirrors, moving trains, and users who shake their heads violently. Enormous engineering goes into degraded-mode behavior, fast relocalization, and graceful fallback (e.g., dropping to 3-DoF rotational tracking when visual features vanish) rather than peak accuracy. Failure taxonomies — low light, low texture, dynamic scenes, sensor saturation — drive the roadmap more than benchmark leaderboards.
- **Latency and power are hard constraints.** Motion-to-photon latency must stay low enough (combined with pose prediction and late-stage reprojection of rendered frames) to avoid motion sickness, and the whole stack must run continuously within a mobile power budget, sharing the SoC with rendering. This drives lightweight front-ends, fixed-point/DSP implementations, dedicated co-processors, and careful thread scheduling — and is why MSCKF-class efficiency (accuracy per CPU cycle) matters more here than anywhere else.
- **Calibration at scale.** Millions of units mean per-device factory calibration plus *online* refinement of camera-IMU extrinsics, intrinsics, and time offset — devices deform with temperature and drops. Online calibration, a research topic in OpenVINS-era papers, is table stakes in production.
- **Mapping is a product feature.** Persistent anchors, shared/cloud anchors for multi-user AR, and headset "roomscale" boundary systems are map reuse and relocalization problems — the deployed cousins of loop closure and multi-session mapping (the problem maplab tackled in the open literature).
- **Privacy and safety constraints** shape what can be stored or uploaded: maps are typically abstracted (feature descriptors and geometry, not photos) and processed on-device where possible.
- **The user is part of the system.** Initialization must work with whatever motion an untrained user provides (no "excite all axes" instructions), and observability-driven degradations (hover-like stillness, pure rotation) must be handled invisibly — a sharp contrast with datasets recorded by experts who know what VIO needs.

## Why study them without source code?

Three reasons. First, the constraint set explains *why* the open literature looks the way it does: efficiency-obsessed filters, online calibration, fast relocalization, and consistency machinery are exactly what shipping products need. Second, the public artifacts — developer APIs (anchors, plane detection, tracking-state notifications), device teardowns, and published talks/papers from these teams — are informative about architecture even when implementations stay closed. Third, many open systems in this roadmap were written by people who came from or went to these teams; the design DNA is shared.

## What to take away

Treat deployed VIO as the *requirements document* for this level: any open system you study can be graded against the deployment checklist — What happens in the dark? How fast is relocalization? Does it estimate its own calibration? Does it degrade gracefully? How many milliwatts? — and the gaps you find are the research problems industry actually pays for.

## Why it matters for SLAM
Deployed VIO is proof that the material in this level is not academic: MSCKF-style filtering, preintegration, online calibration, and observability-aware design are exactly what ships in consumer devices. Studying the deployment constraints (robustness, latency, power, calibration drift) tells you which research problems industry actually pays for — and explains design choices in open systems written by authors who came from or went to these teams.

## Related
- [Tightly-coupled vs Loosely-coupled](tightly-coupled-vs-loosely-coupled.md) — the architecture deployed stacks use.
- [MSCKF](msckf.md) — the efficient filtering approach suited to embedded compute budgets.
- [OpenVINS](openvins.md) — open-source system with the online calibration machinery production stacks need.
- [OKVIS](okvis.md) — keyframe sliding-window VIO from an era of early AR/MAV deployment work.
- [maplab](maplab.md) — multi-session mapping and relocalization, the research analogue of persistent anchors.
- [Observability](observability.md) — the theory behind graceful handling of degenerate user motion.
