# BA on Graph Processor

> Ortiz 2020 · [논문](https://arxiv.org/abs/2003.03134)

**한 줄 요약** — Bundle adjustment가 그래프 프로세서 (Graphcore IPU) 위에서 Gaussian Belief Propagation으로 극도로 빠르게 풀릴 수 있음을 처음으로 보여준 논문 (CVPR 2020)으로, FutureMapping이 제시한 알고리즘-하드웨어 공동 설계 비전을 입증했습니다.

## 문제

Bundle adjustment는 SLAM과 SfM의 중심적인 계산 병목입니다. 고전적 솔버는 Levenberg-Marquardt로 MAP 해의 점 추정치를 계산하는데 — 이는 본질적으로 중앙화된 배치 연산이며, iSAM2와 같은 트리 기반 증분 방법조차도 그래프의 주기적인 중앙화된 재구성이 필요합니다. 한편, 저전력 embodied Spatial AI는 데이터 전송을 최소화한 대규모 병렬, in-place 연산을 요구합니다. 이 논문은 지금까지 geometric vision에서 거의 사용되지 않았던 GBP가 Graphcore의 IPU — 1216개의 독립적인 코어("타일"), 각 타일당 256KB의 로컬 메모리와 6개의 하드웨어 스레드, all-to-all 인터커넥트, GPU/CPU DRAM의 바이트당 수백 pJ에 비해 약 1pJ에 불과한 온칩 접근 비용을 가진 — 위에 자연스럽게 대응됨을 보여줍니다.

## 방법 및 아키텍처

**Factor graph로서의 BA.** 변수는 키프레임 포즈 $X$와 랜드마크 $L$입니다. Factor는 가우시안 사전 분포 $\phi_i(\mathbf{x}_i)$, $\theta_j(\mathbf{l}_j)$ (단안 스케일을 정하고 2-DOF 재투영 메시지를 조건화하기 위해 필요; 측정 항보다 100배 약하게 자동 생성됨)와, 측정 모델 $\mathbf{h}(\mathbf{x}_k,\mathbf{l}_m) = \pi(R_k\mathbf{l}_m + \mathbf{t}_k)$를 가진 재투영 factor $\psi_{km}$입니다. MAP 추론은 사전 분포와 재투영에 대한 Mahalanobis 잔차 제곱합을 최소화합니다. $2\times 9$ 야코비안 $\mathrm{J}$를 사용하여 $(\mathbf{x}_{k,0},\mathbf{l}_{m,0})$ 주변을 선형화하면, 각 측정 factor는 information form으로 다음과 같이 표현됩니다.

$$\eta_{km} = \mathrm{J}^{\top}\Sigma_M^{-1}\left( \mathrm{J}\begin{bmatrix}\mathbf{x}_{k,0}\\ \mathbf{l}_{m,0}\end{bmatrix} + \mathbf{z}_{km} - \mathbf{h}(\mathbf{x}_{k,0},\mathbf{l}_{m,0}) \right), \qquad \Lambda_{km} = \mathrm{J}^{\top}\Sigma_M^{-1}\mathrm{J}.$$

**GBP 메시지 전달.** 각 변수 노드는 신뢰도(belief) $b_i^t(\mathbf{v}_i)=\mathcal{N}^{-1}(\mathbf{v}_i;\eta_{b_i}^t,\Lambda_{b_i}^t)$를 저장합니다. 분할된 파라미터를 가진 pairwise factor $\psi_{ij}$는 변수 $\mathbf{v}_i$에 다음을 전송합니다.

$$\eta_{j\to i}^{t+1} = \eta_i^{ij} - \Lambda_{ij}^{ij}\left( \Lambda_{jj}^{ij} + \Lambda_{b_j}^{t} - \Lambda_{i\to j}^{t} \right)^{-1} \left( \eta_j^{ij} + \eta_{b_j}^{t} - \eta_{i\to j}^{t} \right),$$

$$\Lambda_{j\to i}^{t+1} = \Lambda_{ii}^{ij} - \Lambda_{ij}^{ij}\left( \Lambda_{jj}^{ij} + \Lambda_{b_j}^{t} - \Lambda_{i\to j}^{t} \right)^{-1} \Lambda_{ji}^{ij},$$

그리고 각 변수는 사전 분포와 들어오는 메시지를 합산하여 belief를 업데이트합니다: $\eta_{b_i}^{t+1} = \eta_{p_i} + \sum_j \eta_{j\to i}^{t}$, $\Lambda$에 대해서도 마찬가지입니다. Factor로부터의 메시지는 $\eta^{t+1} \leftarrow (1-d)\,\eta^{t+1} + d\,\eta^{t}$ ($d=0.4$)로 감쇠됩니다. 재선형화는 완전히 지역적입니다: factor는 그 변수들의 belief가 선형화 지점에서 $\beta = 0.01$ 이상 벗어날 때 (최대 10회 반복마다 한 번) 재선형화됩니다. 강건 비용: Mahalanobis 거리 $M_{km}$이 $N_\sigma$를 초과할 때 factor의 가우시안을 재조정함으로써 Huber 커널이 통합되어, 이상치로 의심되는 측정으로부터의 메시지를 다운웨이트합니다.

**IPU 매핑.** 각 factor/변수 노드는 타일에 매핑됩니다 (더 큰 그래프의 경우 6개 스레드를 통해 타일당 여러 노드). IPU의 bulk-synchronous parallel 모델 하에서 실행됩니다: 모든 factor가 재선형화하고 메시지를 계산하여 교환하고, 모든 변수가 belief를 업데이트하여 교환합니다 — 전체 GBP 반복 한 번이 125마이크로초 미만으로 수행됩니다. 전체 구현은 약 1000줄의 Poplar C++이며, IPU가 half/float은 처리하지만 double은 처리하지 못하므로, 수치적 안정성을 위해 사전 분포는 초기에 측정 제약 조건 스케일로 설정된 후 10회 반복에 걸쳐 점진적으로 100배 약해집니다.

## 실험 결과

평가는 TUM과 KITTI 시퀀스의 일부를 ORB-SLAM을 프론트엔드 (키프레임, ORB 특징, 대응점)로 사용하며, 6코어 i7-8700K (18스레드, dense Schur를 사용한 LM, Huber 커널, 해석적 도함수)에서 실행되는 Ceres와 비교합니다:

- **속도**: 평균 재투영 오차(ARE) 1.5 미만으로 수렴하는 시간 — 하나의 IPU에서 GBP는 10개 시퀀스에서 평균적으로 **Ceres보다 24배 빠릅니다**; 125개 키프레임과 1919개 점을 가진 대표 사례는 Ceres의 1450ms에 비해 40ms 미만으로 풀립니다. GBP는 일반적으로 10~40회의 LM 스텝에 비해 50~300회의 반복이 필요하지만, 각각의 in-place 반복이 매우 빠르기 때문에 전체적으로 승리합니다 (IPU는 120W).
- **증분 SLAM**: 90개 키프레임 시퀀스에 걸쳐 키프레임을 한 번에 하나씩 추가할 때, 새로운 변수는 기존 추정치와 즉시 일치하게 됩니다; GBP는 평균적으로 **Ceres보다 36배 빠르게** 수렴하며, 종종 10회 미만의 반복으로 수렴합니다.
- **강건성**: 두 개의 TUM 시퀀스에서 노이즈로 교란된 키프레임 초기화에 대한 100회의 시행에서, GBP는 Ceres와 비슷한 수렴 반경을 가집니다.
- **Huber 손실**: 의도적으로 나쁜 데이터 연관을 주입한 경우 (fr1desk, 20개 키프레임), Huber를 사용한 GBP는 점진적으로 실제 이상치를 격리하며 (recall이 항상 1) 수렴하는 반면, Huber 없는 GBP는 잘못된 연관이 3%를 넘으면 실패합니다 — 그리고 동일한 Huber 손실을 사용한 Ceres는 해를 수렴시키지 못하는데, 이는 GBP의 지역적 이상치 처리가 LM의 전역적 처리보다 우수함을 시사합니다.

## SLAM에서의 의미

이 논문은 FutureMapping의 사변적인 에세이를 그래프, 로컬 저장소, 메시지 전달을 중심으로 SLAM 계산을 재구성하면 자릿수 단위의 속도 향상을 얻을 수 있다는 구체적인 증거로 바꾸어 놓았습니다. 저자들은 진정한 보상이 정적인 BA 속도가 아니라 "Spatial AI 문제를 나타내는 일반적이고 동적으로 변화하는 factor graph의 유연한 in-place 최적화" — 이질적인 factor, 인식으로부터의 사전 분포, 임의의 증분 업데이트 — 라고 주장합니다. SLAM이 이질적인 엣지 하드웨어와 다중 로봇 시스템으로 옮겨감에 따라, GBP의 순수하게 지역적인 계산 모델은 코어 수와 자연스럽게 함께 확장되는 몇 안 되는 백엔드 설계 중 하나입니다.

## 관련 문서

- [FutureMapping 1](futuremapping-1.md) — 이 결과를 예측했던 비전 논문
- [FutureMapping 2](futuremapping-2.md) — 이 구현이 따르는 GBP 튜토리얼
- [DANCeRS](dancers.md) — 분산 다중 로봇 GBP
- [Factor graph](../level-02-getting-familiar/factor-graph.md) — 기저 표현
- [Incremental smoothing](../level-02-getting-familiar/incremental-smoothing.md) — 중앙화된 증분 대안 (iSAM2)
- [Bundle adjustment](../level-02-getting-familiar/bundle-adjustment.md) — 풀고자 하는 문제
