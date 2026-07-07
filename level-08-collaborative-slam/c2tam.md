# C2TAM

> Riazuelo 2014 · [Paper](https://ieeexplore.ieee.org/document/6696630)

**One-line summary** — C2TAM (Cloud framework for Cooperative Tracking And Mapping) pioneered cloud-based collaborative monocular SLAM, offloading expensive bundle adjustment and global map management to a server while each robot keeps only lightweight real-time tracking on board.

## Problem

Collaborative monocular SLAM asks each robot to track its own pose *and* maintain a consistent global map — and the map-side cost (especially bundle adjustment) vastly exceeds what lightweight embedded platforms can sustain. Earlier collaborative systems either ran on high-end workstations, required all robots within direct communication range, or degenerated into independent SLAM runs that shared nothing. Cloud computing offers the obvious division of labor, but raises the make-or-break question: can local tracking remain stable during the latency window of a cloud round-trip (typically 100–500 ms) while waiting for the optimized map to come back?

## Key ideas

- **Tracking/mapping split across the network**: extending PTAM's two-thread decomposition, the *tracking* process runs on the robot against a locally cached copy of the map, while the *mapping* process (keyframe management, triangulation, bundle adjustment, place recognition) runs in the cloud with effectively unlimited resources.
- **Bandwidth-conscious uploads**: when the tracker selects a new keyframe, the client sends only the keyframe's 2D keypoint locations, descriptors, and current pose estimate — raw images are never transmitted. This keypoints-plus-descriptors protocol became the pattern all later centralized collaborative systems adopted.
- **Server-side global optimization**: the server accumulates keyframes from all robots, triangulates new map points from multi-view baselines, and runs full bundle adjustment
  $$\{\mathbf{T}_k^*, \mathbf{P}_j^*\} = \arg\min \sum_{k,j} \rho\!\left(\left\|\pi(\mathbf{T}_k \mathbf{P}_j) - \mathbf{u}_{kj}\right\|^2\right)$$
  over the shared global map.
- **Asynchronous map updates**: local tracking continues on the cached map during cloud round-trip latency; optimized maps are pushed back periodically and swapped in seamlessly, so the robot never blocks on the network — the answer to the latency question above.
- **Cooperative mapping and map reuse**: the server detects overlap between different clients' maps via bag-of-words place recognition plus geometric verification, aligns and fuses the submaps into one unified map used by all clients — and stored maps let new sessions relocalize into previously built environments.

## Results & impact

The system was demonstrated with small teams of simulated and real robots in indoor environments over a standard WiFi network: map merging succeeded when robots traversed overlapping regions, local tracking survived communication dropouts of up to 500 ms, and map quality was comparable to single-robot PTAM while covering a much larger area. C2TAM established the cloud-robotics division of labor for SLAM and is the direct precursor of CCM-SLAM, which rebuilt the same architecture on an ORB-SLAM backbone.

## Why it matters for SLAM

C2TAM established the cloud-robotics division of labor for SLAM — heavy optimization in the cloud, light tracking at the edge — and demonstrated that real network latency is compatible with real-time visual SLAM when the two loops are decoupled. It is the direct conceptual ancestor of CCM-SLAM and of modern centralized/cloud mapping services, and its client-server keyframe protocol remains the default template for centralized collaborative SLAM.

## Related

- [PTAM](../level-03-monocular-slam/ptam.md)
- [CCM-SLAM](ccm-slam.md)
- [Centralized vs Decentralized](centralized-vs-decentralized.md)
- [Communication constraints](communication-constraints.md)
- [Map merging](map-merging.md)

[Back to Level 8](../README.md#level-8-collaborative--multi-robot-slam)
