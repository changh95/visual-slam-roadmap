# Theseus

> Pineda (Meta) 2022 · [논문](https://arxiv.org/abs/2207.09442)

**한 줄 요약** — 미분 가능 비선형 최소자승법(DNLS)을 위한 애플리케이션에 무관한 오픈소스 PyTorch 라이브러리로, bundle adjustment와 같은 기하학적 최적화 루프 *내부에서* 신경망이 학습될 수 있게 하는 재사용 가능한 인프라를 제공합니다.

## 문제

2022년까지 여러 대표적인 시스템(BA-Net, DROID-SLAM, gradSLAM)이 비선형 최소자승법 솔버를 네트워크 *내부에* 넣고 이를 통해 학습하는 방법의 위력을 보여주었지만, 각 구현은 하나의 시스템을 위해 수작업으로 만들어졌습니다. 논문이 말하듯, 기존 DNLS 구현들은 "애플리케이션에 특화되어 있으며 효율성에 중요한 많은 요소들을 항상 포함하지는 않습니다": 희소 솔버, 배칭, 벡터화, GPU 지원, 메모리 효율적인 그래디언트 계산이 프로젝트마다 재발명되거나(혹은 생략되었고), 기존 DNLS 연구들은 오직 unrolling 방식의 그래디언트만 지원했습니다. 한편 성숙한 고전적 솔버(Ceres, g2o, GTSAM)는 이런 효율성 장치를 갖췄지만 그 solve 과정을 통해 역전파할 방법이 없었습니다. Theseus는 "로보틱스와 비전에서의 종단간 구조적 학습"을 위한 공유 인프라로서 이 간극을 한 번에 해결합니다.

## 방법 및 아키텍처

**이중 레벨 최적화로서의 DNLS.** 내부 문제는 매니폴드 값을 갖는 변수 $\theta = \{\theta_j\}$(유클리드 벡터 또는 Lie 그룹)에 대한 비선형 최소자승법이며, 잔차는 가중치와 비용으로 인수분해됩니다: $r_i(\theta^i) = w_i c_i(\theta^i)$.

$$\theta^{\star} = \operatorname*{arg\,min}_{\theta} S(\theta), \qquad S(\theta) = \frac{1}{2}\sum_i \|w_i c_i(\theta^i)\|^2 .$$

이는 반복적 선형화로 풀립니다: $J_i = \partial r_i / \partial\theta^i$로 $\big(\textstyle\sum_i J_i^{\top}J_i\big)\,\delta\theta = \textstyle\sum_i J_i^{\top} r_i$를 풀고, $\theta \leftarrow \theta - \delta\theta$로 retract합니다(Gauss–Newton; 적응형 감쇠를 갖는 LM과 Dogleg도 제공됩니다). 상류의 네트워크 파라미터 $\phi$가 비용, 가중치, 초기화 어디에든 개입할 수 있어, 다음과 같은 이중 레벨 구성이 됩니다:

$$\text{내부:}\;\; \theta^{\star}(\phi) = \operatorname*{arg\,min}_{\theta} S(\theta;\phi), \qquad \text{외부:}\;\; \phi^{\star} = \operatorname*{arg\,min}_{\phi} L(\theta^{\star}(\phi)),$$

여기서 외부 루프는 솔버를 통과하는 $\partial\theta^{\star}/\partial\phi$를 사용하는 일반적인 gradient descent입니다.

**API(factor graph 형태).** `Variable`(최적화 또는 보조 텐서), `CostFunction`($c_i$; 해석적 Jacobian을 갖춘 라이브러리 제공 요소들 — Gaussian 측정, 재투영, 상대 포즈, 모션 모델, 충돌 — 또는 in-place `AutoDiffCostFunction`), `CostWeight`($w_i$, 강건 손실 포함), `Objective`($S$), `Optimizer`, 그리고 `TheseusLayer`가 있으며, 이것의 `forward`는 어떤 PyTorch 그래프 내부에서도 입력 텐서를 최적 변수 값으로 매핑합니다. 미분 가능한 Lie 그룹은 exp/log, 역원, 합성을 해석적 접공간(tangent-space) 미분과 함께 닫힌 형태로 계산하고, autograd 그래디언트가 접공간에 올바르게 매핑되도록 하는 투영 연산자를 갖추고 있습니다(연산별 커스텀 커널을 쓰는 LieTorch와 대조적입니다). 미분 가능한 순방향 kinematics는 Differentiable Robot Model을 감쌉니다.

**효율성 장치.** (i) 두 단계의 병렬성 — DNLS 문제의 네이티브 배칭과 동일 유형 비용 연산의 자동 벡터화(SIMD 방식). (ii) PyTorch의 dense Cholesky를 대체하는 종단간 미분 가능 *희소* 선형 솔버: CHOLMOD(CPU), cudaLU(GPU에서의 cuSolverRF 기반 배치 LU), 그리고 BaSpaCho — GPU 지원을 갖춘 새로운 오픈소스 배치 supernodal 희소 Cholesky로, 그 희소 소거법은 외부 Schur complement 트릭의 필요성을 없앱니다. 선형 solve $y = A^{-1}b$를 통한 역전파는 암묵적 미분을 사용합니다: $\partial f/\partial b = A^{-1}\,\partial f/\partial y$ 및 $\partial f/\partial A = -A^{-1}(\partial f/\partial y)\,y^{\top}$이며, 인수분해를 캐싱하면 역전파가 순전파보다 더 빨라집니다.

**네 가지 역전파 방식.** Unrolling(솔버 반복을 통한 역전파 — 계산량/메모리가 선형적으로 증가하며 그래디언트 소실 위험이 있음); truncated differentiation(TBPTT, 편향됨); 최적성 조건 $g(\theta;\phi) := \nabla_{\theta} S(\theta;\phi) = 0$에 암묵적 함수 정리를 적용하는 **암묵적 미분**:

$$\mathrm{D}_{\phi}\theta^{\star}(\bar{\phi}) = -\mathrm{D}_{\theta}^{-1} g\big(\theta^{\star}(\bar{\phi});\bar{\phi}\big)\, \mathrm{D}_{\phi} g\big(\theta^{\star}(\bar{\phi});\bar{\phi}\big),$$

실제로는 해에서의 단일 Newton step $h(\theta;\phi) = \theta - [\nabla^2_{\theta}S]^{-1}_{\text{stop}}\nabla_{\theta}S$를 미분하여 계산합니다. 그리고 손실이 추가된 내부 solve를 사용하는 finite-difference vector-Jacobian-product 방식인 direct loss minimization(DLM)이 있습니다. 암묵적 방식과 DLM은 반복 횟수와 무관한 비용을 가집니다.

**동일한 구성 요소로 만들어진 예시 애플리케이션들**: pose graph optimization(Welsch 강건 커널 반경 학습), 촉각(tactile) 상태 추정(촉각 이미지-상대 포즈 네트워크의 종단간 학습), bundle adjustment(이상치 소프트 커널 반경 학습), 모션 플래닝(학습된 초기화 모델을 갖춘 미분 가능 GPMP2), feature-metric homography 추정(강건한 정렬 특징을 위한 CNN 학습).

## 실험 결과

- **희소 대 밀집(PGO, 합성 Cube 데이터셋, V100 32 GB, 내부 반복 10회 / 외부 epoch 20회, 암묵적 모드):** PyTorch의 밀집 솔버는 배치 크기 128에서 256개 포즈를 넘으면 메모리가 부족해지며, 그 이전 지점에서도 순전파+역전파 시간이 20.81초(밀집)인 반면 CHOLMOD 10.96초, cudaLU 2.86초, BaSpaCho 2.25초입니다. BaSpaCho는 2048개 포즈, cudaLU는 4096개, CHOLMOD는 배치 256에서 8192개 포즈까지 확장되며, BaSpaCho는 모든 규모에서 밀집 솔버보다 우수하고 최대 한 자릿수 더 빠릅니다.
- **Ceres 대비(배치 PGO, 10회 반복, 256개 문제):** 소규모(256개 포즈, 배치 16)에서는 Ceres가 25배 더 빠르지만, 2048개 포즈 / 배치 256에서는 BaSpaCho가 Ceres보다 약 23배 빠르고 다른 희소 솔버들은 약 4배 빠릅니다. 초록에서 강조하는 "최대 20배"의 순전파 속도 향상은 배칭 + 벡터화 + 희소성에서 나옵니다.
- **역전파 방식(촉각 상태 추정, 100 epoch):** unrolling의 역전파 시간과 메모리는 내부 반복 수에 따라 선형적으로 증가하는 반면(약 34 MB에서 262 MB), 암묵적/DLM은 약 28–29 MB로 일정합니다. 암묵적 미분은 최고의 검증 손실도 달성하여, 권장 기본값이 됩니다.
- 자동 벡터화는 PGO에서 순전파/역전파 속도를 크게 향상시키지만, 그 대가로 메모리가 최대 약 82%(순전파)/약 55%(역전파) 더 필요합니다.

## SLAM에서의 의미

고전적인 SLAM 백엔드(g2o, Ceres, GTSAM)는 고도로 최적화되어 있지만 미분 가능하지 않으며, 심층 신경망은 미분 가능하지만 SLAM을 다룰 수 있게 만드는 희소 구조를 버립니다. Theseus는 이 둘을 연결합니다: factor-graph 스타일의 최적화를 PyTorch로 가져와 하이브리드 시스템(학습 기반 프론트엔드, 최적화 기반 백엔드)이 실제 태스크 손실에 대해 종단간으로 학습될 수 있게 합니다. BA-Net과 DROID-SLAM이 개척한 패턴을 공유 인프라로 일반화하며, VIO/SLAM 추정기의 잔차 가중치, 강건 커널, 초기화 네트워크를 수작업 튜닝 대신 학습시키는 자연스러운 도구입니다.

## 관련 문서

- [BA-Net](ba-net.md) — 네트워크 레이어로서의 미분 가능 bundle adjustment로, 직접적인 선행 연구입니다.
- [Lietorch](lietorch.md) — PyTorch에서의 미분 가능 Lie 그룹 연산으로, 같은 종류의 문제에 사용됩니다.
- [GradSLAM](gradslam.md) — 완전히 미분 가능한 밀집 SLAM 파이프라인.
- [DROID-SLAM](droid-slam.md) — 미분 가능 BA 레이어를 중심으로 구축된 종단간 SLAM 시스템.
- [Differentiability](differentiability.md) — 이 모든 시스템의 근간이 되는 개념.
- [MAP inference as sparse nonlinear least squares](../level-02-getting-familiar/map-inference-as-sparse-nonlinear-least-squares.md) — 미분 가능하게 만들어지는 고전적 문제.
