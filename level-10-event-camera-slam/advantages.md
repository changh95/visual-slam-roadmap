# Advantages

Event cameras offer four headline advantages over conventional frame cameras, all of which follow directly from the per-pixel, change-driven sensing principle.

- **High dynamic range (140 dB+)**. Each pixel compares *log*-luminance against a relative threshold, so the sensor responds to contrast rather than absolute brightness. The result is a dynamic range of roughly 140 dB versus about 60 dB for standard cameras — no saturation in direct sunlight, no signal loss in dark corridors, and usable output in scenes that mix both (e.g., driving out of a tunnel).

- **No motion blur**. Blur in a frame camera is a temporal integration artifact: the shutter stays open while the scene moves. Events have no exposure window — each event encodes the exact instant an intensity edge crossed a pixel — so fast motion produces *more* events rather than smeared ones.

- **Low latency (microseconds)**. A pixel fires as soon as its threshold is crossed, with sub-millisecond latency, instead of waiting for the next frame. This enables perception-to-action loops (e.g., obstacle avoidance on quadrotors) that are impossible at 30–60 Hz frame rates, and provides motion information *between* the frames of a standard camera.

- **Low power and bandwidth**. Pixels are silent when nothing changes, so a mostly static scene generates very little data. Average bandwidth and power consumption are far below those of a frame camera streaming full images, which is attractive for battery-powered and always-on devices.

A useful mental model: an event camera trades absolute intensity for temporal precision and dynamic range. It excels precisely where frame cameras fail (fast, dark, high-contrast) and is weakest where frame cameras are comfortable (slow or static, texture-rich scenes) — which is why many practical systems fuse both.

## Why it matters for SLAM

The classic failure modes of visual SLAM — motion blur during aggressive motion, dropped tracking in HDR or low-light scenes, and latency-limited control — map one-to-one onto the strengths of event cameras. This is why event-based SLAM research targets drones, AR/VR headsets, and other agile platforms. Systems like Ultimate-SLAM demonstrate the payoff concretely: fusing events with frames and IMU keeps state estimation alive in lighting and speed regimes where frame-only VIO fails outright.

## Related

- [Event cameras (DVS)](event-cameras-dvs.md)
- [Challenges](challenges.md)
- [Ultimate-SLAM](ultimate-slam.md)
- [Event-based Vision Survey](event-based-vision-survey.md)

[Back to Level 10](../README.md#level-10-event-camera-slam)
