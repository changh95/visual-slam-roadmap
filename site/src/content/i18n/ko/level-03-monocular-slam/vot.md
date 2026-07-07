# VoT

> Yugay 2025 · [논문](https://arxiv.org/abs/2510.03348)

**한 줄 요약** — Visual Odometry with Transformers(FVO로 재명명, "Fast Visual Odometry with Transformers"): 단안 VO를 고용량 시간-공간 Transformer와 신뢰도 가중 집계를 이용한 직접 상대 포즈 회귀로 공식화하여, 하이브리드 네트워크 + 번들 조정 파이프라인을 완전히 대체합니다.

## 문제

딥 네트워크와 고전적 최적화를 결합한 하이브리드 파이프라인이 visual odometry를 지배하고 있습니다: 신경망 예측과 번들 조정을 합치면 매우 정확한 궤적이 나옵니다. 하지만 이러한 하이브리드는 속도와 능력에서 순수 end-to-end 접근법에 못 미칩니다 — 이들은 스케일 모호성을 안고 학습된 거대하고 고정된(frozen) 사전 학습 3D 백본에 의존하므로, 파이프라인이 "본질적으로 이 한계를 물려받아, 설계상 절대 스케일을 추정하는 데 실패"합니다; 그리고 느린 최적화와 후처리 단계가 추론 속도의 병목이 됩니다. 번들 조정 기반 방법들은 또한 일반적으로 알려진 카메라 캘리브레이션을 가정합니다. FVO는 질문합니다: 후처리를 완전히 없애버리면 어떨까?

## 방법 및 아키텍처

**파이프라인**: 겹치는 프레임 윈도우 → 고정된 인코더 → 시간-공간 Transformer 디코더 → 쌍별 상대 포즈 + 신뢰도 → 신뢰도 가중 궤적 융합. 번들 조정도, 카메라 내부 파라미터도, 테스트 시점 최적화도 없습니다.

- **인코더**: DUSt3R 프레임워크 내에서 학습된, 고정된 3억 파라미터 CroCo ViT입니다. 각 이미지는 $h \cdot w$개의 패치로 분할되고($h = H/p$, $w = W/p$), sinusoidal 위치 인코딩과 함께 특징 $F \in \mathbb{R}^{N \times (h \cdot w) \times d}$를 만듭니다.
- **시간-공간 디코더**: $L = 12$개의 블록(2억 파라미터)으로, 각각이 멀티헤드 *시간적* 어텐션(프레임 간 동일 공간 위치)을 적용한 다음 *공간적* 어텐션(각 프레임 내부), 그리고 MLP를 적용합니다 — 전체 어텐션의 인수분해된 대안입니다(163 대 380 GFLOPs). 학습 가능한 카메라 임베딩 $\mathrm{ce} \in \mathbb{R}^d$가 연결되어 $F_0 = [\mathrm{ce}, F]$를 이루고, 오직 공간적 어텐션에만 참여합니다(시간적 어텐션에 주입하면 정확도가 저하됩니다).
- **포즈 헤드**: 연속된 각 쌍 $(i, i+1)$에 대해, 카메라 임베딩의 단일 선형 투영이 14차원 벡터를 출력합니다: 원본 회전 행렬 $\mathbf{F}_{i,i+1} \in \mathbb{R}^{3\times3}$, 이동 $\mathbf{t}_{i,i+1} \in \mathbb{R}^3$, 그리고 신뢰도 $\mathbf{c}_R, \mathbf{c}_t$. 회전은 직교 Procrustes 문제를 통해 매니폴드에 투영되며, SVD로 풀립니다:

$$\text{Procrustes}(\mathbf{F}_R) = \arg\min_{\hat{\mathbf{R}} \in \mathbb{SO}(3)} \|\hat{\mathbf{R}} - \mathbf{F}_R\|_F^2$$

- **불확실성 인지 손실**: geodesic 회전 오차 $\mathcal{L}_{\text{rot}} = \cos^{-1}\big(\tfrac{\mathrm{Tr}(\mathbf{R}^\top \hat{\mathbf{R}}) - 1}{2}\big)$와 L1 이동 오차 $\mathcal{L}_{\text{trans}} = \|\mathbf{t} - \hat{\mathbf{t}}\|_1$가 이질분산적(heteroscedastic)으로 결합됩니다,

$$\mathcal{L} = \mathcal{L}_{\text{rot}} \exp(-\mathbf{c}_R) + \mathbf{c}_R + \mathcal{L}_{\text{trans}} \exp(-\mathbf{c}_t) + \mathbf{c}_t,$$

  따라서 신뢰도는 깊이나 대응점에 대한 감독 없이, 오직 포즈 레이블로부터 자기 감독적으로 학습됩니다. 이동은 학습 데이터셋 통계로 역정규화되어 *미터 단위* 궤적을 만듭니다.
- **신뢰도 인지 추론**: 비디오는 겹치는 윈도우 $\{1,\dots,K\}, \{2,\dots,K+1\}, \dots$로 나뉘어, 각 상대 포즈 $(i,j)$가 $M$번 예측됩니다. 신뢰도는 정규화된 가중치 $\tilde{w}^{(k)} = \exp(-\mathbf{c}^{(k)}) / \sum_{\ell} \exp(-\mathbf{c}^{(\ell)})$가 되며; 회전은 $\mathbb{SO}(3)$ 위의 가중 프레셰 평균으로 융합됩니다, $\bar{\mathbf{R}}_{i,j} = \arg\min_{\mathbf{R}} \sum_k \tilde{w}_R^{(k)} d^2(\mathbf{R}, \mathbf{R}_{i,j}^{(k)})$, 이동은 가중 평균으로, 궤적은 합성 $\mathbf{T}_{i+1} = \mathbf{T}_i \bar{\mathbf{T}}_{i,i+1}$으로 만들어집니다.
- **학습**: 224×224 해상도의 8개 입력 뷰, AdamW, 250 에폭, H100 GPU 12개로 5일; ARKitScenes, ScanNet, 7-Scenes, TartanAir, KITTI로 학습됩니다.

## 실험 결과

정렬하지 않은(unaligned) ATE와 정렬한(aligned) ATE(RMSE, 미터 단위)로 평가됩니다 — 정렬하지 않은 지표가 중요한 이유는 실제 배포 환경에는 정렬할 정답 데이터가 없기 때문입니다:

- **FVO**: ARKit 0.54 / 0.26, ScanNet 0.34 / 0.16, KITTI 50.31 / 8.47, TUM(모든 방법에 대해 zero-shot) 0.47 / 0.19 — 전반적으로 최고 또는 두 번째로 우수합니다.
- 기준선들: MASt3R-SLAM-VO 0.60 / 0.28(ARKit), 0.99 / 0.22(ScanNet), KITTI에서는 실패; DPVO 5.48 / 0.49(ARKit), 194.55 / 9.74(KITTI) — 정렬 시에는 정확하지만 절대 스케일에는 약함; VGGT 2.94 / 2.26(ARKit); CUT3R 2.42 / 0.67(ARKit); 대형 3D 모델들은 긴 시퀀스에서 심하게 드리프트합니다.
- **속도**: RTX 3090에서 가장 빠른 기준선보다 거의 2배 빠릅니다(공정성을 위해 VGGT는 카메라 헤드만 사용하여 실행).
- Ablation: FVO의 이질분산적 신뢰도는 ATE 1.04를 주는 반면 DUSt3R 스타일 픽셀별 신뢰도는 1.33, 신뢰도 없음은 1.21입니다; SO(3) 투영은 쿼터니언(1.19), 6D(1.12), Plücker-ray(1.17) 회전 표현보다 우수합니다; CroCoV2-DUSt3R 백본(1.04)이 DINOv2-VGGT(1.31)보다 훨씬 우수합니다. ATE는 학습 데이터가 많아지고 디코더 레이어가 많아질수록 꾸준히 감소합니다.

## SLAM에서의 의미

VoT/FVO는 기하학적 추정을 Transformer 아키텍처로 옮기는 더 넓은 흐름의 일부입니다 — 매칭에서 LoFTR을, 전체 다중 뷰 기하학에서 VGGT를 낳은 것과 같은 흐름입니다. SLAM 학습자에게 이 논문의 가치는 설계 공간의 end-to-end 극단을 보여주는 명확한 사례 연구라는 점입니다: 최적화기를 삭제함으로써 얻는 것(속도, 미터 단위 스케일, 캘리브레이션 불필요)과 잃는 것(해석 가능한 기하학적 백본, 동적 장면에서의 강건성)이 무엇인지 보여줍니다. 명명에 관한 참고: arXiv 논문은 처음 "VoT"로 등장했으며, 이후 FVO로 재명명되었습니다.

## 관련 문서

- [DROID-SLAM](droid-slam.md) — CNN + 최적화를 사용한 학습 기반 SLAM 기준선
- [DPVO](dpvo.md) — 희소 패치 기반 학습 VO 기준선
- [VGGT](vggt.md) — 동일한 흐름 속의 완전한 feed-forward Transformer 기하학
- [LoFTR](../level-05-deep-learning/loftr.md) — Transformer 기반 검출기 없는 매칭
- [TartanVO](tartanvo.md) — 기하학적 형태의 출력을 유지한 더 이전의 일반화 가능한 학습 기반 VO
