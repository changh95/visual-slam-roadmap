# Differentiability

신경망을 학습시키려면 손실로부터 파라미터까지 그래디언트가 흘러야 한다. 하지만 고전적인 SLAM은 그래디언트를 막는 연산들로 가득하다: RANSAC은 이산적인 가설 선택(argmax)을 수행하고, keypoint 검출은 non-maximum suppression과 top-$k$ 선택을 적용하며, bundle adjustment 같은 최적화 solver는 닫힌 형태(closed-form)의 함수가 아니라 반복적인 절차다. *Differentiability(미분 가능성)* 연구는 다음을 묻는다: 이런 고전적 기하 알고리즘들을 어떻게 미분 가능하게 만들어서, 네트워크가 그것들을 *통과하며* 학습될 수 있게 할 수 있을까 — 어떤 proxy 라벨이 아니라 최종 포즈나 맵 품질을 위해 최적화하도록?

## 고전적 SLAM이 그래디언트를 막는 이유

표준적인 relocalization 파이프라인을 생각해보자: 네트워크가 2D-3D 대응 관계를 예측하고, RANSAC이 최소 집합을 샘플링하고, PnP가 각 가설을 풀고, inlier 개수가 점수를 매기고, argmax 가설이 선택된다. 이 중 세 단계는 미분 불가능하다:

- **하드 선택(Hard selection)** — 가설들에 대한 argmax는 거의 모든 곳에서 그래디언트가 0이다(그리고 결정 경계에서는 그래디언트가 존재하지 않는다).
- **하드 카운팅(Hard counting)** — inlier 테스트 $[\,e_i < \tau\,]$는 계단 함수(step function)이며; 그 도함수는 정의되는 모든 곳에서 0이다.
- **반복적 solver** — Gauss-Newton이나 Levenberg-Marquardt는 하나의 함수가 아니라 반복 횟수가 가변적인 루프다; naive하게는 닫힌 형태의 Jacobian이 없다.

체인의 어느 한 연결이 그래디언트를 죽이면, 그 위쪽에 있는 모든 것은 시스템이 실제로 해야 하는 일과 맞지 않을 수도 있는 proxy 손실(ground-truth 깊이 모방, 수동 라벨링된 매칭 모방)로 학습되어야 한다.

## 주요 기법들

각 기법은 대표적인 시스템과 결부되어 있어, 구체적으로 학습할 수 있다:

- **argmax 대신 소프트 선택(DSAC)**: RANSAC의 하드한 가설 선택을 확률적 선택으로 대체한다. 가설 $\mathcal{H}_j$가 확률 $p(\mathcal{H}_j) \propto \text{score}(\mathcal{H}_j)$로 선택된다면, *기대(expected)* 태스크 손실
  $$\mathbb{E}[\mathcal{L}] = \sum_j p(\mathcal{H}_j)\,\mathcal{L}(\mathcal{H}_j)$$
  은 하나의 가설을 샘플링하는 것 자체는 미분 불가능하더라도 네트워크 파라미터에 대해 미분 가능하다. 하드 inlier 카운팅도 마찬가지로 매끄러운 대체물(예: residual의 sigmoid)로 대체되어, 가설 점수 자체가 그래디언트를 나른다.
- **solver를 unrolling하기(BA-Net, DROID-SLAM)**: Gauss-Newton 스텝
  $$\Delta\boldsymbol{\xi} = -\left(\mathbf{J}^\top\mathbf{J}\right)^{-1}\mathbf{J}^\top\mathbf{r}$$
  은 그저 행렬 곱, 선형 해법(linear solve), residual 평가일 뿐이다 — 모두 미분 가능하다. 따라서 *고정된* 반복 횟수는 계산 그래프로 unrolling되어 역전파될 수 있다. BA-Net은 학습된 특징 맵 위에서 bundle adjustment를 unrolling하고; DROID-SLAM은 동일한 아이디어를 재귀적인(recurrent) 업데이트 루프 안에 적용하여, 매 반복마다 dense BA 레이어를 다시 선형화한다.
- **암묵적 미분(Implicit differentiation, Theseus)**: 모든 solver 반복을 거쳐 역전파하는 대신(모든 중간 상태를 저장해야 하므로 메모리를 많이 잡아먹는다), 수렴된 해 $\mathbf{x}^*(\theta)$에서의 *최적성 조건(optimality conditions)*을 미분한다. $\nabla_{\mathbf{x}} E(\mathbf{x}^*, \theta) = 0$으로부터, 음함수 정리(implicit function theorem)는 다음을 준다
  $$\frac{d\mathbf{x}^*}{d\theta} = -\left(\nabla^2_{\mathbf{xx}} E\right)^{-1} \nabla^2_{\mathbf{x}\theta} E,$$
  따라서 그래디언트는 해에 도달하는 경로가 아니라 해 자체에만 의존한다. Theseus 같은 라이브러리는 (unrolling과 truncated 변형과 함께) 이런 방식으로 미분 가능한 비선형 최소자승법을 제공한다.
