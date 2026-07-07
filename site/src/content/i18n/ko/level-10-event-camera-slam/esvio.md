# ESVIO

> Chen 2023 · [논문](https://arxiv.org/abs/2212.13184)

**한 줄 요약** — ESVIO는 최초의 이벤트 기반 *스테레오* 시각-관성 오도메트리 시스템으로, 스테레오 이벤트 스트림, 표준 스테레오 이미지, IMU 측정값을 긴밀하게 융합하여 공격적 움직임과 저조도 조건에서 강인한 상태 추정을 수행합니다.

## 문제

이벤트 카메라의 저지연, 비동기 출력(및 표준 카메라의 약 60 dB에 비해 140 dB의 동적 범위)은 도전적인 상황에서의 상태 추정에 훌륭하게 어울리지만, 대부분의 이벤트 기반 VO는 단안이었습니다 — 스테레오 이벤트 비전은 연구가 거의 이루어지지 않았습니다. 설계 공간에는 공백이 있었습니다: ESVO는 IMU 없는 스테레오 이벤트 오도메트리를 제공했고, Ultimate-SLAM은 이벤트, 프레임, IMU를 융합했지만 단안에서만 그러했습니다. 게다가 이미지 스타일의 즉각적인 매칭은 두 개의 비동기 이벤트 스트림에 직접 적용할 수 없습니다 — 시간적 편차, 잡음, 다른 대비 감도가 잘못된 스테레오 대응을 유발합니다.

## 방법 및 아키텍처

파이프라인에는 두 가지 변형이 있습니다: **ESIO**(순수 이벤트-관성)와 **ESVIO**(이벤트 + 이미지 보조). 세 가지 프론트엔드/백엔드 단계가 폐루프로 상호작용합니다:

1. **IMU 보조 모션 보상.** 각 이벤트 $e_k = \{l_k, t_k, p_k\}$는 짧은 구간 $\Delta t$에 걸쳐 균일한 움직임을 가정하고, 회전에는 자이로스코프를, 이동에는 백엔드의 속도 추정값을 사용하여 기준 시각 $t_{ref}$로 워프됩니다:

$$ {}^{ref}\mathbf{R}_k = \exp\big((\tilde{\boldsymbol{\omega}}_k - \mathbf{b}_g - \mathbf{n}_g)\Delta t\big), \qquad {}^{ref}\mathbf{L}_k = {}^{ref}\mathbf{R}_k \mathbf{L}_k + \mathbf{v}_{ref}\Delta t, $$

여기서 $\mathbf{L}_k$는 동차 픽셀 위치이고 $\mathbf{v}_{ref}$는 백엔드 속도입니다. 더 나은 상태 추정값은 보상된 이벤트 엣지를 더 선명하게 만들고, 이는 다시 다음 추정값을 개선합니다.

2. **공간적 및 시간적 데이터 연관.** 보상된 이벤트는 극성별로 분리된 활성 이벤트 표면(SAE)을 채우고, 이는 타임 서페이스(TS)로 변환됩니다. 이벤트 코너는 수정된 Arc* 검출기로 추출됩니다(100~200개 특징 유지, TS 상의 최소 거리 마스크로 분산). 특징은 연속된 왼쪽 이벤트 스트림 사이에서 *시간적으로* 추적되고, 스테레오 정렬된 좌/우 타임 서페이스 사이에서 *즉각적으로* 매칭되며, 두 경우 모두 전방-역방향 LK 광학 흐름을 사용합니다; 깊이는 RANSAC 이상치 제거를 사용한 삼각측량으로 복원됩니다.

3. **그래프 기반 백엔드.** 슬라이딩 윈도우가 전체 상태 $\boldsymbol{\chi} = [\mathbf{x}_{b_0}, \dots, \mathbf{x}_{b_n}, \mathbf{x}^b_e, \mathbf{x}^b_c, \boldsymbol{\Lambda}_{es}, \boldsymbol{\Lambda}_{et}, \boldsymbol{\Lambda}_c]$ — IMU 상태(위치, 쿼터니언, 속도, 바이어스), 카메라-IMU 외부 파라미터, 이벤트/이미지 특징의 역깊이 — 를 다음을 최소화하여 최적화합니다:

$$ \min_{\boldsymbol{\chi}} \Big( \sum_{k} \|\mathbf{r}_b\|^2_{\Omega_b} + \sum_{(l,k)} \|\mathbf{r}_{es}\|^2_{\Omega_{es}} + \sum_{(l,k)} \|\mathbf{r}_{et}\|^2_{\Omega_{et}} + \sum_{(l,k)} \|\mathbf{r}_c\|^2_{\Omega_c} \Big), $$

이는 IMU 사전통합 잔차 $\mathbf{r}_b$, **공간적** 이벤트 잔차 $\mathbf{r}_{es}$(역깊이 $\lambda_{es}$와 외부 파라미터 $\mathbf{T}^{le}_{re}$를 통해 우측에서 좌측 이벤트 카메라로의 특징 재투영), **시간적** 이벤트 잔차 $\mathbf{r}_{et}$(본체 포즈 $\mathbf{T}^w_{b_i}, \mathbf{T}^{b_k}_w$를 통한 $i$번째와 $k$번째 좌측 이벤트 스트림 사이의 재투영), 표준 카메라 잔차 $\mathbf{r}_c$를 결합합니다.

## 실험 결과

- **자체 수집한 HKU 데이터셋**(DAVIS346 2대, 6 cm 베이스라인, 스테레오 이벤트 60 Hz, 프레임 30 Hz, IMU 1000 Hz, VICON 실측; 공격적 움직임과 HDR): ESVIO는 평균 MPE 0.14% / MRE 0.033°/m를 달성하며, ORB-SLAM3 스테레오 VIO(0.16% / 0.12°/m), VINS-Fusion(0.76% / 0.38°/m), USLAM 단안 EIO(5.06% / 1.05°/m), PL-EVIO(0.26% / 0.41°/m)를 능가합니다. ESIO는 0.89%, 모션 보상된 ESIO+는 0.66%에 도달합니다. ORB-SLAM3와 VINS-Fusion은 hku_agg_walk(모션 블러)에서 실패; ORB-SLAM3는 hku_dark_normal에서 실패; EVO와 ESVO는 모든 시퀀스에서 실패했습니다.
- **공개 데이터셋**: VECtor에 대한 최초 보고 결과(예: VINS-Fusion, EVO, ESVO가 실패하는 robot-fast에서 0.20%)와 강력한 MVSEC indoor-flying 결과(예: flying 1/3에서 0.94% / 0.47% MPE, PL-EVIO의 1.35% / 0.64% 대비); 텍스처가 낮은 units-dolly/scooter는 모든 시각 전용 방법에서 여전히 어렵습니다.
- **실시간성**: i7-1260P NUC에서 346×260 해상도로 프론트엔드 10.44 ms, 백엔드 19.30 ms(640×480에서는 35.69 / 35.59 ms).
- **온보드 쿼드로터 비행**: ESVIO를 유일한 포즈 피드백으로 사용한 폐루프 비행; 56.0 m HDR 비행에서 ATE RMSE 0.17 m, 평균 상대 이동 오차 약 0.1 m; 대규모 야외 및 주행 시퀀스가 장기간 운용을 입증합니다.

## SLAM에서의 의미

ESVIO는 이벤트 SLAM의 센서 융합 계보를 완성합니다: 전체 스테레오 + 이벤트 + 프레임 + IMU 조합이 실제 항공 플랫폼에서, 센서가 설계된 바로 그 어둡고 빠른 조건에서 실용적임을 보여줍니다. 이는 ESVO와 Ultimate-SLAM 다음의 자연스러운 학습 대상이며, 오픈소스 공개(HKU ArcLab)로 후속 이벤트 VIO 연구의 공통 기준선이 되었습니다.

## 관련 문서

- [ESVO](esvo.md)
- [Ultimate-SLAM](ultimate-slam.md)
- [EKLT](eklt.md)
- [IMU preintegration](../level-06-vio-vins/imu-preintegration.md)
- [VINS-Fusion](../level-06-vio-vins/vins-fusion.md)
