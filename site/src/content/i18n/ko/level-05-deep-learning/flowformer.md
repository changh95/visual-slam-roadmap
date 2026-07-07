# FlowFormer

> Huang 2022 · [논문](https://arxiv.org/abs/2203.16194)

**한 줄 요약** — 4D cost volume을 중심으로 구축된 최초의 optical flow Transformer 아키텍처입니다: cost volume을 토큰화하고, 이를 alternate-group attention으로 잠재적인 "cost memory"로 인코딩한 후, 동적 위치 cost query를 사용하여 flow를 반복적으로 디코딩합니다.

## 문제

Optical flow는 각 원본 이미지 위치 $\mathbf{x}$를 대응하는 목표 이미지 위치 $\mathbf{p}=\mathbf{x}+\mathbf{f}(\mathbf{x})$로 매핑하는 픽셀별 변위 필드 $\mathbf{f}:\mathbb{R}^{2}\rightarrow\mathbb{R}^{2}$를 추정합니다. RAFT는 모든 쌍의 유사도로 이루어진 $H \times W \times H \times W$ 4D cost volume을 구축하지만, 지역적 윈도우에서만 cost를 조회하기 때문에 큰 변위와 occlusion에서 어려움을 겪습니다. Transformer는 전역적 추론을 제공하지만, 수천 개의 cost volume 토큰에 대한 naive self-attention은 계산적으로 감당할 수 없습니다 — Perceiver IO는 대신 원본 픽셀에 대해 attend하며 약 80배 더 많은 학습 데이터를 필요로 합니다. FlowFormer는 콤팩트한 cost volume을 유지하면서도 Transformer 스타일의 전역적 집계를 얻는 방법을 질문합니다.

## 방법 및 아키텍처

3단계로 구성됩니다: 4D cost volume을 구축하고, 이를 cost memory로 인코딩하고, flow를 반복적으로 디코딩합니다.

- **Cost volume**: ImageNet으로 사전 학습된 Twins-SVT backbone의 처음 두 단계가 $H \times W \times D_f$ 특징 ($D_f{=}256$, 1/8 해상도)을 추출합니다. 모든 원본/목표 특징 쌍 간의 내적 유사도가 $H \times W \times H \times W$ 볼륨을 형성하며, 이는 원본 픽셀 $\mathbf{x}$마다 하나의 2D cost map $\mathbf{M_x} \in \mathbb{R}^{H \times W}$로 볼 수 있습니다.
- **2단계 토큰화**: 각 cost map은 세 개의 stride-2 컨볼루션에 의해 $8{\times}8$ 패치 특징 $\mathbf{F_x}$ ($D_p{=}64$ 채널)로 패치화된 후, 학습된 codeword $\mathbf{C}\in\mathbb{R}^{K\times D}$ (모든 픽셀에 공유되고 역전파로 학습됨)에 의해 $K$개의 잠재 토큰으로 요약됩니다:

$$\mathbf{K_x}=\mathrm{Conv}_{1\times 1}(\mathrm{Concat}(\mathbf{F_x},\mathrm{PE})),\quad \mathbf{V_x}=\mathrm{Conv}_{1\times 1}(\mathrm{Concat}(\mathbf{F_x},\mathrm{PE})),\quad \mathbf{T_x}=\mathrm{Attention}(\mathbf{C},\mathbf{K_x},\mathbf{V_x})$$

  이는 4D 볼륨을 $H \times W \times K$ 토큰 그리드로 변환합니다 ($K \times D \ll H \times W$; 최종 모델에서는 128차원의 토큰 8개).
- **Alternate-Group Transformer (AGT) 레이어** (최종 모델에서 3개)는 두 개의 직교하는 그룹화를 번갈아 적용합니다: 각 픽셀의 $K$개 토큰에 대한 *intra-cost-map* self-attention, $\mathbf{T_x}=\mathrm{FFN}(\mathrm{SelfAttention}(\mathbf{T_x}(1),\dots,\mathbf{T_x}(K)))$, 그리고 $K$개 그룹 각각의 $H \times W$개 토큰에 대한 (Twins의) *inter-cost-map* spatially-separable self-attention, $\mathbf{T}_i=\mathrm{FFN}(\mathrm{SSSelfAttention}(\mathbf{T}_i))$이며, 시각적으로 유사한 픽셀이 일관된 flow를 갖도록 원본 이미지 컨텍스트 특징이 query/key에 주입됩니다. 출력 토큰이 **cost memory**입니다.
- **동적 위치 cost query를 사용한 반복 디코더**: 각 반복에서 현재 flow는 $\mathbf{p}=\mathbf{x}+\mathbf{f}(\mathbf{x})$를 제공합니다; 지역적 $9{\times}9$ cost 패치 $\mathbf{q_x}=\mathrm{Crop}_{9\times 9}(\mathbf{M_x},\mathbf{p})$가 query $\mathbf{Q_x}=\mathrm{FFN}(\mathrm{FFN}(\mathbf{q_x})+\mathrm{PE}(\mathbf{p}))$를 구축하며, 이는 cost memory에 cross-attend합니다, $\mathbf{c_x}=\mathrm{Attention}(\mathbf{Q_x},\mathbf{K_x},\mathbf{V_x})$ (key/value는 한 번 계산되어 재사용됨). ConvGRU가 잔차를 회귀합니다

$$\Delta\mathbf{f}(\mathbf{x})=\mathrm{ConvGRU}(\mathrm{Concat}(\mathbf{c_x},\mathbf{q_x}),\,\mathbf{t_x},\,\mathbf{f}(\mathbf{x}))$$

  flow는 전체 해상도로 convex-upsample되며, 매 반복마다 증가하는 가중치로 지도됩니다.

## 실험 결과

- **Sintel test (C+T+S+K+H)**: 1.159 AEPE clean / 2.088 final — 이전 최고 성능 결과 (warm-start를 사용한 GMA의 1.388 및 2.47)로부터 16.5%와 15.5% 오차 감소로, warm-start 없이 양쪽 pass 모두 1위입니다; warm-start가 없는 GMA와 비교하면 17.2%/27.5% 감소입니다.
- **일반화 (C+T만)**: Sintel train clean/final에서 1.01 / 2.40 AEPE, KITTI-2015 train에서 4.09 F1-epe / 14.72 F1-all — GMA와 비교하여 Sintel clean/final에서 22.3%와 12.4% 낮은 오차, KITTI F1-all에서 13.9% 낮은 오차; 1.01의 clean AEPE는 이전 최고 발표 결과 (1.29)를 21.7% 능가합니다.
- **KITTI-2015 test**: KITTI 미세 조정 후 4.68 F1-all로 2위 (S-Flow의 4.64가 0.85% 낮지만, S-Flow는 Sintel clean/final에서 31.6%/22.5% 더 나쁨).
- ImageNet으로 사전 학습된 transformer backbone이 optical flow 추정에 도움이 됨을 최초로 검증했습니다.

## SLAM에서의 의미

Dense optical flow는 현대의 학습 기반 SLAM front-end (DROID-SLAM, DPVO 계열) 내부의 대응점 엔진이며, FlowFormer는 매칭 cost에 대한 전역적 attention이 wide-baseline 모션에서 가장 중요한 장거리, 모호한 대응점을 해결한다는 것을 입증했습니다 — 이는 정확히 그 cost memory가 목표로 하는 어려운 사례들 (큰 변위, occlusion)입니다. 이는 SLAM 엔지니어가 flow backbone을 선택할 때 고려하는 오늘날의 트레이드오프 — Transformer 정확도 (FlowFormer) 대 합성곱 효율성 (SEA-RAFT) — 중 Transformer 쪽을 확립했습니다.

## 관련 문서

- [RAFT](raft.md) — FlowFormer가 토큰화하는 cost volume의 합성곱 all-pairs 전신
- [SEA-RAFT](sea-raft.md) — 학습 개선을 통해 Transformer에 필적하는 효율성 중심의 대조점
- [FlowNet 2.0](flownet-2-0.md) — deep flow에서의 더 이른 반복적 정제 계보
- [DROID-SLAM](droid-slam.md) — dense 순환 flow를 중심으로 구축된 SLAM 시스템
- [LoFTR](loftr.md) — detector-free 이미지 매칭에 적용된 Transformer attention
