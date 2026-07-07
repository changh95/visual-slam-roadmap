# Basic Probability & Statistics

SLAM은 본질적으로 *확률적 추정 문제*입니다: 노이즈가 섞인 센서 데이터가 주어졌을 때, 로봇의 가장 그럴듯한 상태(포즈 + 지도)는 무엇인가? 확률론은 불확실성 아래에서 추론하기 위한 엄밀한 언어를 제공합니다.

## 가우시안 분포

평균 $\mu$와 표준편차 $\sigma$를 가진 단변량 가우시안(정규) 분포의 확률 밀도 함수:

$$p(x) = \frac{1}{\sigma\sqrt{2\pi}} \exp\!\left(-\frac{(x-\mu)^2}{2\sigma^2}\right)$$

SLAM 상태는 다차원이므로 **다변량 가우시안**을 사용합니다. 평균 $\boldsymbol{\mu}$와 공분산 행렬 $\boldsymbol{\Sigma}$(대칭 양의 정부호)를 가진 확률 벡터 $\mathbf{x} \in \mathbb{R}^n$에 대해:

$$p(\mathbf{x}) = \frac{1}{(2\pi)^{n/2}|\boldsymbol{\Sigma}|^{1/2}} \exp\!\left(-\frac{1}{2}(\mathbf{x}-\boldsymbol{\mu})^T \boldsymbol{\Sigma}^{-1}(\mathbf{x}-\boldsymbol{\mu})\right)$$

지수의 인자인 $(\mathbf{x}-\boldsymbol{\mu})^T\boldsymbol{\Sigma}^{-1}(\mathbf{x}-\boldsymbol{\mu})$는 **마할라노비스 거리**로---$\mathbf{x}$가 평균으로부터 얼마나 떨어져 있는지를 나타내는 스케일 불변 측도입니다. SLAM에서 공분산 $\boldsymbol{\Sigma}$는 불확실성을 나타냅니다: 대각 원소 $\Sigma_{ii}$가 크면 상태의 $i$번째 성분에 대한 불확실성이 크다는 의미입니다.

가우시안이 추정의 핵심 도구가 되는 두 가지 성질이 있습니다:

- **선형 사상에 대한 닫힘성**: $\mathbf{x} \sim \mathcal{N}(\boldsymbol{\mu}, \boldsymbol{\Sigma})$이면, $\mathbf{y} = A\mathbf{x} + \mathbf{b}$는 평균 $A\boldsymbol{\mu} + \mathbf{b}$와 공분산 $A\boldsymbol{\Sigma}A^T$를 가진 가우시안입니다. 이 **공분산 전파** 규칙($\Sigma_y = A\Sigma A^T$, 비선형 사상의 경우 $A$를 야코비안으로 대체)은 SLAM 파이프라인에서 불확실성이 흘러가는 방식입니다---픽셀 노이즈에서 삼각측량된 점의 공분산으로, 다시 포즈 공분산으로 이어집니다.
- **가우시안의 곱은 (정규화를 제외하면) 가우시안**입니다. 이것이 가우시안 사전 확률과 우도를 사용한 베이즈 업데이트가 다루기 쉬운 이유이며---칼만 필터 뒤에 있는 대수적 원리입니다.

## 베이즈 정리

베이즈 정리는 확률적 SLAM의 핵심 엔진입니다. 관측값 $\mathbf{z}$가 주어졌을 때 상태 $\mathbf{x}$에 대한 우리의 믿음인 *사후 확률* $p(\mathbf{x}|\mathbf{z})$를 *우도* $p(\mathbf{z}|\mathbf{x})$와 *사전 확률* $p(\mathbf{x})$와 연결합니다:

$$p(\mathbf{x} \mid \mathbf{z}) = \frac{p(\mathbf{z} \mid \mathbf{x})\, p(\mathbf{x})}{p(\mathbf{z})} \propto p(\mathbf{z} \mid \mathbf{x})\, p(\mathbf{x})$$

SLAM에서 $\mathbf{x}$는 로봇 포즈(및 지도)이고, $\mathbf{z}$는 카메라 이미지(또는 특징점 관측값)입니다. 사전 확률은 동작 모델에서, 우도는 관측 모델에서 얻습니다. 베이즈 정리의 재귀적 적용---예측 후 업데이트---이 Extended Kalman Filter(EKF-SLAM)와 파티클 필터의 기반입니다.

