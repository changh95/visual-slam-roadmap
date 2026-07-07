# R3LIVE++

> Lin 2023 · [논문](https://arxiv.org/abs/2209.03666)

**한 줄 요약** — R3LIVE++는 R3LIVE를 단순 RGB 채색에서 온더플라이 **복사(radiance) 맵** 재구성으로 업그레이드하고, 카메라 광도계 캘리브레이션과 온라인 노출 시간 추정을 추가하여 매핑 정밀도와 상태 추정 정확도를 모두 개선한다.

## 문제

R3LIVE는 맵 포인트에 원시 RGB 값을 저장하지만, 픽셀의 밝기는 장면의 속성이 아니다—그것은 장면의 복사(radiance)가 카메라의 비선형 응답 함수, 렌즈 비네팅, 그리고 자동 노출이 해당 프레임에 대해 선택한 노출 시간을 거쳐 필터링된 결과다. 이 이미징 파이프라인을 무시하면 저장된 색상이 시점과 시간에 따라 일관되지 않게 되고, 광도계 잔차에 체계적인 오차가 주입된다. R3LIVE++는 이미징 파이프라인을 명시적으로 모델링하여, 맵이 장치에 종속적인 RGB가 아니라 물리적 양인 *복사(radiance)*를 저장하도록 한다.

## 방법 및 아키텍처

R3LIVE와 동일한 두 서브시스템 ESIKF 아키텍처—FAST-LIO 스타일의 LIO가 맵의 기하학적 구조를 구축하고, 직접 VIO가 그 포인트들의 복사를 복원한다—를 사용하지만, 이제 시각 측면이 물리적으로 모델링된다:

- **이미지 형성 모델**: 각 색상 채널 $i$에 대해, 기록된 픽셀 강도는

$$\mathbf{I}_i(\boldsymbol{\rho}) = \mathbf{f}_i\big(\tau\, V(\boldsymbol{\rho})\, \boldsymbol{\gamma}_i\big),$$

  여기서 $\boldsymbol{\gamma}_i$는 해당 포인트에서의 장면 복사, $V(\boldsymbol{\rho}) \in [0,1]$는 픽셀별 비네팅 인자, $\tau$는 노출 시간, $\mathbf{f}_i(\cdot)$는 해당 채널의 비선형 카메라 응답 함수(CRF)이다. CRF와 비네팅은 오프라인으로 캘리브레이션되며; 이를 역산하면 관측된 픽셀로부터 복사를 얻는다: $\boldsymbol{\gamma}_i = \mathbf{f}_i^{-1}(\mathbf{I}_i(\boldsymbol{\rho})) \,/\, (\tau V(\boldsymbol{\rho}))$. 조명이 일정하고 램버시안 반사를 가정하면, 복사는 카메라 포즈에 불변한다—바로 이 성질이 에고 모션 추정을 이끄는 힘이다.
- **상태에 포함된 노출**: 전체 상태 $\mathbf{x} = ({^G}\mathbf{R}_I, {^G}\mathbf{p}_I, {^G}\mathbf{v}, \mathbf{b_g}, \mathbf{b_a}, {^G}\mathbf{g}, {^I}\mathbf{R}_C, {^I}\mathbf{p}_C, \epsilon, {^I}t_C, \boldsymbol{\phi})$는 이제 **역노출 시간** $\epsilon = 1/\tau$를 포함하며, 외부 파라미터, 시간 오프셋, 내부 파라미터와 함께 온라인으로 추정된다.
- **보정된 이미지에 대한 2단계 VIO**: 들어오는 각 이미지는 먼저 광도계적으로 보정(CRF와 비네팅을 되돌림)되어 $\boldsymbol{\Gamma}$가 된다. 광류로 추적된 맵 포인트에 대한 프레임-투-프레임 PnP 업데이트가 대략적인 상태를 제공하고; 그다음 프레임-투-맵 업데이트가 추적된 각 포인트에 대해 **복사 오차**를 최소화한다,

$$\mathbf{r}_c(\check{\mathbf{x}}_k, {^G}\mathbf{p}_s, \boldsymbol{\gamma}_s) = \boldsymbol{\Phi}_s - \boldsymbol{\gamma}_s, \qquad \boldsymbol{\Phi}_s = \check{\epsilon}_k\, \boldsymbol{\Gamma}_k(\check{\boldsymbol{\rho}}_{s_k}),$$

  맵 포인트의 저장된 복사 $\boldsymbol{\gamma}_s$를 그 투영 위치에서 관측된 복사 $\boldsymbol{\Phi}_s$와 비교한다. $\boldsymbol{\Phi}_s$가 $\epsilon$에 의존하기 때문에, 잔차 야코비안은 0이 아닌 노출 항목을 가진다—포즈를 추적하는 동일한 업데이트가 노출도 함께 추정한다.
- **패치가 아닌 단일 픽셀**: 잔차는 (카메라 회전/이동에 불변인) 포인트의 저장된 복사를 사용한 개별 픽셀에 대한 것으로, 패치 기반 직접 방법의 패치 워핑과 패치당 일정 깊이라는 근사를 피한다.
- **복사 맵 업데이트**: 수렴 후, 베이지안 업데이트가 새로운 관측을 보이는 각 포인트의 복사에 융합하며, 조명 변화 랜덤 워크 노이즈 $\mathbf{n}_{\text{ic}} \sim \mathcal{N}(\mathbf{0}, \boldsymbol{\sigma}^2_{\text{ic}} \Delta t_{\boldsymbol{\gamma}_s})$가 오래된 복사의 공분산을 증가시킨다.

## 실험 결과

- **NCLT 벤치마크**(25개 시퀀스, 138.0km, 총 33.6시간; 공정성을 위해 기준선들에서 루프 클로저 비활성화): R3LIVE++는 평균 절대 위치 오차 **8.51 m**로 최고를 달성했으며, FAST-LIO2(9.59 m), R2LIVE(10.58 m), 자체 LIO 단독(10.75 m), LVI-SAM(15.03 m), LIO-SAM(15.39 m)이 그 뒤를 잇는다.
- **R3LIVE 데이터셋**(자체 수집한 13개 HKU/HKUST 시퀀스, 8.4km, 2.4시간, LiDAR/카메라 퇴화 시퀀스 3개 포함): 장치가 텍스처 없는 단일 벽을 마주하는 시나리오에서도 시스템이 생존한다.
- **노출 추정** 대 카메라 API의 정답값: 다섯 시퀀스에서 평균 오차 0.189–3.460ms로, 일관되게 Tum-cali(0.341–7.082ms)보다 낮다. 예를 들어 hkust_campus_seq_02에서 0.302ms 대 5.225ms.
- **복사 맵 정확도**(맵을 모든 이미지에 재투영한 평균 광도계 오차): 모든 시퀀스에서 최저치를 기록한다—예를 들어 hku_campus_seq_00: 14.57(R3LIVE++) 대 22.56(R3LIVE) 대 34.78(최근 프레임으로 채색하는 기준선).
- **런타임**(i7-9700K, CPU 전용): NCLT에서 LiDAR 스캔당 34.3ms, 이미지당 16.6ms—데이터 1초당 처리 시간이 0.5초 미만으로, 실시간의 약 두 배 속도다.
- 복사 맵을 기반으로 구축된 응용: HDR 이미징(여러 가상 노출로 렌더링), 가상 환경 탐색, 3D 비디오 게이밍.

## SLAM에서의 의미

R3LIVE++는 SLAM과 사진 실사적 재구성의 수렴을 향한 초기의 실용적인 발걸음이다: 외관을 장식이 아니라 캘리브레이션된 물리적 측정값으로 취급하며, 실시간 LVI 추정기 안에서 복사장(radiance-field) 사고방식(NeRF, Gaussian splatting)을 선취한다. 그 광도계 캘리브레이션과 온라인 노출 추정은 FAST-LIVO2 같은 후속 직접 LVI 시스템에 채택되었다. 결과물이 단순한 궤적이 아니라 고품질의 색상화된 맵일 때 손을 뻗어야 할 대상이다.

## 관련 문서

- [R3LIVE](r3live.md) — 이 시스템이 개선한 선행 시스템
- [FAST-LIVO2](fast-livo2.md) — 노출도 온라인으로 추정하는 직접 LVI 오도메트리
- [FAST-LIO2](fast-lio2.md) — HKU MARS 스택의 LiDAR-관성 토대
- [Direct LiDAR-camera alignment](direct-lidar-camera-alignment.md) — 직접 방법에 광도계 캘리브레이션이 중요한 이유
- [DSO](../level-03-monocular-slam/dso.md) — 완전한 광도계 캘리브레이션을 개척한 시각 전용 시스템
- [NeRF](../level-05-deep-learning/nerf.md) — 이 시스템이 실시간으로 선취하는 복사장 아이디어
