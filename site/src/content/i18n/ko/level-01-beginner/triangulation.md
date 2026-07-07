# Triangulation

카메라 포즈와 두 개 이상의 뷰에서 대응하는 이미지 점들이 주어지면, **삼각측량(triangulation)**은 이들을 생성한 3D 점을 복원합니다. 이는 매칭된 2D 관측값을 지도의 기하 구조로 바꾸는 단계입니다.

## DLT 방법

투영 행렬 $P_i$를 가진 카메라 $i$와 관측된 동차 점 $\mathbf{p}_i = [u_i, v_i, 1]^T$에 대해, 투영은 $\lambda_i \mathbf{p}_i = P_i\mathbf{X}$를 줍니다. 외적을 취하면 미지의 스케일 $\lambda_i$가 제거됩니다.

$$\mathbf{p}_i \times (P_i\mathbf{X}) = \mathbf{0}$$

$P_i$의 행을 $\mathbf{r}_1^T, \mathbf{r}_2^T, \mathbf{r}_3^T$로 쓰면, 각 뷰마다 두 개의 독립적인 방정식은 다음과 같습니다.

$$\big(u_i\,\mathbf{r}_3^T - \mathbf{r}_1^T\big)\mathbf{X} = 0, \qquad \big(v_i\,\mathbf{r}_3^T - \mathbf{r}_2^T\big)\mathbf{X} = 0$$

$N$개 뷰로부터의 방정식들을 쌓으면 동차 시스템을 얻습니다.

$$A\mathbf{X} = \mathbf{0}, \qquad A \in \mathbb{R}^{2N \times 4}$$

최소제곱 해는 $A$의 가장 작은 특이값에 대응하는 우특이벡터입니다---SVD의 직접적인 응용입니다. 이것이 **DLT(Direct Linear Transform)** 방법입니다. 동차 해를 네 번째 성분으로 나누면 유클리드 점을 얻습니다.

## 중점법 (Mid-point Method)

중점법은 투영 광선까지의 제곱 거리의 합을 최소화하는 3D 점을 찾습니다.

$$\mathbf{X}^* = \arg\min_{\mathbf{X}} \sum_i d^2(\mathbf{X},\ \mathrm{ray}_i)$$

이는 닫힌 형태의 해를 가지며, 광선들이 거의 평행할 때(예: 전진 운동에 가까운 경우로 DLT의 조건이 나빠지는 경우) 선호됩니다. 두 뷰의 경우 두 광선 사이의 최단 선분을 찾아 그 중점을 취하는 것으로 환원됩니다.

## 스테레오 특수 사례

기선 $b$와 초점 거리 $f_x$를 가진 정렬된 스테레오 쌍에 대해, 삼각측량은 한 줄짜리 공식으로 축약됩니다. 깊이 $Z$에 있는 점은 두 이미지 사이에 수평 **시차(disparity)** $d$로 나타나며,

$$Z = \frac{b\, f_x}{d}$$

깊이가 시차에 반비례하므로, 픽셀의 일부 단위인 고정된 매칭 오차가 거리에 따라 빠르게 증가하는 깊이 오차로 이어집니다---이것이 스테레오(그리고 삼각측량 일반)가 먼 점과 좁은 기선에서 성능이 저하되는 이유입니다.

## 실제 시스템에서 사용하는 품질 검사

- **패럴랙스 각도(Parallax angle)**: 두 관측 광선 사이의 각도. 넓은 기선은 조건이 좋은 교차를 만들지만, 패럴랙스가 아주 작으면 깊이 불확실성이 매우 큰 점이 만들어집니다. SLAM 시스템은 새로운 지도 점을 받아들이기 전에 이 각도를 검사합니다.
- **양의 깊이(카이랄리티, cheirality)**: 삼각측량된 점은 *두* 카메라 모두의 앞쪽에 있어야 합니다. 음의 깊이는 매칭이나 포즈 가설이 잘못되었다는 뜻입니다.
- **재투영 오차**: 삼각측량된 점을 각 뷰에 다시 투영하여 측정값과 비교합니다. 잔차가 임계값을 초과하면 거부합니다.
- 선형 방법(DLT, 중점법)은 초기 추정값을 제공합니다. 정확도가 중요한 파이프라인은 재투영 오차를 최소화하여 점을 정밀화하는데, 이는 번들 조정이 모든 점과 포즈에 대해 공동으로 수행하는 작업입니다.

## 흔한 함정

- **모든 것을 삼각측량하는 것**: 패럴랙스가 낮은 점을 그대로 유지하면 깊이가 거의 제약되지 않는 랜드마크로 지도가 오염되어 이후 최적화가 불안정해집니다.
- **좌표 관례를 혼용하는 것**: DLT는 월드를 이미지로 매핑하는 일관된 투영 행렬 $P_i = \mathbf{K}[R|\mathbf{t}]$를 요구합니다. 카메라-투-월드 포즈를 그대로 넘기면 표면적으로는 그럴듯해 보이지만 엉망인 결과가 나옵니다.
- **DLT의 대수적 오차를 신뢰하는 것**: DLT는 기하학적 양이 아니라 대수적 양을 최소화합니다. 정확도를 위해서는 재투영 오차 정밀화 단계를 뒤따라야 합니다.

## SLAM에서의 의미

삼각측량은 SLAM 지도가 성장하는 방식입니다: 에피폴라 기하학(또는 PnP)이 카메라 포즈를 제공한 후, 새로운 모든 특징점 매칭은 삼각측량을 통해 3D 랜드마크 후보가 됩니다. 이는 또한 고전적인 모노큘러 부트스트래핑 방법의 절반이기도 합니다---essential 행렬로부터 상대 포즈를 복원한 다음 초기 지도를 삼각측량하는 것---이며, 그 주변의 품질 검사(패럴랙스, 재투영 오차, 양의 깊이)가 견고한 시스템과 취약한 시스템을 가르는 요소입니다.

## 실습

- [Triangulation hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch02_07)

## 관련 문서

- [Epipolar geometry](epipolar-geometry.md)
- [Pinhole camera model](pinhole-camera-model.md)
- [Basic Linear Algebra](basic-linear-algebra.md)
- [2D-2D correspondence](../level-02-getting-familiar/2d-2d-correspondence.md)
- [Landmark](../level-02-getting-familiar/landmark.md)
- [Disparity vs Depth](../level-07-stereo-slam/disparity-vs-depth.md)
