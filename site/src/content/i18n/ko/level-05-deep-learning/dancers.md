# DANCeRS

> Patwardhan 2025 · [논문](https://arxiv.org/abs/2508.18153)

**한 줄 요약** — DANCeRS는 Gaussian Belief Propagation을 로봇 군집(swarm)의 분산 합의(consensus)에 적용한다: 로봇들은 중앙 서버 없이 팩터 그래프 상의 순수하게 지역적인 peer-to-peer 메시지 전달을 통해 연속적(포메이션의 포즈) 또는 이산적(best-of-N 선택) 공유 결정에 합의한다.

## 문제

로봇 군집은 형태 형성(shape formation)부터 집단 의사결정까지 다양한 과제에서 결속력 있는 집단 행동을 필요로 한다. 기존 접근법들은 "이산적 결정 공간과 연속적 결정 공간에서의 합의를 서로 별개의 문제로 다루는 경우가 많으며", 각각 전용 알고리즘(한쪽은 best-of-N 투표와 여론 동역학, 다른 쪽은 이웃 평균화와 mean-shift)을 사용한다. DANCeRS는 지역적 통신만 가능하고, 그래프 토폴로지가 동적이며, 군집 규모에 따라 확장 가능해야 한다는 군집의 현실을 존중하면서도, 단일 분산 추론 프레임워크로 두 영역 모두에서 합의를 이끌어낼 수 있는지를 묻는다.

## 방법 및 아키텍처

$N$대의 로봇(통신 반경 $r_C$)으로 구성된 군집은 동적인 무방향 그래프를 형성하며, 전체 문제는 결합 분포가 다음과 같이 인수분해되는 하나의 팩터 그래프이다.

$$p(\mathbf{X})=\prod_{s}f_{s}(\mathbf{X}_{s}), \qquad f_{s}(\mathbf{X}_{s})\propto e^{-\frac{1}{2}\mathbf{r}^{\top}\boldsymbol{\Lambda}_{s}\mathbf{r}}, \qquad \mathbf{r}=\mathbf{z}_{s}-\mathbf{h}_{s}(\mathbf{X}_{s}),$$

이때 belief는 정보 형태($\boldsymbol{\Lambda}=\boldsymbol{\Sigma}^{-1}$, $\boldsymbol{\eta}=\boldsymbol{\Lambda}\boldsymbol{\mu}$)로 유지된다. GBP 추론은 팩터-변수 메시지, 변수 belief 갱신, 변수-팩터 메시지로 이루어진 하나의 루프이며 — 모두 엄격히 이웃 간에만 이루어진다. 비유클리드 상태에 대해서는 메시지가 Exp/Log를 통해 현재 belief의 tangent space로 매핑되었다가 다시 되돌아오므로, 변수는 $\mathbb{R}^{M}, SO(2), SO(3), SE(2), SE(3)$ 위에 존재할 수 있다.

각 로봇은 두 층의 팩터 그래프 스택을 실행한다:

- **전역 합의(Global Consensus) 층** — 로봇 $i$는 공유 파라미터 $\chi$에 대한 자신의 해석 ${}^{\mathcal{G}}X_{i}$를 보유하며, 사전 팩터 $h_{p}={}^{\mathcal{G}}X_{i}\ominus{}^{\mathcal{G}}x_{i}^{0}$와 함께, 통신 범위 내 이웃 $j$마다 명시적인 협상 팩터를 갖는다.

$$h_{c}\left({}^{\mathcal{G}}X_{i},{}^{\mathcal{G}}X_{j}\right)={}^{\mathcal{G}}X_{i}\ominus{}^{\mathcal{G}}X_{j}=\mathrm{Log}\left({}^{\mathcal{G}}X_{j}^{-1}\cdot{}^{\mathcal{G}}X_{i}\right).$$

  GBP 변수는 메모리가 없으므로, 각 로봇은 시간적으로 연결된 $W$개의 복사본으로 이루어진 슬라이딩 윈도우를 유지한다. 가장 오래된 것이 삭제될 때 그 marginal이 새로운 사전 분포가 되어, 그룹을 떠나는 로봇은 협상된 평균값을 유지하면서 공분산만 약해진다.
- **연속 합의로서의 이산 결정** — $N_D$개의 선택지에 대해 $\mathcal{M}=\mathbb{R}^{1}$을 취하고 결정을 읽어낼 때만 양자화한다: $\gamma(x)=\lfloor N_{D}\cdot x\rfloor$, $\gamma^{-1}(k)=k/N_{D}$. 협상 자체는 가우시안이면서 연속적으로 유지된다.
- **경로 계획(Path Planning) 층** — 상태 $[x,y,\theta,\dot{x},\dot{y},\dot{\theta}]^{\top}$를 지평선(horizon)에 걸쳐 유지하며, 새로운 비홀로노믹 unicycle 팩터 $h_{u}=\dot{x}\cos\theta-\dot{y}\sin\theta$(0으로 수렴하도록 하여 속도를 헤딩에 맞춤)와 완화된(smoothed) 로봇 간 충돌 팩터 $h_{r}=\exp(-|\mathbf{x}_{k,i}-\mathbf{x}_{k,j}|/d_{min})$을 갖는다. 형태 형성의 경우, 목표는 통신 범위를 벗어난 이웃이 있을 때 감쇠하는 "점유 가중치(occupancy weighting)"로 보강된 포메이션 점들에 대한 KD-트리 최근접 이웃 탐색으로 선택된다.

## 실험 결과

- **연속 합의(형태 형성):** 수렴은 로봇 간 평균 편차가 위치에서 0.1 m, 헤딩에서 0.01 rad 이하로 정의된다. 100×100 m 영역에서의 50회 실험에서, DANCeRS는 Sun et al. 2023의 mean-shift 합의 기준선보다 (메시지 전달 반복 횟수 기준) 한 자릿수 더 빠르게 수렴하며, $r_C$, 로봇 수 $N_R$, 윈도우 $W$가 증가할수록 수렴이 가속된다. 또한 mean-shift 방법이 하나의 연결된 구성요소로 제한되어 만들지 못하는 분리된 형태('!', 'wifi', 웃는 얼굴)도 형성할 수 있다.
- **이산 합의:** 엔트로피 기반(ECA) 및 확률적(PCA) 합의 기준선과 비교했을 때, $r_C=6$ m에서는 ECA가 전혀 수렴하지 못했다. 더 큰 $r_C$에서는 $N_R$이 증가해도 DANCeRS가 대략 일정한 반복 횟수를 유지했다. 스윕 실험은 $\sigma_{c}=0.5/N_{D}$가 합의 팩터 강도의 바람직한 상한임을 뒷받침한다.
- **정보를 가진 로봇**($N_R=500$, $r_C=6$ m): 단일 시드 로봇($\zeta=0.002$)으로 DANCeRS는 80%의 실험에서 시드 결정으로 수렴했고 $\zeta\geq0.01$에서는 100%였다. 이는 PCA가 $\zeta=0.002$–$0.05$에 걸쳐 9%→94%, ECA가 전체 구간에서 0%였던 것과 대비된다.
- **비용:** 로봇 간 메시지 하나는 $n$차원 벡터와 $n\times n$ 대칭 공분산으로 구성되며, 형태 형성에서는 $n=3$, 이산 합의에서는 $n=1$이다 — 저전력 장치에서도 가벼울 만큼 경량이다.

## SLAM에서의 의미

군집 규모의 협업 SLAM은 DANCeRS가 겨냥하는 것과 정확히 같은 문제에 부딪힌다: 중앙집중식 맵 서버는 대역폭과 신뢰성의 병목이 되며, 분산 최적화기는 비동기성과 지역적 통신만을 견뎌내야 한다. GBP 스타일 합의가 Lie 군 변수 위에서, 동적 그래프 아래에서도 군집 전체에 걸쳐 작동함을 입증한 것은, 팩터 그래프 메시지 전달이 분산 추정, 매핑, 계획, 협조를 위한 공통 기계장치라는 비전을 뒷받침한다 — 이는 그래프 프로세서에서 BA를 푸는 것과 같은 계산이다.

## 관련 문서

- [FutureMapping 2](futuremapping-2.md)
- [BA on Graph Processor](ba-on-graph-processor.md)
- [Factor graph](../level-02-getting-familiar/factor-graph.md)
- [Kimera-Multi](../level-08-collaborative-slam/kimera-multi.md)
- [Swarm-SLAM](../level-08-collaborative-slam/swarm-slam.md)
- [Centralized vs Decentralized](../level-08-collaborative-slam/centralized-vs-decentralized.md)
