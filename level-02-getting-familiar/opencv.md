# OpenCV

**OpenCV** is the de-facto standard open-source computer vision library, and for SLAM work it is the toolbox you will reach for daily. It is written in C++ with near-complete Python bindings (`pip install opencv-python`), so the same API serves both fast prototyping and production front-ends.

The parts of OpenCV that matter most for SLAM:

- **Image I/O and processing** — reading/writing images and video, colour conversion, undistortion (`cv::undistort`, `cv::remap`), blurring, pyramids, drawing for debug visualisation.
- **Feature detection and description** — `cv::ORB`, `cv::SIFT`, `cv::AKAZE`, `cv::FastFeatureDetector`, plus `cv::goodFeaturesToTrack` (Shi-Tomasi corners) for KLT-style pipelines.
- **Feature matching** — `cv::BFMatcher` (brute force, L2 or Hamming) and `cv::FlannBasedMatcher` (approximate nearest neighbour), with Lowe's ratio test implemented on top.
- **Feature tracking** — `cv::calcOpticalFlowPyrLK`, the pyramidal Lucas-Kanade tracker used by many VO/VIO front-ends (e.g. VINS-Mono).
- **Multiple-view geometry** — `cv::findEssentialMat` / `cv::recoverPose` (5-point + RANSAC), `cv::findFundamentalMat`, `cv::findHomography`, `cv::triangulatePoints`, `cv::solvePnP` / `cv::solvePnPRansac` for 2D-3D pose estimation.
- **Calibration** — `cv::calibrateCamera`, `cv::stereoCalibrate`, `cv::stereoRectify`, fisheye and omnidirectional models in `cv::fisheye` and contrib modules.

A minimal feature-matching pipeline in Python:

```python
import cv2

orb = cv2.ORB_create(2000)
kp1, des1 = orb.detectAndCompute(img1, None)
kp2, des2 = orb.detectAndCompute(img2, None)

matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
matches = sorted(matcher.match(des1, des2), key=lambda m: m.distance)

pts1 = cv2.KeyPoint_convert(kp1, [m.queryIdx for m in matches])
pts2 = cv2.KeyPoint_convert(kp2, [m.trainIdx for m in matches])
E, inliers = cv2.findEssentialMat(pts1, pts2, K, method=cv2.RANSAC)
_, R, t, _ = cv2.recoverPose(E, pts1, pts2, K, mask=inliers)
```

Be aware of its limits: OpenCV gives you the front-end building blocks, but not a SLAM back-end. Bundle adjustment, pose graphs, and factor graphs live in Ceres, g2o, or GTSAM; OpenCV's role is images in, correspondences and initial poses out.

## Why it matters for SLAM

Nearly every open-source SLAM system — ORB-SLAM, VINS-Mono, and countless research prototypes — uses OpenCV for image handling, feature extraction, and geometric solvers. Being fluent in it means you can read those codebases, and build a complete visual-odometry pipeline (detect, match, RANSAC, PnP) in an afternoon, which is the recommended Level 2 exercise.

## Related

- [C++](cpp.md)
- [Python](python.md)
- [Keypoints](keypoints.md)
- [2D-3D correspondence](2d-3d-correspondence.md)
- [Camera calibration](../level-01-beginner/camera-calibration.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
