# IGGT

> Li 2025 · [논문](https://arxiv.org/abs/2510.22706)

**한 줄 요약** — 피드포워드 3D 복원과 인스턴스 수준의 장면 이해를, 별도로 복원된 지도에 의미론을 덧붙이는 대신 단일 모델 안에서 통합하는 인스턴스 기반 기하 트랜스포머(instance-grounded geometry transformer)입니다.

## 문제

인간은 기하학적 구조와 의미론적 내용을 서로 얽힌 것으로 지각하지만, 대부분의 파이프라인은 이 둘을 별도로 다룹니다: 대규모 기하 모델(DUSt3R/VGGT 계열)은 저수준 3D 복원을 위해 학습되는 반면, 고수준의 공간 이해는 별도로 처리됩니다 — 이는 "일반화를 제한하고 다운스트림 3D 이해 작업에서 낮은 성능으로 이어집니다." 최근의 해결책들은 3D 모델을 하나의 특정 비전-언어 모델에 정렬시키지만, 이는 세밀한 기하학적 디테일을 과도하게 매끄럽게 만들고, 지각 능력을 정렬된 모델의 역량(예: LSeg)으로 제한하며 — VLM 특징이 범주(category) 수준이기 때문에 — 같은 클래스의 다른 객체들을 구별하지 못해 큰 시점 변화 아래에서 인스턴스 추적이 무너집니다.

## 방법 및 아키텍처

IGGT는 $N$개의 이미지를 한 번의 순전파로 기하학 *및* 인스턴스 특징에 매핑합니다:

$$\mathcal{F}: \{I_i\}_{i=1}^{N} \mapsto (t_i, D_i, P_i, S_i)_{i=1}^{N},$$

여기서 $t_i$는 카메라 파라미터, $D_i$는 깊이 맵, $P_i$는 포인트 맵, $S_i$는 3D-일관적인 인스턴스 수준 특징 맵입니다.

- **대형 통합 트랜스포머(Large Unified Transformer)**: 뷰마다 DINOv2 패치 토큰과 학습 가능한 카메라 토큰을 사용하는 10억 파라미터 규모의 VGGT 스타일 백본으로, 뷰 내부 self-attention과 전역 뷰 간 attention을 교대로 수행하는 24개 블록을 거쳐 이미지마다 통합 토큰 $\mathbf{T}_i \in \mathbb{R}^{M \times D}$를 생성합니다.
- **두 개의 헤드**: 동일한 토큰을 디코딩하는 기하 헤드(Geometry Head, VGGT에서 계승된 DPT 스타일의 카메라·깊이·포인트 예측기)와 인스턴스 헤드(Instance Head): $\{F^{pt}_i\} = \Phi_{pt}(\{\mathbf{T}_i\})$, $\{F^{ins}_i\} = \Phi_{ins}(\{\mathbf{T}_i\})$.
- **크로스모달 융합 블록**: 슬라이딩 윈도우 cross-attention이 픽셀 수준의 기하학적 특징을 인스턴스 분기에 주입합니다(전역 attention의 2차 비용을 피함):
  $$\hat{F}_{i,(l)}^{ins} = F_{i,(l)}^{ins} + \mathcal{F}_{\text{win}}\left(Q = F_{i,(l)}^{ins},\; K = F_{i,(l)}^{pt},\; V = F_{i,(l)}^{pt}\right),$$
  객체 경계와 공간 배치 인식을 더욱 선명하게 합니다. 정제된 특징은 8차원 인스턴스 임베딩 $O_{ins}$로 투영됩니다.
- **3D-일관적 대조 학습(3D-Consistent Contrastive Learning)**: 샘플링된 픽셀 $\mathcal{P}$에 대해, 동일한 물리적 인스턴스(인스턴스 ID $m(p)$)의 특징은 여러 뷰에 걸쳐 서로 가까워지도록, 서로 다른 인스턴스는 마진 $M$만큼 멀어지도록 학습됩니다:
  $$\mathcal{L}_{mvc} = \lambda_{pull} \sum_{m(p_i) = m(p_j)} d(f_{p_i}, f_{p_j}) + \lambda_{push} \sum_{m(p_i) \neq m(p_j)} \max\left(0,\, M - d(f_{p_i}, f_{p_j})\right),$$
  여기서 $d$는 정규화된 특징 간의 L2 거리입니다. 전체 손실은 $\mathcal{L}_{overall} = \mathcal{L}_{pose} + \mathcal{L}_{depth} + \mathcal{L}_{pmap} + \mathcal{L}_{mvc}$입니다(기하학 항들은 VGGT의 학습 방식을 따릅니다).
- **인스턴스 기반 장면 이해**: 추론 시, HDBSCAN이 다중 뷰 인스턴스 특징을 $K$개의 인스턴스로 클러스터링하여 3D-일관적인 2D 인스턴스 마스크를 생성합니다. 이 마스크는 플러그 앤 플레이 방식으로 어떤 VLM/LMM으로든 이어지는 *다리* 역할을 합니다: 마스크 풀링된 OpenSeg/CLIP 특징은 개방형 어휘 분할을 제공하고, 마스크로 강조된 뷰를 LMM(예: Qwen2.5-VL, GPT-4o)에 질의하면 QA 장면 그라운딩을 얻습니다. 특정 언어 모델이 고정되어 내장되어 있지 않습니다.
- **InsScene-15K**: 합성 데이터(Aria, Infinigen), 비디오(RE10K, SAM + SAM2 전파와 키프레임 재시딩을 통해), RGB-D(ScanNet++, SAM2 제안으로 정제된 투영 3D 주석)로부터 정리된 15,000개 장면 데이터셋(RGB, 포즈, 깊이, 3D-일관적 인스턴스 마스크)입니다. IGGT는 VGGT 가중치로 초기화되어 8개의 A800에서 2일간 미세 조정됩니다.

## 실험 결과

ScanNet과 ScanNet++(각 10개 장면, 장면당 8~10개 이미지)에서 평가:

- **인스턴스 공간 추적**: ScanNet에서 T-mIoU **69.41** / T-SR **98.66**, ScanNet++에서 **73.02** / **98.90** — SAM2*의 53.74/71.25와 44.16/57.89, SpaTracker+SAM의 26.43/38.57과 16.15/23.68 대비. 기준선들이 큰 카메라 모션 아래에서 객체를 놓치는 지점에서도 거의 완벽한 성공률을 보입니다.
- **개방형 어휘 분할**: ScanNet++에서 2D mIoU 31.31, mAcc 70.78 — 다른 접근법들을 mIoU 8.34%, mAcc 7.88% 앞섭니다. 3D mIoU는 이전 접근법 대비 ScanNet에서 4.31%(39.68), ScanNet++에서 4.97%(20.14) 향상됩니다.
- **복원 품질은 희생되지 않음**: 깊이 Abs. Rel은 ScanNet에서 1.90으로 VGGT의 1.84와 대등하며, ScanNet++에서는 VGGT보다 *더 우수*합니다(Abs. Rel 2.61 대 2.75, inlier ratio 85.66 대 85.41로 0.25 개선) — 의미론 학습을 함께 수행하는 것이 기하학에도 도움이 된다는 증거입니다.
- LERF-OVS(Teatime)에서의 QA 그라운딩 시연은 인스턴스 기반 LMM 질의가 다중 뷰 일관성에서 Gemini 2.5 Pro에 직접 프롬프트하는 것보다 우수함을 보여줍니다.

## SLAM에서의 의미

DUSt3R/VGGT 계열의 흐름은 SLAM 시스템에 밀집 기하학을 공짜로 제공하는 파운데이션 모델을 향하고 있습니다. IGGT는 이 흐름을 표면이 *어디에* 있는지뿐만 아니라 장면에 *무엇이* 있는지로 확장합니다. 조작, 의미론적 내비게이션, AR 같은 Spatial AI에서는 3D-일관적인 객체 인스턴스로 분할된 지도가 원시 기하학보다 훨씬 실행 가능하며, 이를 하나의 피드포워드 모델 안에서 수행하면 프레임별 2D 분할(SAM 마스크, CLIP 특징)을 3D 지도에 이어붙이는 데서 오는 불일치를 피할 수 있습니다. 마스크를 다리로 사용하는 설계는 더 나은 VLM이 등장할 때마다 의미론적 스택이 공짜로 업그레이드된다는 것을 의미하기도 합니다.

## 관련 문서

- [VGGT](vggt.md)
- [DUSt3R](dust3r.md)
- [VGGT-SLAM](vggt-slam.md)
- [ConceptFusion](conceptfusion.md)
- [ConceptGraphs](../level-05-deep-learning/conceptgraphs.md)
- [SAM 2](../level-05-deep-learning/sam-2.md) — InsScene-15K의 인스턴스 마스크를 정리하는 데 사용됨
