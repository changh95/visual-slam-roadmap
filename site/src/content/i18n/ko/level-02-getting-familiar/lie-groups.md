# Lie groups

카메라 포즈는 $\mathrm{SE}(3)$에, 회전은 $\mathrm{SO}(3)$에 속하며 — 이들은 **다양체(manifold)**이지, 벡터 공간이 아닙니다. 두 회전 행렬을 더해서 회전을 얻을 수 없으므로, 표준적인 "업데이트 $x \leftarrow x + \Delta x$" 방식의 최적화는 직접 적용되지 않습니다. **리 이론(Lie theory)**이 이 간극을 메웁니다: 각 리 군(회전/포즈의 곡면 공간)에는 대응하는 **리 대수(Lie algebra)**(그 군에 항등원에서 접하는 평평한 벡터 공간)가 있으며, 지수 사상과 로그 사상으로 연결됩니다. 최적화기는 평평한 대수 위에서 동작하고, 업데이트를 군 위로 다시 사상합니다.

**so(3)와 SO(3).** 리 대수 $\mathfrak{so}(3)$는 $3 \times 3$ 반대칭 행렬 $[\boldsymbol{\phi}]_\times$로 구성되며, 벡터 $\boldsymbol{\phi} \in \mathbb{R}^3$(축 곱하기 각도)로 매개변수화됩니다. 지수 사상은 로드리게스 회전 공식입니다:

$$
R = \exp([\boldsymbol{\phi}]_\times) = I + \frac{\sin\|\boldsymbol{\phi}\|}{\|\boldsymbol{\phi}\|}[\boldsymbol{\phi}]_\times + \frac{1-\cos\|\boldsymbol{\phi}\|}{\|\boldsymbol{\phi}\|^2}[\boldsymbol{\phi}]_\times^2
$$

로그 사상 $\log: \mathrm{SO}(3) \to \mathfrak{so}(3)$는 그 역입니다 — 회전 행렬로부터 회전 벡터를 복원합니다.

**se(3)와 SE(3).** 강체 포즈의 경우, $\mathfrak{se}(3)$의 원소는 $\boldsymbol{\xi} = [\boldsymbol{\rho}^T, \boldsymbol{\phi}^T]^T \in \mathbb{R}^6$(이동 부분 $\boldsymbol{\rho}$, 회전 부분 $\boldsymbol{\phi}$)로 매개변수화됩니다:

$$
\hat{\boldsymbol{\xi}} = \begin{bmatrix} [\boldsymbol{\phi}]_\times & \boldsymbol{\rho} \\ \mathbf{0}^T & 0 \end{bmatrix}, \qquad
T = \exp(\hat{\boldsymbol{\xi}}) = \begin{bmatrix} \exp([\boldsymbol{\phi}]_\times) & J\boldsymbol{\rho} \\ \mathbf{0}^T & 1 \end{bmatrix}
$$

여기서 $J$는 $\mathrm{SO}(3)$의 **왼쪽 야코비안(left Jacobian)**입니다:

$$
J = I + \frac{1 - \cos\|\boldsymbol{\phi}\|}{\|\boldsymbol{\phi}\|^2}[\boldsymbol{\phi}]_\times + \frac{\|\boldsymbol{\phi}\| - \sin\|\boldsymbol{\phi}\|}{\|\boldsymbol{\phi}\|^3}[\boldsymbol{\phi}]_\times^2
$$

**왜 이 매개변수화가 유리한가.** 포즈는 정확히 6개의 자유도를 가지며, $\boldsymbol{\xi} \in \mathbb{R}^6$은 지역적 업데이트를 위한 *최소한의*, 특이점이 관리되는 매개변수화입니다: 유지해야 할 제약이 없고($3\times4$ 행렬이나 단위 쿼터니언과 달리), 짐벌락도 없습니다(그 특이점에서의 오일러 각과 달리). SLAM 최적화에서, 각 반복은 대수에서 작은 업데이트 $\boldsymbol{\xi}$를 풀고 이를 군 위에 **섭동(perturbation)**으로 적용합니다:

$$
T \leftarrow T \cdot \exp(\hat{\boldsymbol{\xi}}) \quad \text{(오른쪽 섭동)} \qquad \text{또는} \qquad T \leftarrow \exp(\hat{\boldsymbol{\xi}}) \cdot T \quad \text{(왼쪽 섭동)}
$$

잔차(예: 재투영 오차)의 야코비안은 $\boldsymbol{\xi}$에 대해 유도되며, $\boldsymbol{\xi} = 0$에서 평가됩니다.

## 예제로 풀어보는 섭동 야코비안

모든 미분 계산은 하나의 동작으로 귀결됩니다: $\exp$를 1차까지 전개하면 $\exp([\delta\boldsymbol{\phi}]_\times) \approx I + [\delta\boldsymbol{\phi}]_\times$이고, $[\mathbf{a}]_\times \mathbf{b} = -[\mathbf{b}]_\times \mathbf{a}$를 사용합니다. 왼쪽 섭동 아래에서 회전된 점 $R\mathbf{p}$에 대해:

