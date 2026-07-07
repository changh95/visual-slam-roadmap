# DETR

> Carion 2020 · [논문](https://arxiv.org/abs/2005.12872)

**한 줄 요약** — 객체 검출을 이분 매칭(bipartite matching) 손실을 가진 Transformer 인코더-디코더로 풀리는 직접적 집합 예측(set prediction) 문제로 공식화하여, 앵커, NMS, 수작업으로 설계된 검출 파이프라인을 제거한다.

## 문제

Faster R-CNN이나 YOLO 같은 고전적 검출기는 진정한 종단간(end-to-end) 방식이 아니다: 검출 태스크에 대한 사전 지식을 명시적으로 인코딩하는 수작업 설계 구성 요소들 — 앵커 생성, non-maximum suppression(NMS), 다단계 proposal 파이프라인 — 에 의존하며 각각 튜닝이 필요하다. 이런 구성 요소들이 존재하는 이유는 네트워크가 사후에 중복 제거되어야 하는 거의 동일한 후보 박스들을 다수 만들어내기 때문이다. DETR은 검출을 명확한 *집합 예측* 문제로 다룰 수 있는지를 묻는다: 이미지를 입력받아, 하나의 손실로 학습된 하나의 네트워크에서 (박스, 클래스) 쌍의 집합을 출력하며, 중복은 사후 처리가 아니라 학습 목표 자체에 의해 억제된다.

## 방법 및 아키텍처

세 가지 구성 요소가 순차적으로 연결된다: **CNN backbone**(ResNet-50/101)이 특징 맵을 추출하고, 이는 flatten되어 고정된 positional encoding이 더해진다; **Transformer 인코더**(기본 모델에서 6개 레이어, 너비 256, 8개 헤드)가 모든 공간적 위치에 대해 전역 self-attention을 적용한다; **Transformer 디코더**는 $N$개의 학습된 임베딩 — *object query* — 을 self-attention과 인코더-디코더 cross-attention을 통해 변환하며, $N$개의 객체를 모두 **병렬로**(자기회귀적이지 않게) 디코딩한다; 마지막으로 공유되는 **feed-forward 네트워크**가 각 출력 임베딩을 정규화된 박스 좌표 $b \in [0,1]^4$와 클래스 레이블(특별한 "객체 없음" 클래스 $\varnothing$ 포함)로 매핑한다. $N$은 고정되어 있고 일반적인 객체 개수보다 훨씬 크다. 각 디코더 레이어 뒤에 적용되는 보조 Hungarian 손실이 학습을 돕는다.

**이분 매칭(bipartite matching).** 학습은 먼저 $N$개의 예측과 패딩된 ground-truth 집합 사이에서 비용이 가장 낮은 일대일 할당을 찾는다:

$$\hat{\sigma} = \arg\min_{\sigma \in \mathfrak{S}_N} \sum_{i}^{N} \mathcal{L}_{\text{match}}\big(y_i, \hat{y}_{\sigma(i)}\big),$$

Hungarian 알고리즘으로 계산되며, $y_i = (c_i, b_i)$에 대해 매칭 비용은 $-\mathbf{1}_{\{c_i \neq \varnothing\}}\, \hat{p}_{\sigma(i)}(c_i) + \mathbf{1}_{\{c_i \neq \varnothing\}}\, \mathcal{L}_{\text{box}}\big(b_i, \hat{b}_{\sigma(i)}\big)$이다.

**Hungarian 손실.** 최적 할당이 주어지면, 손실은 클래스 예측에 대한 negative log-likelihood와 매칭된 쌍에 대한 박스 손실의 합이다:

$$\mathcal{L}_{\text{Hungarian}}(y, \hat{y}) = \sum_{i=1}^{N} \Big[ -\log \hat{p}_{\hat{\sigma}(i)}(c_i) + \mathbf{1}_{\{c_i \neq \varnothing\}}\, \mathcal{L}_{\text{box}}\big(b_i, \hat{b}_{\hat{\sigma}(i)}\big) \Big],$$

클래스 불균형을 위해 $\varnothing$의 log-확률은 10배 낮게 가중된다. 박스는 (앵커에 대한 델타가 아니라) 직접 예측되기 때문에 순수한 $\ell_1$ 손실은 스케일이 잘 맞지 않게 되므로, 박스 손실은 $\ell_1$과 스케일 불변인 generalized IoU를 결합한다: $\mathcal{L}_{\text{box}} = \lambda_{\text{iou}}\, \mathcal{L}_{\text{iou}}\big(b_i, \hat{b}_{\sigma(i)}\big) + \lambda_{\text{L1}}\, \lVert b_i - \hat{b}_{\sigma(i)} \rVert_1$이다. 일대일 매칭은 학습 중 중복 예측에 큰 비용을 부과하므로 — 추론 시에는 NMS가 필요 없다.

**Panoptic 확장.** 디코더 출력 위에 마스크 헤드를 추가하고 마스크 점수에 대해 픽셀별 argmax를 취하면, 중첩 휴리스틱 없이 "thing"과 "stuff"를 통합한 panoptic 세그멘테이션을 얻는다.

## 실험 결과

- COCO val에서 DETR(ResNet-50, 4100만 파라미터, 86 GFLOPS, 28 FPS)은 **42.0 AP**에 도달하여, 세밀하게 튜닝된 Faster R-CNN-FPN+ baseline(42.0 AP, 4200만 파라미터)과 대등하다 — 이는 큰 물체 검출에서 훨씬 우수한 성능($\text{AP}_L$ 61.1 대 53.4)으로 달성되었지만 작은 물체에서는 뒤처진다($\text{AP}_S$ 20.5 대 26.6). DETR-DC5-R101은 44.9 AP에 도달한다.
- 학습에는 500 epoch가 필요했다(400 epoch에서 lr drop); 긴 스케줄은 짧은 스케줄보다 1.5 AP를 더한다. Ablation: 인코더를 제거하면 전체적으로 3.9 AP, 큰 물체에서는 6.0 AP를 잃는다 — 전역 self-attention이 실제로 중요한 역할을 하고 있다는 뜻이다.
- Panoptic 세그멘테이션: DETR-R101은 COCO val에서 **45.1 PQ**를 얻는데, 동일한 augmentation으로 재학습된 PanopticFPN++ baseline은 44.1이다 — 특히 stuff 클래스에서 우세하다($\text{PQ}^{\text{st}}$ 37.0 대 33.6), COCO test에서는 46 PQ.
- 출시 당시의 주요 약점 — 느린 수렴과 작은 물체 AP — 는 후속 연구(Deformable DETR, DINO, RT-DETR)에서 해결되었으며, 이분 매칭 집합 손실은 어떤 집합-대-집합 예측 태스크에도 쓰이는 표준 도구가 되었다.

## SLAM에서의 의미

DETR은 객체 검출에서 Transformer의 시대를 열었으며, 그 후속작들(RT-DETR, DINO, Grounding DINO)은 현대의 시맨틱/객체 수준 SLAM 시스템이 기반으로 삼는 검출기들이다. 이분 매칭 아이디어는 어떤 집합-대-집합 예측 문제에도 일반화되며 — keypoint, segment, 객체 landmark — 학습된 SLAM 프론트엔드에서 반복적으로 등장한다. SLAM 시스템이 시맨틱 매핑, 동적 물체 필터링, 또는 scene graph를 위해 객체 검출이 필요할 때, 그 검출기는 매우 자주 DETR 계열 모델이다.

## 관련 문서

- [RT-DETR](rt-detr.md) — YOLO급 검출기를 능가하는 실시간 DETR 변형
- [Grounding DINO](grounding-dino.md) — 개방형 어휘, 텍스트 프롬프트 기반 DETR 후속작
- [YOLO](yolo.md) — DETR과 대조되는 고전적 실시간 검출기 계열
- [SAM](sam.md) — DETR 계열 검출기와 자주 함께 쓰이는 프롬프트 가능한 세그멘테이션
