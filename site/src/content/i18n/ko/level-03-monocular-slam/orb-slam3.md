# ORB-SLAM3

> Campos 2020 · [논문](https://arxiv.org/abs/2007.11898)

**한 줄 요약** — 핀홀 및 어안 모델을 갖춘 단안, 스테레오, RGB-D 카메라 전반에서 시각, 시각-관성, 다중 지도 SLAM을 지원하는 최초의 SLAM 라이브러리로, 이전 시스템들에 비해 정확도를 크게 향상시켰습니다.

## 문제

ORB-SLAM2는 IMU 통합이 없었고 추적 실패로부터 복구할 수 없었습니다: 추적이 한번 실패하면 지도는 실질적으로 사라졌습니다. 실세계 배치 — AR 헤드셋, 드론, 장시간 로봇 임무 — 는 일시적인 가림, 퇴화된 운동, 오랜 기간의 부실한 시각 정보를 견뎌내야 합니다. ORB-SLAM3(IEEE TRO, University of Zaragoza)는 두 가지 간극을 모두 해결합니다: "IMU 초기화 단계에서도 최대 사후 확률(Maximum-a-Posteriori, MAP) 추정에 완전히 의존하는" 긴밀하게 결합된 시각-관성 시스템과, 추적 실패를 재앙이 아니라 복구 가능한 사건으로 전환시키는 Atlas 다중 지도 메커니즘입니다.

## 방법 및 아키텍처

시스템은 ORB-SLAM2의 스레드 구조를 유지하되 다중 지도 동작을 위해 확장합니다: **추적 스레드**는 활성 지도에 대해 각 프레임을 지역화합니다(관성 모드에서는 최적화 상태에 몸체 속도와 IMU 편향을 추가합니다); **지역 매핑 스레드**는 슬라이딩 윈도우 방식의 키프레임에 대한 시각 또는 시각-관성 BA로 활성 지도를 확장하고 정제하며, IMU 초기화를 수행합니다; **루프 및 지도 병합 스레드**는 키프레임 속도로 전체 Atlas를 탐색합니다 — 활성 지도 내의 매칭은 루프 클로저를 유발하고, 다른 지도 내의 매칭은 매끄러운 병합(용접 윈도우(welding-window) BA 이후 필수 그래프 포즈 최적화)을 유발하며, 이후 별도의 스레드에서 전역 BA가 수행됩니다. 카메라 모델(투영, 역투영, 자코비안)은 하나의 모듈로 추상화되어, 핀홀과 Kannala-Brandt 어안 모델이 전체 시스템에서 동작하며, MLPnP 기반 재지역화와 고정된 외부 파라미터 $\mathrm{SE}(3)$ 제약을 갖는 두 개의 단안 카메라로 취급되는 비정렬(non-rectified) 스테레오도 포함됩니다.

시각-관성 모드에서 키프레임별 상태는 $\mathcal{S}_{i}\doteq\{\mathbf{T}_{i},\mathbf{v}_{i},\mathbf{b}^{g}_{i},\mathbf{b}^{a}_{i}\}$(포즈, 속도, 자이로/가속도계 편향)입니다. 키프레임 간 IMU 사전적분(preintegration)은 $\Delta\mathbf{R}_{i,i+1},\Delta\mathbf{v}_{i,i+1},\Delta\mathbf{p}_{i,i+1}$과 관성 잔차 $\mathbf{r}_{\mathcal{I}_{i,i+1}}$을 제공합니다. 예를 들어 회전 항은 $\mathbf{r}_{\Delta\mathrm{R}_{i,i+1}}=\mathrm{Log}\left(\Delta\mathbf{R}_{i,i+1}^{\mathrm{T}}\mathbf{R}_{i}^{\mathrm{T}}\mathbf{R}_{i+1}\right)$입니다. 재투영 잔차 $\mathbf{r}_{ij}=\mathbf{u}_{ij}-\Pi\left(\mathbf{T}_{\mathrm{CB}}\mathbf{T}_{i}^{-1}\oplus\mathbf{x}_{j}\right)$와 함께, 시각-관성 SLAM은 다음과 같은 키프레임 기반 MAP 문제입니다

$$\min_{\bar{\mathcal{S}}_{k},\mathcal{X}}\left(\sum_{i=1}^{k}\left\lVert\mathbf{r}_{\mathcal{I}_{i-1,i}}\right\rVert_{\Sigma_{\mathcal{I}_{i,i+1}}^{-1}}^{2}+\sum_{j=0}^{l-1}\sum_{i\in\mathcal{K}^{j}}\rho_{\mathrm{Hub}}\left(\left\lVert\mathbf{r}_{ij}\right\rVert_{\Sigma_{ij}^{-1}}\right)\right)$$

관성 측정에는 오연관(mis-association)이 없으므로 Huber 커널은 시각 항에만 적용됩니다.

**MAP 기반 IMU 초기화**는 세 단계로 진행됩니다: (1) 시각 전용 — 2초 동안의 순수 단안 SLAM이 정확한 스케일 미확정 궤적을 제공합니다; (2) 관성 전용 — 상태 $\mathcal{Y}_{k}=\{s,\mathbf{R}_{\mathrm{wg}},\mathbf{b},\bar{\mathbf{v}}_{0:k}\}$(스케일, 중력 방향, 편향, 속도)가 다음을 통해 풀립니다

$$\mathcal{Y}_{k}^{*}=\arg\min_{\mathcal{Y}_{k}}\left(\|\mathbf{b}\|_{\Sigma_{b}^{-1}}^{2}+\sum_{i=1}^{k}\|\mathbf{r}_{\mathcal{I}_{i-1,i}}\|_{\Sigma_{\mathcal{I}_{i-1,i}}^{-1}}^{2}\right)$$

시각 궤적을 고정한 채로 계산합니다; (3) 결합 시각-관성 BA. 추적 실패는 두 단계로 처리됩니다: 단기(IMU로부터의 포즈, 넓은 윈도우의 지도점 재매칭)와 장기(Atlas 내에 새로운 활성 지도 시작). **개선된 장소 인식**은 세 개의 연속된 키프레임 감지를 기다리는 대신 지도 내 이미 공시야 상태인 키프레임에 대해 후보를 기하학적으로 검증하고, 매칭된 키프레임 주위의 지역 윈도우에서 중기(mid-term) 매칭을 집중적으로 탐색함으로써 DBoW2의 재현율을 높입니다.

## 실험 결과

모든 실험은 Intel Core i7-7700 CPU에서 수행되었습니다. EuRoC에서(10회 실행의 중앙값, RMS ATE), ORB-SLAM3는 네 가지 구성 모두에서 이전 시스템을 능가합니다: 스테레오-관성은 전체 11개 시퀀스에서 평균 0.035 m(0.6% 스케일 오차), 단안-관성 0.043 m, 스테레오 0.084 m, 완료된 시퀀스에서 단안 0.041 m입니다. 단안-관성은 "MCSKF, OKVIS, ROVIO보다 5배에서 10배 더 정확하며, VI-DSO와 VINS-Mono의 정확도를 두 배 이상" 능가합니다; 스테레오-관성은 Kimera와 VINS-Fusion보다 3~4배 더 정확합니다. IMU 초기화는 2초 안에 5% 스케일 오차에 도달하며 정제 후에는 약 1%에 도달합니다. 어안 렌즈 TUM-VI 벤치마크에서는 전체적으로 VINS-Mono와 Basalt를 능가합니다; AR/VR과 유사한 room 시퀀스에서 평균 ATE는 스테레오-관성 0.009 m, 단안-관성 0.011 m입니다. EuRoC 다중 세션 실험에서 Atlas 병합은 CCM-SLAM과 VINS-Mono의 정확도를 두 배 이상 향상시킵니다(VINS-Mono에 대한 우위는 단일 세션의 2.6배에서 다중 세션의 3.2배로 증가합니다). 전체적으로 초록은 "이전 접근법보다 2배에서 10배 더 정확하다"고 주장하며, 오픈소스 공개는 이후 수백 편의 논문에서 표준 기준선이 되었습니다.

## SLAM에서의 의미

ORB-SLAM3는 PTAM과 ORB-SLAM에서 시작된 특징점 기반 SLAM 계보의 정점이며, 출시 당시 가장 완전하고 정확한 오픈소스 SLAM 라이브러리였습니다 — 모든 알고리즘 단계에서 단기, 중기, 장기, *그리고* 다중 지도 데이터 연관을 활용한 최초의 시스템입니다. 다중 지도 Atlas는 장기적이고 실패에 강한 운용을 실용적으로 만들었으며, MAP 기반 시각-관성 초기화는 VIO 시스템의 새로운 표준을 세웠습니다. 이는 여전히 이 분야에서 가장 흔한 기준선이자 실무 출발점 중 하나로 남아 있습니다.

## 관련 문서

- [ORB-SLAM](orb-slam.md)
- [ORB-SLAM2](orb-slam2.md)
- [IMU preintegration](../level-06-vio-vins/imu-preintegration.md)
- [VINS-Mono](../level-06-vio-vins/vins-mono.md)
- [Basalt](../level-06-vio-vins/basalt.md)
- [Camera models beyond pinhole](../level-01-beginner/camera-models-beyond-pinhole.md)
