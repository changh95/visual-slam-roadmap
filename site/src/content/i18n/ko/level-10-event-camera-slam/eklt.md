# EKLT

> Gehrig 2020 · [논문](https://rpg.ifi.uzh.ch/docs/IJCV19_Gehrig.pdf)

**한 줄 요약** — EKLT는 Lucas-Kanade(KLT) 스타일 특징 추적을 이벤트 카메라로 가져옵니다: 특징은 표준 프레임에서 초기화된 뒤, 최대 가능도 프레임워크 내의 생성적 이벤트 모델을 통해 프레임 사이에서 이벤트를 사용하여 비동기적으로 추적되며, 이를 통해 기존 특징 기반 파이프라인에 바로 연결 가능한 고속의 블러 없는 트랙을 얻습니다.

## 문제

KLT 추적은 특징 기반 VO/VIO의 핵심 프론트엔드입니다: 이는 밝기 불변성 가정 아래 광도계 오차를 최소화하여 연속된 프레임 사이의 특징 패치를 추적합니다. 고속에서는 이것이 무너집니다 — 특징이 프레임 사이에 여러 픽셀만큼 이동하고, 모션 블러가 패치 외관을 파괴하며, 최소화가 발산합니다. 이벤트는 마이크로초 지연과 블러 없이 발화하여, 빠진 프레임 간 움직임 신호를 정확히 담고 있습니다 — 하지만 동일한 장면 패턴도 움직임 방향에 따라 *다른* 이벤트를 생성하므로, 시간에 걸친 이벤트 대응 관계를 확립하기가 어렵습니다. EKLT는 움직임에 독립적인 프레임을 기준으로 사용하고 움직임에 의존적인 이벤트를 측정값으로 사용하여 이 문제를 피해갑니다.

## 방법 및 아키텍처

이상적인 이벤트 카메라는 픽셀 $\mathbf{u}_k$에서 로그 밝기 $L$이 대비 임계값 $\pm C$만큼 변할 때 이벤트 $e_k = (x_k, y_k, t_k, p_k)$를 트리거합니다:

$$\Delta L(\mathbf{u}_k, t_k) = L(\mathbf{u}_k, t_k) - L(\mathbf{u}_k, t_k - \Delta t_k) = p_k C,$$

극성 $p_k \in \{-1,+1\}$을 가집니다. 구간 $\tau$에 걸쳐 극성을 누적하면 **관측된 밝기 증분 이미지** $\Delta L(\mathbf{u}) = \sum_{t_k \in \tau} p_k C\, \delta(\mathbf{u} - \mathbf{u}_k)$를 얻습니다. 작은 $\tau$에 대해, 생성 모델은 증분이 광학 흐름 $\mathbf{v}$와 함께 움직이는 그래디언트에 의해 발생한다고 말합니다:

$$\Delta L(\mathbf{u}) \approx -\nabla L(\mathbf{u}) \cdot \mathbf{v}(\mathbf{u})\, \tau,$$

따라서 엣지와 평행한 움직임은 이벤트를 생성하지 않고, 수직인 움직임은 가장 높은 비율로 이벤트를 생성합니다. 후보 워프 $\mathbf{W}$ 아래 프레임 $\hat{L}$(시각 $t=0$에서 주어짐)로부터의 **예측 증분**은 $\Delta \hat{L}(\mathbf{u}; \mathbf{p}, \mathbf{v}) = -\nabla \hat{L}(\mathbf{W}(\mathbf{u};\mathbf{p})) \cdot \mathbf{v}\, \tau$입니다. 가우시안 오차를 가정하면 최대 가능도는 최소자승 정합으로 귀결됩니다; $C$가 미지이므로 EKLT는 패치 영역 $\mathcal{P}$에 대해 *단위 노름* 패치를 비교합니다:

$$\min_{\mathbf{p},\mathbf{v}} \left\| \frac{\Delta L(\mathbf{u})}{\|\Delta L(\mathbf{u})\|} - \frac{\Delta \hat{L}(\mathbf{u};\mathbf{p},\mathbf{v})}{\|\Delta \hat{L}(\mathbf{u};\mathbf{p},\mathbf{v})\|} \right\|^2_{L^2(\mathcal{P})},$$

이는 $C$와 $\tau$를 상쇄합니다. 워프는 이미지 평면에서의 강체 운동입니다: $\mathbf{W}(\mathbf{u};\mathbf{p}) = \mathrm{R}(\mathbf{p})\mathbf{u} + \mathbf{t}(\mathbf{p})$, $(\mathrm{R}, \mathbf{t}) \in SE(2)$, Ceres로 최적화됩니다. 파이프라인: 프레임에서 Harris 코너를 검출하고, 강도 패치와 $\nabla \hat{L}$을 추출합니다; 이후 들어오는 각 이벤트를, 이벤트가 닿는 패치들에 누적합니다; 한 패치에 $N_e$개의 이벤트가 모이면 목적함수를 최소화하여 $\mathbf{p}$와 $\mathbf{v}$를 업데이트하고, 패치를 리셋한 뒤 반복합니다. 따라서 추적은 비동기적입니다 — 업데이트는 $N_e$개의 이벤트가 도착할 때마다(일반적으로 프레임 레이트의 ~10배) 발생하며, 각 패치는 자신의 프레임 템플릿에 대해 독립적으로 추적되며, 암묵적인 픽셀-대-픽셀 데이터 연관을 사용합니다(이벤트-대-특징 ICP 대응이 아님). 최소 비용을 모니터링하여 트랙 손실을 감지하고 새 프레임에서 재초기화를 트리거합니다.

## 실험 결과

- **시뮬레이션 데이터**(이벤트 카메라 시뮬레이터, 4개 장면): 약 0.4픽셀의 평균 추적 오차 — 0.20 px(sim_april_tags), 0.29 px(sim_3planes), 0.42 px(sim_rocks), 0.67 px(sim_3wall) — 잡음 없는 조건에서의 하한선입니다.
- **실제 데이터, 8개 시퀀스**: shapes_6dof, checkerboard, boxes_6dof, poster_6dof(Event Camera Dataset), pipe_2, bicycles, outdoor_day1(MVSEC), outdoor_forward5(UZH-FPV)를 네 가지 기준선(Canny 포인트 집합에 대한 ICP, EM-ICP, 모션 보상된 이벤트 프레임에 대한 KLT, 하이패스 필터로 재구성된 이미지에 대한 KLT)과 비교. 실측값은 DAVIS 프레임에 대한 KLT로부터 얻음.
- 트랙 정규화 오차: 8개 시퀀스 전체에서 EKLT 0.64~1.21 px(예: poster_6dof 0.64 대 ICP 2.48, EM-ICP 3.10, KLT-MCEF 0.97, KLT-HF 1.18; boxes_6dof 0.72 대 ICP 4.59), 모든 시퀀스에서 정확도상 모든 기준선을 능가.
- 흑백 장면에서 EKLT는 ICP보다 평균 두 배 정확하고 트랙 길이도 두 배 길다; 특징 수명(feature age)은 KLT-MCEF 및 KLT-HF 기준선과 비슷하다.
- IJCV(2020)에 게재됨; "프레임 그래디언트로부터 이벤트를 예측하고 관측된 이벤트에 정렬한다"는 패러다임은 이후 이벤트 기반 특징 추적기의 표준 비교 대상이 되었습니다(예: EKLT-VIO는 이를 VIO 프론트엔드로 사용).

## SLAM에서의 의미

EKLT는 이벤트 카메라를 기존 SLAM 시스템에 도입하는 가장 실용적인 진입점입니다: 전체 파이프라인을 교체하는 대신 특징 추적기만 업그레이드하여, 고전적인 VIO 프론트엔드를 프레임 기반 KLT가 트랙을 잃는 속도 영역까지 확장합니다. 또한 특징 수준에서 "이벤트 + 프레임은 상호 보완적"이라는 원칙을 결정화했으며, 이는 Ultimate-SLAM이 추정기 수준에서, EDS가 직접법에 적용하는 것과 동일한 철학입니다.

## 관련 문서

- [EVO](evo.md)
- [Ultimate-SLAM](ultimate-slam.md)
- [ESVIO](esvio.md)
- [VINS-Mono](../level-06-vio-vins/vins-mono.md)
- [Event cameras (DVS)](event-cameras-dvs.md)
