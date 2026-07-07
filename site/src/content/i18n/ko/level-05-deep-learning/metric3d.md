# Metric3D

> Yin 2023 · [논문](https://arxiv.org/abs/2307.10984)

**한 줄 요약** — 모든 학습 이미지(또는 그 라벨)를 초점 거리 모호성을 제거하는 canonical camera 공간으로 변환하여, 수천 개의 서로 다른 카메라에 걸쳐 zero-shot *metric* 단안 깊이를 달성한다.

## 문제

단일 이미지 metric 깊이는 두 가지 실패 모드 사이에 갇혀 있다. 최신 metric 모델은 단일 카메라 모델만 다룰 수 있고 metric 모호성 때문에 혼합 데이터로 학습할 수 없다: pinhole 투영에서, 실제 크기 $\hat{S}$인 물체가 크기 $\hat{S}'$로 촬영되면

$$d_a = \hat{S}\,\frac{\hat{f}}{\hat{S}'} = \hat{S}\cdot\alpha$$

를 만족하므로, 동일한 픽셀 패턴이 서로 다른 초점 거리 $\hat{f}$ 아래서는 서로 다른 metric 깊이에 대응한다(대조적으로 센서와 픽셀 크기는 영향을 주지 않음이 밝혀졌다). 대규모 혼합 데이터셋(MiDaS 스타일)으로 학습된 모델은 affine-invariant 깊이로 물러나야만 zero-shot 일반화를 달성하며, 이는 실제 스케일을 복원할 수 없다. Metric3D는 zero-shot metric 모델의 핵심이 대규모 혼합 데이터 학습과 이 카메라 모호성의 명시적 해결을 결합하는 데 있음을 보인다.

## 방법 및 아키텍처

**Canonical camera space transformation (CSTM).** 정형화된(canonical) 초점 거리 $f^c$를 고정하고, 모든 학습 데이터를 그 카메라로 촬영된 것처럼 다음 두 가지 동등한 방식 중 하나로 변환한다:

- *CSTM_label*: 이미지는 그대로 두고 ground-truth 깊이를 $\omega_d = \frac{f^c}{f}$만큼 스케일한다, 즉 $\mathbf{D}^*_c = \omega_d \mathbf{D}^*$;
- *CSTM_image*: 이미지(와 광학 중심)를 $\omega_r = \frac{f^c}{f}$만큼 resize한다, 즉 $\mathbf{I}_c = \mathcal{T}(\mathbf{I}, \omega_r)$이며, 라벨은 스케일링 없이 resize된다.

그 뒤 random crop을 적용한다(FOV와 광학 중심만 바꿀 뿐 metric은 바꾸지 않는다). 네트워크 $\mathcal{N}_d$는 canonical 공간에서 $\min_\theta \left|\mathcal{N}_d(\mathbf{I}_c, \theta) - \mathbf{D}^*_c\right|$로 학습되며, 추론 시 **de-canonicalization**이 예측값을 실제 카메라로 되돌린다 — 예를 들어 CSTM_label의 경우 $\mathbf{D} = \frac{1}{\omega_d}\mathbf{D}_c$. 테스트 시에는 초점 거리만 필요하며, 이 모듈은 기존의 어떤 단안 깊이 모델에도 끼워 넣을 수 있다.

**Random proposal normalization loss (RPNL).** 이미지 전체에 대한 scale-shift 정규화는 세밀한 지역적 깊이 대비를 뭉개버리므로, $M=32$개의 patch $p_i$(이미지 크기의 0.125–0.5)를 무작위로 잘라내어 각각을 median absolute deviation으로 정규화한 뒤 L1으로 비교한다:

$$L_{RPNL} = \frac{1}{MN}\sum_{p_i}^{M}\sum_{j}^{N}\left|\frac{d^*_{p_i,j}-\mu(d^*_{p_i,j})}{\frac{1}{N}\sum_j |d^*_{p_i,j}-\mu(d^*_{p_i,j})|} - \frac{d_{p_i,j}-\mu(d_{p_i,j})}{\frac{1}{N}\sum_j |d_{p_i,j}-\mu(d_{p_i,j})|}\right|$$

여기서 $\mu(\cdot)$는 median이다. 전체 손실은 $L = L_{PWN} + L_{VNL} + L_{silog} + L_{RPNL}$이다(pair-wise normal 회귀, virtual normal, scale-invariant log, 그리고 RPNL).

**Backbone과 학습.** ConvNeXt-Large encoder(ImageNet-22K로 초기화)를 가진 UNet이 11개의 공개 RGB-D 데이터셋 — 1만 개 이상의 카메라에 걸친 800만 장 이상의 이미지, 모두 알려진 intrinsic을 가짐 — 으로 학습되며, 미니배치별로 균형이 맞춰지고, $512\times 960$ crop, 48개의 A100 GPU에서 50만 iteration 동안 학습된다. CSTM 없이는 동일한 모델이 혼합 metric 데이터에서 수렴하지 못한다; intrinsic을 추가 입력 채널로 인코딩하는 방식(CamConvs)은 학습은 되지만 명백히 더 나쁜 성능을 보인다.

## 실험 결과

Metric3D는 7개의 zero-shot 벤치마크에서 state-of-the-art 성능을 달성했으며 제2회 Monocular Depth Estimation Challenge에서 우승했다. Zero-shot으로 (두 데이터셋 모두 학습에 사용하지 않고) CSTM_label은 NYUv2에서 $\delta_1$ 0.944 / AbsRel 0.083, KITTI에서 $\delta_1$ 0.964 / AbsRel 0.058을 달성한다 — 완전 지도학습된 도메인 내 SOTA(NeWCRFs: 0.922 / 0.095와 0.974 / 0.052)에 필적하는 수준이다. 단일 이미지로부터 얻은 metric point cloud는 메타데이터의 intrinsic만으로 Flickr 사진에서도 실측(metrology)을 가능하게 한다. SLAM의 경우, 이 metric 깊이를 KITTI odometry의 Droid-SLAM에 그대로 입력하면 이동 drift $t_{rel}$이 크게 줄어든다: Seq 00은 33.9에서 1.44로, Seq 02는 34.88에서 2.64로, Seq 05는 23.4에서 1.44로, Seq 09는 21.7에서 1.63으로 — ORB-SLAM2(예: Seq 00에서 11.43)보다 훨씬 낮은 수준이며, metric-scale의 dense mapping도 함께 가능해진다; ETH3D의 작은 실내 SLAM 장면에서의 개선은 더 작다.

## SLAM에서의 의미

SLAM은 *metric* 깊이를 필요로 한다 — relative 깊이는 단안 시스템의 scale을 고정하거나 metric map fusion에 투입될 수 없다. Metric3D의 canonical-camera 정규화는 카메라에 무관한 metric 깊이의 표준 레시피가 되었으며(UniDepth, Depth Pro 등이 채택; Metric3D v2는 ViT backbone과 surface normal을 추가), 로봇이 어떤 카메라를 달고 있든 카메라별 미세조정 없이 plug-and-play 깊이 사전을 가능하게 한다. 자체 실험이 그 성과를 직접 보여준다: 이 깊이를 사용한 단안 SLAM 시스템은 RGB-D SLAM처럼 동작하며, scale drift가 대부분 사라진다.

## 관련 문서

- [MiDaS](midas.md) — scale을 무시하는 relative-depth 기준선
- [ZoeDepth](zoedepth.md) — metric 깊이로 가는 metric-bins 방식의 대안 경로
- [Depth Anything V2](depth-anything-v2.md) — 깊이 foundation model 계보에서의 데이터 스케일링 후속작
- [DROID-SLAM](../level-03-monocular-slam/droid-slam.md) — Metric3D가 KITTI에서 그 깊이를 투입하는 SLAM 시스템
- [Pinhole camera model](../level-01-beginner/pinhole-camera-model.md) — 모호성을 만드는 intrinsic
