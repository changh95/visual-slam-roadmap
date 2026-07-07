# Corner detector

코너는 밝기가 *여러 방향에서* 크게 변하는 이미지 위치입니다. 코너는 안정적이고 반복 가능한 랜드마크입니다: 평탄한 영역(그래디언트 없음)이나 에지(한 방향에서만 그래디언트)와 달리, 코너는 2D에서 모호함 없이 위치를 특정할 수 있어 추적과 매칭에 이상적입니다. 대표적인 검출기는 **Harris 코너 검출기**입니다.

## 구조 텐서

가중 함수 $w(x,y)$(대개 가우시안)로 가중된 지역 윈도우 $W$에 걸쳐 계산되는 픽셀에서의 **구조 텐서**(2차 모멘트 행렬):

$$M = \sum_{(x,y) \in W} w(x,y) \begin{bmatrix} I_x^2 & I_x I_y \\ I_x I_y & I_y^2 \end{bmatrix}$$

여기서 $I_x = \frac{\partial I}{\partial x}$와 $I_y = \frac{\partial I}{\partial y}$는 이미지 그래디언트(Sobel 연산자로 계산)입니다. $M$의 고유값 $\lambda_1, \lambda_2$는 지역 구조를 특성화합니다:

| $\lambda_1$ | $\lambda_2$ | 해석 |
|---|---|---|
| $\approx 0$ | $\approx 0$ | 평탄 영역(그래디언트 없음) |
| $\gg 0$ | $\approx 0$ | 에지(한 방향만 그래디언트) |
| $\gg 0$ | $\gg 0$ | 코너(양 방향 모두 그래디언트) |

직관은 다음과 같습니다: $M$은 윈도우를 이동시켰을 때 밝기 차이의 제곱 합이 어떻게 변하는지를 요약합니다. 코너는 *어느* 이동 방향으로도 큰 변화가 생기는 지점입니다---정확히 "두 고유값 모두 큼"이라는 조건입니다.

## 코너 응답 함수

고유값을 직접 계산하는 것(비용이 큼) 대신, Harris는 다음 응답을 제안했습니다:

$$R = \det(M) - k\,(\mathrm{trace}(M))^2 = \lambda_1\lambda_2 - k(\lambda_1 + \lambda_2)^2$$

경험적으로 $k \in [0.04, 0.06]$입니다. $R > 0$은 코너를, $R < 0$은 에지를, 작은 $|R|$은 평탄 영역을 나타냅니다. 이후 비최대 억제가 가장 강한 지역 최댓값을 최종 코너로 선택합니다.

밀접하게 관련된 **Shi-Tomasi** 기준("Good Features to Track")은 각 픽셀을 $\min(\lambda_1, \lambda_2)$로 직접 점수화합니다---패치의 최악의 경우 추적 가능성을 나타내며, OpenCV의 `cv::goodFeaturesToTrack`이 구현하는 방식입니다.

## 처음부터 구현하는 스케치

몇 줄의 NumPy/OpenCV로 Harris를 구현하는 것은 초급자에게 가장 좋은 연습 중 하나입니다:

```python
import cv2, numpy as np

I  = cv2.imread("frame.png", cv2.IMREAD_GRAYSCALE).astype(np.float32)
Ix = cv2.Sobel(I, cv2.CV_32F, 1, 0)
Iy = cv2.Sobel(I, cv2.CV_32F, 0, 1)

# window-averaged structure tensor entries
Sxx = cv2.GaussianBlur(Ix * Ix, (5, 5), 1.0)
Syy = cv2.GaussianBlur(Iy * Iy, (5, 5), 1.0)
Sxy = cv2.GaussianBlur(Ix * Iy, (5, 5), 1.0)

k = 0.04
R = (Sxx * Syy - Sxy**2) - k * (Sxx + Syy)**2   # Harris response
corners = R > 0.01 * R.max()                    # threshold before NMS
```

## SLAM 프론트엔드를 위한 실무적 노트

- ORB의 배경이 되는 검출기인 **FAST**는 구조 텐서를 후보 주위 16픽셀 원 위에서의 빠른 세그먼트 테스트로 대체합니다---훨씬 저렴하며, 이것이 수천 개의 키포인트를 실시간으로 검출할 수 있게 만드는 요인입니다. 개념적으로는 여전히 "여러 방향에서 밝기가 변한다"는 동일한 속성을 목표로 합니다.
- **공간 분포가 중요합니다**: 응답 임계값을 그대로 적용하면 텍스처가 풍부한 영역에 코너가 집중됩니다. 따라서 SLAM 시스템은 이미지를 그리드로 나누고 각 셀별로 가장 좋은 코너를 유지하여, 포즈 추정이 이미지의 모든 영역에서 제약되도록 합니다.
- **서브픽셀 세밀화**(응답의 최댓값 주변에 2차 함수를 피팅, 예: `cv::cornerSubPix`)는 후속 기하학을 눈에 띄게 향상시킵니다.

## 흔한 함정

- **윈도우/블러 크기의 트레이드오프**: 윈도우가 너무 작으면 텐서가 노이즈에 취약해지고, 너무 크면 서로 다른 코너들이 뒤섞이며 위치가 밀립니다.
- **최대 응답의 비율로 정한 임계값**은 장면에 따라 잘 적응하지 못합니다. 셀별 선택이 단일 전역 임계값보다 더 강건합니다.
- **움직이는 물체나 스펙큘러 하이라이트 위의 코너**는 기하학적으로 무용합니다. 검출 품질은 이야기의 절반일 뿐이고, 나머지 절반은 후속 단계의 이상치 제거입니다.

## SLAM에서의 의미

코너는 특징점 기반 SLAM 프론트엔드의 원자재입니다: 서술되고, 매칭되고, 삼각측량되어 지도점이 되는 키포인트가 됩니다. 구조 텐서는 Lucas-Kanade 광학 흐름에서 거의 그대로 다시 나타납니다---코너(두 고유값 모두 큼)는 정확히 안정적으로 추적할 수 있는 종류의 점이며, 이것이 "good features to track"과 Harris 코너가 그렇게 밀접하게 연관되어 있는 이유입니다. 실시간 SLAM에서 사용되는 이후 세대 검출기(FAST, ORB의 방향 있는 FAST)는 같은 아이디어의 더 빠른 후계자들입니다.

## 관련 문서

- [Edge detector](edge-detector.md)
- [Basic Linear Algebra](basic-linear-algebra.md)
- [Keypoints](../level-02-getting-familiar/keypoints.md)
- [SuperPoint](../level-05-deep-learning/superpoint.md)
