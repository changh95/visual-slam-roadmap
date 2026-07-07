# OKVIS2

> Leutenegger 2022 · [논문](https://arxiv.org/abs/2202.09199)

**한 줄 요약** — OKVIS2는 고전적인 OKVIS 슬라이딩 윈도우 VIO를, 공통 관측값을 포즈 그래프 엣지로 주변화하고 루프 클로저 시 이를 다시 랜드마크와 관측값으로 유연하게 되돌릴 수 있게 함으로써, 실시간이면서 확장 가능한 시각-관성 *SLAM* 시스템으로 발전시킵니다.

## 문제

슬라이딩 윈도우 VIO 시스템은 오래된 상태를 주변화하거나 고정함으로써 계산량을 제한하지만, 고전적인 주변화는 일방통행입니다: 루프 클로저와 대규모 지도 관리를 긴밀하게 통합하는 것은 "오래된 상태와 랜드마크의 주변화를 사용하는 방식에 내재된 도전 과제를 구성합니다." 이와 대조적으로 ORB-SLAM3는 단순히 오래된 상태를 *고정*합니다—더 단순하지만 "과거 추정 불확실성을 효과적으로 무시하므로 본질적으로 보수적인 근사가 아닙니다." OKVIS2는 특히 *길고* *반복되는* 루프 클로저에 주의를 기울이며, 로보틱스와 AR/VR을 위한 강건하고 정확한 추정을 목표로 하며, 오도메트리와 완전한 SLAM처럼 동시에 동작하는 하나의 제한된 팩터 그래프를 사용합니다.

## 방법 및 아키텍처

시스템은 **프론트엔드**(상태 초기화, BRISK 키포인트 매칭, 스테레오 삼각측량, 세그멘테이션 CNN, 장소 인식/재위치추정)와 다중 프레임마다 동기적으로 실행되는 **실시간 추정기**, 그리고 **비동기 전체 그래프 루프 최적화**로 나뉩니다. 추정기는 다음을 최소화합니다(Ceres, Cauchy로 강건화된 관측값):

$$c(\mathbf{x}) = \frac{1}{2}\sum_{i}\sum_{k\in\mathcal{K}}\sum_{j\in\mathcal{J}(i,k)} \rho\left({\mathbf{e}_{\mathrm{r}}^{i,j,k}}^T \mathbf{W}_{\mathrm{r}}\, \mathbf{e}_{\mathrm{r}}^{i,j,k}\right) + \frac{1}{2}\sum_{k\in\mathcal{P}\cup\mathcal{K}\setminus f} {\mathbf{e}_{\mathrm{s}}^{k}}^T \mathbf{W}_{\mathrm{s}}^{k}\, \mathbf{e}_{\mathrm{s}}^{k} + \frac{1}{2}\sum_{r\in\mathcal{P}}\sum_{c\in\mathcal{C}(r)} {\mathbf{e}_{\mathrm{p}}^{r,c}}^T \mathbf{W}_{\mathrm{p}}^{r,c}\, \mathbf{e}_{\mathrm{p}}^{r,c},$$

이는 재투영 오차 $\mathbf{e}_{\mathrm{r}}^{i,j,k} = \tilde{\mathbf{z}}^{i,j,k} - \mathbf{h}\big(\mathbf{T}_{SC_i}^{-1}\, \mathbf{T}_{S^k W}\, {}_{W}\mathbf{l}^{j}\big)$, 사전 적분된 IMU 오차 $\mathbf{e}_{\mathrm{s}}^{k} = \hat{\mathbf{x}}^{n}(\mathbf{x}^{k}, \tilde{\mathbf{z}}_{\mathrm{s}}^{k,n}) \boxminus \mathbf{x}^{n} \in \mathbb{R}^{15}$, 상대 자세(포즈 그래프) 오차에 걸친 것입니다. $\mathcal{K}$는 가장 최근 $T$개 프레임에 살아 있는 관측값을 가진 $M$개 키프레임을 더한 것을 보유합니다; $\mathcal{P}$는 훨씬 더 과거로 뻗어 있는 포즈 그래프 프레임을 보유합니다.

- **포즈 그래프 생성(핵심 기여)**: $|\mathcal{K}|$가 경계 $K$를 초과하면, 공가시성(co-visibility)이 가장 낮은 키프레임이 포즈 그래프 노드로 변환됩니다. 연결된 프레임과의 결합 관측값은 상대 자세 팩터로 압축됩니다.
  $$\mathbf{e}_{\mathrm{p}}^{r,c} = \mathbf{e}_{\mathrm{p},0}^{r,c} + \begin{bmatrix} {}_{S^r}\mathbf{r}_{S^c} - {}_{S^r}\tilde{\mathbf{r}}_{S^c} \\ \mathbf{q}_{S^rS^c} \boxminus \tilde{\mathbf{q}}_{S^rS^c} \end{bmatrix},$$
  그 가중치는 슈어 보완 $\mathbf{H}^{*} = \mathbf{H}_{\mathrm{p},\mathrm{p}} - \sum_j \mathbf{H}_{\mathrm{p},j}\mathbf{H}_{jj}^{+}\mathbf{H}_{\mathrm{p},j}^{T}$로 공관측된 랜드마크를 실제로 주변화하여 얻어지며, $\mathbf{W}_{\mathrm{p}}^{r,c} = \mathbf{H}^{*}$와 $\mathbf{e}_{\mathrm{p},0}^{r,c} = -\mathbf{H}^{*+}\mathbf{b}^{*}$를 제공합니다—사실상의 표준인 항등 가중치 포즈 그래프 엣지에 대한 이론적으로 정당한 대안입니다.
- **엣지 선택**: 공관측 횟수에 대한 최대 스패닝 트리가 어떤 엣지를 생성할지 결정하여 그래프를 희소하게 유지합니다; 가장 오래된 키프레임은 현재와 여전히 관측값을 공유하는 동안 유지되어, 장기적인 방향 정확도를 보존합니다.
- **랜드마크 복원을 포함한 루프 클로저**: DBoW2 질의와 3D-2D RANSAC 검증이 활성 윈도우를 매칭된 자세에 재정렬합니다; 이를 연결하는 포즈 그래프 엣지는 다시 랜드마크와 관측값으로 "복원"되며, 랜드마크가 병합되고, 루프 오차는 회전 평균화로 분산되며, (IMU 팩터를 포함하고 루프 내부 상태가 가변인) 백그라운드 전체 그래프 최적화가 나중에 실시간 그래프와 동기화됩니다.
- **제한된 실시간 문제**: $A = \max(A_{\min}, A_{\Delta T})$개의 가장 최근 상태만 가변으로 유지됩니다; 실험에서는 $T{=}3$, $K{=}5$, $L{=}5$개의 루프 클로저 프레임, $A_{\min}{=}12$, $\Delta T{=}2$초를 사용합니다.
- **동적 콘텐츠 제거**: 경량 Fast-SCNN 세그멘테이션 CNN이 키프레임에서만 CPU에서 비동기로 실행되어, Cauchy 강건화기 단독으로는 걸러지지 않는 하늘/구름 영역으로의 관측값을 제거합니다.

## 실험 결과

EuRoC와 TUM-VI에서 평가되었습니다(위치 + 요 정렬 후 ATE, 인과적(causal) vs 비인과적(non-causal) 결과를 별도로 보고):

- **EuRoC** 평균 ATE: OKVIS2 비인과적 **0.031\,m** vs ORB-SLAM3 0.035, 인과적 0.048, VIO 모드 0.071; 원본 OKVIS 0.089, Kimera 0.119, VINS-Fusion 0.138.
- **TUM-VI**: 짧은 복도/방 시퀀스에서는 ORB-SLAM3와 대등(방 평균 0.01\,m), 긴 시퀀스에서는 명확히 우수함—magistrale 평균 0.28\,m vs ORB-SLAM3 0.81\,m, outdoors 평균 11.60\,m vs 17.87\,m, slides 평균 0.54\,m vs 0.45\,m—그리고 ORB-SLAM3가 루프 클로저를 전혀 보고하지 못하는 시퀀스에서 루프 클로저를 달성합니다.
- 프레임당 시간(i7-11700K): 검출 및 기술 7.1\,ms, 매칭 및 삼각측량 26.6\,ms, 루프 클로저 시도 17.7\,ms, 실시간 그래프 최적화 33.2\,ms, 포즈 그래프 엣지 처리 14.0\,ms; 백그라운드 루프 최적화는 매우 긴 루프의 경우 수십 ms에서 최대 ~1초가 걸립니다.

## SLAM에서의 의미

OKVIS(2015)는 VIO를 위한 슬라이딩 윈도우 최적화 + 주변화 아키텍처를 정의했지만, 루프가 발견되었을 때 주변화를 되돌릴 수 없었습니다. OKVIS2의 주변화 유래 포즈 그래프 엣지는 슈어 보완 사전과 완전한 랜드마크 보존 사이의 이론적으로 정당한 중간 지점이며, 추정기는 지도 재설정 없이 오도메트리와 완전한 SLAM 사이를 유연하게 이동합니다. 이는 동일한 팩터 그래프를 깊이, LiDAR, GNSS로 확장하는 OKVIS2-X의 직접적인 기반입니다.

## 관련 문서

- [OKVIS](okvis.md)
- [OKVIS2-X](okvis2-x.md)
- [IMU preintegration](imu-preintegration.md)
- [Marginalization](../level-02-getting-familiar/marginalization.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)
- [VINS-Mono](vins-mono.md)
- [ORB-SLAM3](../level-03-monocular-slam/orb-slam3.md)