## MAP와 MLE

사후 확률을 최대화하는 상태를 찾는 것이 **MAP(최대 사후 확률) 추정**입니다:

$$\mathbf{x}^* = \arg\max_{\mathbf{x}}\, p(\mathbf{x} \mid \mathbf{z}) = \arg\max_{\mathbf{x}}\, p(\mathbf{z} \mid \mathbf{x})\, p(\mathbf{x})$$

사전 확률이 균일하면 MAP은 **최대 우도 추정(MLE)**으로 환원됩니다. 가우시안 노이즈 모델에서 MLE는 제곱 오차 합의 최소화와 동치입니다---이것이 정확히 번들 조정이 수행하는 것입니다.

## MLE에서 최소제곱으로 (핵심 유도)

독립적인 관측값 $\mathbf{z}_i$가 가우시안 노이즈를 가진다고 가정합니다: $\mathbf{z}_i = \mathbf{h}_i(\mathbf{x}) + \boldsymbol{\epsilon}_i$, $\boldsymbol{\epsilon}_i \sim \mathcal{N}(\mathbf{0}, \boldsymbol{\Sigma}_i)$. 우도는 곱이므로, 그 *음의 로그*는 합이 됩니다:

$$-\log \prod_i p(\mathbf{z}_i \mid \mathbf{x}) = \frac{1}{2}\sum_i \big(\mathbf{z}_i - \mathbf{h}_i(\mathbf{x})\big)^T \boldsymbol{\Sigma}_i^{-1} \big(\mathbf{z}_i - \mathbf{h}_i(\mathbf{x})\big) + \text{const}$$

따라서 우도를 최대화하는 것은 **마할라노비스 가중 제곱 잔차 합을 최소화하는 것**과 같습니다. 이 한 줄이 확률론과 최적화를 연결합니다: 번들 조정, 포즈 그래프 최적화, 팩터 그래프 추론은 모두 가우시안 노이즈 하의 MAP 추정이며, 정보 행렬 $\boldsymbol{\Sigma}_i^{-1}$은 정확히 각 잔차에 부여되는 가중치입니다.

## 흔한 함정

- **우도와 사후 확률을 혼동**: $p(\mathbf{z}|\mathbf{x})$는 데이터를 고정한 상태에서 상태에 대한 함수이며, $\mathbf{x}$에 대해 적분해도 1이 되지 않습니다.
- **상관관계 무시**: 오차가 상관되어 있을 때(예: 마지널화 이후) $\boldsymbol{\Sigma}$를 대각으로 취급하면 추정기가 과도한 확신을 갖게 됩니다---SLAM에서 *비일관성*의 근본 원인입니다.
- **가우시안 가정 대 이상치**: 잘못된 특징점 매칭 하나만으로도 가우시안 노이즈 모델을 심하게 위반하여 전체 추정을 오염시킬 수 있습니다. 이것이 강건 커널과 RANSAC이 존재하는 이유입니다.

## SLAM에서의 의미

SLAM 백엔드의 두 지배적인 계열---필터링(EKF, 파티클 필터)과 스무딩(팩터 그래프, 번들 조정)---은 모두 가우시안 노이즈 하의 베이즈 추정을 직접 적용한 것입니다. 가우시안, 베이즈 정리, MAP/MLE 연결을 이해하는 것은 칼만 필터 업데이트와 최소제곱 풀이가 동일한 추론 문제를 바라보는 두 가지 관점이라는 것을 알게 해줍니다.

## 관련 문서

- [Basic Calculus](basic-calculus.md)
- [MAP inference as sparse nonlinear least squares](../level-02-getting-familiar/map-inference-as-sparse-nonlinear-least-squares.md)
- [Factor graph](../level-02-getting-familiar/factor-graph.md)
- [Visual-SLAM why filter?](../level-03-monocular-slam/visual-slam-why-filter.md)
- [Consistency](../level-02-getting-familiar/consistency.md)
- [Marginalization](../level-02-getting-familiar/marginalization.md)
