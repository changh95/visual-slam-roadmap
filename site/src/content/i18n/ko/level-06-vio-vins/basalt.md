# Basalt

> Usenko 2020 · [논문](https://arxiv.org/abs/1904.06504)

**한 줄 요약** — 시각-관성 추정을 실시간 오도메트리 계층과 매핑 계층으로 분리하고, 비선형 팩터 복구(NFR)를 사용하여 VIO의 선형화된 주변화 사전을 소수의 비선형 상대 자세 및 롤-피치 팩터로 변환함으로써 전역 번들 조정이 자유롭게 재선형화할 수 있도록 한다.

## 문제

카메라와 IMU는 상호 보완적이지만, 이를 *전역적으로 일관된 매핑*을 위해 결합하는 것은 간단하지 않다: 번들 조정은 큰 베이스라인과 긴 시간 간격을 가진 키프레임을 원하는 반면, "관성 데이터는 반대로 간격의 지속 시간에 따라 빠르게 저하되며, 몇 초간의 적분 후에는 일반적으로 유용한 정보가 거의 남지 않는다." 따라서 키프레임 사이에서 IMU 데이터를 직접 사전 적분하는 시스템은 키프레임 간격을 제한해야 하고, 속도와 바이어스를 전역 문제로 끌고 가야 하는데, 여기서는 희소한 키프레임이 이들을 제대로 제약하지 못한다. 한편 슬라이딩 윈도우 VIO는 이력을 그 선형화 지점에서 고정된 슈어 보완 사전으로 압축한다. 선형화 지점을 고정하거나 모든 원시 측정값을 끌고 다니지 않으면서 오도메트리에서 누적된 정보를 전역 최적화로 어떻게 전달할 수 있을까?

## 방법 및 아키텍처

**VIO 계층(고정 지연 스무더).** FAST 코너가 50픽셀 격자에서 추출되고(80–120개의 활성 특징) 밝기 스케일 국소 SSD 노름(밝기 스케일 불변)으로 $\mathrm{SE}(2)$ 패치 워프를 추정하는 피라미드형 역합성(inverse-compositional) KLT로 추적된다; 원본 프레임으로의 역추적으로 이상치를 걸러낸다. 랜드마크는 호스트 키프레임에 대해 상대적으로, 스테레오그래픽 투영 좌표 $(u,v)$의 단위 시선 벡터와 역거리 $d$로 저장되어, 재투영 잔차는

$$\mathbf{r}_{it} = \mathbf{z}_{it} - \pi_{c(t)}\big(\mathbf{T}_{t}^{-1} \mathbf{T}_{h(i)}\, \mathbf{q}_{i}(u,v,d)\big)$$

가 되며, $d = 0$에서도 수치적으로 안정적으로 유지된다. IMU 측정값은 재귀적으로 전파되는 공분산과 바이어스 야코비안을 가진 유사 측정값 $(\Delta\mathbf{R}, \Delta\mathbf{v}, \Delta\mathbf{p})$로 사전 적분된다; 예를 들어 회전 잔차는 $\mathbf{r}_{\Delta\mathbf{R}} = \mathrm{Log}(\Delta\tilde{\mathbf{R}}\, \mathbf{R}_{j}^{\top} \mathbf{R}_{i})$이다. 매 프레임마다 다음을 최소화한다

$$E = \sum_{i\in\mathcal{P},\; t\in\mathrm{obs}(i)} \mathbf{r}_{it}^{\top} \boldsymbol{\Sigma}^{-1}_{it} \mathbf{r}_{it} + \sum_{(i,j)\in\mathcal{C}} \mathbf{r}_{ij}^{\top} \boldsymbol{\Sigma}^{-1}_{ij} \mathbf{r}_{ij} + E_{\text{m}}$$

7개의 키프레임 자세와 가장 최근의 완전한 상태(자세, 속도, 바이어스) 3개로 이루어진 윈도우에 걸쳐; 더 오래된 상태는 널스페이스를 보존하는 First-Estimate 야코비안을 사용한 슈어 보완 부분 주변화($\mathbf{H}^{\text{m}}_{\alpha\alpha} = \mathbf{H}_{\alpha\alpha} - \mathbf{H}_{\alpha\beta}\mathbf{H}_{\beta\beta}^{-1}\mathbf{H}_{\beta\alpha}$)로 제거된다.

**NFR을 사용하는 매핑 계층.** 키프레임이 윈도우를 벗어나면, Basalt는 그 마르코프 블랭킷의 선형화를 저장하고 키프레임 자세를 제외한 모든 것을 주변화한 뒤, 원래의 가우시안 $N(\boldsymbol{\mu}_{\text{o}}, \mathbf{H}_{\text{o}}^{-1})$과 인수분해된 근사 사이의 쿨백-라이블러(Kullback-Leibler) 발산을 최소화하여 그 밀집 사전을 근사하는 비선형 팩터를 *복구*한다. 복구된 잔차는 상대 자세와 롤-피치이다(위치/요는 관측 불가능하므로 제외):

$$\mathbf{r}_{\text{rel}}(\mathbf{s}, \mathbf{z}_{\text{rel}}) = \mathrm{Log}(\mathbf{z}_{\text{rel}}\, \mathbf{T}_{j}^{-1} \mathbf{T}_{i}), \qquad \mathbf{r}_{\text{rp}}(\mathbf{s}, \mathbf{z}_{\text{rp}}) = \lfloor \mathbf{z}_{\text{rp}}\, \mathbf{R}_{i}^{-1} (0,0,-1)^{\top} \rfloor_{xy}$$

유사 측정값 $\mathbf{z}$는 현재 추정값에서 읽어오며(따라서 평균이 보존된다), 정보 행렬은 닫힌 형태 $\mathbf{H}_{i} = (\{\mathbf{J}_{\text{r}} \boldsymbol{\Sigma}_{\text{o}} \mathbf{J}_{\text{r}}^{\top}\}_{i})^{-1}$로 계산된다. 이후 전역 매핑은 ORB 특징을 검출하고 매칭하여(VIO의 KLT 포인트와 통계적으로 독립적이므로 암묵적인 루프 클로저를 제공) 재투영 오차와 복구된 팩터 에너지 $E_{\text{nfr}}$을 함께 최소화한다 — 속도나 바이어스 없이 키프레임 자세와 랜드마크에 대해서만 수행하는 번들 조정으로, 모든 것을 자유롭게 재선형화할 수 있다. 롤-피치 팩터는 전역 맵을 중력 방향에 정렬된 상태로 유지하고, 상대 자세 팩터는 특징 매칭이 없는 구간을 잇는다.

## 실험 결과

EuRoC에서(RMS ATE, 400프레임 이상 누락된 V2_03 제외): 오도메트리 방법들 중 VIO 계층이 10개 시퀀스 중 8개에서 최고 — 예를 들어 MH_01–05에서 0.07 / 0.06 / 0.07 / 0.13 / 0.11 m, V1_01–V2_02에서 0.04 / 0.05 / 0.10 / 0.04 / 0.05 m — VI-DSO(5개에서 최고)와 대등하며 OKVIS와 VINS-Fusion을 확실히 앞선다. 전체 매핑 시스템은 0.02–0.10 m에 도달하며, 특히 키프레임 간격이 큰 machine-hall 시퀀스(MH_04: 0.10 대 0.22 m)와, 순수 BA가 실패하고 단위 가중치 팩터를 사용한 BA가 0.56 m로 저하되는 V1_03(0.03 m)의 추적에서 VI ORB-SLAM을 능가한다 — 이는 팩터 토폴로지뿐 아니라 KLD로 복구된 가중치 자체가 중요함을 보여준다. 시간(Intel E5-1620): VIO는 프레임당 평균 7.83 ms, 프레임의 ~11.5%가 키프레임이 되며, 매핑은 키프레임당 52.8 ms; MH_05(2273 스테레오 프레임, 114초)는 VIO 19.2초 + 매핑 9.7초로 처리되어 실시간보다 ~4배 빠르며, 단순 IMU 적분보다 전역 상태가 2.5배 작다.

## SLAM에서의 의미

Basalt는 모든 VIO-플러스-매핑 시스템이 직면하는 질문—선형화 지점을 고정하거나 원시 측정값을 유지하지 않으면서 오도메트리 정보를 전역 최적화로 전달하는 방법—에 대해 원칙적인 답을 주었다. "오도메트리에서 무엇을 유지할 것인가"를 분포 근사 문제(어떤 비선형 팩터가 누적된 정보를 가장 잘 근사하는가)로 정식화한 것은 이 아이디어를 전이 가능하게 만들었다 — OKVIS2의 주변화된 랜드마크를 포즈 그래프 에지로 다루는 방식을 비롯한 이후 시스템에 영향을 주었다 — 그리고 그 고품질 오픈 소스 구현은 EuRoC와 TUM-VI에서 흔히 사용되는 고정확도 기준선이다.

## 실습

- [Basalt-VIO 실행하기](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/basalt)

## 관련 문서

- [OKVIS](okvis.md) — Basalt가 겨냥하는 주변화 취약점을 가진 슬라이딩 윈도우 아키텍처.
- [Marginalization](../level-02-getting-familiar/marginalization.md) — 근본 메커니즘과 그 선형화 함정.
- [DM-VIO](dm-vio.md) — 동일한 불일치 문제에 대한 또 다른 해법(지연된 주변화).
- [OKVIS2](okvis2.md) — 재활성화 가능한 주변화 정보를 가진 차세대 시스템.
- [VI-DSO](vi-dso.md) — 논문의 평가에서 가장 근접한 VIO 경쟁자.
- [Camera models beyond pinhole](../level-01-beginner/camera-models-beyond-pinhole.md) — Basalt의 오픈 소스 구현에서 사용된 어안 모델에 대한 배경.
