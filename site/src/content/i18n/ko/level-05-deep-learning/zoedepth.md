# ZoeDepth
> Bhat 2023 · [논문](https://arxiv.org/abs/2302.12288)

**한 줄 요약** — 상대 깊이 사전 학습(MiDaS/DPT 방식)과 경량 Metric Bins Module을 결합하여 zero-shot *metric* 깊이를 생성함으로써, 단안 SLAM에 절대 스케일을 가진 깊이 사전 정보를 제공합니다.

## 문제
단안 깊이 연구는 두 계열로 나뉘어 있었습니다: 도메인 전반에 일반화되지만 출력이 알려지지 않은 스케일과 시프트까지만 정의되는 *상대적* 깊이 모델(MiDaS, DPT)과, 절대 거리를 예측하지만 학습된 단일 카메라/데이터셋에 과적합되는 *metric* 깊이 모델입니다. SLAM은 두 속성을 동시에 필요로 합니다 — 어디서나 미터 단위로. 깊이 스케일이 크게 다른(실내 약 10m 대 실외 약 80m) 데이터셋들에 걸쳐 단일 metric 모델을 학습시키면 대개 성능이 저하되거나 완전히 발산합니다.

## 방법 및 아키텍처

**2단계 학습.** 1단계는 M12(12개 데이터셋 혼합)에서 scale-shift-invariant 다중 태스크 손실을 사용하여 MiDaS 방식의 인코더-디코더(BEiT384-L transformer 인코더를 사용한 DPT 아키텍처)를 상대 깊이로 사전 학습합니다. 2단계는 하나 이상의 경량 metric head(각각 백본 파라미터의 1% 미만)를 디코더에 부착하고, metric 데이터셋(NYU Depth v2 및/또는 KITTI)에서 종단간으로 미세 조정합니다.

**Metric bins 모듈.** 이 head는 bottleneck과 4개의 디코더 레벨(1/32, 1/16, 1/8, 1/4, 1/2 해상도)에 연결됩니다. 적응형 bin 아이디어를 따라, 픽셀 $i$에서의 깊이는 픽셀별 bin 중심 $c_i(k)$의 확률 가중 조합입니다:

$$d(i) = \sum_{k=1}^{N_{total}} p_i(k)\, c_i(k)$$

적은 시드 bin으로 시작하여 각 디코더 레이어에서 이를 *분할*하는 LocalBins와 달리, ZoeDepth는 bottleneck에서 모든 $N_{total}=64$개의 bin 중심을 예측하고 각 디코더 레벨에서 **attractor layer**로 이를 *조정*합니다: MLP가 픽셀당 $n_a$개의 attractor 점 $\{a_k\}$를 예측하고, 각 bin 중심은 역 attractor를 통해 $c_i' = c_i + \Delta c_i$만큼 이동합니다.

$$\Delta c_i = \sum_{k=1}^{n_a} \frac{a_k - c_i}{1 + \alpha |a_k - c_i|^{\gamma}}$$

여기서 $\alpha, \gamma$는 attractor 강도를 설정하며, $\{n_a^l\} = \{16, 8, 4, 1\}$이 디코더 레이어마다 적용됩니다. Attraction은 수축적(contracting)입니다(분할이 부과하는 폭의 합 제약 없이 정제가 이루어집니다).

**Log-binomial 확률.** bin이 순서를 가지므로, bin에 대한 확률은 단순 softmax가 아니라 예측된 모드 $q$와 온도 $t$를 갖는 이항 분포입니다:

$$p(k; N, q) = \binom{N}{k} q^k (1-q)^{N-k}$$

이는 Stirling 근사를 사용해 로그 공간에서 계산되고 $\mathrm{softmax}(\log(p_k)/t)$로 정규화되어 단일 최빈값(unimodality)을 보존합니다. 픽셀 지도 학습은 scale-invariant log 손실을 사용합니다.

**도메인 head + 라우터.** 공유 백본 위에 별도의 metric head가 실내/실외 전문가로 동작합니다. bottleneck 특징에 대한 라우터 MLP가 이미지별로 어느 head를 사용할지 선택합니다. 라벨 기반, 학습 기반, 자동 라우터의 세 가지 변형이 있어 장면 유형 라벨 없이도 배포할 수 있습니다.

## 실험 결과

NYU Depth v2 벤치마크에서: ZoeD-X-N(상대 사전 학습 없음)은 REL 0.082를 달성하여 기존 최고 성능 NeWCRFs(REL 0.095)를 13.7% 앞서며, metric-bins 설계 자체의 유효성을 입증합니다. ZoeD-M12-N(M12 사전 학습, NYU 미세 조정)은 REL 0.075로 NeWCRFs 대비 총 21% 향상됩니다. NYU + KITTI에서 공동으로 학습하면, 대표 모델인 두 head짜리 ZoeD-M12-NK는 NYU에서 REL 0.077을 유지합니다(NYU 전용 모델보다 단 2.6% 낮음). 반면 NeWCRFs는 약 15% 저하되고(0.095 → 0.109), AdaBins/PixelBins는 공동 설정에서 수렴에 실패합니다. 단일 head 변형은 8%만 저하됩니다(0.081). 여덟 개의 미경험 데이터셋으로의 zero-shot 전이에서 ZoeD-M12-NK는 NeWCRFs 대비 평균 상대 지표($\delta_1$, REL, RMSE에 대한 mRI)를 실내에서 5.3%(HyperSim)에서 46.3%(DIODE Indoor)까지, 실외에서 7.8%(Virtual KITTI 2)에서 976.4%(약 11배, DIML Outdoor)까지 개선하며, DDAD에서만 뒤처집니다(−12.8%). 코드와 사전 학습된 모델이 공개되어 있습니다.

## SLAM에서의 의미
단안 SLAM은 스케일 모호성을 가지며, MiDaS와 같은 상대 깊이 네트워크는 출력이 아핀 변환까지만 정의되기 때문에 이를 해결할 수 없습니다. ZoeDepth는 도메인 전반에 걸쳐 zero-shot metric 깊이를 실용적으로 제공한 최초의 모델로, 단일 네트워크가 단안 SLAM의 초기화, 밀집화, 스케일 드리프트 보정을 위한 스케일을 제공할 수 있게 했습니다. 그 상대-후-metric 학습 패러다임은 Metric3D, Depth Anything 같은 후속 연구에 채택되었으며, ZoeDepth는 상대 깊이 파운데이션 모델과 metric-scale 로보틱스 활용 사이를 잇는 핵심 연결점입니다.

## 관련 문서
- [MiDaS](midas.md) — 다중 데이터셋 상대 깊이 백본과 학습 기법.
- [DPT](dpt.md) — ZoeDepth가 기반으로 하는 ViT 기반 dense prediction 아키텍처.
- [Metric3D](metric3d.md) — zero-shot metric 깊이를 위한 대안적인 canonical camera 접근법.
- [Depth Anything](depth-anything.md) — 깊이 파운데이션 모델의 스케일 확장; metric 미세 조정에 ZoeDepth 프레임워크를 사용합니다.
- [Depth from sensor](../level-04-rgbd-slam/depth-from-sensor.md) — metric 깊이 네트워크가 대체하거나 보완하려는 대상.
- [Scale ambiguity](../level-03-monocular-slam/scale-ambiguity.md) — metric 깊이 사전 정보가 해결하는 단안 SLAM의 문제.
