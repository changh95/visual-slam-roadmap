# SfM-Learner

> Zhou 2017 · [논문](https://arxiv.org/abs/1704.07813)

**한 줄 요약** — 레이블이 없는 단안 비디오로부터 광도 뷰 합성(photometric view synthesis)만을 유일한 지도 신호로 사용하여 단일 뷰 깊이 네트워크와 다중 뷰 포즈 네트워크를 공동으로 학습시키며, 자기지도 깊이 + ego-motion 분야를 창시했습니다.

## 문제

지도 학습 기반 깊이 및 포즈 추정은 값비싼 실측값 — 깊이를 위한 LiDAR 스캔, 포즈를 위한 모션 캡처 또는 고급 GPS/INS — 을 필요로 하며, 이는 학습 데이터를 소수의 계측된 데이터셋으로 제한합니다. 그러나 구조화되지 않은 단안 비디오는 본질적으로 무료이며 무한합니다.

핵심 통찰: 뷰 합성 시스템은 "장면의 geometry와 카메라 포즈에 대한 중간 예측이 물리적 실측값과 일치할 때만 일관되게 잘 동작한다"는 것입니다. 따라서 네트워크를 뷰 합성이라는 '메타' 태스크로 학습시키면, 깊이와 ego-motion이 중간 예측으로서 자연스럽게 나타나야 합니다.

## 방법 및 아키텍처

- **손실을 통해서만 결합되는 두 네트워크.** 깊이 네트워크(스킵 연결과 다중 스케일 부수 예측을 가진 DispNet 스타일 인코더-디코더; 깊이 출력 $1/(\alpha \cdot \mathrm{sigmoid}(x)+\beta)$, $\alpha=10,\beta=0.01$)는 단일 타겟 프레임을 봅니다. 포즈 네트워크(타겟과 소스 프레임을 concat; 7개의 stride-2 합성곱 다음에 $6(N-1)$ 채널을 가진 $1\times1$ 합성곱 — 소스 뷰당 3개의 오일러 각과 3D 이동 — 그리고 전역 평균 풀링)은 상대 포즈 $\hat{T}_{t\rightarrow s}$를 예측합니다. 둘은 공동으로 학습되지만 테스트 시에는 독립적으로 실행됩니다.
- **뷰 합성 목적 함수.** 타겟 $I_t$와 소스 $I_s$를 가지고:

$$\mathcal{L}_{vs}=\sum_{s}\sum_{p}\left|I_{t}(p)-\hat{I}_{s}(p)\right|,$$

  여기서 $\hat{I}_{s}$는 타겟 프레임으로 워프된 $I_s$입니다. 각 타겟 픽셀 $p_t$는 다음을 통해 소스 뷰로 투영됩니다.

$$p_{s}\sim K\hat{T}_{t\rightarrow s}\hat{D}_{t}(p_{t})K^{-1}p_{t},$$

  ($K$는 내부 파라미터, $\hat{D}_t$는 예측된 깊이) 그리고 $\hat{I}_s(p_t)$는 4-픽셀 이웃의 미분 가능한 bilinear 샘플링(spatial transformer network)으로 채워집니다. 정확한 깊이 *그리고* 포즈만이 워프를 photo-consistent하게 만듭니다.
- **설명 가능성 마스크(explainability mask).** 세 번째 헤드(포즈 인코더를 공유, 5개의 deconv 레이어, 쌍마다 softmax)가 손실에 가중치를 부여하는 소프트 마스크 $\hat{E}_{s}$를 예측합니다: $\mathcal{L}_{vs}=\sum_{s}\sum_{p}\hat{E}_{s}(p)\,|I_{t}(p)-\hat{I}_{s}(p)|$, 이는 움직이는 객체, 가림, non-Lambertian 효과를 할인합니다; 1로 향하는 교차 엔트로피 정규화 항이 자명한 전부-0 마스크를 방지합니다.
- **그래디언트 지역성(locality) 수정.** Bilinear-샘플링 그래디언트는 지역적이므로, 전체 목적 함수는 이미지 피라미드에 걸쳐 적용되며 매끄러움을 위한 2차 깊이 그래디언트에 대한 $L_1$ 페널티가 함께 적용됩니다:

$$\mathcal{L}_{final}=\sum_{l}\mathcal{L}_{vs}^{l}+\lambda_{s}\mathcal{L}_{smooth}^{l}+\lambda_{e}\sum_{s}\mathcal{L}_{reg}(\hat{E}_{s}^{l}).$$

- **학습.** TensorFlow; $\lambda_s=0.5/l$, $\lambda_e=0.2$; Adam(lr 0.0002, 배치 4), 약 150K 반복; 128×416에서 3프레임 스니펫(44,540개 KITTI 시퀀스: 40,109 train / 4,431 val).

## 실험 결과

- **KITTI 깊이(Eigen split, 697개 테스트 이미지, median-scaled)**: Abs Rel 0.208(KITTI로 학습), Cityscapes 사전 학습 시 0.198 — *깊이-지도학습* Eigen 등(0.203 Fine)과 비슷하고 *포즈-지도학습* Garg 등에 근접합니다(cap 50m: 0.201 대 0.169), 다만 동시대의 stereo 학습 기반 Godard 등(0.148)보다는 뒤처집니다. 레이블이 전혀 없다는 점을 고려하면 주목할 만합니다.
- 설명 가능성 ablation은 미미합니다(0.221 → 0.208 Abs Rel) — KITTI는 3프레임 스니펫에서 대부분 정적입니다.
- **포즈(KITTI odometry 09/10, 5-프레임 스니펫에 대한 ATE)**: 0.021±0.017 / 0.020±0.015m — 같은 5-프레임 스니펫에서 실행한 ORB-SLAM(short)(0.064±0.141 / 0.064±0.130)과 평균-odometry 기준선보다 우수하며, 전체 시퀀스에 루프 클로저와 재위치추정(relocalization)을 사용하는 ORB-SLAM(full)(0.014±0.008 / 0.012±0.011)에만 뒤처집니다.
- **Make3D zero-shot**: Make3D 학습 없이 Abs Rel 0.383 — 전역적 배치(layout)는 포착하지만 Make3D-지도학습 방법들과는 격차가 있습니다.
- 논문에 명시된 상속된 한계: 스케일 모호성이 남아 있고, 내부 파라미터는 알려져 있어야 하며, 정적 장면/photo-consistency 가정이 정확도를 제한합니다 — direct SLAM을 제한하는 것과 동일한 가정입니다.

## SLAM에서의 의미

SfM-Learner는 고전적 SfM/SLAM의 목적 함수 — 뷰 전체에 걸친 광도 일관성 — 이 런타임 비용이 아니라 학습 신호로 사용될 수 있음을 보여주었으며, 이를 통해 네트워크가 원시 비디오로부터 깊이와 ego-motion을 학습할 수 있게 했습니다. 이 뷰 합성 손실은 Monodepth2, D3VO, 그리고 학습된 깊이 사전 분포를 다시 SLAM 파이프라인에 공급하는 수십 개의 자기지도 VO/깊이 시스템의 표본이 되었습니다. 이는 direct SLAM과 종단간 학습 기반 odometry 사이의 개념적 다리를 이룹니다.

## 관련 문서

- [Self-supervised depth](../level-03-monocular-slam/self-supervised-depth.md) — 이 논문이 시작한 개념
- [MonoDepth](monodepth.md) — stereo-지도학습 사촌 접근법
- [DeepVO](deepvo.md) — 지도학습 기반 학습된 odometry 대응
- [UndeepVO](undeepvo.md) — stereo 학습으로부터 절대 스케일을 복원하는 후속 연구
- [DeMoN](demon.md) — 동시대의 지도학습 기반 two-view 깊이 + 모션
- [D3VO](../level-03-monocular-slam/d3vo.md) — direct VO에 통합된 자기지도 예측
