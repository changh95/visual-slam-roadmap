# RT-DETR

> Zhao (Baidu) 2023 · [논문](https://arxiv.org/abs/2304.08069)

**한 줄 요약** — 최초의 실시간 종단간 Transformer 검출기로, YOLO의 속도에 맞먹으면서도 DETR의 깔끔한 NMS 없는 집합 예측을 유지합니다("DETRs Beat YOLOs on Real-time Object Detection").

## 문제

YOLO 시리즈는 합리적인 속도/정확도 트레이드오프를 통해 실시간 검출을 지배하고 있지만, 속도와 정확도 모두 NMS 후처리에 의해 부정적인 영향을 받습니다: 두 개의 임계값(신뢰도와 IoU)을 시나리오별로 튜닝해야 하며, NMS 실행 시간은 박스 개수에 따라 달라집니다. 논문은 이를 정량화합니다 — YOLOv8에서 신뢰도 임계값을 0.001에서 0.05로 옮기면 AP가 52.9%에서 51.2%로 떨어지는 반면 NMS 시간은 2.36ms에서 1.06ms로 줄어듭니다; 앵커 기반 YOLO는 앵커 프리 YOLO보다 약 3배 더 많은 박스를 생성하므로 더 많은 NMS 시간이 필요합니다. 종단간 Transformer 검출기(DETR)는 이분 매칭을 통해 NMS를 제거하지만, 그 연산 비용 — 특히 Deformable-DETR GFLOPs의 49%를 차지하면서 AP에는 11%만 기여하는 다중 스케일 Transformer 인코더 — 때문에 실시간 영역에 들어오지 못했습니다.

## 방법 및 아키텍처

RT-DETR = backbone + 효율적 하이브리드 인코더 + 보조 예측 헤드를 가진 Transformer 디코더. 마지막 세 개의 backbone 스테이지 $\{\mathcal{S}_3, \mathcal{S}_4, \mathcal{S}_5\}$가 인코더에 입력되며, 디코더는 고정된 object query 집합을 (카테고리, 박스) 쌍으로 반복적으로 정제합니다 — 앵커도 없고, NMS도 없습니다.

**효율적 하이브리드 인코더**는 기존의 다중 스케일 인코더가 동시에 수행하던 두 가지 작업을 분리합니다:

- **AIFI**(Attention-based Intra-scale Feature Interaction): 단일 레이어 Transformer self-attention을 최상위 레벨 특징 $\mathcal{S}_5$에만 적용합니다 — 고수준 특징은 서로 관련지을 가치가 있는 의미론적 개념을 담고 있는 반면, 저수준에서의 스케일 내 attention은 중복됩니다(attention을 $\mathcal{S}_5$로 제한하면 variant D가 35% 더 빨라지면서 AP도 +0.4% 향상됩니다).
- **CCFF**(CNN-based Cross-scale Feature Fusion): PANet 스타일의 합성곱 융합 경로로, 융합 블록(두 개의 $1\times1$ 합성곱 + $N$개의 RepBlock, 원소별 합)이 인접 스케일을 병합합니다.

$$\mathcal{Q}=\mathcal{K}=\mathcal{V}=\texttt{Flatten}(\mathcal{S}_5),\quad \mathcal{F}_5=\texttt{Reshape}(\texttt{AIFI}(\mathcal{Q},\mathcal{K},\mathcal{V})),\quad \mathcal{O}=\texttt{CCFF}(\{\mathcal{S}_3,\mathcal{S}_4,\mathcal{F}_5\})$$

**불확실성 최소 query 선택**: 기존 query 선택 방식은 분류 점수만으로 상위 $K$개($K=300$) 인코더 특징을 선택하므로, 위치 추정(localization)이 좋지 않은 특징이 초기 query가 되는 경우가 생깁니다. RT-DETR은 인코더 특징 $\hat{\mathcal{X}}$의 불확실성을 예측된 위치 추정 분포 $\mathcal{P}$와 분류 분포 $\mathcal{C}$ 사이의 불일치로 정의하고, 이를 손실에서 최적화합니다:

$$\mathcal{U}(\hat{\mathcal{X}})=\|\mathcal{P}(\hat{\mathcal{X}})-\mathcal{C}(\hat{\mathcal{X}})\|,\quad \hat{\mathcal{X}}\in\mathbb{R}^{D}$$

$$\mathcal{L}(\hat{\mathcal{X}},\hat{\mathcal{Y}},\mathcal{Y})=\mathcal{L}_{box}(\hat{\mathbf{b}},\mathbf{b})+\mathcal{L}_{cls}(\mathcal{U}(\hat{\mathcal{X}}),\hat{\mathbf{c}},\mathbf{c})$$

여기서 $\hat{\mathbf{c}},\hat{\mathbf{b}}$는 예측된 카테고리와 박스이고, $\mathbf{c},\mathbf{b}$는 실측값(ground truth)입니다. 이는 분류와 IoU 양쪽에서 모두 고품질인 선택된 특징의 비율을 거의 두 배로 늘립니다(두 점수 모두 0.5를 넘는 특징이 0.67% 대 0.30%).

**유연한 속도 조절**: 디코더 레이어들이 동질적이므로, 추론 시 뒤쪽 디코더 레이어를 제거하면 재학습 없이 정확도를 속도와 맞바꿀 수 있습니다 — 예를 들어, 6-레이어 RT-DETR-R50의 레이어 5를 사용하면 AP를 0.1%(53.1 → 53.0) 잃으면서 0.5ms를 줄입니다. 인코더와 디코더의 너비/깊이는 backbone(R18/R34/CSPResNet부터 S/M급 모델까지)에 맞춰 확장됩니다.

## 실험 결과

COCO val2017, T4 GPU에서 TensorRT FP16으로 측정한 속도, 종단간(YOLO의 경우 논문이 제안한 종단간 속도 벤치마크를 통해 NMS 시간 포함):

- **RT-DETR-R50: 53.1% AP, 108 FPS(42M 파라미터); RT-DETR-R101: 54.3% AP, 74 FPS** — YOLOv5/PP-YOLOE/YOLOv6/YOLOv7/YOLOv8의 L/X 모델을 속도와 정확도 양쪽에서 능가합니다(예: YOLOv8-L: 71 FPS에서 52.9% AP; YOLOv8-X: 50 FPS에서 53.9% AP).
- 동일한 backbone을 가진 DETR과 비교: RT-DETR-R50은 DINO-Deformable-DETR-R50을 **+2.2% AP(53.1 대 50.9)로, 약 21배의 FPS(108 대 5)**로 능가합니다.
- 인코더 ablation: 하이브리드 인코더(variant E, 47.9% AP, 9.3ms) 대 결합된 다중 스케일 인코더(variant C, 45.6% AP, 13.3ms) — 분리는 더 빠르면서 더 정확합니다.
- Query 선택 ablation: 불확실성 최소 선택은 기존 점수 기반 선택보다 **+0.8% AP(48.7 대 47.9)** 향상됩니다.
- Objects365 사전 학습을 사용하면: RT-DETR-R50/R101은 **55.3% / 56.2% AP**에 도달합니다.
- 명시된 한계: 소형 객체 AP는 여전히 최고의 YOLO보다 뒤처집니다(RT-DETR-R50은 YOLOv8-L보다 AP-S가 0.5% 낮습니다).

## SLAM에서의 의미

시맨틱 SLAM 프론트엔드는 프레임 속도로 동작하는 객체 검출을 필요로 하며, 역사적으로 이는 YOLO와 NMS 휴리스틱을 의미했습니다. RT-DETR은 동일한 연산 예산 안에서 Transformer급 품질의 검출을 제공하며, NMS 없는 결정론적 출력은 SLAM 파이프라인에 통합하기가 더 단순합니다(데이터 연관을 위한 안정적인 인스턴스 개수, 임계값 튜닝 불필요, 예측 가능한 지연 시간). 실시간 시맨틱 매핑과 동적 객체 필터링을 위한 자연스러운 검출기 선택입니다.

## 관련 문서

- [DETR](detr.md) — 원조 종단간 Transformer 검출기
- [YOLO](yolo.md) — 경쟁 상대인 실시간 CNN 기준선
- [Grounding DINO](grounding-dino.md) — 개방형 어휘 DETR 스타일 검출
- [SAM](sam.md) — 검출기와 자주 함께 사용되는 프롬프트 가능한 세그먼테이션
