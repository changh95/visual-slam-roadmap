# FAST-LIVO

> Zheng 2022 · [논문](https://arxiv.org/abs/2203.00893)

**한 줄 요약** — FAST-LIVO는 LiDAR 맵 포인트에 이미지 패치를 부착함으로써 직접 LiDAR-관성 오도메트리와 직접 시각 오도메트리를 단일 ESIKF에서 통합하여, 두 모달리티 모두에서 특징 추출을 제거했다.

## 문제

기존 LVI 시스템(R2LIVE, LVI-SAM)은 특징 기반 프론트엔드를 실행한다—시각 측에서는 코너 추출과 슬라이딩 윈도우 최적화, LiDAR 측에서는 모서리/평면 추출—이는 상당한 계산 비용이 들고 뚜렷한 특징이 부족한 곳에서 실패한다. FAST-LIVO는 FAST-LIO2가 LiDAR에 가져온 직접 철학이 카메라로도 확장될 수 있는지, 그리고 두 센서가 별도의 시각 및 LiDAR 표현 대신 하나의 맵을 공유할 수 있는지를 묻는다.

## 방법 및 아키텍처

18차원 매니폴드 상태 $\mathbf{x} = [{^G}\mathbf{R}_I^T\ {^G}\mathbf{p}_I^T\ {^G}\mathbf{v}^T\ \mathbf{b_g}^T\ \mathbf{b_a}^T\ {^G}\mathbf{g}^T]^T \in SO(3)\times\mathbb{R}^{15}$ 위에서 동작하는 하나의 오차 상태 반복 칼만 필터(ESIKF)이며, 측정값 사이에서 IMU가 전방 전파를 수행하고 각 LiDAR 스캔을 디스큐잉하기 위해 후방 전파를 수행한다.

- **LIO 서브시스템** (FAST-LIO2에서 적응): 원시 스캔 포인트—모서리/평면 특징 없음—가 포인트-투-평면 잔차로 프레임-투-맵 정합된다

$$\mathbf{r}_l(\mathbf{x}_k, {^L}\mathbf{p}_j) = \mathbf{u}_j^T\big({^G}\mathbf{T}_{I_k}\,{^I}\mathbf{T}_L\,{^L}\mathbf{p}_j - \mathbf{q}_j\big),$$

  여기서 $\mathbf{u}_j, \mathbf{q}_j$는 증분 k-d 트리(ikd-Tree)에서 찾은 가장 가까운 5개의 맵 포인트에 피팅된 평면의 법선과 중심이다.
- **VIO 서브시스템** (희소-직접, 프레임-투-맵): 맵 포인트 ${^G}\mathbf{p}_i$는 이전 관측 이미지들로부터의 패치 피라미드를 지니며, 참조 패치 $\mathbf{Q}_i$는 관측 각도가 가장 가까운 것이 선택되고, 정렬은 다음 광도계 잔차를 최소화한다

$$\mathbf{r}_c(\mathbf{x}_k, {^G}\mathbf{p}_i) = \mathbf{I}_k\big(\boldsymbol{\pi}({^I}\mathbf{T}_C^{-1}\,{^G}\mathbf{T}_{I_k}^{-1}\,{^G}\mathbf{p}_i)\big) - \mathbf{A}_i\mathbf{Q}_i$$

  ($\mathbf{A}_i$는 어파인 워프, $\boldsymbol{\pi}$는 핀홀 투영), 3단계 피라미드 레벨에 대해 조-대-세밀(coarse-to-fine)로 최적화된다. ORB/FAST 코너도, 삼각측량도, 깊이 필터도 없다.
- **측정값당 하나의 MAP 문제**: 시각각 $t_k$에 어느 센서의 데이터가 도착하든 $\min_{\mathbf{x}_k} \big( \|\mathbf{x}_k \boxminus \hat{\mathbf{x}}_k\|^2_{\hat{\mathbf{P}}_k} + \sum_j \|\mathbf{r}_l\|^2_{\boldsymbol{\Sigma}_l} + \sum_i \|\mathbf{r}_c\|^2_{\boldsymbol{\Sigma}_c} \big)$의 반복 업데이트를 트리거한다—LiDAR 스캔은 $\mathbf{r}_l$만, 이미지는 $\mathbf{r}_c$만 융합하며, 둘 다 동일한 상태와 공분산에 대해서이다(가우스-뉴턴과 동치).
- **공유 맵**: LiDAR 전역 맵은 모든 포인트의 ikd-Tree이며; 시각 전역 맵은 해시 인덱싱된 복셀에 LiDAR 포인트와 그 패치 피라미드를 함께 보관한다. 시각 서브맵은 가장 최근 스캔이 닿은 복셀을 폴링하여 가져온다.
- **이상치 제거**: 서브맵 포인트는 예측된 포즈로 투영되며, 40×40 픽셀 그리드당 최저 깊이 포인트만 유지되고, 9×9 이웃 내에서 현재 스캔 포인트에 가려진 포인트는 제외된다—광도계 정렬을 오염시킬 경계 및 가려진 포인트를 제거한다.
- **맵 업데이트**: 정렬 후 광도계 오차가 높은 포인트는 마지막 갱신 이후 >20 프레임 또는 >40 픽셀이 경과했으면 새로운 8×8 패치를 받는다; 새 맵 포인트는 40×40 그리드당 최고 그래디언트를 갖는 투영된 LiDAR 포인트이며, 고곡률 경계 포인트는 건너뛴다.

## 실험 결과

- **NTU-VIRAL 벤치마크** (UAV 시퀀스 9개, Ouster OS1-16 + 카메라 + IMU): FAST-LIVO는 9개 중 8개 시퀀스에서 최상의 절대 병진 RMSE를 달성한다—예를 들어 eee_01: 0.28m vs 0.54m (FAST-LIO2), 0.45m (R2LIVE), 2.88m (DVL-SLAM, 루프 클로저 제거), SVO2.0은 실패; nya_01: 0.19m. sbs_01에서만(0.29m vs FAST-LIO2의 0.25m) 심한 모션 블러로 이미지가 도움이 되지 않는다.
- **LiDAR 퇴화 벽면** (~30m 벽면을 향한 상태): FAST-LIO2는 제약되지 않은 방향으로 드리프트하고 SVO2.0은 반복적인 텍스처에서 드리프트하는 반면, FAST-LIVO는 가장 낮은 종단 드리프트인 0.05m를 달성한다.
- **시각적 도전 시퀀스** (실내-실외 전환, 두 번의 공격적인 모션, 무질감 백색 벽): 79.52m 경로에서 0.04m 종단 오차로 생존한다.
- **런타임**: LiDAR+이미지 프레임당 총 36.75ms vs R2LIVE의 프론트엔드 45.16ms + 슬라이딩 윈도우 백엔드 59.27ms; VIO 서브시스템은 Intel i7에서 10.23ms, ARM (Qualcomm RB5)에서 13.82ms가 걸린다—양쪽 모두 실시간이며, 하드웨어 동기화된 Livox Avia + 카메라도 오픈소스로 함께 공개되었다.

## SLAM에서의 의미

FAST-LIVO는 "직접" 철학이 LiDAR에서 시각 모달리티로 깔끔하게 확장된다는 증거이다—하나의 공유 맵, 하나의 필터, 특징 프론트엔드 없음. LiDAR는 모든 시각 앵커에 정확한 깊이를 제공하므로, 시각은 거의 추가 비용 없이 포즈 제약을 제공한다. 이 아키텍처적 경제성(LVI-SAM의 두 개의 특징 파이프라인이나 R3LIVE의 색상 부여 전용 VIO와 대비하여)은 소형 온보드 컴퓨터에서 고속 LVI 오도메트리를 위한 템플릿으로 만들었으며, 이는 FAST-LIVO2로 직접 이어진다.

## 관련 문서

- [FAST-LIO2](fast-lio2.md) — 직접 LIO 토대와 ikd-Tree 맵
- [FAST-LIVO2](fast-livo2.md) — 순차적 ESIKF 업데이트를 갖춘 정제된 후속 연구
- [R3LIVE](r3live.md) — 맵 채색 중심의 VIO 철학을 가진 자매 시스템
- [SVO](../level-03-monocular-slam/svo.md) — 이 시스템이 기반으로 삼는 희소-직접 시각 정렬 아이디어
- [Direct LiDAR-camera alignment](direct-lidar-camera-alignment.md) — 이 시스템이 정의하는 개념
- [LVI-SAM](lvi-sam.md) — 특징 기반, 팩터 그래프 대안
