# OpenScene

> Peng (ETH) 2023 · [논문](https://arxiv.org/abs/2211.15654)

**한 줄 요약** — 2D 비전-언어 특징을 역투영하여 3D 네트워크로 증류함으로써 3D 포인트 클라우드에 대한 밀집한 포인트별 CLIP 공간 특징을 예측하며, 레이블이 있는 3D 데이터 없이도 제로샷, 작업 무관 오픈 어휘 3D 장면 이해를 가능하게 합니다.

## 문제

전통적인 3D 장면 이해는 레이블이 있는 3D 데이터셋에 의존하여 작업마다 하나의 모델을 감독 학습으로 훈련합니다: 모든 작업은 각자의 값비싼 3D 어노테이션을 필요로 하고, 모든 모델은 사전 정의된 카테고리 목록에 고정됩니다. 한편, 인터넷 규모 데이터로 학습된 2D 비전-언어 모델은 이미지와 텍스트를 이미 공유된 공간에 임베딩합니다. OpenScene은 다음을 묻습니다: 3D 포인트를 그 동일한 CLIP 특징 공간에 임베딩할 수 있다면, 하나의 비지도 표현이 물체, 재질, 어포던스, 활동, 방 종류 등 *어떤* 쿼리에도 쿼리 시점에 응답할 수 있지 않을까?

## 방법 및 아키텍처

포인트 클라우드 $\mathbf{P} \in \mathbb{R}^{M \times 3}$와 포즈가 있는 RGB 이미지가 주어지면, 세 단계로 포인트별 CLIP 공간 특징을 생성합니다:

1. **이미지 특징 융합 (2D → 3D).** 동결된 2D 비전-언어 분할 모델 $\mathcal{E}^{\text{2D}}$ (OpenSeg 또는 LSeg)가 픽셀별 임베딩 $\mathbf{I}_i \in \mathbb{R}^{H \times W \times C}$를 산출합니다. 각 표면 점 $\mathbf{p}$는 핀홀 모델 $\tilde{\mathbf{u}} = I_i \cdot E_i \cdot \tilde{\mathbf{p}}$를 통해 (깊이 기반 가림 테스트와 함께) 프레임 $i$로 투영되며, 그 점이 보이는 $K$개 뷰의 특징을 평균 풀링하여 하나의 융합 특징 $\mathbf{f}^{\text{2D}} = \phi(\mathbf{f}_1, \cdots, \mathbf{f}_K)$를 얻고, 이로써 특징 클라우드 $\mathbf{F}^{\text{2D}} \in \mathbb{R}^{M \times C}$가 만들어집니다.
2. **3D 증류.** 희소 컨볼루션 기반 MinkowskiNet18A $\mathcal{E}^{\text{3D}}$가 기하학만으로 그 특징들을 예측하도록 학습됩니다,

$$\mathbf{F}^{\text{3D}} = \mathcal{E}^{\text{3D}}(\mathbf{P}), \qquad \mathcal{E}^{\text{3D}} : \mathbb{R}^{M \times 3} \mapsto \mathbb{R}^{M \times C},$$

   코사인 증류 손실로 학습됩니다

$$\mathcal{L} = 1 - \cos\big(\mathbf{F}^{\text{2D}}, \mathbf{F}^{\text{3D}}\big),$$

   따라서 새로운 포인트 클라우드는 이미지 없이도 임베딩될 수 있습니다.
3. **2D–3D 앙상블.** 융합된 2D 특징은 작거나 기하학적으로 모호한 물체 (컵, 그림)에서 우수하며, 증류된 3D 특징은 형태가 뚜렷한 것 (벽, 바닥)에서 우수합니다. 각 점에 대해, 두 특징 모두 쿼리 집합의 CLIP 텍스트 임베딩 $\mathbf{t}_n$과 비교되어 채점됩니다 ($\mathbf{s}^{\text{2D}}_n = \cos(\mathbf{f}^{\text{2D}}, \mathbf{t}_n)$, $\mathbf{s}^{\text{3D}}_n = \cos(\mathbf{f}^{\text{3D}}, \mathbf{t}_n)$), 그리고 $\max_n$ 점수가 더 높은 특징이 $\mathbf{f}^{\text{2D3D}}$가 됩니다.

**추론**은 순수한 코사인 유사도입니다: 제로샷 분할은 각 점에 $\arg\max_n \cos(\mathbf{f}^{\text{2D3D}}, \mathbf{t}_n)$로 레이블을 붙이고, 임의의 오픈 어휘 텍스트는 동일한 방식으로 관련성 히트맵을 생성합니다. 학습 어디에서도 2D나 3D 실측 레이블은 사용되지 않습니다.

## 실험 결과

- **제로샷 3D 의미론적 분할** (ScanNet, 미관측 4개 클래스, 3DGenZ의 프로토콜): OpenScene-LSeg는 **62.8 mIoU**에 도달하는 반면 3DGenZ는 7.7입니다 — 3DGenZ는 나머지 16개 클래스에 대해 실측 레이블로 학습함에도 그렇습니다. OpenScene-OpenSeg는 83.7 mAcc에 도달합니다.
- **전체 벤치마크** (전체 클래스, mIoU/mAcc): Ours-OpenSeg는 ScanNet val에서 47.5/70.7, Matterport3D test에서 42.6/59.2, nuScenes val에서 42.1/61.8을 얻어 — 어디서나 제로샷 MSeg-Voting 기준선 (45.6/54.4, 33.4/39.0, 31.0/36.9)을 능가하며 "몇 년 전의 감독 학습 접근법과 대등"합니다; Matterport3D에서는 완전 감독 학습 SOTA와의 격차가 -11.6 mIoU / -8.0 mAcc에 불과합니다.
- **롱테일 확장성** (K개의 가장 빈번한 클래스에 대한 Matterport3D mAcc): 완전 감독 학습된 MinkowskiNet은 K가 21에서 160으로 갈 때 64.5 → 18.4로 하락하지만, 단일한 고정 OpenScene 모델은 59.2 → 23.1로 가서 K ≥ 40에서 감독 학습을 앞지릅니다 (K=40에서 50.9 대 50.8).
- **어블레이션**: 2D–3D 앙상블은 모든 데이터셋/지표에서 둘 중 어느 한 브랜치만보다 우수합니다 (예: OpenSeg ScanNet 47.5/70.7 대 융합-2D만 41.4/63.6, 증류-3D만 46.0/66.3); 점의 약 70%가 3D 특징을 선택하며, 레이블 집합이 롱테일화될수록 2D의 비율이 증가합니다.
- 재질, 어포던스, 활동, 방 종류에 대한 3D 장면 오픈 어휘 쿼리를 단일 모델과 레이블이 있는 3D 데이터 없이 최초로 시연했습니다.

## SLAM에서의 의미

OpenScene은 인터넷 규모의 2D 비전-언어 지식이 3D 지도로 전이될 수 있음을 보였습니다 — 이는 언어에 기반한 공간 AI (spatial AI)의 핵심 구성 요소입니다. SLAM에 있어 이는 고정된 레이블 집합이 아니라 자유 형식 언어로 쿼리되는 지도를 시사합니다: 융합 후 증류 (픽셀 특징을 기하학에 투영한 후 3D 네트워크가 이를 예측하도록 학습)라는 레시피는 ConceptFusion, ConceptGraphs, LERF에서 채택되었으며, 로봇 매핑 스택에 점점 더 요구되는 능력입니다.

## 관련 문서

- [ConceptFusion](conceptfusion.md)
- [LERF](lerf.md)
- [ConceptGraphs](../level-05-deep-learning/conceptgraphs.md)
- [CLIP](../level-11-world-models-spatial-ai/clip.md)
- [SpatialLM](spatiallm.md)
