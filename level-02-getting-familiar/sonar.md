# Sonar

**Sonar** (Sound Navigation and Ranging) measures range by emitting acoustic pulses and timing the echo. It is the acoustic sibling of LiDAR and RADAR, and it appears in two very different corners of robotics:

- **Ultrasonic rangers** on ground robots: cheap, short-range (a few metres) transducers that return the distance to the nearest obstacle inside a wide beam cone. They powered much of early mobile robotics — the classic occupancy-grid mapping work of the 1980s was developed around rings of ultrasonic sensors — and they survive today as parking sensors and low-cost obstacle detectors.
- **Underwater sonar**: in water, cameras see only metres (turbidity, darkness) and electromagnetic sensors like LiDAR, RADAR, and GPS are strongly attenuated — but sound travels far. Sonar is therefore *the* exteroceptive sensor for underwater robots (AUVs/ROVs). Variants include single-beam and multibeam echo sounders (bathymetry), mechanically scanning sonar, side-scan sonar, and forward-looking imaging sonar, which produces 2D acoustic images used for underwater SLAM.

The sensing characteristics that make sonar-based estimation hard:

| Property | Consequence for SLAM |
|---|---|
| Wide beam / low angular resolution | A single return constrains the obstacle to lie somewhere on an arc, not at a point |
| Specular reflection | Smooth surfaces at oblique angles bounce the pulse away — no return, or multipath ghosts |
| Slow propagation (approx. 340 m/s in air, approx. 1500 m/s in water) | Low measurement rates; range-dependent latency |
| Imaging sonar projection | Elevation angle is lost, an ambiguity analogous to (but different from) a camera's lost depth |

Because of these ambiguities, sonar SLAM leans heavily on probabilistic modelling: wide-beam measurement models in occupancy grids, robust outlier handling for multipath, and acoustic feature extraction from sonar images for data association. Fusion with proprioceptive sensing (DVL — Doppler velocity log, IMU, depth/pressure sensors) is standard practice underwater.

## Why it matters for SLAM

Underwater is one of the last domains where visual SLAM fundamentally cannot operate alone, and sonar is what fills the gap — subsea inspection, marine archaeology, and AUV navigation all run on acoustic SLAM. Historically, sonar is also where SLAM began: the field's foundational probabilistic mapping ideas were developed on sonar-equipped robots, and the wide-beam measurement models built for them still inform how we treat highly ambiguous sensors today.

## Related

- [RADAR](radar.md)
- [LiDAR](lidar.md)
- [Exteroceptive sensor](exteroceptive-sensor.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
