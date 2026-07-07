# RAFT

> Teed 2020 · [논문](https://arxiv.org/abs/2003.12039)

**한 줄 요약** — 4D all-pairs correlation volume을 구축하고, 현재 추정치 주변의 상관 정보를 조회하는 가중치 공유 ConvGRU로 단일 고해상도 optical flow 필드를 반복적으로 정제한다 — ECCV 2020 Best Paper이자 현대 optical flow의 대표 아키텍처.

## 문제

주류 딥 flow 아키텍처(PWC-Net 등)는 고전적인 coarse-to-fine 피라미드를 그대로 물려받았다: 저해상도에서 flow를 추정한 후 워핑하고 정제한다. 이 설계에는 구조적 사각지대가 있다 — 각 레벨의 cost volume은 작은 탐색 윈도우만 다루고, 작고 빠르게 움직이는 물체는 조대 해상도에서 사라지며, 피라미드 초반에 발생한 오류는 되돌리기 어렵고, 다단계 캐스케이드는 흔히 100만 회 이상의 학습 반복이 필요하다. 이전의 반복적 정제 방식들은 반복마다 가중치를 공유하지 않았거나(혹은 IRR처럼 큰 순환 유닛에 의해 제약받았다). RAFT는 다음을 묻는다: 네트워크가 *모든* 픽셀 쌍 사이의 매칭 비용을 사전 계산해두고, 경량의 학습된 최적화기가 필요할 때마다 이 볼륨을 조회하며 단일 고해상도 flow 필드를 정제한다면 어떨까?

## 방법 및 아키텍처

모두 미분 가능하고 종단간으로 학습되는 세 단계:

1. **특징 추출**: 인코더 $g_\theta : \mathbb{R}^{H \times W \times 3} \mapsto \mathbb{R}^{H/8 \times W/8 \times D}$($D = 256$, 6개의 residual block)가 두 프레임 모두를 인코딩한다. 동일한 아키텍처의 context 네트워크 $h_\theta$는 $I_1$만 인코딩한다. 둘 다 프레임 쌍마다 한 번만 실행된다.
2. **All-pairs correlation**: 시각적 유사도는 단일 행렬 곱으로 모든 픽셀 쌍에 대해 사전 계산된다.

$$C_{ijkl} = \sum_h g_\theta(I_1)_{ijh} \cdot g_\theta(I_2)_{klh}, \qquad \mathbf{C} \in \mathbb{R}^{H \times W \times H \times W}$$

   이후 마지막 두 차원이 커널 1, 2, 4, 8로 average-pooling되어 피라미드 $\{\mathbf{C}^1, \mathbf{C}^2, \mathbf{C}^3, \mathbf{C}^4\}$를 만든다. $I_2$ 차원만 풀링하는 것으로 $I_1$ 차원은 전체(1/8) 해상도로 유지되어 — 작고 빠르게 움직이는 물체를 잃지 않으면서도 큰 변위와 작은 변위를 모두 포착한다. 조회 연산자 $L_\mathbf{C}$는 현재 대응 관계 $\mathbf{x}' = \mathbf{x} + \mathbf{f}(\mathbf{x})$ 주변의 지역 그리드에서 각 레벨을 bilinear 샘플링한다.

$$\mathcal{N}(\mathbf{x}')_r = \{ \mathbf{x}' + \mathbf{dx} \mid \mathbf{dx} \in \mathbb{Z}^2,\ \lVert \mathbf{dx} \rVert_1 \le r \}$$

   레벨 $k$마다 $\mathcal{N}(\mathbf{x}'/2^k)_r$에서 인덱싱된다 — 일정한 반경이라도 더 조대한 레벨에서는 더 넓은 맥락을 커버한다(레벨 $k=4$에서의 반경 4는 원본 해상도에서 256픽셀을 커버한다).
3. **반복적 업데이트**: $\mathbf{f}_0 = \mathbf{0}$에서 시작해, 반복 업데이트 연산자(단 270만 파라미터, 모든 반복에서 가중치 공유)가 상관 조회 결과, flow 특징, context 특징 $x_t$를 입력받아 컨볼루션 GRU를 통해 잔차 업데이트 $\mathbf{f}_{k+1} = \mathbf{f}_k + \Delta\mathbf{f}$를 산출한다:

$$z_t = \sigma(\mathrm{Conv}_{3\times3}([h_{t-1}, x_t], W_z)), \qquad r_t = \sigma(\mathrm{Conv}_{3\times3}([h_{t-1}, x_t], W_r))$$

$$\tilde{h}_t = \tanh(\mathrm{Conv}_{3\times3}([r_t \odot h_{t-1}, x_t], W_h)), \qquad h_t = (1 - z_t) \odot h_{t-1} + z_t \odot \tilde{h}_t$$

   이 연산자는 1차 최적화기를 모방하지만, 테일러 선형화된 데이터 항 대신 하강 방향 자체를 *학습*으로 제안한다. 유계 활성 함수는 고정점으로의 수렴을 유도하며, 발산 없이 100회 이상의 반복도 가능하게 한다. Flow는 1/8 해상도에서 예측된 후, 각 픽셀의 3x3 조대 이웃에 대한 학습된 convex 결합으로(softmax를 통한 가중치) 업샘플링된다.

지도(supervision)는 지수적으로 증가하는 가중치로 추정치 전체 시퀀스를 다룬다:

$$\mathcal{L} = \sum_{i=1}^{N} \gamma^{N-i} \lVert \mathbf{f}_{gt} - \mathbf{f}_i \rVert_1, \qquad \gamma = 0.8$$

학습은 FlyingChairs 후 FlyingThings, 이어서 벤치마크 파인튜닝 순으로 진행된다. 비디오에서는 warm-start 초기화가 이전 프레임의 flow를 순방향으로 투영한다.

## 실험 결과

- **Sintel(final pass, 테스트)**: EPE 2.855px로, 이전 최고 발표 결과(4.098px)에서 30%의 오차 감소를 달성했으며, clean과 final pass 모두에서 1위를 기록했다. **KITTI**: F1-all 5.10%로, 이전 최고 발표 결과(6.10%)에서 16% 감소했으며, 모든 optical flow 방법 중 1위다.
- **일반화**: 합성 C+T 데이터만으로 학습해 KITTI-15(train)에서 EPE 5.04px를 기록했다(이전 최고 딥 네트워크의 8.36에서 40% 감소). Sintel train clean에서 EPE 1.43으로, FlowNet2보다 29% 낮다.
- **효율성**: 1088x436 비디오에서 10fps(GTX 1080Ti); 다른 아키텍처보다 10배 적은 반복으로 학습된다. 100만 파라미터의 RAFT-S는 6배 이상 큰 PWC-Net과 VCN을 모두 능가한다. Ablation에서 RAFT는 3회의 업데이트 반복 후 PWC-Net을, 6회 후 FlowNet2를 능가한다. 1080p DAVIS 비디오까지 확장 가능하다(12회 반복에 550ms, 그중 all-pairs correlation은 95ms).
- Ablation은 각 설계 선택을 확인해준다: GRU가 단순 컨볼루션보다 우수하고, 가중치 공유가 비공유보다 우수하며, all-pairs가 윈도우 기반 correlation과 워핑 기반 정제보다 우수하고, 학습된 업샘플링이 bilinear보다 우수하다.

## SLAM에서의 의미

RAFT의 "correlation volume + 반복적 순환 정제" 방식은 SLAM에서 학습된 데이터 연관의 표준 기법이 되었다: DROID-SLAM과 DPVO는 본질적으로 미분 가능한 bundle adjustment 레이어를 감싸는 RAFT류의 업데이트 연산자다. 그 후속작들(scene flow를 위한 RAFT-3D, 실시간을 위한 SEA-RAFT)은 flow 벤치마크를 지배하고 있으며, RAFT가 대중화시킨 unrolled된 학습 최적화 패턴은 이제 밀집 예측과 SLAM 시스템 전반에 걸쳐 나타난다.

## 관련 문서

- [PWC-Net](pwc-net.md) — RAFT가 대체한 coarse-to-fine 전작
- [RAFT-3D](raft-3d.md) — 강체 운동 임베딩을 사용한 3D scene flow로의 확장
- [SEA-RAFT](sea-raft.md) — 단순하고 효율적인 실시간 RAFT 변형
- [FlowFormer](flowformer.md) — cost-volume 추론을 위한 Transformer 기반 후속작
- [DROID-SLAM](droid-slam.md) — RAFT 기법을 완전한 SLAM 시스템으로 만든 사례
- [DPVO](dpvo.md) — 동일 계보에서 나온 sparse patch 기반 odometry
