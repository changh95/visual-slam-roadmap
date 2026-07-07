# FlowNet

> Dosovitskiy 2015 · [논문](https://arxiv.org/abs/1504.06852)

**한 줄 요약** — Optical flow 추정을 위한 최초의 종단간 CNN으로, correlation layer와 이 분야 전체의 표준이 된 합성 Flying Chairs 학습 데이터셋을 도입했습니다.

## 문제

2015년까지 CNN은 인식 작업을 변화시켰지만, optical flow는 그 성공 사례에 포함되지 않았습니다: Horn-Schunck 계열의 변분법 (DeepFlow, EpicFlow)이 여전히 지배적이었으며, 프레임당 수 초에서 수 분이 걸렸습니다. Flow는 이전의 CNN 응용과 근본적으로 다릅니다 — 픽셀별 위치 파악뿐 아니라 두 이미지 사이의 특징 *매칭*을 요구합니다. 두 가지 장벽이 이를 학습하는 것을 막았습니다: 어떤 아키텍처가 dense한 두 프레임 간 대응 관계를 표현할 수 있는지 아무도 몰랐고, CNN 규모에서 dense ground-truth flow를 가진 데이터셋도 없었습니다 (실제 장면에 대한 참 대응점을 얻는 것은 거의 불가능합니다; 가장 큰 데이터셋인 Sintel도 학습 쌍이 1,041개뿐이었습니다). FlowNet은 두 문제 모두를 공략했습니다.

## 방법 및 아키텍처

각각 9개의 컨볼루션 레이어를 가진 두 개의 encoder-decoder 아키텍처 (6개 레이어에서 stride 2, 각 레이어 후 ReLU, fully-connected 레이어가 없어 입력 크기가 임의적임; 필터는 $7\times7$에서 $5\times5$, $3\times3$로 축소되며 채널은 각 stride-2 레이어에서 대략 두 배가 됨):

- **FlowNetSimple**은 두 이미지를 6채널 입력으로 쌓아, 일반적인 네트워크가 스스로 모션을 추출하는 방법을 학습하도록 합니다.
- **FlowNetCorr**는 두 이미지를 별도의 동일한 스트림으로 처리한 후, 명시적인 **correlation layer** — 이 논문의 핵심 아키텍처 기여 — 로 그 특징 맵 $\mathbf{f}_1,\mathbf{f}_2:\mathbb{R}^2\to\mathbb{R}^c$을 비교합니다. $\mathbf{x}_1$과 $\mathbf{x}_2$를 중심으로 하는 패치들의 correlation은

$$c(\mathbf{x}_1,\mathbf{x}_2)=\sum_{\mathbf{o}\in[-k,k]\times[-k,k]}\langle \mathbf{f}_1(\mathbf{x}_1+\mathbf{o}),\,\mathbf{f}_2(\mathbf{x}_2+\mathbf{o})\rangle$$

  패치 크기 $K:=2k+1$에 대해 구조적으로는 컨볼루션의 한 단계이지만, *데이터와 데이터*를 컨볼브하므로 학습 가능한 가중치가 없습니다. 모든 $w^2 h^2$개의 패치 쌍을 비교하는 것은 다루기 어려우므로, 변위는 $d$로 제한되고 (이웃 $D:=2d+1$), stride $s_1,s_2$가 사용되며, 상대 변위는 채널로 구성되어 $w\times h\times D^2$ 출력을 만듭니다. 선택된 파라미터: $k{=}0$, $d{=}20$, $s_1{=}1$, $s_2{=}2$.

**정제**: 'upconvolutional' 레이어 (unpooling + 컨볼루션)가 대략적인 특징을 확장합니다; 각 단계에서 upconvolve된 특징은 대응하는 contractive part 특징 맵 및 업샘플링된 더 대략적인 flow 예측과 연결되며, 해상도를 4번 두 배로 늘려 1/4 해상도에 도달한 후, bilinear 업샘플링으로 전체 크기에 도달합니다. 선택적 변분 정제 ('+v')는 매칭이 없는 변분 solver의 coarse-to-fine 반복 20회와 전체 해상도 반복 5회를 실행하며, 경계를 존중하는 평활도 $\alpha=\exp(-\lambda b(x,y)^{\kappa})$를 사용합니다.

**학습**: 손실은 endpoint error (EPE — 예측 flow와 ground-truth flow 사이의 유클리드 거리, 픽셀에 대해 평균)입니다; Adam ($\beta_1{=}0.9$, $\beta_2{=}0.999$), 배치 8, 학습률 $10^{-4}$을 300k 이후 100k 반복마다 절반으로 감소 (FlowNetCorr는 그래디언트 폭발을 피하기 위해 $10^{-6}$에서 warm-up이 필요). 데이터는 목적에 맞게 구축된 **Flying Chairs** 세트입니다: 809종의 렌더링된 의자 (각 62개 뷰)가 964개의 Flickr 배경 위에서 affine 변환으로 이동하며, 변위 통계는 Sintel과 일치시켰습니다 — 정확한 dense flow를 가진 22,872개의 이미지 쌍입니다. 적극적인 온라인 증강 (이동 ±20%, 회전 ±17°, 스케일링 0.9–2.0, 노이즈, 밝기/대비/감마/색상)이 여전히 중요합니다.

## 실험 결과

- 비현실적인 Flying Chairs로만 학습했음에도, 네트워크는 실제 데이터로 일반화되어 LDOF를 능가합니다: Sintel Clean test EPE 7.28 (FlowNetC) / 7.42 (FlowNetS) 대 LDOF 7.56; Sintel 미세 조정 + 변분 정제 후, FlowNetS+ft+v는 Sintel Final test에서 7.22에 도달합니다 — DeepFlow (7.21)와 동등 — 그리고 KITTI test에서 7.6으로, EPPM 9.2와 LDOF 12.4를 능가합니다.
- Flying Chairs 테스트 세트에서 이 네트워크들은 모든 고전적 방법을 능가합니다: FlowNetC EPE 2.19 대 EpicFlow 2.94, DeepFlow 3.53 — 그리고 여기서는 변분 정제가 오히려 *해를 끼치는데*, 이는 현실적인 학습 데이터가 주어진다면 다른 곳에서도 네트워크가 우위를 차지할 수 있음을 암시합니다.
- GTX Titan에서 프레임당 실행 시간 0.08초 (FlowNetS) / 0.15초 (FlowNetC) — 전체 Sintel 해상도에서 5~10 fps로, EpicFlow/DeepFlow의 프레임당 16~17초 (CPU) 대비 우수하며, 실시간 방법 중 최고 정확도입니다.
- Ablation: 증강을 제거하면 Sintel에서 EPE가 약 2 px 나빠집니다; Sintel만으로 학습하면 Chairs 사전 학습 + 미세 조정보다 약 1 px 나쁩니다. FlowNetC는 약간 더 과적합되며, correlation의 변위 제한이 감지 가능한 모션을 제한하기 때문에 매우 큰 변위에서 어려움을 겪습니다 (s40+ 오차 48 px 대 FlowNetS+ft의 43.3 px).

## SLAM에서의 의미

FlowNet은 전체 deep optical flow 분야를 시작시켰으며, 그 후손들 (RAFT와 그 변형들)은 이제 DROID-SLAM과 같은 학습 기반 visual odometry 및 SLAM 시스템 내부의 dense 대응점 엔진으로 사용됩니다. 그 두 가지 핵심 유산은 10년이 지난 지금도 여전히 중요합니다: correlation layer (PWC-Net, RAFT, 그리고 본질적으로 이후의 모든 flow 네트워크에서 재사용됨)와 합성 데이터 레시피 — 정확한 ground truth를 가진 렌더링 데이터로 학습하고 Sintel/KITTI에서 평가하는 방식 — 로, FlyingThings3D, AutoFlow, Kubric이 모두 이를 따릅니다.

## 관련 문서

- [FlowNet 2.0](flownet-2-0.md) — 고전적 방법의 정확도에 도달한 스택 기반 정제
- [PWC-Net](pwc-net.md) — 콤팩트한 피라미드/워핑/cost-volume 후속 연구
- [RAFT](raft.md) — 이 계열을 대체한 all-pairs correlation 아키텍처
- [FlowNet3D](flownet3d.md) — 동일한 아이디어를 3D 포인트 클라우드로 옮긴 연구
