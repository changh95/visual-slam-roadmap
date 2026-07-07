# DM-VIO
> von Stumberg 2022 · [논문](https://arxiv.org/abs/2201.04114)

**한 줄 요약** — 두 가지 새로운 기법 — *지연된 주변화(delayed marginalization)*와 IMU 초기화를 위한 *포즈 그래프 번들 조정(PGBA)* — 위에 구축된 직접(DSO 기반) 단안 VIO로, 단일 카메라와 IMU만으로도 스테레오-관성 시스템을 능가한다.

## 문제
주변화는 슬라이딩 윈도우 VIO를 실시간으로 유지하지만, "쉽게 되돌릴 수 없으며, 연결된 변수들의 선형화 지점이 고정되어야 한다"(First-Estimates Jacobians). 이는 특히 단안 VIO에서 문제가 되는데, 첫 번째 키프레임이 주변화되는 순간 스케일이 주변화 사전에 연결되지만, 등속도 운동(자동차에서 흔함) 하에서는 스케일이 관측 불가능하므로 여전히 크게 변할 수 있기 때문이다. 이전 시스템들은 시각 전용 + 별도의 IMU 초기화를 실행(광도 불확실성을 잃음)하거나, VI-DSO처럼 임의의 스케일로 즉시 초기화하고 손실이 있는 *동적* 주변화를 사용했다. DM-VIO는 하나의 메커니즘으로 세 가지 질문에 답한다: 초기화기에서 전체 시각적 불확실성을 어떻게 포착하는가, 이를 어떻게 메인 시스템으로 전달하는가, 스케일이 변할 때 사전을 어떻게 일관되게 유지하는가.

## 방법 및 아키텍처
핵심은 모든 활성 키프레임에 걸친 시각-관성 번들 조정으로, Levenberg-Marquardt로 최소화된다(광도 부분은 DSO에서 SIMD로 가속되고, 다른 팩터들은 GTSAM에서 처리됨):

$$E(\mathbf{s}) = W(e_{\text{photo}}) \cdot E_{\text{photo}} + E_{\text{imu}} + E_{\text{prior}}$$

- **광도 에너지(DSO 방식).** 각 활성 키프레임 $i \in \mathcal{F}$는 관측 프레임 $j$에 투영되는 포인트 $\mathbf{p}$를 호스팅한다:
  $$E_{\mathbf{p}j} = \sum_{\mathbf{p} \in \mathcal{N}_{\mathbf{p}}} \omega_{\mathbf{p}} \left\lVert (I_j[\mathbf{p}'] - b_j) - \frac{t_j e^{a_j}}{t_i e^{a_i}} (I_i[\mathbf{p}] - b_i) \right\rVert_{\gamma},$$
  아핀 밝기 파라미터 $a, b$, 노출 시간 $t$, Huber 노름 $\lVert\cdot\rVert_\gamma$를 사용한다.
- **동적 광도 가중치.** $e_{\text{photo}} = \sqrt{E_{\text{photo}}/n_{\text{residuals}}}$일 때, $e_{\text{photo}} \geq \theta$이면 가중치는 $W(e_{\text{photo}}) = \lambda \cdot (\theta/e_{\text{photo}})^2$(그렇지 않으면 $\lambda$), $\theta = 8$. 포인트별 Huber 노름과는 달리, 이는 품질이 나쁠 때 *전체 이미지*의 가중치를 낮춰 신뢰를 IMU 쪽으로 옮긴다.
- **IMU 팩터.** 다양체 위 사전 적분은 공분산 $\widehat{\Sigma}_j$와 함께 상태 $\widehat{\mathbf{s}}_j^I$를 예측한다:
  $$E_{\text{imu}}(\mathbf{s}_i^I, \mathbf{s}_j^I) = \left(\widehat{\mathbf{s}}_j^I \boxminus \mathbf{s}_j^I\right)^T \widehat{\Sigma}_j^{-1} \left(\widehat{\mathbf{s}}_j^I \boxminus \mathbf{s}_j^I\right)$$
- **명시적 스케일과 중력.** 시각 팩터는 스케일이 임의인 프레임 $V$에, IMU 팩터는 미터 프레임 $I$에 존재한다; 상태는 스케일 $s$와 회전 $\mathbf{R}_{V\_I}$를 명시적으로 포함하므로, 초기화 이후에도 메인 시스템에서 스케일이 계속 최적화된다.
- **주변화.** 오래된 변수 $\beta$는 슈어 보완 $\widehat{\mathbf{H}}_{\alpha\alpha} = \mathbf{H}_{\alpha\alpha} - \mathbf{H}_{\alpha\beta}\mathbf{H}_{\beta\beta}^{-1}\mathbf{H}_{\beta\alpha}$을 통해 제거되며, DSO의 비고정 지연 전략으로 최대 $N_f = 8$개의 키프레임을 유지한다.
- **지연된 주변화.** *두 번째* 팩터 그래프가 지연 $d = 100$프레임을 두고 동일한 주변화 순서를 재생한다(포인트는 여전히 즉시 주변화되므로, 각 선형화된 광도 팩터는 정확히 $N_f$개의 키프레임을 연결한다; 마르코프 블랭킷 — 따라서 0.44 ms로 측정된 런타임 — 은 메인 그래프와 동일하게 유지된다). 이 그래프는 (1) IMU 팩터로 채워질 수 있고, (2) 재진행하여 사전을 재구성할 수 있으며, (3) FEJ 값을 재선형화하는 데 사용될 수 있다.
- **IMU 초기화를 위한 PGBA.** IMU와 바이어스 팩터가 지연 그래프에 삽입되고(최소 $d - N_f + 2$개의 자세가 이를 받을 수 있음, 즉 ≥93개의 IMU 팩터) 모든 변수가 최적화된다. 포즈 그래프 최적화와는 달리 전체 BA 확률 분포를 포착하는 "8원(octonary)" 팩터를 사용하고, 완전한 BA와는 달리 광도 항을 결코 재선형화하지 않는다 — 정확하면서도 빠르다. 최적화된 그래프를 재진행하면 메인 시스템에 모든 시각 및 관성 정보를 담은 주변화 사전을 넘겨준다.
- **다단계 초기화기.** 대략적인 IMU 초기화(자세 고정, 단일 바이어스; 평균 가속도계로부터 중력, 스케일 = 1) → 마진 스케일 공분산 임계값 → PGBA 초기화(더 엄격한 임계값 $\theta_{\text{reinit}}$ 하에서 선택적 재초기화 포함) → $\max(s, s_{\text{fej}})/\min(s, s_{\text{fej}}) > \theta_s$일 때마다 *주변화 교체*, 현재 선형화 지점으로 사전을 재구축.

## 실험 결과
EuRoC, TUM-VI, 4Seasons(드론, 핸드헬드, 자동차)에서 평가; EuRoC 시퀀스당 10회, 그 외에는 5회 실행, 2013년형 MacBook Pro(i7 2.3 GHz, GPU 없음)에서 실시간 모드로 수행.

- **EuRoC**: 평균 RMSE ATE **0.069 m** (단안, 루프 클로저 없음) — 발표 당시 최고 성능의 VIO로, 스테레오-관성 Basalt(0.072), VI-DSO(0.089, 단안), VINS-Mono(0.184), OKVIS(0.231)를 능가. 데이터셋에서 보고된 것 중 가장 낮은 평균 스케일 오차(0.6%)이기도 하다.
- **TUM-VI**: 평균 드리프트 **0.472%** (Basalt 0.939%(스테레오), VINS-Mono 1.700% 대비); 28개 시퀀스 중 16개에서 최고 결과(예: outdoors8: 2.11 m 대 Basalt 13.53 m). 누적 그래프에서는 전반적으로 ORB-SLAM3보다 강건하지만, ORB-SLAM3의 루프 클로저가 일부 시퀀스에서 승리한다.
- **4Seasons**: 단안 스케일이 관측 불가능한 긴 등속도 구간에서도 DM-VIO는 스테레오-관성 ORB-SLAM3와 Basalt를 능가한다.
- 실행 시간: 추적 10.34 ms, 키프레임 처리 53.67 ms; 지연된 주변화는 키프레임 스레드에 0.44 ms(0.8%)만 추가한다.

## SLAM에서의 의미
DM-VIO는 직접법과 특징 기반 VIO 사이의 격차를 좁혔다: 잘 설계된 주변화 및 초기화 전략을 가진 단안 광도 시스템이 특징 기반 *스테레오*-관성 파이프라인을 능가할 수 있다. TUM 직접법 계열(DSO → VI-DSO → DM-VIO)의 정점이며, 주변화 일관성 문제(FEJ, 관측 불가능한 스케일)가 실제로 어떻게 나타나고 완화되는지를 공부하기 위한 시스템이다. 지연된 주변화는 범용적인 도구다: 논문 자체는 맵 재사용을 위한 키프레임 재활성화와 장기 루프 클로저를 위한 PGBA를 제안한다.

## 관련 문서
- [DSO](../level-03-monocular-slam/dso.md) — 직접 희소 오도메트리의 핵심.
- [VI-DSO](vi-dso.md) — 같은 그룹의 초기 직접 시각-관성 선행 연구.
- [Basalt](basalt.md) — 주변화 선형화 오차에 대한 대안적 해법(비선형 팩터 복구).
- [IMU Preintegration on Manifold](imu-preintegration-on-manifold.md) — 사용된 IMU 팩터 정식화.
- [Marginalization](../level-02-getting-familiar/marginalization.md) — "지연"되는 메커니즘에 대한 배경.
- [Schur complement / Sparsity](../level-02-getting-familiar/schur-complement-sparsity.md) — 식 (10) 뒤에 있는 선형대수 도구.
- [Observability](observability.md) — 단안 스케일이 처음에는 왜 관측 불가능하며 명시적으로 처리되어야 하는 이유.
