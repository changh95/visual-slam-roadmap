# Logarithm & Exponential

지수 함수와 로그 함수는 **Lie 군**과 **Lie 대수**의 맥락에서 SLAM 전반에 걸쳐 등장합니다. 익숙한 스칼라 형태를 넘어서, 이들의 행렬 버전은 회전(최적화하기 어려운 대상)과 벡터(최적화하기 쉬운 대상) 사이를 잇는 다리 역할을 합니다.

## 스칼라 함수 복습

지수 함수 $e^x = \sum_{k=0}^{\infty} \frac{x^k}{k!}$와 그 역함수인 로그 함수 $\log(x)$는 이들을 유용하게 만드는 다음 항등식을 만족합니다.

$$e^{a+b} = e^a e^b, \qquad \log(ab) = \log a + \log b$$

로그 항등식은 확률론에서 이미 그 가치를 입증합니다: 우도는 작은 수 여러 개의 *곱*이므로 부동소수점 언더플로우가 발생합니다. 로그를 취하면 곱이 수치적으로 안정적인 *합*으로 바뀝니다---이것이 추정기가 우도 자체를 최대화하는 대신 음의 로그 우도(negative log-likelihood)를 최소화하는 이유입니다.

## 회전의 문제점

회전 행렬 $R \in SO(3)$은 벡터 공간이 아닙니다---두 회전을 더해서는 회전을 얻을 수 없으므로, 여기에 일반적인 그래디언트 하강법을 그대로 적용할 수 없습니다. 하지만 그 *Lie 대수* $\mathfrak{so}(3)$(항등원에서의 접선 공간)은 벡터 공간*입니다*: 그 원소는 그저 3-벡터 $\boldsymbol{\phi}$(축-각도)이며, 왜대칭 행렬 $[\boldsymbol{\phi}]_\times$로 표기됩니다.

## 지수 사상과 로그 사상

**행렬 지수**는 스칼라 지수와 동일한 거듭제곱 급수 $\exp(A) = \sum_{k=0}^{\infty} \frac{A^k}{k!}$로 정의되며, 왜대칭 인자에 대해서는 이 급수가 닫힌 형태로 축약됩니다.

- **지수 사상** $\exp: \mathfrak{so}(3) \to SO(3)$은 Lie 대수 원소를 회전 행렬로 변환합니다. 단위축 $\hat{\mathbf{n}}$을 중심으로 각도 $\theta$만큼 회전하는 경우($\boldsymbol{\phi} = \theta\hat{\mathbf{n}}$이므로):

$$\exp([\boldsymbol{\phi}]_\times) = I + \sin\theta\,[\hat{\mathbf{n}}]_\times + (1 - \cos\theta)\,[\hat{\mathbf{n}}]_\times^2$$

  이것이 **Rodrigues 공식**입니다---단위 왜대칭 행렬의 거듭제곱이 순환한다는 사실($[\hat{\mathbf{n}}]_\times^3 = -[\hat{\mathbf{n}}]_\times$)에서 얻어지는 행렬 지수 급수의 닫힌 형태입니다.

- **로그 사상** $\log: SO(3) \to \mathfrak{so}(3)$은 그 역사상입니다: 회전 행렬로부터 축-각도 벡터를 추출합니다. 각도는 대각합(trace)으로부터 $\theta = \arccos\!\big(\tfrac{\mathrm{trace}(R) - 1}{2}\big)$로 얻어지고, 축은 $R$의 반대칭 성분으로부터 얻어집니다.

작은 회전에 대해서는 1차 항만 남기면 다음과 같은 흔히 쓰이는 근사식을 얻습니다.

$$\exp([\boldsymbol{\phi}]_\times) \approx I + [\boldsymbol{\phi}]_\times \qquad (\|\boldsymbol{\phi}\| \text{가 작을 때})$$

이는 회전 섭동에 대한 잔차의 야코비안을 유도할 때 사용하는 선형화와 정확히 동일합니다.

동일한 구성이 완전한 강체 포즈로도 확장됩니다: $\exp$는 $\mathfrak{se}(3)$(6-벡터: 이동 + 회전)을 $SE(3)$(동차 변환 행렬)로 사상하며, $\log$는 그 역방향으로 사상합니다.

## 스칼라 직관이 여전히 도움이 되는 이유

익숙한 항등식들은 그 정신을 그대로 이어받습니다: 지수는 덧셈을 합성으로 바꾸고(교환 가능한 인자에 대해 $e^{a+b} = e^a e^b$), 로그는 합성을 다시 가산적인 것으로 바꿉니다. 이는 정확히 최적화에 필요한 것입니다: 작은 보정을 벡터 $\boldsymbol{\xi}$로 표현하고, 이를 $T \leftarrow T\cdot\exp(\hat{\boldsymbol{\xi}})$처럼 곱셈적으로 적용하며, 포즈 오차를 $\|\log(T_1^{-1}T_2)\|$로 측정합니다.

기억해 둘 만한 주의사항 하나: 행렬의 경우 $e^{A+B} = e^A e^B$는 $A$와 $B$가 교환 가능할 때만 성립합니다---그리고 서로 다른 축에 대한 회전들은 교환되지 않습니다. 바로 이 비교환성 때문에 3D 회전은 단순한 벡터 덧셈이 아니라 Lie 이론을 필요로 합니다.

## 흔한 함정

- **$\theta = 0$과 $\theta = \pi$ 근처에서의 로그 사상의 수치적 불안정성**: 축을 구하는 공식은 $\sin\theta$로 나누므로, 견고한 구현에서는 이 각도들 근처에서 테일러 전개 분기로 전환합니다.
- **가산성을 가정하는 오류**: 두 축-각도 벡터를 더해서 합성하는 것은 작은 각도에 대해서만 근사적으로 맞습니다. 정확한 합성은 $\exp$/$\log$를 거쳐야 합니다.
- **표기 관례 혼용**: 어떤 라이브러리는 $SE(3)$ 접공간 벡터를 (이동, 회전) 순서로 저장하고, 다른 라이브러리는 (회전, 이동) 순서로 저장합니다---코드베이스 사이에서 야코비안을 복사하기 전에 반드시 확인해야 합니다.

## SLAM에서의 의미

로그와 지수는 회전과 포즈를 "선형화"하여 그래디언트 기반 최적화에 적용할 수 있게 해줍니다---모든 현대 SLAM 백엔드(g2o, GTSAM, 매니폴드 매개변수화를 사용하는 Ceres)는 지수 사상을 통해 포즈를 업데이트하며, 포즈 그래프 오차는 로그 사상을 통해 정의됩니다. 지금 $\exp/\log$에 익숙해지면 레벨 2에서 Lie 군을 제대로 배울 때 곧바로 도움이 됩니다.

## 관련 문서

- [Rigid body motion](rigid-body-motion.md)
- [Basic Calculus](basic-calculus.md)
- [Basic Probability & Statistics](basic-probability-and-statistics.md)
- [Lie groups](../level-02-getting-familiar/lie-groups.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)
