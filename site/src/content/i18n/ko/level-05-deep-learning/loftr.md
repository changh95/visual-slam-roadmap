# LoFTR

> Sun 2021 · [논문](https://arxiv.org/abs/2104.00680)

**한 줄 요약** — Transformer를 이용한 검출기 없는(detector-free) 밀집 특징 매칭: self-attention과 cross-attention이 두 이미지 모두에 조건화된 특징을 만들어, keypoint 검출기가 실패하는 텍스처가 부족한 영역에서도 신뢰할 수 있는 매칭을 생성한다.

## 문제

고전적인 파이프라인은 특징 검출, 기술, 매칭을 *순차적으로* 수행하므로, 모든 것이 검출기가 두 이미지에서 재현 가능한(repeatable) interest point를 만들어내는 데 달려 있다 — 그러나 검출기는 텍스처가 적은 영역(빈 벽, 바닥)과 반복 패턴 아래서 이를 제대로 하지 못하는 것으로 잘 알려져 있다. 기존의 밀집 대안들은 비용 볼륨(cost volume)을 통해 대응점을 탐색했는데, 이는 비용이 크고 여전히 지역적 근거에만 의존한다. LoFTR은 검출을 완전히 건너뛴다: 먼저 조대한 수준에서 픽셀 단위의 밀집 매칭을 확립한 뒤, 좋은 매칭만 정제한다 — 어떤 것이 매칭되는지는 두 이미지 모두에 동시에 조건화된 Transformer의 전역 수용 영역이 결정한다.

## 방법 및 아키텍처

**Backbone.** ResNet-18 + FPN CNN이 1/8 해상도의 조대 특징 $\tilde{F}^A, \tilde{F}^B$와 1/2 해상도의 정밀 특징 $\hat{F}^A, \hat{F}^B$를 추출한다.

**LoFTR 모듈.** 2D sinusoidal 위치 인코딩(한 번만 더해짐)이 특징을 위치에 의존하게 만든다 — 특징이 없는 영역을 매칭하는 데 결정적이다. 그다음 $N_c = 4$개의 self-attention과 cross-attention이 번갈아 배치된 레이어가 조대 특징을 $\tilde{F}^A_{tr}, \tilde{F}^B_{tr}$로 변환한다. 일반적인 attention $\mathrm{Attention}(Q,K,V) = \mathrm{softmax}(QK^T)\,V$는 $O(N^2)$의 비용이 들기 때문에, LoFTR은 Linear Transformer 커널

$$ \mathrm{sim}(Q,K) = \phi(Q)\cdot\phi(K)^{T}, \quad \phi(\cdot) = \mathrm{elu}(\cdot) + 1 $$

을 사용하며, 행렬 곱의 결합법칙에 의해(먼저 $\phi(K)^T V$를 계산, 특징 차원 $D \ll N$) 비용이 $O(N)$으로 줄어든다.

**조대 매칭.** 점수 행렬 $\mathcal{S}(i,j) = \frac{1}{\tau} \langle \tilde{F}^A_{tr}(i), \tilde{F}^B_{tr}(j) \rangle$이 optimal-transport 레이어(SuperGlue와 동일)나 *dual-softmax* 중 하나로 전달된다:

$$ \mathcal{P}_c(i,j) = \mathrm{softmax}\big(\mathcal{S}(i,\cdot)\big)_j \cdot \mathrm{softmax}\big(\mathcal{S}(\cdot,j)\big)_i $$

조대 매칭은 $\mathcal{P}_c$에서 상호 최근접 이웃이면서 신뢰도가 $\theta_c = 0.2$ 이상인 쌍이다.

**조대-정밀 정제.** 각 조대 매칭에 대해, 정밀 특징 맵에서 $w \times w = 5 \times 5$ 크기의 지역 창을 잘라내어 더 작은 LoFTR 모듈($N_f = 1$)로 변환한다; query 창의 중심 벡터를 다른 창과 상관시키면 매칭 확률 히트맵이 나오며, 그 기댓값이 subpixel 위치 $\hat{j}'$을 준다.

**지도학습.** $\mathcal{L} = \mathcal{L}_c + \mathcal{L}_f$: (SuperGlue처럼 pose + 깊이로부터 얻은) ground-truth 조대 grid 매칭에 대한 negative log-likelihood와, 정밀 offset에 대한 히트맵 분산 가중 $\ell_2$ 손실을 더한 것이다:

$$ \mathcal{L}_f = \frac{1}{|\mathcal{M}_f|} \sum_{(\hat{i},\hat{j}')\in\mathcal{M}_f} \frac{1}{\sigma^2(\hat{i})} \big\lVert \hat{j}' - \hat{j}'_{gt} \big\rVert_2 $$

**비용.** RTX 2080Ti에서 640×480 쌍 하나당 dual-softmax로 116 ms(optimal transport로는 130 ms); 처음부터 end-to-end로 학습되며, 실내 모델은 64개의 GTX 1080Ti GPU에서 24시간 걸린다.

## 실험 결과

- **HPatches homography:** AUC@3px 65.9 — SuperPoint+SuperGlue의 53.9, DRC-Net의 50.6에 비해 우수하며, 더 엄격한 임계값에서 격차가 더 커진다.
- **실내 pose (ScanNet, 테스트 쌍 1500개):** LoFTR-DS AUC@5°/10°/20° = 22.06/40.8/57.62 — SuperPoint+SuperGlue의 16.16/33.81/51.84, DRC-Net의 7.69/17.93/30.49에 비해 우수하며, 텍스처가 적고 baseline이 넓은 실내 장면에서 가장 큰 이득을 보인다.
- **실외 pose (MegaDepth):** LoFTR-DS 52.8/69.19/81.18 — SuperPoint+SuperGlue의 42.18/61.16/75.96(AUC@10°에서 13% 우수)과 검출기 없는 DRC-Net(AUC@10°에서 61% 우수) 대비 우수하다.
- **시각적 위치추정:** 발표 시점에 Long-Term Visual Localization benchmark의 두 트랙에서 공개된 방법 중 1위에 올랐다 — Aachen v1.1 야간 local-feature 트랙(LoFTR-DS 72.8/88.5/99.0)에서 최고, InLoc에서 hloc과 함께 공개된 방법 중 최고(DUC1 47.5/72.2/84.8, DUC2 54.2/74.8/85.5).
- **Ablation:** LoFTR 모듈을 비슷한 파라미터 수의 컨볼루션으로 대체하면 AUC가 크게 떨어진다(22.06 대비 14.98 @5°); DETR 스타일의 레이어별 위치 인코딩도 성능을 해친다.

## SLAM에서의 의미

실내 SLAM은 검출할 것이 없는 곳 — 빈 벽, 바닥, 반복적인 표면 — 에서 끊임없이 실패한다. LoFTR은 전역 문맥을 활용하는 매처가 그런 곳에서도 대응점을 만들 수 있음을 보였고, RoMa, EfficientLoFTR 등 많은 후속 연구가 기반으로 삼는 검출기 없는 패러다임을 확립했다. 실무에서는 실내 복원, wide-baseline 재위치추정, 그리고 희소 매칭이 너무 취약할 때의 loop closure 검증에서 흔히 선택되는 방법이며, 그 대가로 희소 매처보다 더 많은 연산을 필요로 한다.

## 관련 문서

- [SuperGlue](superglue.md) — 희소 학습 기반 매칭의 대응 방법
- [LightGlue](lightglue.md) — 빠른 희소 매처; 효율성에 초점을 둔 대안
- [RoMa](roma.md) — foundation model 특징을 이용한 밀집 매칭
- [SuperPoint](superpoint.md) — LoFTR이 우회하는 검출기 기반 패러다임
- [HF-Net](hf-net.md) — 검출기 없는 매처가 들어갈 수 있는 시각적 위치추정 파이프라인
