# VI-DSO

> von Stumberg 2018 · [논문](https://arxiv.org/abs/1804.05625)

**한 줄 요약** — VI-DSO는 사전 적분된 IMU 팩터를 DSO의 직접 희소 광도 번들 조정에 긴밀하게 통합하여, 미터 스케일과 중력 방향을 명시적으로 최적화함으로써 임의의 스케일로도 즉시 초기화할 수 있게 하며, 새로운 "동적 주변화" 기법으로 그 일관성을 유지합니다.

## 문제

단안 직접 오도메트리(DSO)는 우수한 정확도를 제공하지만 알려지지 않은 스케일까지만 그렇습니다. IMU는 스케일을 관측 가능하게 만들지만 — 종종 *즉시는* 아닙니다: 특정 운동(예: 등속도에서의 가속도 0)에서는 즉시 초기화가 불가능하며, 이것이 VI ORB-SLAM이 EuRoC에서 초기화 전에 15초의 카메라 운동을 기다리는 이유입니다. 한편, 슬라이딩 윈도우 추정기는 부분 주변화를 통해 계산량을 제한된 범위로 유지하는데, 스케일 추정값이 이후 사전이 선형화되었던 값으로부터 멀리 이동하면 선형화된 사전이 불일치하게 됩니다. VI-DSO는 이 두 문제를 동시에 해결합니다.

## 방법 및 아키텍처

두 구성 요소가 병렬로 실행됩니다: **코어스 트래킹(coarse tracking)**은 최신 키프레임에 대한 직접 이미지 정합과 관성 항(기하와 스케일은 고정)을 이용해 매 프레임의 자세를 추정하고, 새 키프레임이 생성될 때마다 **시각-관성 번들 조정**이 결합 에너지를 최소화하여 모든 활성 키프레임의 기하와 자세를 다시 추정합니다.

$$E_{\text{total}} = \lambda \cdot E_{\text{photo}} + E_{\text{inertial}}$$

광도 항은 키프레임 $i$에서 호스팅되고 프레임 $j$에서 관측된 점 $\boldsymbol{p}$에 대한 DSO의 오차입니다:

$$E_{\boldsymbol{p}j} = \sum_{\mathbf{p}\in\mathcal{N}_{\boldsymbol{p}}} \omega_{\boldsymbol{p}} \left\lVert (I_j[\boldsymbol{p}'] - b_j) - \frac{t_j e^{a_j}}{t_i e^{a_i}} (I_i[\boldsymbol{p}] - b_i) \right\rVert_{\gamma}$$

여기서 $\mathcal{N}_{\boldsymbol{p}}$는 작은 픽셀 인근, $t_i, t_j$는 노출 시간, $a_i, b_i, a_j, b_j$는 아핀 조명 파라미터, $\omega_{\boldsymbol{p}}$는 그래디언트 의존 가중치, $\gamma$는 Huber 노름입니다 — 그래서 코너뿐 아니라 강도 그래디언트가 충분히 큰 *어떤* 픽셀이든 추적할 수 있습니다. 연속된 키프레임 사이의 IMU 측정값은 하나의 팩터로 사전 적분됩니다: 예측 상태 $\widehat{\boldsymbol{s}}_j$와 공분산 $\widehat{\boldsymbol{\Sigma}}_{s,j}$가 있을 때,

$$E_{\text{inertial}}(\boldsymbol{s}_i, \boldsymbol{s}_j) = \left(\boldsymbol{s}_j \boxminus \widehat{\boldsymbol{s}}_j\right)^{T} \widehat{\boldsymbol{\Sigma}}_{s,j}^{-1} \left(\boldsymbol{s}_j \boxminus \widehat{\boldsymbol{s}}_j\right)$$

각 키프레임의 상태는 자세, 속도, IMU 바이어스, 아핀 밝기, 그리고 해당 키프레임이 호스팅하는 점들의 역깊이를 쌓은 것입니다,

$$\boldsymbol{s}_i = \big[(\boldsymbol{\xi}^{D}_{cam_i\_w})^{T},\ \boldsymbol{v}_i^{T},\ \boldsymbol{b}_i^{T},\ a_i,\ b_i,\ d_i^{1}, \dots, d_i^{m}\big]^{T}$$

전체 상태에는 추가로 카메라 내부 파라미터와, 스케일/중력이 없는 "DSO 프레임"과 미터 프레임 사이의 이동 없는 SIM(3) 변환인 $\boldsymbol{\xi}_{m\_d} \in \mathfrak{sim}(3)$이 포함됩니다. 광도 오차는 DSO 프레임(스케일 독립적)에서 평가되고, 관성 오차는 미터 프레임에서 평가됩니다 — 그래서 **스케일과 중력 방향이 명시적 변수**가 되어 가우스-뉴턴에 의해 다른 모든 것과 함께 공동으로 최적화됩니다. 이때 $\mathbf{H} = \mathbf{H}_{\text{photo}} + \mathbf{H}_{\text{imu}}$이고, 관성 블록은 상대 야코비안 $\mathbf{J}_{\text{rel}}$을 통해 두 상태 표현 사이로 사상됩니다. 연속 키프레임 사이의 간격은 사전 적분의 정확도를 유지하기 위해 0.5초 미만으로 유지됩니다.

**초기화** — DSO의 시각적 초기화기(1로 정규화된 평균 깊이), 최대 40개의 가속도계 측정값을 평균하여 얻은 중력 방향, 0인 속도와 바이어스, 스케일 1.0으로 시작하며; 이후 모두 공동으로 정제되므로, 관성 데이터는 첫 프레임부터 자세 추정을 개선합니다.

**동적 주변화** — (First-Estimate Jacobians를 사용하는) 슈어 보완을 통해 오래된 키프레임을 주변화하면 선형화 지점이 고정되는데, 스케일이 아직 수렴 중일 때는 이것이 안전하지 않습니다. 그래서 VI-DSO는 세 가지 주변화 사전을 유지합니다: $M_{\text{visual}}$(스케일 독립적인 시각적 팩터만), $M_{\text{curr}}$(스케일 선형화 지점 이후의 모든 팩터; 최적화에 사용됨), $M_{\text{half}}$(현재 추정값에 가까운 스케일을 가진 최근 상태만) — 그리고 다음을 강제합니다

$$\forall i \in M_{\text{curr}}:\ s_i \in \left[\, s_{\text{middle}}/d_i,\ s_{\text{middle}} \cdot d_i \,\right]$$

스케일 추정값이 구간 경계를 넘어설 때마다 사전이 순차적으로 교체되고($M_{\text{curr}} \leftarrow M_{\text{half}}$, $M_{\text{half}} \leftarrow M_{\text{visual}}$) 구간 중심 $s_{\text{middle}}$이 이동합니다 — 그래서 최적화는 항상 일관된 스케일을 가진 *일부* 관성 이력을 유지하며, 구간 크기 $d_i$는 동적으로 조정됩니다($d_{\text{min}} = \sqrt{1.1}$).

## 실험 결과

EuRoC(왼쪽 카메라, 각 시퀀스를 10회 실행, RMSE 중앙값, 실시간)에서: MH1–MH5에서 0.062 / 0.044 / 0.117 / 0.132 / 0.121 m, V11–V23에서 0.059 / 0.067 / 0.096 / 0.040 / 0.062 / 0.174 m — 모든 시퀀스가 0.23 m 미만이며, ROVIO를 제외하고 평가된 방법 중 어떤 시퀀스에서도 실패하지 않은 유일한 방법입니다. VI-DSO는 모든 시퀀스에서 단안 VI 오도메트리(Leutenegger et al.)를 능가하며, 심지어 11개 중 9개 시퀀스에서 스테레오/SLAM 변형(Kasyanov et al.)도 능가합니다. VI ORB-SLAM(완전한 SLAM 시스템으로, 그 번들 조정된 키프레임 궤적으로 평가됨)에 대해서는, 루프 클로저 없이도 RMSE에서 경쟁력이 있고 더 강건합니다 — ORB-SLAM의 초기화는 V1_03_difficult에서 실패합니다. 스케일 추정도 더 낫습니다: 평균 스케일 오차는 0.7% 대 1.0%, 최대 1.2% 대 3.4%입니다. 시각 전용 DSO는 V1_03/V2_03을 전혀 처리할 수 없습니다; ROVIO는 강건하지만 필터로서 정확도가 훨씬 떨어집니다.

## SLAM에서의 의미

VI-DSO는 시각-관성 융합이 특징 기반 파이프라인의 전유물이 아님을 입증했습니다: 직접 광도 번들 조정도 IMU 팩터를 수용할 수 있으며, 성숙한 특징 기반 VIO와 경쟁력 있는 EuRoC 정확도를 제공합니다. DSO 계보(DSO → Stereo DSO / LDSO → VI-DSO → DM-VIO)에서 핵심적인 연결점입니다: 윈도우 내에서 스케일과 중력을 공동으로 추정하는 방식은 시각-관성 초기화의 흔한 패턴이 되었고, 동적 주변화는 DM-VIO의 지연 주변화(delayed marginalization)의 직접적인 전신입니다.

## 관련 문서

- [DSO](../level-03-monocular-slam/dso.md)
- [DM-VIO](dm-vio.md)
- [Stereo DSO](../level-07-stereo-slam/stereo-dso.md)
- [IMU 사전 적분](imu-preintegration.md)
- [VINS-Mono](vins-mono.md)
- [주변화](../level-02-getting-familiar/marginalization.md)
