# OpenCV

**OpenCV**는 사실상의 표준 오픈소스 컴퓨터 비전 라이브러리이며, SLAM 작업에서는 매일 손을 뻗게 되는 도구함입니다. C++로 작성되어 있고 거의 완전한 Python 바인딩(`pip install opencv-python`)을 제공하므로, 같은 API가 빠른 프로토타이핑과 프로덕션 프론트엔드 모두에 쓰입니다.

SLAM에 있어 가장 중요한 OpenCV의 부분들은 다음과 같습니다.

- **이미지 입출력 및 처리** — 이미지/비디오 읽기·쓰기, 색상 변환, 왜곡 보정(`cv::undistort`, `cv::remap`), 블러링, 피라미드, 디버그 시각화를 위한 드로잉.
- **특징 검출 및 기술** — `cv::ORB`, `cv::SIFT`, `cv::AKAZE`, `cv::FastFeatureDetector`, 그리고 KLT 방식 파이프라인을 위한 `cv::goodFeaturesToTrack`(Shi-Tomasi 코너).
- **특징 매칭** — `cv::BFMatcher`(브루트 포스, L2 또는 해밍)와 `cv::FlannBasedMatcher`(근사 최근접 이웃), 그 위에 구현된 Lowe의 비율 테스트.
- **특징 추적** — 많은 VO/VIO 프론트엔드(예: VINS-Mono)에서 사용하는 피라미드형 Lucas-Kanade 추적기인 `cv::calcOpticalFlowPyrLK`.
- **다중 뷰 기하학** — 2D-3D 자세 추정을 위한 `cv::findEssentialMat` / `cv::recoverPose`(5점 + RANSAC), `cv::findFundamentalMat`, `cv::findHomography`, `cv::triangulatePoints`, `cv::solvePnP` / `cv::solvePnPRansac`.
- **캘리브레이션** — `cv::calibrateCamera`, `cv::stereoCalibrate`, `cv::stereoRectify`, `cv::fisheye` 및 contrib 모듈의 어안(fisheye) 및 전방향(omnidirectional) 모델.

Python으로 작성한 최소한의 특징 매칭 파이프라인은 다음과 같습니다.

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

파이프라인을 계속 진행하면: 3D 점들의 지도를 가지고 있다면, 새 프레임을 추적하는 것은 PnP 문제가 됩니다 — 그리고 이 패턴(투영, 매칭, `solvePnPRansac`, 정제)은 특징 기반 SLAM의 추적 스레드가 하는 일과 본질적으로 같습니다.

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

한계도 알아두어야 합니다: OpenCV는 프론트엔드 빌딩 블록을 제공하지만 SLAM 백엔드는 제공하지 않습니다. 번들 조정, 포즈 그래프, 팩터 그래프는 Ceres, g2o, GTSAM에 있습니다. OpenCV의 역할은 이미지를 입력받아 대응점과 초기 자세를 출력하는 것입니다.

## 흔한 함정들

- **한 라이브러리 안의 두 가지 좌표 규약**: 기하학 함수들은 점을 $(x, y)$ 픽셀로 받지만, `Mat`/NumPy 인덱싱은 `[row, col]` = `[y, x]`입니다. 이를 혼용하면 그럴듯해 보이는 엉터리 결과가 나옵니다.
- **왜곡 처리**: `findEssentialMat`/`recoverPose`는 전달한 내부 파라미터에 점들이 맞아 들어간다고 가정합니다. 먼저 점을 왜곡 보정하거나(`cv2.undistortPoints`), `K`와 왜곡 모델이 일관되게 적용되도록 해야 합니다 — 왜곡된 점을 슬쩍 그대로 입력하는 것은 정확도를 죽이는 전형적인 실수입니다.
- **`recoverPose`의 병진은 단위 노름입니다**: 본질 행렬은 병진을 스케일까지만 정의합니다(단안 스케일 모호성) — 즉 `t`는 방향일 뿐 미터 단위가 아닙니다.
- **디스크립터에 맞는 노름을 사용하십시오**: 이진 디스크립터(ORB, BRIEF, AKAZE)는 해밍, 부동소수점 디스크립터(SIFT)는 L2입니다. FLANN은 이진 디스크립터에 대해 LSH 파라미터가 필요합니다.
- **RANSAC 임계값은 픽셀 단위입니다**: 적절한 `reprojectionError`/`threshold`는 이미지 해상도와 캘리브레이션 품질에 따라 스케일이 달라집니다. VGA 이미지에 맞춘 기본값은 4K에는 너무 엄격하고 320p에는 너무 느슨합니다.
- **`Rodrigues`와 자세 방향**: `solvePnP`는 world-to-camera 변환을 반환합니다($X_{cam} = R X_{world} + t$를 만족하는 $R, t$). 월드 좌표계 기준의 카메라 자세를 원한다면 역변환해야 합니다. 이 부호/방향에 대한 혼동은 아마도 자체 제작 VO에서 가장 흔한 버그입니다.
- **반환 플래그를 확인하십시오**: 많은 솔버(`solvePnP`, `findEssentialMat`)는 거의 평면이거나 시차가 낮은 입력에 대해 실패하거나 여러 개/퇴화된 해를 반환할 수 있습니다. 항상 인라이어 수에 따라 게이트를 걸어야 합니다.

## SLAM에서의 의미

거의 모든 오픈소스 SLAM 시스템 — ORB-SLAM, VINS-Mono, 그리고 수많은 연구용 프로토타입 — 은 이미지 처리, 특징 추출, 기하학적 솔버를 위해 OpenCV를 사용합니다. 이 라이브러리에 익숙해지면 그런 코드베이스들을 읽을 수 있고, 완전한 시각적 오도메트리 파이프라인(검출, 매칭, RANSAC, PnP)을 오후 한나절에 만들 수 있습니다 — 이것이 레벨 2에서 권장되는 실습 과제입니다.

## 관련 문서

- [C++](cpp.md)
- [Python](python.md)
- [Keypoints](keypoints.md)
- [2D-3D correspondence](2d-3d-correspondence.md)
- [Camera calibration](../level-01-beginner/camera-calibration.md)
