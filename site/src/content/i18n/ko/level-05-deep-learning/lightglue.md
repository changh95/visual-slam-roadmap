# LightGlue

> Lindenberger 2023 · [논문](https://arxiv.org/abs/2306.13643)

**한 줄 요약** — 적응적 깊이와 너비를 통해 훨씬 더 빨라진, 재설계된 SuperGlue: 쉬운 이미지 쌍은 조기에 네트워크를 빠져나오고, 확신 있게 매칭되거나 거부된 keypoint는 이후 계산에서 제거된다.

## 문제

SuperGlue는 학습된 희소 매칭을 state of the art로 확립했지만, *고정된* 연산 예산을 소비한다: 모든 keypoint는 이미지 쌍이 얼마나 쉬운지와 무관하게 모든 레이어를 통과하며, Sinkhorn optimal-transport head는 비용이 크고 학습하기가 유난히 어렵다 — 후속 연구들은 원래 모델의 성능에 도달하지 못했다. LightGlue는 SuperGlue의 설계 결정들을 하나씩 재검토하여 단순하지만 효과적인 개선을 이끌어내고, 각 쌍의 난이도에 맞춰 추론을 적응적으로 만든다.

## 방법 및 아키텍처

이미지 $A$와 $B$로부터 얻은 지역 특징(정규화된 위치 $\mathbf{p}_i \in [0,1]^2$, descriptor $\mathbf{d}_i \in \mathbb{R}^d$, $d{=}256$)이 주어지면, LightGlue는 $L = 9$개의 동일한 레이어를 쌓으며, 각 레이어는 self-attention 하나 + cross-attention 하나(4개 head)로 point별 상태 $\mathbf{x}_i$(초기값 $\mathbf{d}_i$)를 갱신한다:

$$ \mathbf{x}^{I}_{i} \leftarrow \mathbf{x}^{I}_{i} + \mathrm{MLP}\big(\big[\mathbf{x}^{I}_{i} \,\Vert\, \mathbf{m}^{I\leftarrow S}_{i}\big]\big) $$

여기서 $\mathbf{m}^{I\leftarrow S}_i$는 source 이미지 $S$의 상태에 대한 attention 가중 평균이다.

- **상대적 rotary 위치 인코딩(self-attention):** $a_{ij} = \mathbf{q}_i^\top\, \mathbf{R}(\mathbf{p}_j - \mathbf{p}_i)\, \mathbf{k}_j$, 여기서 $\mathbf{R}$은 학습된 basis로의 사영을 통해 $d/2$개의 2D 부분공간을 회전시킨다 — 오직 *상대적* 위치만을 포착하며(in-plane 카메라 이동에 대해 equivariant), SuperGlue의 절대적 MLP 인코딩(네트워크가 잊어버리는 경향이 있음) 대신 매 레이어에 적용된다.
- **양방향 cross-attention:** query 없이 key만 사용: $a^{IS}_{ij} = \mathbf{k}_i^{I\top} \mathbf{k}_j^{S} = a^{SI}_{ji}$, 따라서 $O(NMd)$ 유사도가 양방향에 대해 한 번만 계산된다(실행 시간 20% 절감).
- **Sinkhorn + dustbin 대신 경량 head:** pairwise 유사도 $\mathbf{S}_{ij} = \mathrm{Linear}(\mathbf{x}_i^A)^\top \mathrm{Linear}(\mathbf{x}_j^B)$는 point별 매칭 가능성 $\sigma_i = \mathrm{Sigmoid}(\mathrm{Linear}(\mathbf{x}_i))$와 *분리*되며, 다음과 같이 결합된다

$$ \mathbf{P}_{ij} = \sigma_i^A\, \sigma_j^B\, \mathrm{Softmax}_{k \in \mathcal{A}}(\mathbf{S}_{kj})_i\, \mathrm{Softmax}_{k \in \mathcal{B}}(\mathbf{S}_{ik})_j $$

  대응점은 $\mathbf{P}_{ij}$가 임계값을 넘고 자신의 행과 열에서 최댓값인 쌍이다 — 상호 최근접 이웃 탐색과 학습된 inlier 분류기의 융합으로, optimal transport보다 훨씬 저렴하다.
- **적응적 깊이(조기 종료):** 각 레이어 뒤에서 소형 MLP가 point별 신뢰도 $c_i = \mathrm{Sigmoid}(\mathrm{MLP}(\mathbf{x}_i))$를 예측하며, $c_i > \lambda_\ell$인 point 비율이 비율 $\alpha$를 넘으면 추론이 멈춘다.
- **적응적 너비(point 제거):** 확신 있고 *동시에* 매칭 불가능한 point는 이후 레이어에서 제거되어 이차 attention 비용을 줄인다.
- **Deep supervision:** head가 저렴하기 때문에, 할당은 *매* 레이어에서 negative log-likelihood로 예측되고 지도된다(매칭 불가능한 집합 $\bar{\mathcal{A}}, \bar{\mathcal{B}}$에 대한 균형 잡힌 매칭 가능성 항 포함); 신뢰도 분류기는 그 이후 어떤 레이어의 매칭이 이미 최종 레이어의 매칭과 같은지를 예측하도록 학습된다.
- **레시피:** 100만 장의 이미지에 대한 합성 homography로 사전학습한 뒤 MegaDepth로 미세조정; 이미지당 2천 개의 point, gradient checkpointing + mixed precision으로 24GB GPU 한 대에 32개 쌍을 맞춘다 — 며칠의 GPU 시간 안에 state-of-the-art 정확도를 달성한다.

## 실험 결과

- **MegaDepth-1500 상대 pose (SuperPoint 특징, 2048개 keypoint):** LightGlue RANSAC AUC@5°/10°/20° = 49.9/67.0/80.1, 44.2 ms — SuperGlue의 49.7/67.1/80.6, 70.0 ms 대비 우수; LO-RANSAC 사용 시 66.7/79.3/87.9 vs 65.8/78.7/87.5. 적응형 변형은 31.4 ms에서 49.4/67.2/80.1을 유지한다 — SuperGlue와 SGMNet보다 2배 이상 빠르고, 밀집 매처(LoFTR 181 ms, ASpanFormer 369 ms)보다 5–11배 빠르다.
- **HPatches homography:** 희소 매처 중 최고 정밀도(P 88.9 vs SuperGlue 87.4)와 최고 DLT AUC(35.9/78.6 @1/5px).
- **Aachen Day-Night localization (hloc, 4096개 keypoint):** 주간 90.2/96.0/99.4, 야간 77.0/91.1/100 — SuperGlue(주간 89.8/96.1/99.4, 야간 77.0/90.6/100)와 동등하면서 17.3 대 6.4 pair/s (약 2.5배; 최적화된 flash-attention 변형에서는 4배로, 4096개 keypoint를 실시간으로 매칭).
- **Ablation (동일한 homography 학습):** LightGlue는 정밀도 86.8 / 재현율 96.3을 19.4 ms에 달성하는 반면 SuperGlue는 74.6/90.5를 29.1 ms에 달성한다(+12% 정밀도, +4% 재현율), 그리고 수렴도 훨씬 빠르다.
- **적응성:** 쉬운 쌍은 9개 레이어 중 평균 약 4.7개 만에 빠져나가 1.86배 속도 향상을 얻으며, 어려운 쌍도 여전히 point의 약 28%를 제거한다. IMC 2021에서 DISK(8K)+LightGlue가 1위를 차지한다(평균 AUC@5°/10° = 58.8/70.0).

## SLAM에서의 의미

SuperGlue는 학습된 매칭이 최근접 이웃 + ratio test보다 더 강인함을 입증했지만, 고정된 연산 예산 때문에 실시간 SLAM에는 부담스러웠다. LightGlue의 통찰 — 연산량을 문제 난이도에 비례해서 쓰고, overlap이 큰 tracking 프레임에는 저렴하게, wide-baseline loop closure에는 깊게 쓴다 — 는 학습된 매칭을 지연에 민감한 파이프라인에서도 실용적으로 만들었으며, hloc 위치추정 툴박스에서 기본 매처로 SuperGlue를 대체했다. 오늘날 현대적인 특징 기반 SLAM이나 재위치추정 파이프라인을 구축한다면, SuperPoint(또는 DISK/SIFT) + LightGlue가 표준적인 출발점이다.

## 관련 문서

- [SuperGlue](superglue.md) — 이를 가속한 전신
- [SuperPoint](superpoint.md) — 가장 흔히 짝을 이루는 특징
- [DISK](disk.md) — LightGlue를 네이티브로 지원하는 대안 특징 backbone
- [LoFTR](loftr.md) — 검출기 없는 밀집 대안
- [XFeat](xfeat.md) — 동일한 효율성 목표를 가진 경량 특징
- [hloc](hloc.md) — 이제 이것이 기본 매처가 된 위치추정 툴박스
