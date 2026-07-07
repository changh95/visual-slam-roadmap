# MiDaS

> Ranftl 2020 · [논문](https://arxiv.org/abs/1907.01341)

**한 줄 요약** — scale-and-shift invariant 손실을 사용하여 여러 이질적인 데이터셋을 혼합해 학습한 강인한 relative(affine-invariant) 단안 깊이로, 도메인 간에 강력한 zero-shot 일반화를 달성한다.

## 문제

단안 깊이 추정의 성공은 크고 다양한 학습 세트에 좌우되지만, 서로 다른 환경에서 대규모로 밀집한 ground-truth 깊이를 얻는 것은 너무 어려워서, 이 분야는 각기 다른 특성과 편향을 가진 데이터셋들로 분열되었다 — stereo에서 유도된 것, laser로 스캔한 것, 구조광 방식 등이 각기 다른 scale 관례, 깊이 범위, 심지어 알 수 없거나 일관되지 않은 calibration을 가진다. 단일 데이터셋으로 학습된 모델은 해당 도메인 밖에서는 취약하다. MiDaS는 서로의 주석이 상호 호환되지 않더라도 이들 모두에 대해 *공동으로* 학습할 수 있는 도구를 만든다.

## 방법 및 아키텍처

네트워크 자체는 통상적인 encoder-decoder(Xian et al.의 multi-scale ResNet 기반 아키텍처)이며, 기여는 그 주변의 학습 기제에 있다.

**예측 공간.** 모델은 알 수 없는 scale과 shift까지의 *disparity*(역깊이) 공간에서 예측한다 — 이는 모든 종류의 annotation(calibration되지 않은 stereo, laser, SfM)과 호환되는 유일한 표현이다.

**Scale-and-shift invariant 손실.** $M$개의 valid 픽셀에 대해, 손실은 예측과 ground truth를 정렬한 버전 $\hat{d}, \hat{d}^*$에서 계산된다:

$$L_{ssi}(\hat{d}, \hat{d}^*) = \frac{1}{2M}\sum_{i=1}^{M} \rho\left(\hat{d}_i - \hat{d}_i^*\right)$$

한 가지 정렬 방식은 최소자승법이다: $(s,t) = \arg\min_{s,t}\sum_{i=1}^{M}(s d_i + t - d_i^*)^2$, 이는 닫힌 형태로 풀 수 있다. 강인한(robust) 대안은 median/mean-absolute-deviation 추정량으로 두 신호를 정규화한다:

$$t(d) = \mathrm{median}(d), \qquad s(d) = \frac{1}{M}\sum_{i=1}^{M}|d - t(d)|, \qquad \hat{d} = \frac{d - t(d)}{s(d)}$$

가장 성능이 좋은 변형인 $L_{ssitrim}$은 mean-absolute-error $\rho$를 적용하지만 이미지당 residual이 큰 상위 20%를 *잘라낸다*($U_m = 0.8M$), 따라서 ground-truth의 outlier가 학습에 영향을 주지 않는다.

**Gradient matching.** 다중 스케일 gradient-matching 항이 깊이 불연속점을 뾰족하게 하고 ground-truth 엣지와 일치하도록 편향시킨다($R_i = \hat{d}_i - \hat{d}_i^*$, $K=4$개 스케일):

$$L_{reg}(\hat{d},\hat{d}^*) = \frac{1}{M}\sum_{k=1}^{K}\sum_{i=1}^{M}\left(|\nabla_x R_i^k| + |\nabla_y R_i^k|\right)$$

데이터셋별 손실은 $L_l = \frac{1}{N_l}\sum_n L_{ssi} + \alpha\, L_{reg}$이며 $\alpha = 0.5$다.

**Pareto-optimal 데이터셋 혼합.** 데이터셋 전체의 손실을 단순히 평균내는 대신, 각 데이터셋을 다중목적 최적화(Sener & Koltun)의 하나의 task로 취급하여 어떤 데이터셋도 지배하지 않는 근사 Pareto 최적점을 찾는다.

**데이터: MIX 5 + 3D movie.** 다섯 개의 학습 세트 — ReDWeb, DIML, MegaDepth, WSVD, 그리고 새로운 3D Movies 코퍼스(23편의 입체 영화에서 약 7만 5천 프레임): stereo 뷰 사이의 optical flow가 disparity의 proxy로 쓰이며, left-right 일관성 검사(2px 초과는 invalid로 표시), 자동 프레임 필터링, 하늘 영역은 최소 disparity로 강제된다.

**Encoder 사전학습.** encoder의 ImageNet 성능이 깊이 성능을 예측하며, 최고 모델은 ResNeXt-101-WSL encoder(weakly-supervised 사전학습)를 사용해 최대 15%의 상대적 개선을 얻고, 무작위로 초기화된 ResNet-50은 사전학습된 대응 모델보다 약 35% 나쁘다.

## 실험 결과

평가는 *zero-shot 교차 데이터셋 전이*다: 테스트 데이터셋(DIW, ETH3D, Sintel, KITTI, NYU, TUM)은 학습 중 한 번도 보지 않는다. 전체 모델(MIX 5, ResNeXt-101-WSL)은 DIW WHDR 12.46, ETH3D AbsRel 0.129, Sintel AbsRel 0.327, $\delta > 1.25$ outlier 비율 23.90(KITTI), 9.55(NYU), 14.29(TUM)을 달성한다 — 모든 방법 중 최고의 평균 순위(2.0)이며, 가장 경쟁력 있는 방법들(Li MD, Li MC, Wang WS, Xian RW)은 평균 상대 성능에서 65–82% 더 나쁘다. Ablation은 모든 단일 데이터셋 모델이 작지만 잘 정제된 ReDWeb 기준선보다 평균적으로 더 나쁘게 일반화됨을 보이는 반면, 다섯 세트 모두를 Pareto-optimal하게 혼합하면 그 기준선보다 평균 성능이 22.4% 개선된다(naive 혼합의 19.5% 대비). 잘라낸 MAE 손실은 MSE와 MAE 변형보다 우수하다. 학습에는 약 6 GPU-month가 소요되었다.

## SLAM에서의 의미

MiDaS(v2/v3 DPT backbone 버전)는 약 5년간 사실상 표준으로 쓰인 즉시 사용 가능한 단안 깊이 모델이었으며, 그 scale-shift invariant 손실은 이제 깊이 학습(ZoeDepth, Depth Anything, Marigold)의 표준이 되었다. SLAM에서는 relative 깊이가 그 자체로 유용한 dense 사전이다 — 텍스처가 없는 영역을 채우거나, dense mapping을 정규화하거나, 단안 파이프라인에서 깊이를 초기화할 때 — 다만 scale과 shift는 SLAM 시스템 자체가 프레임별로 해결해야 한다는 조건이 붙는다.

## 관련 문서

- [MonoDepth](monodepth.md) — 더 이른 자기지도 단일 데이터셋 방법
- [DPT](dpt.md) — MiDaS v3가 된 ViT backbone
- [ZoeDepth](zoedepth.md) — MiDaS 스타일 사전학습 위에 metric scale을 더함
- [Depth Anything](depth-anything.md) — 이 레시피를 6200만 장 이미지로 확장
- [Metric3D](metric3d.md) — relative 대신 metric으로 가는 canonical-camera 경로
- [Scale ambiguity](../level-03-monocular-slam/scale-ambiguity.md) — 단안 SLAM에서 affine-invariant 깊이가 외부 scale을 필요로 하는 이유
