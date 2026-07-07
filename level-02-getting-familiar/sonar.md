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

## The measurement model, quantitatively

Range comes from time-of-flight: $r = c\,t/2$ for echo delay $t$ and sound speed $c$. Two consequences follow directly. First, $c$ is not a constant — in water it varies with temperature, salinity, and depth by several percent, so serious systems carry a sound-velocity profile; ignoring it biases every range. Second, propagation is *slow*: at 30 m range underwater the echo takes 40 ms, so a scanning sonar sweeping hundreds of beams produces a full "image" over seconds, during which the vehicle moves — sonar SLAM has a motion-distortion problem like a spinning LiDAR's, but two orders of magnitude worse.

For a **forward-looking imaging sonar**, a 3D point at spherical coordinates $(r, \theta, \phi)$ (range, bearing, elevation) is imaged at

$$\mathbf{z} = (r, \theta),$$

i.e. the elevation angle $\phi$ is integrated out — every point on an elevation arc of radius $r$ at bearing $\theta$ lands on the same image pixel. Compare a camera, which measures $(\theta, \phi)$ (two angles) and loses range: sonar and camera lose *complementary* dimensions, which is why opti-acoustic fusion (camera + sonar) is such a natural pairing underwater and why two sonar views from different poses can triangulate what one cannot.

For wide-beam ultrasonic rangers, the classical **inverse sensor model** for occupancy grids captures the arc ambiguity honestly: a return at range $r$ raises occupancy probability along the arc at $r$ inside the beam cone, lowers it in the cone interior closer than $r$, and says nothing beyond — integrating many such soft updates from different poses is what turns ambiguous single readings into a usable map, and it is the founding example of probabilistic robot mapping.

Because of these ambiguities, sonar SLAM leans heavily on probabilistic modelling: wide-beam measurement models in occupancy grids, robust outlier handling for multipath, and acoustic feature extraction from sonar images for data association. Fusion with proprioceptive sensing (DVL — Doppler velocity log, IMU, depth/pressure sensors) is standard practice underwater.

## Common pitfalls

- **Treating a sonar return as a point measurement** — it is an arc (or a cone slice); collapsing it to the beam axis biases maps and breaks data association. Model the beam width.
- **Crosstalk and self-interference** — multiple transducers firing together hear each other's pulses; ring configurations must interleave firing schedules.
- **Specular dropout is systematic, not random** — smooth walls at oblique incidence reliably return nothing; treating "no return" as "free space" carves phantom corridors through real walls.
- **Assuming constant sound speed** — thermoclines refract acoustic paths and shift ranges; deep-water work needs sound-velocity correction.
- **Ignoring intra-scan motion** — registering a mechanically scanned sonar sweep as a rigid scan smears features; deskew with DVL/IMU odometry exactly as LiDAR pipelines deskew spinning scans.

## Why it matters for SLAM

Underwater is one of the last domains where visual SLAM fundamentally cannot operate alone, and sonar is what fills the gap — subsea inspection, marine archaeology, and AUV navigation all run on acoustic SLAM. Historically, sonar is also where SLAM began: the field's foundational probabilistic mapping ideas were developed on sonar-equipped robots, and the wide-beam measurement models built for them still inform how we treat highly ambiguous sensors today.

## Related

- [RADAR](radar.md)
- [LiDAR](lidar.md)
- [Exteroceptive sensor](exteroceptive-sensor.md)
