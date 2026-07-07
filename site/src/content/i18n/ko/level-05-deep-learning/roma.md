# RoMa

> Edstedt 2024 · [논문](https://arxiv.org/abs/2305.15404)

**한 줄 요약** — 동결된 DINOv2 파운데이션 모델 특징(강인하지만 조대함)과 특화된 VGG19 세밀 특징(정밀하지만 취약함)을 앵커 확률을 예측하는 Transformer 매칭 디코더에서 융합하며, regression-by-classification 후 강건한 회귀로 학습되는 강인한 밀집 특징 매칭.

## 문제

밀집 특징 매칭 — 두 이미지 간 모든 픽셀에 대해 밀집 워프 $W^{\mathcal{A}\to\mathcal{B}}$와 매칭 가능성 점수 $p(x^{\mathcal{A}})$를 추정하는 것 — 은 스케일, 조명, 시점, 텍스처의 극단적인 실세계 변화를 견뎌내야 한다. 매칭 데이터로부터 처음부터 학습된 특징(DKM의 ResNet50)은 공간적으로 정밀하지만 학습 집합에 과적합된다. 동결된 DINOv2 특징은 훨씬 더 강인하지만(논문은 동결 특징 조대 매칭 프로브에서 27.1px EPE / 85.6% 강인성을, ResNet50은 60.2 / 57.5%, VGG19는 87.6 / 43.2%를 측정한다) 조대한 stride 14에서만 존재한다. RoMa는 이 둘을 모두 얻는 방법과, 각 단계를 그 오차 특성에 맞는 손실로 학습하는 방법을 묻는다.

## 방법 및 아키텍처

**2단계 밀집 파이프라인(DKM 골격).** 분리된 인코더가 조대 및 세밀 특징을 추출한다. 전역 매처 $G_\theta = D_\theta(E_\theta(\varphi^{\mathcal A}_{\text{coarse}}, \varphi^{\mathcal B}_{\text{coarse}}))$가 조대 워프와 확신도를 생성하고, stride $\{1,2,4,8\}$의 정제기 $R_{\theta,i}$가 누적된 특징 맵과 이전 추정치 주변의 지역 correlation volume을 사용하여 잔차 워프와 확신도-logit 오프셋을 재귀적으로 예측하며, 단계 간 그래디언트는 분리된다.

**강인하면서도 위치 정밀한 특징.** $F_{\text{coarse},\theta}=\text{DINOv2}$(학습 전체 기간 동안 동결됨 — 표현을 고정하는 것이 과적합을 줄이고 계산을 절감한다), $F_{\text{fine},\theta}=\text{VGG19}$: Ablation에 따르면 VGG19는 조대 특징으로는 부족하지만 세밀 특징으로는 최고의 성능을 보이며, 이는 "세밀한 위치 정밀도와 조대한 강인성 사이의 내재적 긴장 관계"를 드러낸다.

**앵커 확률을 갖는 Transformer 매칭 디코더.** 좌표를 직접 회귀하는 대신, 디코더(5개의 ViT 블록, 8개 헤드, 은닉 크기 1024, 해상도 과적합과 과도한 평활화를 피하기 위해 특징 유사도로만 전파되는 위치 인코딩 없음)는 $K = 64\times 64$개의 균일한 앵커에 대한 이산화된 조건부 분포를 출력한다:

$$p_{\text{coarse},\theta}(x^{\mathcal{B}}|x^{\mathcal{A}})=\sum_{k=1}^{K}\pi_k(x^{\mathcal{A}})\,\mathcal{B}_{m_k},$$

$\pi_k$는 앵커 확률, $m_k$는 앵커 좌표다 — 그리하여 다모드 모호성(반복 구조, 모션 경계)이 평균화되지 않고 표현된다. 워프는 앵커에 대한 argmax 이후 4-이웃 $N_4(k^*)$에 대한 지역 softargmax로 디코딩된다.

**각 단계에 맞춰진 손실.** 스케일 $s$에서의 매칭 가능성을 흐려진 결합 분포 $q(x^{\mathcal{A}},x^{\mathcal{B}};s)=\mathcal{N}(0,s^2\mathbf{I}) \ast p(x^{\mathcal{A}},x^{\mathcal{B}};0)$로 모델링하면, 조대 조건부 분포는 모션 경계 근처에서 다모드이지만 (이전 워프에 조건화된) 정제 단계는 지역적으로 단모드임이 드러난다. 따라서 $\mathcal{L}_{\text{coarse}}$는 regression-by-classification — 정답에 가장 가까운 앵커 $k^{\dagger}(x)=\operatorname{argmin}_k \lVert m_k - x\rVert$의 NLL — 이며, $\mathcal{L}_{\text{fine}}$은 강건한 generalized Charbonnier 회귀($\alpha=0.5$)로, 그 로그 밀도는 $-(\lVert\mu_\theta - x_i^{\mathcal{B}}\rVert^2 + s)^{1/4}$다: 지역적으로는 L2와 유사한 그래디언트를 가지면서 이상치에 대해서는 0으로 감쇄한다. 전체 손실은 $\mathcal{L}=\mathcal{L}_{\text{coarse}}+\mathcal{L}_{\text{fine}}$로, 단계 간 가중치 조정이 필요 없다. MegaDepth(+실내 평가를 위한 ScanNet 모델)에서 560×560으로 학습된다.

## 실험 결과

- **Ablation(MegaDepth validation에서 100−PCK@5px, 낮을수록 좋음)**: DKM 기준선 5.8 → 분리된 인코더 4.5 → +DINOv2 조대 특징 3.2 → +regression-by-classification 2.8 → +강건한 정제 손실 2.7(전체 RoMa); Transformer 디코더를 ConvNet으로 되돌리면 3.5로 저하된다.
- **WxBS(극단적으로 넓은 다중 요인 기준선)**: 80.1 mAA@10px 대 DKM 58.9, LoFTR 55.4 — 이전 최신 기술 대비 36% 향상.
- **IMC2022**: 88.0 mAA@10 대 DKM 83.1 — 26%의 상대적 오차 감소.
- **MegaDepth-1500 포즈**: AUC@5°/10°/20°에서 62.6 / 76.7 / 86.3(DKM 60.4/74.9/85.1); **MegaDepth-8-Scenes**: 62.2/75.9/85.3.
- **ScanNet-1500 포즈**: 31.8 / 53.4 / 70.9 — AUC@20°가 70을 넘은 최초의 방법.
- **InLoc 시각 localization**: DUC1 60.6/79.3/89.9, DUC2 66.4/83.2/87.8 — 최신 기술 수준.
- **런타임**: DKM보다 7% 느릴 뿐이다(560×560, 배치 8, RTX 6000에서 쌍당 186.3 → 198.8ms).

## SLAM에서의 의미

RoMa는 동결된 파운데이션 모델 특징이 매칭 강인성을 극적으로 향상시킨다는 것을 보여주며, "조대 앵커를 위한 파운데이션 특징 + 정밀도를 위한 특화 특징"이라는 패러다임을 확립했다. SLAM에서는 이것이 심각한 외관 변화(주야, 계절) 하에서의 relocalization과 loop closure에서 가장 중요하게 작용하며, 이런 상황에서는 sparse한 수작업 특징이나 학습된 keypoint조차 실패한다. RoMa류의 밀집 매처는 이제 여러 현대적 복원 및 localization 파이프라인을 지탱하고 있다.

## 관련 문서

- [RoMa v2](roma-v2.md) — 더 강인하고 더 정확하며 더 빠르고 더 밀집한 후속작
- [LoFTR](loftr.md) — 앞선 검출기 없는 Transformer 매칭
- [DeDoDe](dedode.md) — 같은 그룹의 검출/기술 분리 방법
- [Foundation models](foundation-models.md) — 동결된 사전 학습 특징이 일반화되는 이유
- [MASt3R](mast3r.md) — 밀집 매칭과 3D 복원의 융합
