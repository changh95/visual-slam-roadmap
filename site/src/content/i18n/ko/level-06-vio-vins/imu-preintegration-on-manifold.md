# IMU Preintegration on Manifold
> Forster 2015 · [논문](https://arxiv.org/abs/1512.02363)

**한 줄 요약** — IMU 측정값의 $SO(3)$ 다양체 위에서 이론적으로 엄밀한 사전 적분을 유도하여, 원시 IMU 데이터를 재적분하지 않고도 최적화 기반 VIO가 바이어스 변화를 해석적으로 보정할 수 있게 한다.

## 문제
비선형 최적화는 매우 정확한 VIO를 제공하지만, "실시간 최적화는 궤적이 시간이 지남에 따라 성장하면서 빠르게 다루기 힘들어지며; 관성 측정값이 고속으로 도착한다는 사실 때문에 이 문제는 더욱 심화되어 최적화 변수의 수가 급격히 증가한다"(초록). 단순한 적분은 세계 프레임에서 정의되므로 구간 시작 시점의 절대 자세에 의존한다: 최적화기가 그 자세를 옮길 때마다 모든 원시 IMU 데이터를 재적분해야 한다 — 수백 Hz에서는 절망적이다. Lupton의 사전 적분(2012)이 탈출구를 보여주었지만 회전을 벡터 공간에서 다루었다; 엄밀한 정식화는 $SO(3)$의 다양체 구조를 존중하고 회전 잡음을 올바르게 특성화해야 했다.

## 방법 및 아키텍처
IMU는 서서히 변화하는 바이어스와 백색 잡음으로 오염된 바디 프레임 각속도와 비력을 측정한다(식 27–28):

$$\tilde{\boldsymbol{\omega}}(t) = \boldsymbol{\omega}(t) + \mathbf{b}^g(t) + \boldsymbol{\eta}^g(t), \qquad \tilde{\mathbf{a}}(t) = \mathtt{R}_{\mathrm{WB}}^{\mathsf{T}}(t)\big(\mathbf{a}(t) - \mathbf{g}\big) + \mathbf{b}^a(t) + \boldsymbol{\eta}^a(t),$$

운동학은 $\dot{\mathtt{R}}_{\mathrm{WB}} = \mathtt{R}_{\mathrm{WB}}\,\boldsymbol{\omega}^{\wedge}$, $\dot{\mathbf{v}} = \mathbf{a}$, $\dot{\mathbf{p}} = \mathbf{v}$이다. 파이프라인은 다음과 같이 동작한다:

- **사전 적분된 측정값.** 키프레임 $i$와 $j$ 사이의 모든 측정값은 프레임 $i$에 대해 상대적으로, 적분 시점의 바이어스 추정값 $\mathbf{b}_i$를 사용하여 한 번 합성된다:

$$\Delta\tilde{\mathtt{R}}_{ij} \doteq \prod_{k=i}^{j-1} \mathrm{Exp}\big((\tilde{\boldsymbol{\omega}}_k - \mathbf{b}^g_i)\Delta t\big), \qquad \Delta\tilde{\mathbf{v}}_{ij} \doteq \sum_{k=i}^{j-1} \Delta\tilde{\mathtt{R}}_{ik}\,(\tilde{\mathbf{a}}_k - \mathbf{b}^a_i)\Delta t,$$

  그리고 $\Delta\tilde{\mathbf{p}}_{ij}$는 유사한 이중 합으로부터 구해진다 — 이 양들은 측정값과 $\mathbf{b}_i$에만 의존하며 절대 상태에는 의존하지 않는다.
- **올바른 회전 잡음 처리.** $\mathrm{Exp}$의 1차 전개와 수반(adjoint) 성질을 사용하여, 합성된 회전은 측정값 곱하기 잡음으로 분해된다, $\Delta\mathtt{R}_{ij} = \Delta\tilde{\mathtt{R}}_{ij}\,\mathrm{Exp}(-\delta\boldsymbol{\phi}_{ij})$, 여기서 $\delta\boldsymbol{\phi}_{ij}$는 $SO(3)$의 탄젠트 공간에 존재하며 우측 야코비안 $\mathtt{J}_r^k$를 포함한다. 이는 측정 모델(식 38)을 낳는다

$$\Delta\tilde{\mathtt{R}}_{ij} = \mathtt{R}_i^{\mathsf{T}}\mathtt{R}_j\,\mathrm{Exp}(\delta\boldsymbol{\phi}_{ij}), \quad \Delta\tilde{\mathbf{v}}_{ij} = \mathtt{R}_i^{\mathsf{T}}(\mathbf{v}_j - \mathbf{v}_i - \mathbf{g}\Delta t_{ij}) + \delta\mathbf{v}_{ij}, \quad \Delta\tilde{\mathbf{p}}_{ij} = \mathtt{R}_i^{\mathsf{T}}\big(\mathbf{p}_j - \mathbf{p}_i - \mathbf{v}_i\Delta t_{ij} - \tfrac{1}{2}\mathbf{g}\Delta t_{ij}^2\big) + \delta\mathbf{p}_{ij},$$

  여기서 잡음 벡터 $[\delta\boldsymbol{\phi}_{ij}, \delta\mathbf{v}_{ij}, \delta\mathbf{p}_{ij}]$는 1차까지 평균이 0인 가우시안이며, 공분산 $\mathbf{\Sigma}_{ij}$가 반복적으로 전파된다.
- **재적분 없는 바이어스 보정.** 최적화기가 바이어스를 $\delta\mathbf{b}$만큼 업데이트하면, 델타 측정값은 재적분 대신 미리 계산된 상수 야코비안으로 보정된다(식 44):

$$\Delta\tilde{\mathtt{R}}_{ij}(\mathbf{b}^g_i) \simeq \Delta\tilde{\mathtt{R}}_{ij}(\bar{\mathbf{b}}^g_i)\,\mathrm{Exp}\!\Big(\tfrac{\partial\Delta\bar{\mathtt{R}}_{ij}}{\partial\mathbf{b}^g}\delta\mathbf{b}^g\Big), \qquad \Delta\tilde{\mathbf{v}}_{ij} \simeq \Delta\tilde{\mathbf{v}}_{ij}(\bar{\mathbf{b}}_i) + \tfrac{\partial\Delta\bar{\mathbf{v}}_{ij}}{\partial\mathbf{b}^g}\delta\mathbf{b}^g + \tfrac{\partial\Delta\bar{\mathbf{v}}_{ij}}{\partial\mathbf{b}^a}\delta\mathbf{b}^a.$$

- **사전 적분된 IMU 팩터.** 하나의 9-DoF 잔차 $\mathbf{r}_{\mathcal{I}_{ij}} = [\mathbf{r}_{\Delta\mathtt{R}_{ij}}, \mathbf{r}_{\Delta\mathbf{v}_{ij}}, \mathbf{r}_{\Delta\mathbf{p}_{ij}}]$가 연속된 키프레임 상태를 제약한다. 예를 들어 $\mathbf{r}_{\Delta\mathtt{R}_{ij}} = \mathrm{Log}\big(\big(\Delta\tilde{\mathtt{R}}_{ij}(\bar{\mathbf{b}}^g_i)\,\mathrm{Exp}(\tfrac{\partial\Delta\bar{\mathtt{R}}_{ij}}{\partial\mathbf{b}^g}\delta\mathbf{b}^g)\big)^{\mathsf{T}}\mathtt{R}_i^{\mathsf{T}}\mathtt{R}_j\big)$ — 재투영 잔차와 정확히 대응하며, 모든 야코비안이 해석적 형태로 주어진다.
- **구조 없는 시각 팩터를 가진 팩터 그래프 백엔드.** IMU 팩터는 iSAM2로 풀리는 팩터 그래프 위의 MAP 추정에 결합된다; 시각 랜드마크는 닫힌 형태로(구조 없는 투영 팩터) 소거되어, "3D 포인트에 대한 최적화를 피해 계산을 더욱 가속화한다" — 고정 지연 필터링이 아니라 완전한 스무딩을 실시간으로 수행한다.

## 실험 결과
- **시뮬레이션:** 사인파 형태의 수직 운동이 있는 120 m 원형 궤적에서 50회 몬테카를로 실행이 사전 적분 모델의 정확도와 일관성을 확인한다(iSAM2로 풀이).
- **실내(430 m 궤적, VI-Sensor: 800 Hz의 ADIS16448 IMU, 20 Hz 카메라, Vicon 그라운드 트루스):** 전체 파이프라인(SVO 프론트엔드 + 사전 적분 + 구조 없는 팩터 + iSAM2)은 360 m 이동에 걸쳐 **평균 드리프트 0.3 m** (OKVIS와 MSCKF는 둘 다 0.7 m)를 달성하며, 요 드리프트가 눈에 띄게 적다.
- **실행 시간(Intel i7, 2.4 GHz 노트북):** iSAM2 업데이트 평균 10 ms(10회 반복, 완전 MAP); SVO 프론트엔드 프레임당 ~3 ms. 반면 OKVIS는 선형화 지점이 바뀔 때마다 IMU 적분을 반복해야 한다.
- **야외 대 Google Tango:** 사무실 건물 주변에서 종단간 루프 오차 1.5 m 대 Tango의 2.2 m; 3층 궤적에서 0.5 m 대 1.4 m.
- IEEE TRO(2017; arXiv 2015)에 게재; 사전 적분된 IMU와 구조 없는 시각 팩터의 참조 구현은 GTSAM에 포함되어 있다.

## SLAM에서의 의미
이는 사실상 모든 현대 최적화 기반 VIO의 기초 이론이다: VINS-Mono, ORB-SLAM3, Kimera-VIO, Basalt, OKVIS2 모두 IMU 팩터에 Forster 방식의 다양체 위 사전 적분을 사용한다. 이는 Lupton의 원래 사전 적분 아이디어를 올바른 다양체 처리로 업그레이드하여 — 오일러 각의 특이점을 피하고 — 고속 관성 센싱을 키프레임 속도의 비선형 최적화와 호환되게 만들었다. VIO 이론을 하나만 직접 구현해본다면, 이것으로 하라.

## 관련 문서
- [IMU preintegration](imu-preintegration.md) — 주변 맥락을 담은 개념 노트.
- [Quaternion kinematics for error-state KF](quaternion-kinematics-for-error-state-kf.md) — 다양체 위 상태 추정을 위한 보완 참고 자료.
- [Lie groups](../level-02-getting-familiar/lie-groups.md) — 수학적 장치($\mathrm{Exp}/\mathrm{Log}$, 야코비안).
- [VINS-Mono](vins-mono.md) — 이 IMU 팩터들 위에 구축된 널리 사용되는 시스템.
- [Incremental smoothing](../level-02-getting-familiar/incremental-smoothing.md) — 논문이 짝지어 사용하는 iSAM2 백엔드.
- [IMU noise model](imu-noise-model.md) — 공분산 전파에 들어가는 잡음 항의 출처.
