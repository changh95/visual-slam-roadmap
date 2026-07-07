# SuperGlue

> Sarlin 2020 · [논문](https://arxiv.org/abs/1911.11763)

**한 줄 요약** — self-attention과 cross-attention, 그리고 (매칭되지 않은 점을 위한 dustbin을 가진) 미분 가능한 Sinkhorn 최적 운송을 사용하여 취약한 최근접 이웃 매칭을 대체하는 Graph Neural Network 특징 매처입니다.

## 문제

고전적 특징 매칭은 수작업으로 설계된 휴리스틱의 파이프라인입니다: 디스크립터 공간에서의 최근접 이웃 탐색, ratio test, 상호(mutual) 검사, 그리고 정리를 위한 RANSAC. 각 디스크립터는 독립적으로 비교됩니다 — 다른 keypoint에 대한, 장면의 기하학에 대한, 또는 어떤 점이 단순히 다른 이미지에 *보이지 않는지*에 대한 추론이 전혀 없습니다. 강한 시점 변화, 반복적인 구조, 또는 부분적인 겹침 아래에서는 이것이 무너집니다. SuperGlue는 매칭 자체를 학습 가능한 최적화 문제로 재구성합니다: 대응점을 찾는 것*과* 매칭 불가능한 점을 거부하는 것을 함께 수행하며, 두 가지 물리적 제약을 활용합니다 — keypoint는 최대 하나의 대응점을 가지며, 일부 keypoint는 가림이나 검출기 실패로 인해 매칭되지 않습니다.

## 방법 및 아키텍처

$M$개와 $N$개의 지역 특징(검출 신뢰도 $c$를 가진 위치 $\mathbf{p}_i := (x, y, c)_i$, 그리고 디스크립터 $\mathbf{d}_i \in \mathbb{R}^D$, 예를 들어 SuperPoint 또는 SIFT)을 가진 이미지 $A, B$가 주어지면, SuperGlue는 $\mathbf{P}\mathbf{1}_N \leq \mathbf{1}_M$과 $\mathbf{P}^\top \mathbf{1}_M \leq \mathbf{1}_N$을 만족하는 부분 소프트 할당(partial soft assignment) $\mathbf{P} \in [0,1]^{M \times N}$을 예측합니다. 두 개의 블록으로 구성됩니다:

**1. Attentional Graph Neural Network.** Keypoint 인코더가 위치를 디스크립터에 임베딩하여 외관과 배치가 함께 추론될 수 있게 합니다:

$$ {}^{(0)}\mathbf{x}_i = \mathbf{d}_i + \mathrm{MLP}_{\mathrm{enc}}(\mathbf{p}_i) $$

두 이미지의 모든 keypoint는 자기 엣지(이미지 내부)와 교차 엣지(이미지 간)를 가진 하나의 완전한 *멀티플렉스* 그래프를 형성합니다. 자기 엣지와 교차 엣지를 교대로 사용하는 잔차(residual) 메시지 전달 업데이트가 $L$개의 레이어에 걸쳐 실행됩니다:

$$ {}^{(\ell+1)}\mathbf{x}_i^A = {}^{(\ell)}\mathbf{x}_i^A + \mathrm{MLP}\big(\big[{}^{(\ell)}\mathbf{x}_i^A \,\Vert\, \mathbf{m}_{\mathcal{E}\rightarrow i}\big]\big) $$

메시지는 attentional 집계입니다: $\mathbf{m}_{\mathcal{E}\rightarrow i} = \sum_{j} \alpha_{ij} \mathbf{v}_j$, 가중치는 엣지 집합에 대해 $\alpha_{ij} = \mathrm{Softmax}_j(\mathbf{q}_i^\top \mathbf{k}_j)$입니다 — self-attention은 keypoint가 자신의 이미지 안에서 두드러진 점에 주목할 수 있게 하고, cross-attention은 다른 이미지 안의 후보 매칭점에 주목할 수 있게 합니다. 최종 매칭 디스크립터는 선형 사영입니다: $\mathbf{f}_i^A = \mathbf{W}\,{}^{(L)}\mathbf{x}_i^A + \mathbf{b}$.

**2. 최적 매칭 레이어.** 쌍별 점수는 내적입니다: $\mathbf{S}_{i,j} = \langle \mathbf{f}_i^A, \mathbf{f}_j^B \rangle$. 점수 행렬은 단일 학습 가능한 스칼라 $z$로 채워진 dustbin 행과 열로 증강되어, 가려지거나 검출되지 않은 점들이 명시적으로 할당됩니다. 엔트로피 정규화된 최적 운송 문제는 $T$번의 미분 가능한 Sinkhorn 반복($\exp(\bar{\mathbf{S}})$의 반복적 행/열 정규화)으로 풀려 $\bar{\mathbf{P}}$를 산출합니다; dustbin을 제외하면 $\mathbf{P}$가 복원됩니다.

**지도(Supervision).** 실측 매칭 $\mathcal{M}$(포즈 + 깊이 또는 homography로부터)과 매칭되지 않은 집합 $\mathcal{I}, \mathcal{J}$에 대한 negative log-likelihood:

$$ \mathrm{Loss} = -\sum_{(i,j)\in\mathcal{M}} \log \bar{\mathbf{P}}_{i,j} - \sum_{i\in\mathcal{I}} \log \bar{\mathbf{P}}_{i,N+1} - \sum_{j\in\mathcal{J}} \log \bar{\mathbf{P}}_{M+1,j} $$

**세부 사항:** $D = 256$, 4-head attention의 $L = 9$개 레이어, $T = 100$번의 Sinkhorn 반복, 1200만 파라미터; forward pass는 GTX 1080 GPU에서 실내 이미지 쌍당 평균 69ms(15 FPS)입니다. 테스트 시 매칭 신뢰도 임계값 0.2.

## 실험 결과

- **Homography 추정**(Oxford/Paris 100만 장 방해 이미지에 대한 합성 homography): 재현율 98.3%, 정밀도 90.7%; 일반 DLT를 사용한 AUC 65.85 대 RANSAC을 사용한 53.67 — 대응점이 너무 깔끔해서 강건하지 않은(non-robust) 최소제곱 솔버가 RANSAC을 능가합니다. NN 매칭은 DLT AUC 0.00을 얻습니다; OANet은 52.29.
- **실내 포즈(ScanNet, 1500개의 wide-baseline 테스트 쌍)**: SuperPoint+SuperGlue 포즈 AUC@5°/10°/20° = 16.16/33.81/51.84, SuperPoint+OANet은 11.76/26.90/43.85, NN+mutual은 9.43/21.53/36.40; 정밀도 84.4%. SIFT를 사용하면: 6.71/15.70/28.67, ratio-test 매칭보다 최대 10배 더 많은 정확한 매칭.
- **실외 포즈(PhotoTourism)**: SuperPoint+SuperGlue AUC@5°/10°/20° = 34.18/50.32/64.16 대 OANet의 21.03/34.08/46.88; 정밀도 84.9%. SIFT+SuperGlue는 23.68/36.44/49.44 대 ratio test의 15.19/24.72/35.30.
- **Ablation:** GNN이 대부분의 성능 향상을 설명합니다; SuperPoint 디스크립터로 역전파하면 AUC@20°가 51.84에서 53.38로 상승하여, 종단간 학습으로 가는 경로를 보여줍니다.

## SLAM에서의 의미

SuperGlue는 어려운 데이터 연관 문제를 위한 프론트엔드 방법론을 바꾸었습니다: SuperPoint + SuperGlue는 시각적 위치 인식, wide-baseline 루프 클로저, 그리고 hloc 파이프라인을 통한 매핑의 지배적인 기준선이 되었습니다. SLAM에서 특히, 이는 디스크립터 거리 매칭이 무너지는 낮/밤 및 강한 시점 변화 전반에서 재위치추정(relocalization)이 동작하도록 만들었습니다. 논문 자체는 이 학습 가능한 미들엔드를 "종단간 딥 SLAM을 향한 중요한 이정표"라고 표현합니다. 매 프레임마다 모든 keypoint에 대해 전체 attention을 수행하는 비용은 실시간 환경에서 이제 표준이 된 효율적인 후속작 LightGlue를 낳았습니다.

## 관련 문서

- [SuperPoint](superpoint.md) — 보통 함께 매칭하는 검출기/디스크립터
- [LightGlue](lightglue.md) — 더 빠른 적응형 후속작
- [LoFTR](loftr.md) — 검출기 없는 밀집 대안
- [HF-Net](hf-net.md) — 이를 중심으로 구축된 계층적 위치 인식 파이프라인
- [hloc](hloc.md) — 이것이 표준 매처인 위치 인식 툴박스
