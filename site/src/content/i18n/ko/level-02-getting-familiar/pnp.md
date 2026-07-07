# PnP (Perspective-n-Point)

**Perspective-n-Point (PnP)** 문제: 알려진 지도(월드) 프레임에서 표현된 $n$개의 3D 점 $\mathbf{X}_i$와, 카메라 이미지에서의 그 2D 투영점 $\mathbf{u}_i$, 그리고 내부 파라미터 행렬 $\mathbf{K}$가 주어졌을 때, 다음을 만족하는 카메라 자세 $[R \mid \mathbf{t}]$를 추정합니다.

$$
\lambda_i \begin{bmatrix} \mathbf{u}_i \\ 1 \end{bmatrix} = \mathbf{K} \left( R \mathbf{X}_i + \mathbf{t} \right)
$$

이는 어떤 양의 깊이 $\lambda_i$에 대해 성립합니다. PnP는 **2D-3D 대응점**의 주력 도구입니다: 2D-2D 매칭으로부터의 본질 행렬 추정과 달리, 3D 점들이 이미 스케일을 담고 있기 때문에 **메트릭 스케일**로 병진을 복원합니다.

## 주요 솔버들

**P3P(최소 솔버).** 세 개의 대응점으로 충분합니다(자세는 6 DoF이고, 각 2D 점은 2개의 제약을 제공합니다). (캘리브레이션된 방향 벡터로부터 계산된) 각 이미지 광선 쌍이 알려진 각도 $\theta_{ij}$를 이루며, 코사인 법칙이 미지의 점 깊이 $d_i = \lVert R\mathbf{X}_i + \mathbf{t} \rVert$를 제약합니다.

$$
d_i^2 + d_j^2 - 2 d_i d_j \cos\theta_{ij} = \lVert \mathbf{X}_i - \mathbf{X}_j \rVert^2
$$

이러한 세 방정식은 **최대 4개의 실수 해**를 갖는 4차 다항식으로 축소됩니다. 4번째 대응점이 모호성을 해소합니다. P3P는 RANSAC 내부에서 사용되는 최소 솔버입니다 — 작은 샘플이 필요한 반복 횟수를 낮게 유지해줍니다.

**DLT(Direct Linear Transform).** $n \geq 6$개의 대응점으로부터 $3 \times 4$ 투영 행렬 $P$를 선형으로 풉니다(각 점은 2개의 동차 선형 방정식을 제공하며, 이를 쌓아 SVD로 $A\mathbf{p} = 0$을 풉니다). 그런 다음 $P = \mathbf{K}[R \mid \mathbf{t}]$를 분해(RQ 분해)하여 자세를 추출합니다. 단순하지만, 풀이 과정에서 알려진 내부 파라미터를 무시하고 (기하학적이 아닌) 대수적 오차를 최소화하므로, 전용 솔버들보다 정확도가 낮습니다.

**EPnP.** $n$개의 3D 점 모두를 **4개의 가상 제어점**의 가중합으로 표현합니다.

$$
\mathbf{X}_i = \sum_{j=1}^{4} \alpha_{ij} \mathbf{c}_j, \qquad \sum_j \alpha_{ij} = 1
$$

무게중심 가중치 $\alpha_{ij}$는 강체 변환에 대해 불변이므로, 문제는 $n$과 무관하게 카메라 프레임에서 제어점들의 12개 좌표를 추정하는 문제로 축소됩니다. 복잡도는 $O(n)$이며, EPnP는 대규모 대응점 집합(예: 재지역화)에 대한 표준적인 비최소 솔버입니다.

**반복 정제.** 어떤 솔버가 초기 자세를 제공하든, 최종 답은 총 **재투영 오차**를 최소화함으로써 정제됩니다.

$$
\min_{R, \mathbf{t}} \sum_i \left\lVert \mathbf{u}_i - \pi\!\left(\mathbf{K}, R\mathbf{X}_i + \mathbf{t}\right) \right\rVert^2
$$

Gauss-Newton 또는 Levenberg-Marquardt를 사용합니다(이것이 반복(iterative) 플래그를 사용한 `cv::solvePnP`, 그리고 ORB-SLAM의 "운동만의 번들 조정"이 하는 일입니다).

## 강건한 추정

실제 2D-3D 매칭 집합에는 이상치(잘못된 디스크립터 매칭, 움직인 물체)가 포함됩니다. 표준 파이프라인은 **P3P + RANSAC**입니다: 3개의 대응점을 샘플링하고, P3P를 풀고, 재투영 오차 임계값(몇 픽셀)으로 인라이어 수를 세고, 최고의 모델을 유지한 뒤, 모든 인라이어에 대해 M-estimator나 단순 최소제곱으로 정제합니다.

## SLAM에서의 의미

- **추적**: 특징 기반 SLAM(PTAM, ORB-SLAM)은 현재 프레임의 키포인트를 이미 삼각측량된 지도점에 매칭하고 PnP를 풀어 매 프레임의 자세를 추정합니다 — 이것이 추적 스레드의 핵심입니다.
- **재지역화와 루프 클로징**: 추적이 소실되거나 루프 후보가 발견된 후, 저장된 지도에 대한 PnP가 자세를 처음부터 다시 복원합니다.
- **메트릭 스케일**: 3D 점들이 스케일을 고정하기 때문에, PnP 기반 추적은 순수한 2D-2D 운동 추정이 겪는 스케일 모호성을 겪지 않습니다.
- 실용적인 VO 파이프라인은 다음과 같습니다: ORB 검출, 매칭, RANSAC으로 이상치 제거, EPnP/P3P로 자세 추정, Gauss-Newton/LM으로 정제.

## 실습

- [Perspective-n-points 실습](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch02_09)

## 관련 문서

- [2D-3D correspondence](2d-3d-correspondence.md)
- [RANSAC](ransac.md)
- [Reprojection error](reprojection-error.md)
- [Gauss-Newton](gauss-newton.md)
- [Pinhole camera model](../level-01-beginner/pinhole-camera-model.md)
