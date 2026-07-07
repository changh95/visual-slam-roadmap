# VINS-Fusion

> Qin 2019 · [논문](https://arxiv.org/abs/1901.03638)

**한 줄 요약** — VINS-Fusion은 VINS-Mono를 모든 센서를 일반적인 팩터로 취급하는 최적화 기반 로컬 오도메트리 프레임워크로 일반화한 것으로, 상태 변수를 공유하는 팩터들을 하나의 슬라이딩 윈도우 문제로 합산하며, 스테레오 전용, 단안+IMU, 스테레오+IMU 구성을 단일 오픈소스 코드베이스에서 시연합니다.

## 문제

로봇은 점점 더 다양한 센서 구성을 탑재합니다 — 지상 차량의 스테레오 카메라, 휴대폰의 단안 카메라 + IMU, 항공 로봇의 스테레오 + IMU — 그러나 대부분의 상태 추정기는 단일 센서 또는 하나의 특정 구성을 위해 설계되어 다른 플랫폼으로 이전할 수 없습니다. 실용적인 시스템은 또한 우아한 센서 장애 처리가 필요합니다: 비활성 센서는 제거하고 대안 센서를 빠르게 추가할 수 있어야 합니다. VINS-Fusion은 모든 센서가 팩터 그래프 안의 또 하나의 잔차 팩터일 뿐인 하나의 일반적인 최적화 기반 프레임워크를 제안합니다.

## 방법 및 아키텍처

**상태.** 슬라이딩 윈도우는 바디 자세와 선택적인 센서별 변수를 추정합니다:

$$\mathcal{X} = [\mathbf{p}_0, \mathbf{R}_0, \dots, \mathbf{p}_n, \mathbf{R}_n, \mathbf{x}_{cam}, \mathbf{x}_{imu}], \quad \mathbf{x}_{cam} = [\lambda_0, \dots, \lambda_l], \quad \mathbf{x}_{imu} = [\mathbf{v}_0, \mathbf{b}_{a_0}, \mathbf{b}_{g_0}, \dots]$$

여기서 $\lambda$는 각 특징을 처음 관측한 프레임에서의 깊이입니다; $\mathbf{x}_{imu}$(속도와 IMU 바이어스)는 스테레오 전용 구성에서는 단순히 생략됩니다. 상태 추정은 독립적인 가우시안 측정값에 대한 MLE, 즉 비선형 최소제곱입니다:

$$\mathcal{X}^{*} = \arg\min_{\mathcal{X}} \sum_{t=0}^{n} \sum_{k\in\mathbf{S}} \left\lVert \mathbf{z}^{k}_{t} - h^{k}_{t}(\mathcal{X}) \right\rVert^{2}_{\mathbf{\Omega}^{k}_{t}}$$

**카메라 팩터.** KLT로 추적되는 Shi-Tomasi 코너(스테레오의 경우 좌우로도 매칭됨); 이 팩터는 특징 $l$을 첫 관측 이미지 $i$에서 이미지 $t$로 재투영합니다:

$$\mathbf{z}^{l}_{t} - h^{l}_{t}(\mathcal{X}) = \begin{bmatrix} u^{l}_{t} \\ v^{l}_{t} \end{bmatrix} - \pi_c\Big( (\mathbf{T}^{b}_{c})^{-1}\, \mathbf{T}_{t}^{-1}\, \mathbf{T}_{i}\, \mathbf{T}^{b}_{c}\, \pi_c^{-1}\big(\lambda_l, \begin{bmatrix} u^{l}_{i} \\ v^{l}_{i} \end{bmatrix}\big) \Big)$$

여기서 $\pi_c$는 카메라 모델의 투영, $\mathbf{T}^b_c$는 바디-카메라 외부 파라미터입니다. *동일한* 팩터가 시간적(왼쪽-왼쪽) 관측과 공간적(왼쪽-오른쪽) 관측을 모두 처리합니다 — 공간적 관측은 IMU 여기(excitation) 없이도 캘리브레이션된 기선을 통해 미터 스케일을 제약합니다.

**IMU 팩터.** 연속된 프레임 사이의 다양체 위 사전 적분은 유사 측정값 $\boldsymbol{\alpha}^{t-1}_{t}, \boldsymbol{\beta}^{t-1}_{t}, \boldsymbol{\gamma}^{t-1}_{t}$(상대 위치, 속도, 회전)와 전파된 공분산을 산출합니다; 잔차는 이들을 상태로 예측한 운동과 비교합니다. 예를 들어 위치의 경우 $\boldsymbol{\alpha}^{t-1}_{t} \ominus \mathbf{R}_{t-1}^{-1}(\mathbf{p}_t - \mathbf{p}_{t-1} + \tfrac{1}{2}\mathbf{g}\,dt^2 - \mathbf{v}_{t-1} dt)$이며, 바이어스는 랜덤 워크로 모델링됩니다.

**최적화 및 주변화.** 합산된 비용은 Ceres에서 가우스-뉴턴/Levenberg-Marquardt로 풀립니다. 윈도우는 10개의 공간적 카메라 프레임을 유지합니다; 새 키프레임이 도착하면, 가장 오래된 프레임의 시각적 및 관성 팩터가 슈어 보완을 통해 주변화됩니다,

$$\mathbf{H}_p = \mathbf{H}_{rr} - \mathbf{H}_{rm}\mathbf{H}_{mm}^{-1}\mathbf{H}_{mr}, \qquad \mathbf{b}_p = \mathbf{b}_r - \mathbf{H}_{rm}\mathbf{H}_{mm}^{-1}\mathbf{b}_m$$

이는 문제를 정보 손실 없는 사전 항을 가진 MAP로 바꿉니다. 잔차 팩터로 축약 가능한 센서라면 무엇이든(휠 오도메트리, LiDAR, 레이더가 예로 언급됨) 이 틀에 들어맞으므로, 센서 장애는 비활성 센서의 팩터를 제거하고 다른 센서의 팩터를 추가하는 것으로 처리됩니다.

## 실험 결과

EuRoC(RMSE ATE, Horn 정렬)에서 세 구성이 OKVIS와 비교됩니다: 단안+IMU는 MH_02에서 0.09 m(OKVIS 0.22), V1_02에서 0.09 m(OKVIS 0.20), V2_01에서 0.06 m(OKVIS 0.13)를 달성하여 대부분의 시퀀스에서 OKVIS를 능가합니다. 스테레오 전용은 V1_03과 V2_03에서 *실패*하며(운동이 시각적 추적에 비해 너무 공격적임) 다른 곳에서도 가장 많이 드리프트합니다; IMU를 보조로 사용하는 모든 구성은 11개 시퀀스 전부에서 살아남습니다 — IMU가 조명 변화, 텍스처 없는 영역, 모션 블러를 이어주고 중력을 관측함으로써 롤/피치 드리프트를 억제합니다. 스테레오+IMU가 항상 최고는 아니며, 캘리브레이션 오차에 더 민감합니다. 야외 핸드헬드 실험(20 Hz mvBlueFOX 스테레오 + 200 Hz DJI A3 IMU, 그라운드 트루스로 GPS 사용)에서 약 224–232 m 루프에 대해, RMSE는 (스테레오 전용) 1.85–2.59 m에서 IMU 융합 시 0.43–0.75 m로 떨어집니다. GPS 융합은 이 논문에서 향후 과제로 언급되며; 오픈소스 VINS-Fusion 릴리스는 로컬 오도메트리를 전역 위치 측정값과 융합하는 동반 전역 포즈 그래프 모듈로서 이를 포함합니다.

## SLAM에서의 의미

VINS-Fusion은 로보틱스에서 가장 널리 배포된 오픈소스 오도메트리 스택 중 하나입니다: 학술적으로 성공적인 VINS-Mono를 스테레오 스케일 관측 가능성과 센서에 구애받지 않는 팩터 공식화를 추가하여 실제 차량에서 실용적으로 만들었고, 이후 GPS 드리프트 보정으로 확장되었습니다. "모든 것은 팩터다"라는 설계는 자율주행과 드론 자율성에서 로컬-전역 결합 융합의 표준 틀이 되었으며, 여전히 스테레오-관성 추정을 위한 표준 기준선으로 남아 있습니다.

## 관련 문서

- [VINS-Mono](vins-mono.md)
- [OKVIS](okvis.md)
- [스케일 관측 가능성](../level-07-stereo-slam/scale-observability.md)
- [긴밀 결합 vs 느슨한 결합](tightly-coupled-vs-loosely-coupled.md)
- [LVI-SAM](../level-09-lidar-visual-lidar-slam/lvi-sam.md)
- [OKVIS2-X](okvis2-x.md)