- **매니폴드를 인식하는 autodiff(LieTorch)**: 포즈는 $\mathbb{R}^{12}$가 아니라 $\mathrm{SE}(3)$ 위에 산다; 행렬 원소에 대한 naive한 autodiff는 매니폴드를 벗어나는 그래디언트를 만들어낸다. LieTorch는 Lie group 위에서 직접 자동 미분을 구현하여, 그래디언트 스텝이 지역 탄젠트 공간에서 취해지도록 한다, $\mathbf{T} \leftarrow \exp(\boldsymbol{\delta}^\wedge)\,\mathbf{T}$ — 이는 고전적 상태 추정에서 쓰이는 것과 동일한 retraction 기반 파라미터화다.
- **강화학습을 이용한 우회(DISK)**: 어떤 단계가 정말로 완화될 수 없을 때(예: 이산적인 keypoint 선택), 이를 확률적 정책(stochastic policy)으로 취급하고 score-function(policy-gradient) 추정기로 기대 보상을 최적화한다 — DISK가 특징 검출과 매칭에서 하는 방식이다.

## 그 대가: 태스크 수준 학습

이 모든 장치의 목적은 *태스크 수준 학습(task-level training)*이다: ground-truth 깊이나 수동 라벨링된 매칭을 모방하도록 네트워크를 가르치는 대신, RANSAC/PnP/BA가 제 역할을 마친 후 최종 카메라 포즈가 정확하도록 학습시킨다. 학습 목표와 시스템 목표가 동일한 것이 된다. 이러한 정렬(alignment)이 바로 미분 가능한 기하학 시스템(DSAC에서 ACE로 이어지는 relocalization 계열, DROID-SLAM)이 PoseNet 같은 naive한 종단간 포즈 회귀보다 더 잘 일반화되는 이유다 — 기하는 여전히 정확한 solver에 의해 강제되며; 네트워크는 학습으로부터 이득을 보는 부분만 학습한다.

두 번째 대가는 *자기지도(self-supervision)*다: 미분 가능한 투영과 solver가 있으면, 알려진 카메라 포즈를 통한 재투영 손실이 3D ground truth를 완전히 대체할 수 있다 — DSAC++가 도입했고 ACE 계열이 몇 분 단위의 매핑을 위해 의존하는 트릭이다.

## 흔한 함정들

- **메모리와 연산량**: unrolled solver는 backward pass를 위해 모든 중간 iterate를 저장해야 한다; 깊은 unroll은 GPU 메모리를 소진시킬 수 있다. 암묵적 미분이나 truncated backprop이 표준적인 회피책이다.
- **학습/테스트 불일치**: 학습 중 사용되는 소프트한 완화(soft argmax, soft inlier count)는 추론 시 사용되는 하드한 연산과 다르다; 그 격차가 크면 학습된 네트워크는 잘못된 파이프라인에 맞춰 최적화된 것이다. 하드 연산 쪽으로 temperature를 점진적으로 annealing하면 이를 완화할 수 있다.
- **그래디언트 병리(pathology)**: 긴 반복적 절차를 거치는 그래디언트는 사라지거나 폭발할 수 있으며, 학습 초기에는 크게 잘못된 가설로부터의 그래디언트가 지배적일 수 있다 — DSAC 스타일 학습은 초기화에 매우 민감한 것으로 유명하며, 이것이 후속 연구들이 사전 학습과 커리큘럼을 추가한 이유다.
- **여전히 지역 최적(local minima)**: solver를 미분 가능하게 만든다고 해서 그 landscape가 convex가 되는 것은 아니다; 네트워크는 solver의 수렴 basin을 *활용*하도록 학습될 수 있지만, 테스트 시의 나쁜 초기화는 고전적 기하학이 그러하듯 여전히 실패한다.

이 분야의 많은 엔지니어링은 바로 이런 문제들을 관리하는 데 관한 것이다.

## SLAM에서의 의미

Differentiability는 레벨 5의 두 절반을 잇는 다리다: 이는 학습된 프론트엔드가 기하학적 백엔드를 루프 안에 둔 채로 학습될 수 있게 하여, 고전적 최적화의 엄밀함을 유지하면서 그 주변의 모든 것을 학습하는 하이브리드 시스템을 만든다. 소프트 선택, solver unrolling, Lie-group autodiff를 이해하면 DSAC부터 DROID-SLAM까지의 논문들을 하나의 아이디어에 대한 변주로 읽을 수 있게 된다.

## 관련 문서

- [DSAC](dsac.md)
- [BA-Net](ba-net.md)
- [Theseus](theseus.md)
- [Lietorch](lietorch.md)
- [GradSLAM](gradslam.md)
- [DISK](disk.md)
- [DROID-SLAM](../level-03-monocular-slam/droid-slam.md)
