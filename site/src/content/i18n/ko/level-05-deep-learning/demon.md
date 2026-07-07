# DeMoN

> Ummenhofer 2017 · [논문](https://arxiv.org/abs/1612.02401)

**한 줄 요약** — DeMoN(CVPR 2017)은 2-뷰 구조-기반-모션(structure-from-motion)을 학습 문제로 공식화했다: 인코더-디코더를 여러 개 이어붙인 체인이 제약 없는 이미지 쌍으로부터 깊이와 카메라 모션을 함께 추정하며, 강제된 광류(optical flow) 예측을 통해 대응 관계를 학습한다.

## 문제

고전적인 2-뷰 SfM은 keypoint 검출, 디스크립터 매칭, essential 행렬 추정, 밀집 스테레오를 연쇄적으로 수행한다 — 모션이 희소하고 outlier가 많은 대응 관계로부터 먼저 추정되기 때문에, 잘못된 모션 추정이 깊이를 오염시키고, 텍스처가 부족한 영역에서는 실패하며, 카메라 이동이 작을 때 기존 파이프라인 전체가 무너진다. 단일 이미지 깊이 네트워크는 매칭을 피하지만 순전히 외관(appearance) 사전 정보에 의존하기 때문에 학습 분포 밖에서는 일반화 성능이 떨어진다. DeMoN은 연속된 *제약 없는* 이미지 쌍으로부터 깊이와 모션을 계산하도록 네트워크를 종단간(end-to-end)으로 학습시키며 — 단순한 접근이 실패한다는 것을 보여준다: 두 프레임을 입력받는 평범한 인코더-디코더는 단일 이미지의 손쉬운 경로(shortcut)를 택해 두 번째 이미지를 그냥 무시해버린다.

## 방법 및 아키텍처

- **체인으로 연결된 세 구성 요소: bootstrap net → iterative net → refinement net.** bootstrap과 iterative 구성 요소는 각각 인코더-디코더 *쌍*이다: 첫 번째는 이미지 쌍으로부터 광류와 flow-confidence 맵을 예측하고(인코더는 넓은 수용 영역(receptive field)을 갖기 위해 1D 필터 쌍을 사용), 두 번째는 flow, confidence, 이미지들, 그리고 flow로 워프된 두 번째 이미지를 받아 깊이, 표면 법선, 그리고 — 3개의 완전 연결 레이어를 통해 — 카메라 모션 $\mathbf{r},\mathbf{t}$와 깊이 스케일 인자 $s$를 예측한다.
- **매칭을 강제하기.** flow를 예측하려면 두 이미지를 모두 사용해야 하며, 이 flow를 깊이/모션 네트워크에 입력하면 모션 시차(motion parallax)를 활용하게 된다. 이것이 핵심적인 아키텍처 트릭이다: naive한 2-프레임 깊이는 단일 이미지보다 나을 게 없지만(L1-inv 0.079 대 0.080), DeMoN은 0.012에 도달한다.
- **파라미터화.** 회전 $\mathbf{r}=\theta\mathbf{v}$ (angle-axis), 이동은 스케일 게이지를 고정하기 위해 $\|\mathbf{t}\|=1$로 정규화되며; 네트워크는 역깊이 $\xi=1/z$ (무한대의 점도 처리 가능)와 스칼라 $s$를 예측하여 최종 깊이는 $s\xi$가 된다.
- **Iterative net.** 이전의 깊이+모션을 flow 제안으로 변환하고 그 flow를 다시 깊이 제안으로 변환한 뒤 재추정한다 — 가중치를 공유하는 학습된 반복 정제(iterative refinement)다. 학습 시에는 이전 학습 반복(iteration)에서의 예측을 미니배치에 이어붙이는 방식을 쓰고(반복에 대한 역전파 없이 unrolling하지 않음) 메모리를 절약하며; 개선은 3~4회 반복 후 saturate된다. refinement net은 64×48 추정치를 전체 256×192 해상도로 업샘플링한다. GTX Titan X에서 3회 반복의 forward pass는 110ms가 걸린다.
- **손실.** 스케일링된 역깊이에 대한 L1, $\mathcal{L}_{\text{depth}}=\sum_{i,j}|s\,\xi(i,j)-\hat{\xi}(i,j)|$; normal과 flow에 대한 L2; ground truth $\hat{c}_{x}=e^{-|\mathbf{w}_{x}-\hat{\mathbf{w}}_{x}|}$를 사용하는 confidence 손실; L2 모션 손실; 그리고 이 논문의 특징적인 **스케일 불변 그래디언트 손실(scale-invariant gradient loss)**은 픽셀 $(i,j)$에서의 이산 그래디언트로부터 구성된다,

$$\mathbf{g}_{h}[f]=\left(\tfrac{f(i+h,j)-f(i,j)}{|f(i+h,j)|+|f(i,j)|},\ \tfrac{f(i,j+h)-f(i,j)}{|f(i,j+h)|+|f(i,j)|}\right)^{\top},$$

$$\mathcal{L}_{\text{grad}\,\xi}=\sum_{h\in\{1,2,4,8,16\}}\sum_{i,j}\left\|\ \mathbf{g}_{h}[\xi]-\mathbf{g}_{h}[\hat{\xi}]\ \right\|_{2},$$

  5개의 간격(spacing)에 걸쳐 인접 픽셀 간의 상대적 깊이 오차에 페널티를 주어 — 깊이 불연속 지점을 더 뚜렷하게 만들고 균일한 영역을 매끄럽게 한다.
- **학습 데이터.** SUN3D, RGB-D SLAM, MVS 재구성, 합성 데이터셋 Scenes11, 그리고 저자들이 만든 Blendswap 데이터셋; Adam을 사용한 Caffe로, 세 단계로 학습된다(순차적 인코더-디코더 학습 → joint iterative 학습 → refinement 학습).

## 실험 결과

- **고전적 2-프레임 SfM과 비교** (SIFT 또는 FlowFields 대응 관계 + 8-point/RANSAC + 재투영 정제 + plane-sweep 스테레오로 구성된 baseline): DeMoN은 대부분의 데이터셋에서 깊이와 모션 모두 "1.5~2배 차이로" 승리한다 — 예를 들어 Sun3D: L1-rel 0.172 대 0.297 (Base-FF), 회전 오차 1.80° 대 3.68°, 이동 방향 오차 18.8° 대 33.3°; Scenes11: 회전 0.81°, 이동 8.9°. 텍스처가 풍부한 MVS에서만 flow 기반 baseline이 모션 면에서 대등하다.
- MVS를 제외한 모든 데이터셋에서 DeMoN의 깊이는 **Base-Oracle** — 즉 *ground-truth* 모션이 주어진 고전적 스테레오 — 마저 능가한다 (예: Sun3D sc-inv 0.114 대 0.241).
- **단일 이미지 깊이와 비교** (Eigen&Fergus VGG, Liu et al.): NYUv2(그들의 학습 도메인)를 제외한 모든 데이터셋에서 우수하다. 특이한 장면들(조각상, 클로즈업, 90° 회전된 이미지)로 구성된 자체 수집 일반화 데이터셋에서: L1-inv 0.041 대 0.062 (Eigen), 0.055 (Liu) — 외관 사전 정보가 실패하는 곳에서 모션 시차가 일반화된다.
- 베이스라인이 작거나 0인 퇴화(degenerate) 경우도 우아하게 처리하며, pairwise 모션을 이어붙이면 RGB-D SLAM 시퀀스에서 지역적으로 일관된 궤적을 얻는다(이동 드리프트는 있으나 루프 클로저는 없음) — "이 결과는 DeMoN이 그러한 [SLAM] 시스템에 통합될 수 있다는 것을 확신시켜준다."

## SLAM에서의 의미

DeMoN은 "네트워크에 두 이미지를 입력하면 기하학적 정보가 나온다"는 계열의 원조다. 학습된 2-뷰 기하학에는 인식(recognition)만이 아니라 매칭이 필요하다는 것을 보여주었으며 — 이 교훈은 지금도 프론트엔드 설계에 영향을 미친다 — 그 학습된 iterative refinement는 BA-Net, DeepV2D, RAFT 계열 시스템을 예고했고, 제약 없는 2-뷰 설정은 DUSt3R이 파운데이션 모델 규모에서 다시 다루는 바로 그 문제다.

## 관련 문서

- [BA-Net](ba-net.md)
- [DeepV2D](deepv2d.md)
- [SfM-Learner](sfm-learner.md)
- [FlowNet](flownet.md)
- [DUSt3R](dust3r.md)
