# Advantages

Event cameras offer four headline advantages over conventional frame cameras, all of which follow directly from the per-pixel, change-driven sensing principle. It is worth understanding *why* each one holds, because each maps onto a specific failure mode of frame-based SLAM.

## High dynamic range (140 dB+)

Each pixel compares **log-luminance** against a *relative* threshold, so the sensor responds to contrast rather than absolute brightness:

$$\Delta L = \log I(t) - \log I(t_{\text{last}}) \gtrless \pm C$$

Because the comparison is logarithmic and every pixel sets its own operating point independently, there is no global exposure setting to get wrong. The result is a dynamic range of roughly **140 dB versus about 60 dB** for standard cameras — no saturation in direct sunlight, no signal loss in dark corridors, and usable output in scenes that mix both (e.g., driving out of a tunnel, a window in a dark room). A frame camera must choose one exposure for the whole sensor; an event camera does not choose at all.

## No motion blur

Blur in a frame camera is a **temporal integration artifact**: the shutter stays open for the exposure time while the scene moves, smearing intensity across pixels. Events have no exposure window — each event encodes the exact instant an intensity edge crossed a pixel — so fast motion produces *more* events rather than smeared ones. The information content of the stream actually increases with motion speed, which is the opposite of a frame camera's behavior.

## Low latency (microseconds)

A pixel fires as soon as its threshold is crossed, with microsecond-order latency, instead of waiting for the next frame slot. Two consequences matter for robotics:

- **Perception-to-action loops** can close far faster than a 30–60 Hz frame rate allows — the classic demonstrations are obstacle dodging and aggressive flight on quadrotors.
- Events provide motion information **between** the frames of a standard camera, which is exactly how hybrid systems (EKLT, EDS, Ultimate-SLAM) use them: frames anchor appearance, events fill the temporal gaps.

## Low power and bandwidth

Pixels are silent when nothing changes, so data rate scales with *scene activity*, not with resolution × frame rate. A mostly static scene generates very little output, and average bandwidth and power consumption sit far below those of a frame camera streaming full images — attractive for battery-powered, always-on, and wearable devices. (The flip side: a fast-moving, highly textured scene can produce millions of events per second — see [Challenges](challenges.md).)

## Summary

| Advantage | Mechanism | Frame-camera failure it fixes |
|---|---|---|
| HDR (140 dB+) | Per-pixel log-relative threshold | Saturation / underexposure |
| No motion blur | No exposure window; per-event timestamps | Smearing during fast motion |
| µs latency | Pixels fire immediately on change | Frame-rate-limited control |
| Low power/bandwidth | Output only where change occurs | Constant full-frame streaming |

A useful mental model: an event camera trades absolute intensity for temporal precision and dynamic range. It excels precisely where frame cameras fail (fast, dark, high-contrast) and is weakest where frame cameras are comfortable (slow or static, texture-rich scenes) — which is why many practical systems fuse both.

## Why it matters for SLAM

The classic failure modes of visual SLAM — motion blur during aggressive motion, dropped tracking in HDR or low-light scenes, and latency-limited control — map one-to-one onto the strengths of event cameras. This is why event-based SLAM research targets drones, AR/VR headsets, and other agile platforms. Systems like Ultimate-SLAM demonstrate the payoff concretely: fusing events with frames and IMU keeps state estimation alive in lighting and speed regimes where frame-only VIO fails outright.

## Related

- [Event cameras (DVS)](event-cameras-dvs.md)
- [Challenges](challenges.md)
- [Ultimate-SLAM](ultimate-slam.md)
- [EDS](eds.md)
- [Event-based Vision Survey](event-based-vision-survey.md)
