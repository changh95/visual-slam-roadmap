# OpenCV

**OpenCV** 是事实上的标准开源计算机视觉库，对于 SLAM 相关工作而言，它是你日常都会用到的工具箱。它用 C++ 编写，并提供近乎完整的 Python 绑定（`pip install opencv-python`），因此同一套 API 既能用于快速原型开发，也能用于生产环境的前端。

对 SLAM 最重要的 OpenCV 组成部分包括：

- **图像 I/O 与处理**——读写图像与视频、色彩转换、去畸变（`cv::undistort`、`cv::remap`）、模糊、金字塔、以及用于调试可视化的绘图功能。
- **特征检测与描述**——`cv::ORB`、`cv::SIFT`、`cv::AKAZE`、`cv::FastFeatureDetector`，以及用于 KLT 风格流程的 `cv::goodFeaturesToTrack`（Shi-Tomasi 角点）。
- **特征匹配**——`cv::BFMatcher`（暴力匹配，L2 或 Hamming 距离）和 `cv::FlannBasedMatcher`（近似最近邻），并在其之上实现了 Lowe 比值检验。
- **特征跟踪**——`cv::calcOpticalFlowPyrLK`，即许多 VO/VIO 前端（例如 VINS-Mono）所使用的金字塔 Lucas-Kanade 跟踪器。
- **多视图几何**——`cv::findEssentialMat` / `cv::recoverPose`（5 点法 + RANSAC）、`cv::findFundamentalMat`、`cv::findHomography`、`cv::triangulatePoints`，以及用于 2D-3D 位姿估计的 `cv::solvePnP` / `cv::solvePnPRansac`。
- **标定**——`cv::calibrateCamera`、`cv::stereoCalibrate`、`cv::stereoRectify`，以及 `cv::fisheye` 和 contrib 模块中的鱼眼与全向相机模型。

一个最简单的 Python 特征匹配流程：

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

继续这个流程：一旦你有了一份 3D 点地图，对新帧进行跟踪就变成了一个 PnP 问题——而这种模式（投影、匹配、`solvePnPRansac`、精化）本质上就是基于特征的 SLAM 跟踪线程所做的事情：

```python
# pts3d: Nx3 map points, pts2d: Nx2 matched pixel observations
ok, rvec, tvec, inliers = cv2.solvePnPRansac(
    pts3d, pts2d, K, distCoeffs,
    reprojectionError=2.0, iterationsCount=100)
R, _ = cv2.Rodrigues(rvec)          # world-to-camera rotation
# triangulate new points from two calibrated views
P1 = K @ np.hstack([np.eye(3), np.zeros((3, 1))])
P2 = K @ np.hstack([R, tvec])
X_h = cv2.triangulatePoints(P1, P2, pts1.T, pts2.T)
X = (X_h[:3] / X_h[3]).T            # homogeneous -> Euclidean
```

要清楚它的局限：OpenCV 为你提供前端的基础构件，但不提供 SLAM 后端。光束法平差、位姿图和因子图都存在于 Ceres、g2o 或 GTSAM 中；OpenCV 的角色是输入图像，输出对应关系和初始位姿。

## 常见陷阱

- **同一库中存在两套坐标约定**：几何函数将点表示为 $(x, y)$ 像素坐标，但 `Mat`/NumPy 的索引方式是 `[row, col]` = `[y, x]`。混用二者会产生看起来合理但实际错误的结果。
- **畸变处理**：`findEssentialMat`/`recoverPose` 假定传入的点与你提供的内参相匹配。要么先对点去畸变（`cv2.undistortPoints`），要么确保 `K` 和畸变模型的使用方式一致——悄悄传入带畸变的点是精度问题的经典杀手。
- **`recoverPose` 的平移是单位范数的**：本质矩阵只能确定平移方向，无法确定尺度（单目尺度不确定性），所以 `t` 是一个方向，不是以米为单位的实际长度。
- **让范数与描述子匹配**：二值描述子（ORB、BRIEF、AKAZE）用 Hamming 距离，浮点描述子（SIFT）用 L2 距离。FLANN 对二值描述子需要 LSH 参数。
- **RANSAC 阈值以像素为单位**：合适的 `reprojectionError`/`threshold` 会随图像分辨率和标定质量的变化而变化；在 VGA 图像上调好的默认值，对 4K 图像来说太紧,对 320p 图像来说又太松。
- **`Rodrigues` 与位姿方向**：`solvePnP` 返回的是世界到相机的变换（$R, t$ 满足 $X_{cam} = R X_{world} + t$）；如果你想得到相机在世界坐标系中的位姿,需要将其求逆。这里的符号/方向混淆很可能是自制 VO 中最常见的 bug。
- **检查返回标志**：许多求解器（`solvePnP`、`findEssentialMat`）在输入近似共面或视差较低时可能失败,或返回多解/退化解；务必以内点数量作为门槛条件。

## 对SLAM的意义

几乎每一个开源 SLAM 系统——ORB-SLAM、VINS-Mono，以及无数研究性原型——都使用 OpenCV 来处理图像、提取特征以及进行几何求解。熟练掌握它意味着你能够读懂这些代码库，并能在一个下午内搭建出一套完整的视觉里程计流程（检测、匹配、RANSAC、PnP），这正是推荐的 Level 2 练习。

## 相关条目

- [C++](cpp.md)
- [Python](python.md)
- [Keypoints](keypoints.md)
- [2D-3D correspondence](2d-3d-correspondence.md)
- [Camera calibration](../level-01-beginner/camera-calibration.md)
