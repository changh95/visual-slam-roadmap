# 재투영 오차

**재투영 오차(reprojection error)**는 시각 SLAM의 근본적인 기하학적 잔차다: 이는 가정된 3D 점과 카메라 자세가 실제 2D 특징 관측을 얼마나 잘 설명하는지를 측정한다. 3D 점 $\mathbf{X}_j$(세계 프레임), 카메라 자세 $T_i \in SE(3)$(세계-투-카메라), 그리고 이미지 $i$에서 그 점의 관측된 픽셀 위치 $\mathbf{z}_{ij}$를 취하면:

$$
\mathbf{e}_{ij} = \mathbf{z}_{ij} - \pi\!\left(T_i \mathbf{X}_j\right)
$$

여기서 $\pi : \mathbb{R}^3 \to \mathbb{R}^2$는 카메라 투영 함수다. 내부 파라미터 $(f_x, f_y, c_x, c_y)$를 가진 핀홀 카메라와 카메라 프레임 점 $\mathbf{X}^c = (X, Y, Z)^T = T_i \mathbf{X}_j$에 대해:

$$
\pi(\mathbf{X}^c) = \begin{bmatrix} f_x \, X / Z + c_x \\ f_y \, Y / Z + c_y \end{bmatrix}
$$

오차는 **픽셀** 단위로 존재하며 — 특징 검출기의 위치 결정 잡음(대개 1픽셀 정도)과 직접 비교할 수 있어, 임계값과 공분산을 설정하기 쉽다.

## 잔차에서 비용 함수로

관측 잡음이 가우시안이라는 가정 $\mathbf{z}_{ij} \sim \mathcal{N}\left(\pi(T_i\mathbf{X}_j), \Sigma_{ij}\right)$ 아래에서, 자세와 점의 최대우도 추정은 정확히 다음의 가중 비선형 최소제곱 문제가 된다

$$
C = \sum_{(i,j) \in \mathcal{O}} \mathbf{e}_{ij}^T \, \Omega_{ij} \, \mathbf{e}_{ij}
$$

여기서 $\Omega_{ij} = \Sigma_{ij}^{-1}$은 **정보 행렬**이고 $\mathcal{O}$는 (자세, 점) 관측 쌍의 집합이다. 각 항은 마할라노비스 거리의 제곱이다; 실제로는 $\Sigma_{ij}$가 등방성이며 특징이 검출된 이미지 피라미드 레벨에 따라 스케일되는 경우가 많다(더 거친 레벨 = 더 잡음이 많음 = 더 낮은 가중치).

거짓 매칭은 이차 비용을 지배해버릴 만큼 거대한 잔차를 만들어내므로, 실제 시스템은 각 항을 **강건 커널** $\rho$(Huber, Cauchy)로 감싸 $\sum \rho\left(\mathbf{e}_{ij}^T \Omega_{ij} \mathbf{e}_{ij}\right)$를 얻고, 카이제곱 값이 임계값을 초과하는 관측을 제거한다.

## 최적화

이 비용은 (자세는 $SE(3)$ 작용과 투영 나눗셈을 통해) 자세에 대해 비선형이다. 현재 추정치 주변에서 $\mathbf{e}(\mathbf{x} + \Delta\mathbf{x}) \approx \mathbf{e}(\mathbf{x}) + J \Delta\mathbf{x}$로 선형화하고, 가우스-뉴턴 정규 방정식 $\left(J^T \Omega J\right)\Delta\mathbf{x} = -J^T \Omega\, \mathbf{e}$를 반복적으로 푸는 것이 표준적인 접근법이다. 연쇄 법칙에 의해 야코비안은 다음으로 분해된다

$$
\frac{\partial \mathbf{e}}{\partial (\cdot)} = -\frac{\partial \pi}{\partial \mathbf{X}^c} \cdot \frac{\partial \mathbf{X}^c}{\partial (\cdot)}
$$

여기서 $\partial \pi / \partial \mathbf{X}^c$는 $1/Z$와 $-X/Z^2$, $-Y/Z^2$ 항을 포함하는 $2 \times 3$ 행렬이며, 두 번째 인자는 자세에 대해 미분하는지(리 대수 섭동을 통해, $2 \times 6$) 점에 대해 미분하는지($2 \times 3$)에 따라 달라진다.

## 어떤 문제들이 이를 최소화하는가

- **모션-온리(motion-only)** (PnP 정제 / 추적): 점을 고정하고 하나의 자세를 최적화.
- **구조-온리(structure-only)** (삼각측량 정제): 자세를 고정하고 점을 최적화.
- **완전한 번들 조정**: 모든 자세와 점을 공동으로 최적화 — 골드 스탠다드.

비교를 위한 대안들: **광도 오차(photometric error)** (직접법은 특징 위치 대신 픽셀 밝기를 비교), **3D 점-대-점/점-대-평면 오차** (ICP). 신뢰할 수 있는 특징 대응점이 존재할 때는 재투영 오차가 선호되는데, 그 픽셀 공간 잡음 모델이 측정이 실제로 이루어진 방식과 일치하기 때문이다.

## SLAM에서의 의미

- 이는 시각 SLAM의 관측 모델이다: PnP 정제, 삼각측량, 지역 및 전역 번들 조정, 팩터 그래프의 시각적 팩터 등 거의 모든 특징 기반 추정기가 이를 최소화한다.
- 이 오차의 카이제곱 통계량은 매칭 제거와 RANSAC 인라이어 계산을 위한 원칙적인 **이상치 검정**을 제공한다.
- 이 오차의 야코비안 구조(각 오차는 정확히 하나의 자세와 하나의 점에만 관여)는 슈어 보수(Schur complement)를 통해 번들 조정을 다루기 쉽게 만드는 희소성을 만들어낸다.

## 관련 문서

- [Bundle Adjustment](bundle-adjustment.md)
- [PnP (Perspective-n-Point)](pnp.md)
- [Gauss-Newton](gauss-newton.md)
- [M-estimator](m-estimator.md)
- [Pinhole camera model](../level-01-beginner/pinhole-camera-model.md)
