# Depth Anything

> Yang 2024 · [논문](https://arxiv.org/abs/2401.10891)

**한 줄 요약** — Depth Anything(CVPR 2024)은 약 6200만 장의 자동 어노테이션된 비라벨 이미지로 학습을 확장하여 임의의 장면에 대한 강력한 zero-shot 일반화를 달성한, 단안 깊이 추정을 위한 파운데이션 모델이다.

## 문제

지도 학습 기반 단안 깊이 모델은 라벨링된 깊이 데이터가 부족하기 때문에 정체를 겪는다 — 공개 데이터셋을 다 합쳐도 대략 백만 장 남짓인 반면, 라벨이 없는 인터넷 이미지 풀은 실질적으로 무제한이다. Depth Anything이 내세우는 목표는 의도적으로 화려하지 않다: "새로운 기술적 모듈을 추구하지 않고" 대규모 비라벨 데이터를 깊이 추정에 실제로 유용하게 만들어 "어떤 상황의 어떤 이미지도 다룰 수 있는 단순하지만 강력한 파운데이션 모델"을 만드는 것이다.

## 방법 및 아키텍처

**기본 모델.** DINOv2로 초기화된 ViT 인코더와 DPT 디코더로 구성되며, MiDaS의 전통을 따라 학습된다: 깊이는 disparity $d = 1/t$로 변환되어 맵별로 $0 \sim 1$로 정규화되고, 다중 데이터셋 학습에는 affine-invariant 손실이 사용된다

$$\mathcal{L}_l = \frac{1}{HW}\sum_{i=1}^{HW} \rho(d_i^*, d_i), \qquad \rho(d_i^*, d_i) = |\hat{d}_i^* - \hat{d}_i|$$

이미지별 정렬은 $\hat{d}_i = \frac{d_i - t(d)}{s(d)}$, $t(d) = \mathrm{median}(d)$, $s(d) = \frac{1}{HW}\sum_i |d_i - t(d)|$로 이루어진다. teacher $T$는 이 방식으로 6개 데이터셋(BlendedMVS, DIML, HRWSI, IRS, MegaDepth, TartanAir)의 150만 장 라벨링된 이미지로 학습되며; 하늘 영역은 세그멘테이션되어 disparity 0으로 설정된다.

**데이터 엔진.** teacher는 8개의 공개 소스(SA-1B, ImageNet-21K, LSUN, BDD100K, Google Landmarks, Objects365, Open Images V7, Places365)에서 가져온 6200만 장의 비라벨 이미지에 pseudo-라벨을 붙인다: $\hat{\mathcal{D}}^u = \{(u_i, T(u_i)) \mid u_i \in \mathcal{D}^u\}$. student $S$는 (T로부터 미세 조정되지 않고) 재초기화되어 배치당 라벨 데이터와 pseudo-라벨 데이터를 1:2 비율로 학습된다.

**Student에게 도전 부여하기.** naive한 self-training은 아무것도 얻지 못했다 — teacher와 student가 아키텍처를 공유하고 비슷한 오류를 만들기 때문이다. 두 가지 전략이 비라벨 데이터의 잠재력을 끌어낸다. (1) *student의 비라벨 입력에만 적용되는 강한 perturbation*: 강한 color jittering과 Gaussian blur, 그리고 공간적 CutMix, $u_{ab} = u_a \odot M + u_b \odot (1-M)$ (직사각형 마스크 $M$, 50% 확률로 적용); 비라벨 손실 $\mathcal{L}_u$는 $M$과 $1-M$ 내부에서 각각 $T(u_a)$와 $T(u_b)$에 대한 affine-invariant 손실을 면적으로 가중하여 합산한 것이며, teacher는 항상 깨끗한 이미지를 본다. 이는 모델이 "적극적으로 추가적인 시각적 지식을 탐색하고 강건한 표현을 획득하도록" 강제한다. (2) 별도의 세그멘테이션 보조 태스크(이산적인 마스크가 너무 많은 정보를 잃어 실패했다) 대신 *feature alignment를 통한 시맨틱 사전 정보*:

$$\mathcal{L}_{feat} = 1 - \frac{1}{HW}\sum_{i=1}^{HW} \cos(f_i, f_i')$$

student의 특징 $f$를 동결된 DINOv2 인코더의 특징 $f'$와 정렬시키되, 유사도가 이미 허용 마진 $\alpha = 0.85$를 넘는 픽셀은 건너뛴다 — 물체들은 시맨틱은 공유하지만 깊이는 공유하지 않으므로, 특징을 그대로 복사하면 오히려 해가 될 것이다. 전체 손실은 $\mathcal{L}_l$, $\mathcal{L}_u$, $\mathcal{L}_{feat}$의 평균이다.

**모델 패밀리.** ViT-S(2480만), ViT-B(9750만), ViT-L(3억 3530만) 인코더는 정확도와 속도를 맞바꾸며; metric 변형은 ZoeDepth 프레임워크에서 NYUv2 또는 KITTI로 인코더를 미세 조정한다.

## 실험 결과

6개의 미학습(unseen) 데이터셋에서의 zero-shot 상대 깊이를, 최고 성능의 MiDaS v3.1 모델(ViT-L급)과 비교하면: Depth Anything ViT-L이 모든 경우에서 우세하다 — KITTI AbsRel 0.076 대 0.127 ($\delta_1$ 0.947 대 0.850), NYUv2 0.043 대 0.048, Sintel 0.458 대 0.587, DDAD 0.230 대 0.251, ETH3D 0.127 대 0.139, DIODE 0.066 대 0.075 — 게다가 MiDaS는 KITTI/NYUv2에서 완전한 zero-shot도 아니었다(그 이미지들로 학습했음; Depth Anything은 하지 않았다). ViT-B 모델은 이미 MiDaS의 더 큰 ViT-L을 능가하며, 심지어 ViT-S(1/10 미만의 크기)조차 Sintel, DDAD, ETH3D에서 우세하다. 도메인 내 metric 깊이(ZoeDepth 프레임워크)를 위해 미세 조정하면, 이전 최고 성능(VPD) 대비 NYUv2 $\delta_1$을 0.964에서 0.984로, AbsRel을 0.069에서 0.056으로 끌어올리고, KITTI $\delta_1$을 0.978에서 0.982로 끌어올린다; 논문은 또한 더 강력한 zero-shot metric 전이, 동일한 인코더로부터의 강력한 시맨틱 세그멘테이션, 그리고 더 나은 깊이 조건 ControlNet도 보여준다.

## SLAM에서의 의미

단안 SLAM은 오랫동안 스케일, 맵 밀도, 초기화, 그리고 저-시차(low-parallax) 모션에서의 강건성을 위해 어디서나 통하는 깊이 사전 정보를 원해왔다. Depth Anything은 "깊이 파운데이션 모델을 그냥 호출한다"를 현실적인 설계 선택으로 만들었다: 임의의 실내/실외 이미지에서 그럴듯한 밀집 깊이를 만들어내는 단일 네트워크가, 실시간 프론트엔드에 쓰기에 충분히 빠른 변형까지 갖췄다. 이는 기하학적 인지를 위한 데이터 스케일링 패러다임을 공고히 했다 — 다양한 비라벨 데이터가 더 많은 지도 라벨을 이긴다는 것 — 그리고 (V2와 함께) dense/신경망 SLAM 파이프라인에 꽂아 넣는 기본 깊이 백본이 되었다.

## 관련 문서

- [MiDaS](midas.md) — 계승한 affine-invariant 다중 데이터셋 학습 레시피
- [DPT](dpt.md) — dense-prediction 디코더 아키텍처
- [Depth Anything V2](depth-anything-v2.md) — 합성 라벨로 학습된 후속작
- [Metric3D](metric3d.md) — metric 깊이로 가는 camera-aware 경로
- [Marigold](marigold.md) — zero-shot 깊이를 위한 diffusion 기반 대안
- [ZoeDepth](zoedepth.md) — metric 변형에 사용된 metric 미세 조정 프레임워크
