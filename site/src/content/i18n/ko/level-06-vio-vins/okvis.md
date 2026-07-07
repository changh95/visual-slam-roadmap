# OKVIS
> Leutenegger 2015 · [논문](https://journals.sagepub.com/doi/10.1177/0278364914554813)

**한 줄 요약** — OKVIS(Open Keyframe-based Visual-Inertial SLAM)는 VIO를 위한 긴밀 결합 슬라이딩 윈도우 최적화 패러다임을 확립했습니다: 키프레임과 최근 프레임의 제한된 윈도우에서 재투영 오차와 IMU 오차를 공동으로 최소화하며, 슈어 보완 주변화로 그보다 오래된 모든 것을 사전(prior) 항으로 압축합니다.

## 문제
필터 기반 VIO(MSCKF 계열)는 각 측정값을 업데이트 시점에 단 한 번 선형화합니다; 누적된 선형화 오차는 정확도를 희생시킵니다. 완전한 번들 조정은 매 반복마다 모든 것을 재선형화하여 드리프트를 훨씬 적게 만들지만—모든 과거 프레임에 대한 BA는 실시간으로 실행될 수 없으며, 수백 Hz로 도착하는 관성 측정값은 연속적인 상태들 사이에 밀집한 시간적 제약을 만듭니다. OKVIS는 제한된 *키프레임* 윈도우로 이 긴장을 해결합니다: 키프레임은 시간적으로 임의로 멀리 떨어져 있을 수 있으므로(정지해 있을 때도 추정값이 드리프트 없이 유지됩니다), 오래된 상태는 주변화를 통해 가우시안 사전으로 접혀 들어갑니다.

## 방법 및 아키텍처
- **상태 및 결합 비용.** 각 로봇 상태는 자세, 속도, IMU 바이어스를 보유합니다, $\mathbf{x}_R = \begin{bmatrix} {}_W\mathbf{r}_S^\top & \mathbf{q}_{WS}^\top & {}_S\mathbf{v}^\top & \mathbf{b}_g^\top & \mathbf{b}_a^\top \end{bmatrix}^\top$, 이와 함께 3D 랜드마크 ${}_W\mathbf{l}^j$와 (선택적으로 온라인 캘리브레이션되는) 카메라 외부 파라미터가 있습니다. 추정기는 가중된 재투영 오차 $\mathbf{e}_r$과 IMU 오차 항 $\mathbf{e}_s$를 결합한 하나의 비용을 최소화합니다(식 7):
  $$J(\mathbf{x}) := \sum_{i=1}^{I}\sum_{k=1}^{K}\sum_{j \in \mathcal{J}(i,k)} \mathbf{e}_r^{i,j,k\,\top}\,\mathbf{W}_r^{i,j,k}\,\mathbf{e}_r^{i,j,k} \;+\; \sum_{k=1}^{K-1} \mathbf{e}_s^{k\,\top}\,\mathbf{W}_s^{k}\,\mathbf{e}_s^{k},$$
  카메라 인덱스 $i$, 프레임 인덱스 $k$, 랜드마크 인덱스 $j$, 정보 행렬 $\mathbf{W}$를 사용하여—(필터와 달리) Google Ceres로 풀고 매 반복마다 재선형화합니다.
- **재투영 오차.** $\mathbf{e}_r^{i,j,k} = \mathbf{z}^{i,j,k} - \mathbf{h}_i\big(\mathbf{T}_{C_iS}\,\mathbf{T}_{SW}\,{}_W\mathbf{l}^j\big)$, 여기서 $\mathbf{h}_i$는 카메라 $i$의 (왜곡을 고려한) 투영입니다; 해석적 야코비안은 주변화 단계의 재료로도 함께 사용됩니다.
- **IMU 오차 항.** 프레임 $k$와 $k{+}1$ 사이의 원시 IMU 측정값은 고전적인 룽게-쿠타(이 논문은 다양체 위 사전 적분보다 앞서 있습니다)로 적분되어 예측값 $\hat{\mathbf{x}}^{k+1}$을 만들며, 15차원 잔차는 예측값과 추정값의 차이입니다—위치, 최소 쿼터니언 오차 $2\big[\hat{\mathbf{q}}_{WS}^{k+1} \otimes \mathbf{q}_{WS}^{k+1\,-1}\big]_{1:3}$, 속도, 바이어스—공분산 $\mathbf{P}\big(\delta\hat{\boldsymbol{\chi}}_R^{k+1}\,\vert\,\mathbf{x}_R^k, \mathbf{z}_s^k\big)$를 잔차 야코비안을 통해 전파하여 얻은 정보 행렬 $\mathbf{W}_s^k$를 사용합니다.
- **키프레임 윈도우.** 최적화는 가장 최근 $S$개 프레임(시간적/IMU 윈도우)에 과거로 멀리 떨어져 있을 수 있는 $M$개 키프레임을 더한 범위를 다룹니다. 투영되고 매칭된 랜드마크의 외곽선이 이미지의 약 50\% 미만을 덮거나 검출된 키포인트의 약 20\% 미만이 매칭될 때 프레임은 키프레임이 됩니다—이렇게 하여 유지되는 키프레임이 다양한 시점을 포함하도록 합니다.
- **주변화.** 상태 $\mathbf{x}_\mu$를 제거할 때 가우스-뉴턴 시스템 $\mathbf{H}\delta\boldsymbol{\chi} = \mathbf{b}$에 슈어 보완을 적용합니다:
  $$\mathbf{H}^{*}_{\lambda\lambda} = \mathbf{H}_{\lambda\lambda} - \mathbf{H}_{\lambda\mu}\mathbf{H}_{\mu\mu}^{-1}\mathbf{H}_{\mu\lambda}, \qquad \mathbf{b}^{*}_{\lambda} = \mathbf{b}_{\lambda} - \mathbf{H}_{\lambda\mu}\mathbf{H}_{\mu\mu}^{-1}\mathbf{b}_{\mu},$$
  선형화 지점은 주변화 시점의 추정값으로 고정됩니다(first-estimate 처리). 비키프레임은 측정값이 제거되고 상태가 주변화됩니다; 오래된 키프레임은 그 안에서만 보이는 랜드마크와 함께 주변화되어 문제를 계속 희소하게 유지합니다.
- **프론트엔드.** BRISK 디스크립터를 가진 다중 스케일 SSE 최적화 Harris 코너(균일한 키포인트 분포 강제), 마할라노비스 검정과 절대 자세 RANSAC으로 게이팅된 무작위 대입 3D-2D 매칭, 그다음 가장 최근 키프레임에 대한 삼각측량과 상대 RANSAC을 사용한 2D-2D 매칭; 스테레오와 단안 변형은 파이프라인을 공유합니다.

## 실험 결과
동일한 키포인트와 IMU 데이터를 받는 기준 MSCKF 스타일 stochastic-cloning 슬라이딩 윈도우 필터를 대상으로, 맞춤형 FPGA 동기화 스테레오-관성 센서(800\,Hz의 ADIS16448 IMU, 20\,Hz의 두 대의 WVGA 글로벌 셔터 카메라, 11\,cm 베이스라인)로부터의 데이터셋에서 평가되었으며, $M{=}7$개 키프레임과 $S{=}3$개의 최근 프레임을 사용했습니다. 1200\,m의 **Vicon Loops** 시퀀스(14분, Vicon 그라운드 트루스)에서는 모든 방법이 이동 거리당 위치 오차 중앙값 0.1\% 미만을 유지하지만, OKVIS는 필터보다 요 드리프트가 적습니다. 7.9\,km의 **Bicycle Trajectory**(23분, 최대 속도 13.1\,m/s, DGPS 그라운드 트루스)와 620\,m의 **ETH Main Building** 핸드헬드 데이터셋에서는, 스테레오(aslam)와 단안(aslam-mono) 버전 모두 일관되게 msckf-mono보다 우수합니다. 대략적인 CAD 추정값에서 시작한 온라인 외부 파라미터 캘리브레이션은 캘리브레이션 오류로 인해 발생하는 스케일 오차를 제거합니다; 키프레임을 7개에서 12개로 늘려도 유의미한 이득은 없으며, 이미지당 키포인트를 240개에서 45개로 줄여도 정확도는 약간만 저하됩니다.

## SLAM에서의 의미
OKVIS가 정의한 슬라이딩 윈도우 BA + 주변화 아키텍처는 VINS-Mono, Basalt, ORB-SLAM3의 VI 모드, DM-VIO, OKVIS2가 모두 따르는 템플릿이며, 이는 긴밀 결합 비선형 최적화가 받아들일 만한 비용으로 필터링보다 정확도에서 우수함을 보여준 최초의 강력한 증거였습니다. 그 키프레임 선택 로직과 주변화 전략은 여전히 "지금까지의 정보를 버리지 않고 VIO 계산량을 제한하는 방법"이라는 질문에 대한 기본적인 답입니다. OKVIS는 또한 긴 계보를 낳았습니다: OKVIS2는 재활성화 가능한 랜드마크로 루프 클로저를 추가했고, OKVIS2-X는 이 프레임워크를 LiDAR, 깊이, GNSS로 확장했습니다.

## 관련 문서
- [VINS-Mono](vins-mono.md) — 이 아키텍처의 가장 널리 배포된 후계자.
- [OKVIS2](okvis2.md) — 확장 가능한 루프 클로저를 추가한 직접적인 후계자.
- [Basalt](basalt.md) — OKVIS 스타일 주변화 사전의 선형화 약점을 해결합니다.
- [IMU Preintegration on Manifold](imu-preintegration-on-manifold.md) — 이후에 나온, 지금은 표준이 된 IMU 팩터 공식화.
- [Marginalization](../level-02-getting-familiar/marginalization.md) — 슬라이딩 윈도우 뒤에 있는 핵심 메커니즘.
- [Schur complement / Sparsity](../level-02-getting-familiar/schur-complement-sparsity.md) — 압축을 수행하는 선형대수 도구.