$$
\exp([\delta\boldsymbol{\phi}]_\times)\, R\,\mathbf{p} \;\approx\; (I + [\delta\boldsymbol{\phi}]_\times) R \mathbf{p}
= R\mathbf{p} + [\delta\boldsymbol{\phi}]_\times R\mathbf{p}
= R\mathbf{p} - [R\mathbf{p}]_\times\, \delta\boldsymbol{\phi}
$$

따라서 $\partial(R\mathbf{p})/\partial\,\delta\boldsymbol{\phi} = -[R\mathbf{p}]_\times$입니다. 오른쪽 섭동 버전도 동일한 두 줄을 따라 유도되며 $-R[\mathbf{p}]_\times$를 줍니다. 이를 투영 야코비안 $\partial\pi/\partial\mathbf{p}$와 연쇄시키면, 모든 번들 조정 구현에서 사용하는 재투영 오차 야코비안을 유도한 셈입니다 — 행렬 미분 표를 찾아볼 필요가 없습니다.

## 코드에서

Sophus는 이 메커니즘의 독립형 C++ 구현체(Eigen 기반)이며, API가 수식을 그대로 반영합니다:

```cpp
#include <sophus/se3.hpp>

Eigen::Matrix<double, 6, 1> xi = ...;      // twist in se(3)
Sophus::SE3d T = Sophus::SE3d::exp(xi);    // exp map: algebra -> group
Eigen::Matrix<double, 6, 1> back = T.log();// log map: group -> algebra

T = T * Sophus::SE3d::exp(delta);          // right-perturbation update step
```

동일한 패턴이 모든 SLAM 라이브러리에 내재되어 있습니다: g2o의 `SE3` 정점, Ceres의 매니폴드(지역 파라미터화), GTSAM의 `Pose3`. 이 메커니즘은 $\mathrm{Sim}(3)$(포즈 + 스케일)까지 확장되는데, 단안 SLAM은 궤적을 따라 스케일이 드리프트하기 때문에 루프 클로저에 이를 사용합니다.

## 흔한 함정들

- **소각(small-angle) 수치 계산**: $\exp$, $\log$, $J$의 $\sin\theta/\theta$ 형태의 계수는 $\theta = 0$에서 $0/0$이 됩니다; 구현체는 0 근처에서 테일러 전개로 전환해야 합니다(라이브러리들은 이를 처리합니다 — 직접 구현한 스크래치 코드도 마찬가지로 해야 합니다).
- **$\pi$ 근처에서의 $\log$**: 거의 $180°$인 회전에서 축을 복원하는 것은 조건이 나쁩니다; 큰 회전을 평균화하거나 보간할 때 주의해야 합니다.
- **왼쪽 대 오른쪽 규약**: 논문과 라이브러리는 왼쪽/오른쪽 섭동을 자유롭게 섞어 씁니다; 야코비안이 서로 다르며(위의 예제 참고), 규약을 무심코 섞는 것은 "옵티마이저가 엉뚱한 값으로 수렴하는" 전형적인 버그의 원인입니다.
- **쿼터니언의 이중 덮개(double cover)**: $q$와 $-q$는 동일한 회전을 인코딩합니다; 잔차와 보간은 이 부호를 처리해야 하며, 그렇지 않으면 $2\pi$ 근처에서 오차가 나타납니다.
- **솔버에서 다양체를 잊는 것**: 지역 파라미터화 없이 원시 4-파라미터 쿼터니언이나 9-파라미터 회전 행렬을 최적화기에 넣으면 업데이트가 다양체를 벗어날 수 있습니다 — Ceres의 매니폴드 API, g2o의 정점 구현, GTSAM의 타입들은 정확히 이를 막기 위해 존재합니다.

## SLAM에서의 의미

번들 조정, 포즈 그래프 최적화, IMU 프리인티그레이션, 직접 이미지 정렬 등 최적화 기반 SLAM 구성 요소는 모두 포즈에 대해 잔차를 미분하며, 리 군 메커니즘이 바로 *어떻게* 이를 올바르게 수행하는지를 말해줍니다. 포즈 간의 잔차 자체도 $\log$를 통해 표현됩니다(포즈 그래프 비용 $\|\log(T_{ij}^{-1} T_i^{-1} T_j)\|^2$처럼). $\exp$/$\log$/섭동 표기를 유창하게 읽지 못한다면 백엔드 논문은 읽을 수 없습니다; 한번 익히면 그 논문들이 모두 즐겁게도 비슷하게 보입니다.

## 실습

- [Eigen + Sophus 실습](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part1_ch03_05)

## 관련 문서

- [Rigid body motion](../level-01-beginner/rigid-body-motion.md)
- [MAP inference as sparse nonlinear least squares](map-inference-as-sparse-nonlinear-least-squares.md)
- [Pose graph optimization](pose-graph-optimization.md)
- [Quaternion kinematics for error-state KF](../level-06-vio-vins/quaternion-kinematics-for-error-state-kf.md)
- [Lietorch](../level-05-deep-learning/lietorch.md)
