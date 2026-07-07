# FutureMapping 1

> Davison 2018 · [Paper](https://arxiv.org/abs/1803.11288)

**One-line summary** — Visionary position paper arguing that SLAM will evolve into general "Spatial AI", and that closing the gap to real products requires co-designing algorithms with graph processors and novel sensors — matching the sparse graph structure of SLAM computation to the hardware it runs on.

## Problem

A big gap remains between the visual perception performance that devices such as augmented-reality eyewear or consumer robots will require and what is possible within the constraints imposed by real products — power, size, cost, latency (prototype systems like SemanticFusion need heavy compute for a fraction of the needed capability). Davison argues the fundamental bottleneck is the mismatch between Spatial AI's computational structure — distributed, sparse, graph-structured estimation coupled to learned components — and centralized, memory-bottlenecked CPU/GPU architectures, where data movement dominates cost. Closing the gap demands joined-up design of algorithms, processors, and sensors.

## Method & architecture

This is an analysis/position paper, so its "method" is an architectural argument rather than an algorithm with equations.

- **From SLAM to Spatial AI.** The goal is not abstract scene understanding but an embodied, real-time, closed-loop capability: (1) incrementally build and refine a *persistent world model* (geometric, appearance, and semantic, with bounded storage per region of space) while estimating camera state; (2) compare each new image against the model (data association) with low latency; (3) update via tracking and map update. A fully generative dense model is prized because every pixel can be checked against a prediction — "to recognise something unusual, keep a full predictive model of what is normal."
- **Graphs in SLAM.** The paper identifies the natural graph structures: the regular *image graph* of pixels, the irregular multi-scale *map graph* of a reconstructed scene, the dynamically changing image/model correspondence between them, and the *computation graph* of the real-time loop (drawn concretely by extending the SLAMBench analysis of KinectFusion), whose elements are CNN labelling, rendering (model-to-image prediction), tracking, fusion, map consolidation, relocalisation/loop closure detection, map consistency optimization, and self-supervised learning.
- **Proposed device architecture ("Spatial AI brain").** A main processor combining a *map store* — the world model distributed across many cores whose interconnect mirrors the map graph topology, refining itself in place (clustering, segmentation, loop closure detection/optimization, regularisation) — and a *real-time loop* region for the massively parallel image-facing computation; plus camera interfaces that run predictive models of each sensor. Loop closure and bundle adjustment are singled out as graph algorithms "well suited to implementation in a message passing manner on a graph processor."
- **Hardware landscape.** CPUs/GPUs need costly data transfer between separate compute and memory; embedded vision chips (Movidius Myriad, HoloLens HPU) are ad hoc. The interesting bets are storage-and-compute-distributed graph/neuromorphic designs: Graphcore's IPU (thousands of interconnected cores, each with local memory, programs compiled to a graph topology by Poplar) and SpiNNaker (up to a million ARM cores).
- **Close-to-sensor processing and generalized event cameras.** Processing should also move into or near the sensor — e.g., the SCAMP5 vision chip (256×256 pixels, 1.2 W, per-pixel analog compute for local operations like TV-L1-style optical flow) — and the event camera concept should generalize: with model predictions sent to the camera, an ideal sensor transmits only where data *differs from the prediction*.
- **Return of active vision.** Bottom-up "brute force" processing won every round since MonoSLAM-era active search, but graph processors make top-down, prediction-driven allocation of computation (in the spirit of SLAM++'s object-level maps) attractive again.

## Results

As a position paper it reports no experiments; its output is a set of predictions and a research program (see paper for the full argument, including a proposed multi-objective set of Spatial AI metrics — local pose accuracy/drift, pose repeatability, tracking and relocalisation robustness, latency, per-pixel dense distance prediction accuracy, object segmentation/classification accuracy, AR pixel registration, scene change detection, power usage, and data movement in bits×millimetres — intended to replace pure trajectory benchmarks). The concrete follow-ups it seeded validate the program: FutureMapping 2 (the GBP framework), Bundle Adjustment on a Graph Processor (the first IPU demonstration), and distributed multi-robot GBP (DANCeRS). It also coined the "Spatial AI" framing that now labels a whole subfield.

## Why it matters for SLAM

This paper reframed the research agenda of a significant part of the SLAM community: it coined the "Spatial AI" framing and launched the graph-processor research program (FutureMapping 2, bundle adjustment on the IPU, distributed multi-robot GBP). Even where its specific hardware bets have not yet materialized commercially, its argument — that perception algorithms and compute substrates must be co-designed around sparse graph structure — shapes how people think about SLAM on AR glasses and embedded robots.

## Related

- [FutureMapping 2](futuremapping-2.md) — the technical follow-up detailing GBP
- [BA on Graph Processor](ba-on-graph-processor.md) — bundle adjustment demonstrated on the IPU
- [DANCeRS](dancers.md) — distributed GBP for multi-robot systems
- [Spatial AI](../level-11-world-models-spatial-ai/spatial-ai.md) — the broader concept this paper articulated
- [Event cameras (DVS)](../level-10-event-camera-slam/event-cameras-dvs.md) — the neuromorphic sensing direction it generalizes
