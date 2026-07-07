# VINS-Mono

> Qin 2018 · [논문](https://arxiv.org/abs/1708.03852)

**한 줄 요약** — VINS-Mono는 강건한 초기화, 양방향 주변화를 갖춘 슬라이딩 윈도우 최적화, 긴밀 결합 재위치추정, 4-DoF 포즈 그래프 루프 클로저를 갖춘 완전한 긴밀 결합 단안 시각-관성 추정기로, 로보틱스에서 가장 널리 사용되는 VIO 시스템 중 하나가 되었습니다.

## 문제

저가형 IMU를 갖춘 단안 카메라는 미터 6-DoF 상태 추정을 위한 *최소한의* 센서 구성입니다 — 그러나 직접적인 거리 측정이 없다는 점은 IMU 처리, 추정기 초기화, 외부 파라미터 캘리브레이션, 비선형 최적화에서 상당한 어려움을 낳습니다. 초기화는 보통 단안 VINS에서 가장 취약한 단계이며, 장기 드리프트를 없애려면 하나의 시스템 안에서 루프 감지, 재위치추정, 전역 최적화가 필요합니다. VINS-Mono의 목표는 실패 복구까지 포함하여 이 모든 것을 다루는 단일하고 강건하며 다재다능한 완전한 패키지였습니다.

## 방법 및 아키텍처

파이프라인: Shi-Tomasi 코너에 대한 KLT 광학 흐름(기본 행렬 RANSAC 이상치 제거) → 시각-관성 정렬 초기화 → 슬라이딩 윈도우 VIO(Ceres) → 주변화 → DBoW2/BRIEF 루프 감지 → 긴밀 결합 재위치추정 → 4-DoF 포즈 그래프.

- **시각-관성 정렬을 통한 초기화.** 비전 전용 SfM이 스케일을 알 수 없는 자세를 제공하고, 자이로 바이어스는 사전 적분된 회전에 대해 $\sum_k \lVert \mathbf{q}_{b_{k+1}}^{c_0\,-1} \otimes \mathbf{q}_{b_k}^{c_0} \otimes \boldsymbol{\gamma}_{b_{k+1}}^{b_k} \rVert^2$를 최소화하여 캘리브레이션되며, 이어서 속도, 중력 $\mathbf{g}^{c_0}$, 미터 스케일 $s$가 사전 적분된 $\hat{\boldsymbol{\alpha}}, \hat{\boldsymbol{\beta}}$ 항으로부터 하나의 선형 시스템에서 풀립니다. 같은 모듈이 실패 복구도 수행합니다.
- **슬라이딩 윈도우 상태와 비용.** 상태 $\mathcal{X} = [\mathbf{x}_0, \dots, \mathbf{x}_n, \mathbf{x}_c^b, \lambda_0, \dots, \lambda_m]$은 $n{+}1$개의 IMU 상태 $\mathbf{x}_k = [\mathbf{p}^w_{b_k}, \mathbf{v}^w_{b_k}, \mathbf{q}^w_{b_k}, \mathbf{b}_a, \mathbf{b}_g]$, 카메라-IMU 외부 파라미터, 역깊이 $\lambda_l$을 가집니다. MAP 문제(식 22)는
  $$\min_{\mathcal{X}} \Big\{ \big\lVert \mathbf{r}_p - \mathbf{H}_p\mathcal{X} \big\rVert^2 + \sum_{k \in \mathcal{B}} \big\lVert \mathbf{r}_{\mathcal{B}}(\hat{\mathbf{z}}^{b_k}_{b_{k+1}}, \mathcal{X}) \big\rVert^2_{\mathbf{P}^{b_k}_{b_{k+1}}} + \sum_{(l,j) \in \mathcal{C}} \rho\big( \lVert \mathbf{r}_{\mathcal{C}}(\hat{\mathbf{z}}^{c_j}_{l}, \mathcal{X}) \rVert^2_{\mathbf{P}^{c_j}_{l}} \big) \Big\},$$
  여기서 $\{\mathbf{r}_p, \mathbf{H}_p\}$는 주변화 사전이고, $\rho$는 시각적 항에 대한 Huber 손실입니다.
- **사전 적분된 IMU 잔차**(식 24): 사전 적분된 항 $\hat{\boldsymbol{\alpha}}^{b_k}_{b_{k+1}}, \hat{\boldsymbol{\beta}}^{b_k}_{b_{k+1}}, \hat{\boldsymbol{\gamma}}^{b_k}_{b_{k+1}}$에 대한 위치/속도/회전/바이어스 오차, 예를 들어 $\delta\boldsymbol{\alpha} = \mathbf{R}^{b_k}_w\big(\mathbf{p}^w_{b_{k+1}} - \mathbf{p}^w_{b_k} + \tfrac{1}{2}\mathbf{g}^w\Delta t_k^2 - \mathbf{v}^w_{b_k}\Delta t_k\big) - \hat{\boldsymbol{\alpha}}^{b_k}_{b_{k+1}}$와 $\delta\boldsymbol{\theta} = 2\big[\mathbf{q}^{w\,-1}_{b_k} \otimes \mathbf{q}^w_{b_{k+1}} \otimes (\hat{\boldsymbol{\gamma}}^{b_k}_{b_{k+1}})^{-1}\big]_{xyz}$이며, 바이어스는 온라인으로 보정됩니다.
- **단위 구 위의 시각적 잔차**(식 25): 재투영 오차는 관측된 단위 방향 벡터의 접평면 $[\mathbf{b}_1\ \mathbf{b}_2]^T$ 위로 투영되므로, 광각/어안 카메라도 자연스럽게 처리됩니다.
- **양방향 주변화.** 두 번째로 최신인 프레임이 키프레임이면, *가장 오래된* 프레임과 그 측정값이 (슈어 보완을 통해) 사전으로 주변화됩니다; 그렇지 않으면 두 번째로 최신인 프레임이 단순히 버려집니다(시각적 측정값은 폐기, IMU는 유지) — 공간적으로 분리된 키프레임을 유지하면서 희소성을 보존합니다.
- **재위치추정 + 4-DoF 포즈 그래프.** DBoW2 루프 후보는 BRIEF 디스크립터 매칭으로 2D-2D 및 PnP RANSAC를 통해 검증됩니다; 검색된 특징은 루프 프레임의 자세를 고정한 채 슬라이딩 윈도우 최적화에 들어갑니다(긴밀 결합 재위치추정). 주변화된 키프레임은 전역 포즈 그래프에 합류하며, 그 엣지는 상대 위치와 요만을 가지고, 잔차는 $\mathbf{r}_{i,j} = \big[\mathbf{R}(\hat{\phi}_i, \hat{\theta}_i, \psi_i)^{-1}(\mathbf{p}^w_j - \mathbf{p}^w_i) - \hat{\mathbf{p}}^i_{ij};\ \psi_j - \psi_i - \hat{\psi}_{ij}\big]$입니다 — 중력이 롤과 피치를 관측 가능하게 만들기 때문에 드리프트에 취약한 4개의 자유도(x, y, z, 요)만 최적화됩니다.

## 실험 결과

EuRoC(MH_03_median, MH_05_difficult)에서 VINS-Mono의 순수 VIO는 정확도에서 OKVIS 단안/스테레오와 대등하며, 루프 클로저를 사용하면 이동 오차가 가장 작습니다. 실내/실외가 섞인 2.5 km 도보 구간에서, 최종 드리프트는 루프 클로저 없이 [−5.47, 2.76, −0.29] m(궤적의 **0.88%**)로, OKVIS의 2.36% 대비 우수했고, 루프 보정을 사용하면 [−0.032, 0.09, −0.07] m였습니다. HKUST 캠퍼스를 도는 5.62 km, 1시간 34분짜리 핸드헬드 순회(25 Hz 카메라 / 200 Hz IMU)는 i7-4790에서 실시간으로 실행되었고(특징 추적 25 Hz에서 15+5 ms, 윈도우 최적화 10 Hz에서 50 ms, 루프 감지 100 ms, 포즈 그래프 최적화 130 ms) 맵에 대해 거의 드리프트 없이 유지되었습니다. 8자 모양 경로를 추적하는(61.97 m, 루프 클로저 비활성화) 온보드 폐루프 MAV 비행은 [0.08, 0.09, 0.13] m의 최종 드리프트 — **0.29%**를 보였습니다. 이 시스템은 iOS(VINS-Mobile)로도 포팅되어 264 m 도보 구간에서 Google Tango와 비교되었으며, PC와 폰 모두를 위한 오픈소스 릴리스가 공개되었습니다.

## SLAM에서의 의미

VINS-Mono는 사실상 대표적인 단안 VIO 시스템입니다: OKVIS가 개척한 슬라이딩 윈도우 + 주변화 아키텍처를 실용적인 선형 초기화와 완전한 재위치추정/루프 클로저 백엔드와 함께 하나의 오픈소스 릴리스로 패키징했으며, 드론과 폰 모두에서 동작합니다. 사전 적분, Huber 강건 단위 구 재투영 팩터, 양방향 주변화, 4-DoF 포즈 그래프라는 설계 선택들은 이후 시스템(VINS-Fusion, ORB-SLAM3의 관성 모드, 많은 상용 트래커)이 따르거나 발전시키는 표준 패턴이 되었습니다.

## 관련 문서

- [IMU 사전 적분](imu-preintegration.md)
- [OKVIS](okvis.md)
- [VINS-Fusion](vins-fusion.md)
- [주변화](../level-02-getting-familiar/marginalization.md)
- [ORB-SLAM3](../level-03-monocular-slam/orb-slam3.md)
