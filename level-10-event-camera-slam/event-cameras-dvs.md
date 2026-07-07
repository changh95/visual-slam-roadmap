# Event cameras (DVS)

An event camera, or Dynamic Vision Sensor (DVS), is a bio-inspired camera in which every pixel works independently and asynchronously. Instead of capturing full intensity frames at a fixed rate, each pixel monitors the **log-luminance** at its location and fires an *event* the moment the change exceeds a contrast threshold. The output is not a sequence of images but a sparse, continuous stream of events with microsecond temporal resolution.

## The event generation model

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

## Where do events come from? Moving edges

For small time intervals, the brightness change at a pixel is well approximated by linearizing brightness constancy:

$$\Delta L(\mathbf{x}) \approx -\nabla L(\mathbf{x}) \cdot \mathbf{v}(\mathbf{x})\, \Delta t$$

i.e., the change equals the image gradient dotted with the optical flow. Two readings of this equation drive much of event-based vision:

- **Events fire at moving intensity edges.** Where $\nabla L = 0$ (textureless regions) or $\mathbf{v} = 0$ (no relative motion), no events fire. The event stream is essentially a movie of the scene's edges as they move.
- **Events are predictable from gradient + motion.** Given an intensity image and a motion hypothesis, you can *predict* the event pattern — the generative model exploited by EKLT for feature tracking and EDS for direct alignment, and the basis of contrast maximization for motion estimation.

## Practical consequences of the design

- **Data is motion-driven**: a static camera looking at a static scene produces (almost) no output. This is a power/bandwidth feature and a SLAM bug — see [Challenges](challenges.md).
- **No global shutter, no exposure time**: there is no frame to blur; each event encodes the exact moment an edge crossed a pixel.
- **Asynchronous output**: there is no natural "frame rate" — algorithms must either handle events one by one or aggregate them into an intermediate representation (see [Event representations](event-representations.md)).
- **Noise is real**: physical sensors emit spurious events, and the effective threshold $C$ varies between units and with temperature — a practical calibration concern for any deployed system.

## Frame camera vs. event camera

| Property | Frame camera | Event camera (DVS) |
|---|---|---|
| Output | Full images at fixed rate | Sparse asynchronous event stream |
| Temporal resolution | ~10–100 ms | ~1 µs |
| Dynamic range | ~60 dB | 140 dB+ |
| Motion blur | Yes (exposure) | No |
| Absolute intensity | Yes | No (changes only) |
| Data rate | Constant (resolution × fps) | Scales with scene activity |

## Hardware landscape

Common hardware includes the iniVation DAVIS family and Prophesee Metavision sensors (including the Sony-fabricated IMX636 generation). The **DAVIS** design is particularly relevant for SLAM because it co-locates a DVS with a standard frame sensor (APS) and an IMU behind shared optics on one chip — providing perfectly registered events, frames, and inertial data from a single device. That is exactly the hardware assumption behind fusion systems like Ultimate-SLAM and hybrid trackers like EKLT.

For getting started without hardware: the Gallego 2020 survey is the standard reading, the Event Camera Dataset and MVSEC/DSEC are the standard benchmarks, and simulators such as ESIM and v2e generate synthetic events from ordinary video — the training-data path used by learned systems like DEVO. The community-maintained Awesome-Event-based-Vision repository indexes all of these.

## Why it matters for SLAM

Event cameras address exactly the conditions where frame-based visual SLAM breaks: fast motion (motion blur), high dynamic range scenes (saturation), and low light. Their microsecond latency also enables state estimation at rates far beyond 30–60 Hz, which matters for agile robots such as quadrotors. However, the entirely different output format means classical SLAM front-ends cannot be applied directly — a whole family of new algorithms (EVO, ESVO, EKLT, Ultimate-SLAM, DEVO) had to be developed around this sensor.

## Related

- [Advantages](advantages.md)
- [Challenges](challenges.md)
- [Event representations](event-representations.md)
- [Event-based Vision Survey](event-based-vision-survey.md)
- [EVO](evo.md)
- [Camera device](../level-02-getting-familiar/camera-device.md)
