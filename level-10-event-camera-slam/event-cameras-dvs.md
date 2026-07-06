# Event cameras (DVS)

An event camera, or Dynamic Vision Sensor (DVS), is a bio-inspired camera in which every pixel works independently and asynchronously. Instead of capturing full intensity frames at a fixed rate, each pixel monitors the **log-luminance** at its location and fires an *event* the moment the change exceeds a contrast threshold. The output is not a sequence of images but a sparse, continuous stream of events with microsecond temporal resolution.

Each event is a tuple

$$e_k = (\mathbf{x}_k, t_k, p_k)$$

where $\mathbf{x}_k = (u_k, v_k)$ is the pixel coordinate, $t_k$ is the timestamp (microsecond resolution), and $p_k \in \{+1, -1\}$ is the polarity — whether brightness went up or down. The firing condition is:

$$
\Delta L(\mathbf{x}, t) = L(\mathbf{x}, t) - L(\mathbf{x}, t_{\text{last}}) \geq +C \;\Rightarrow\; p = +1
$$
$$
\Delta L(\mathbf{x}, t) = L(\mathbf{x}, t) - L(\mathbf{x}, t_{\text{last}}) \leq -C \;\Rightarrow\; p = -1
$$

where $L = \log$ luminance and $C \approx 0.1$–$0.5$ is the contrast threshold set in the sensor firmware. Because the comparison is in log space, the sensor responds to *relative* brightness change, which is what gives it its enormous dynamic range.

Some practical consequences of this design:

- **Data is motion-driven**: a static camera looking at a static scene produces (almost) no output. Events fire mainly at moving intensity edges.
- **No global shutter, no exposure time**: there is no frame to blur; each event encodes the exact moment an edge crossed a pixel.
- **Asynchronous output**: there is no natural "frame rate" — algorithms must either handle events one by one or aggregate them into an intermediate representation.

| Property | Frame camera | Event camera (DVS) |
|---|---|---|
| Output | Full images at fixed rate | Sparse asynchronous event stream |
| Temporal resolution | ~10–100 ms | ~1 µs |
| Dynamic range | ~60 dB | 140 dB+ |
| Motion blur | Yes (exposure) | No |
| Absolute intensity | Yes | No (changes only) |

Common hardware includes the iniVation DAVIS family (which co-locates a DVS with a standard frame sensor and an IMU on one chip) and Prophesee Metavision sensors. The DAVIS design is particularly relevant for SLAM because it provides perfectly registered events, frames, and inertial data from a single device.

## Why it matters for SLAM

Event cameras address exactly the conditions where frame-based visual SLAM breaks: fast motion (motion blur), high dynamic range scenes (saturation), and low light. Their microsecond latency also enables state estimation at rates far beyond 30–60 Hz, which matters for agile robots such as quadrotors. However, the entirely different output format means classical SLAM front-ends cannot be applied directly — a whole family of new algorithms (EVO, ESVO, EKLT, Ultimate-SLAM, DEVO) had to be developed around this sensor.

## Related

- [Advantages](advantages.md)
- [Challenges](challenges.md)
- [Event representations](event-representations.md)
- [Event-based Vision Survey](event-based-vision-survey.md)
- [Camera device](../level-02-getting-familiar/camera-device.md)

[Back to Level 10](../README.md#level-10-event-camera-slam)
