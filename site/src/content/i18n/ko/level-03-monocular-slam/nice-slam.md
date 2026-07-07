# NICE-SLAM

> Zhu & Peng 2022 · [논문](https://arxiv.org/abs/2112.12130)

**한 줄 요약** — 확장 가능한 신경 암시적 SLAM을 위해 다중 레벨 지역 특징 그리드(거친, 중간, 세밀)를 가진 계층적 장면 표현을 도입하여, 큰 장면에서의 iMAP의 한계를 극복합니다.

## 문제

신경 암시적 표현은 iMAP과 함께 막 SLAM에 도입되었지만, "기존 방법들은 지나치게 부드러운 장면 재구성을 만들어내며 큰 장면으로 확장하는 데 어려움을 겪는다" — 이 한계는 "주로 관측 내의 지역 정보를 포함하지 않는 단순한 완전 연결 네트워크 아키텍처 때문"입니다 (초록). 단일 전역 MLP는 새롭고 잠재적으로 부분적인 RGB-D 관측이 들어올 때마다 전역적으로 갱신되어야 하므로, 새로운 영역을 학습하면서 이전 영역을 잊어버립니다. NICE-SLAM (CVPR 2022)은 사전 학습된 네트워크로 디코딩되는 다중 레벨 특징 그리드에 정보를 *지역적으로* 저장하는 표현으로 이를 해결합니다.

## 방법 및 아키텍처

장면은 **네 개의 특징 그리드**로 인코딩됩니다: 거친 (2 m 복셀, 미관측 기하학을 외삽), 중간 (32 cm), 세밀 (16 cm) 레벨을 위한, 동결된 MLP 디코더 $f^l$ ($l\in\{0,1,2\}$)을 가진 세 개의 기하학 그리드 $\phi^l_\theta$와, 디코더 $\mathbf{g}_\omega$를 가진 하나의 색상 그리드 $\psi_\omega$입니다. 점 $\mathbf{p}\in\mathbb{R}^3$는 삼선형 보간 (tri-linear interpolation)을 통해 디코딩됩니다. 중간 레벨은 점유율 $o^1_{\mathbf{p}}=f^1(\mathbf{p},\phi^1_\theta(\mathbf{p}))$을 주고, 세밀 레벨은 중간 특징에 조건화된 잔차를 더합니다,

$$\Delta o^{1}_{\mathbf{p}}=f^{2}(\mathbf{p},\phi^{1}_{\theta}(\mathbf{p}),\phi^{2}_{\theta}(\mathbf{p})),\qquad o_{\mathbf{p}}=o^{1}_{\mathbf{p}}+\Delta o^{1}_{\mathbf{p}},$$

색상은 $\mathbf{c}_{\mathbf{p}}=\mathbf{g}_\omega(\mathbf{p},\psi_\omega(\mathbf{p}))$입니다. 거친/중간/세밀 디코더는 **ConvONet의 일부로 사전 학습된 후** 동결됩니다 — 그리드 특징만 최적화되는데, 이는 최적화를 안정화하고 학습된 실내 기하학 사전 정보를 주입합니다. 거친 그리드는 관측되지 않은 영역 밖에서도 점유율을 예측할 수 있어, 뷰의 많은 부분이 새로운 경우에도 추적이 유지되도록 합니다.

**렌더링**: 각 광선을 따라 $N=N_{\text{strat}}+N_{\text{imp}}$개의 점이 샘플링됩니다 (계층화된 샘플링에 측정된 깊이 근처의 샘플을 더함). 점 $\mathbf{p}_i$에서의 광선 종료 확률은 $w_i=o_{\mathbf{p}_i}\prod_{j=1}^{i-1}(1-o_{\mathbf{p}_j})$이며, 깊이/색상은 다음으로 렌더링됩니다

$$\hat{D}=\sum_{i=1}^{N}w_i d_i,\qquad \hat{I}=\sum_{i=1}^{N}w_i\mathbf{c}_i,$$

광선별 깊이 분산 $\hat{D}_{var}=\sum_i w_i(\hat{D}-d_i)^2$도 거친 레벨과 세밀 레벨에서 계산됩니다.

**매핑**은 현재 프레임과 선택된 키프레임에서 $M$개의 픽셀을 샘플링한 후 단계적으로 최적화합니다: $L_1$ 깊이 손실 $\mathcal{L}_g$로 중간 그리드만 먼저, 그다음 중간+세밀, 그다음 $K$개 키프레임의 포즈도 함께 정제하는 지역 번들 조정 $\min_{\theta,\omega,\{\mathbf{R}_i,\mathbf{t}_i\}}(\mathcal{L}^c_g+\mathcal{L}^f_g+\lambda_p\mathcal{L}_p)$ ($\mathcal{L}_p$는 $L_1$ 색상 손실입니다). **추적**은 병렬로 실행되며, 현재 프레임의 $\{\mathbf{R},\mathbf{t}\}$를 $\min(\mathcal{L}_{g\_var}+\lambda_{pt}\mathcal{L}_p)$로 최적화합니다. 여기서

$$\mathcal{L}_{g\_var}=\frac{1}{M_t}\sum_{m=1}^{M_t}\frac{|D_m-\hat{D}^{c}_m|}{\sqrt{\hat{D}^{c}_{var}}}+\frac{|D_m-\hat{D}^{f}_m|}{\sqrt{\hat{D}^{f}_{var}}}$$

는 물체 경계와 같은 불확실한 영역의 가중치를 낮춥니다. 손실이 프레임 중앙값의 10배를 초과하는 픽셀은 제거되어, 동적 물체에 대한 강건성을 제공합니다. 키프레임은 현재 뷰와 시각적으로 겹치는 프레임 중에서만 선택됩니다 — 이는 그리드 갱신이 지역적이므로 뷰 밖의 기하학이 고정된 채 유지되기 때문에 가능합니다 (구조상 파괴적 망각이 없습니다). 시스템은 세 개의 스레드로 실행됩니다: 거친 매핑, 중간/세밀 + 색상 매핑, 추적입니다.

## 실험 결과

다섯 개의 데이터셋에서 평가되었습니다: Replica, ScanNet, TUM RGB-D, Co-Fusion, 그리고 자체 촬영한 다중 방 아파트입니다.

- **Replica (8개 장면 평균)**: 깊이 L1 3.53 cm, 정확도 2.85 cm, 완성도 3.00 cm, 완성 비율 89.33% — iMAP*의 7.64 / 6.95 / 5.33 / 66.60%와 DI-Fusion의 23.33 / 19.40 / 10.19 / 72.96% 대비 우수하며, 모델 크기는 12.02 MB입니다.
- **ScanNet 추적**: 6개 장면 평균 ATE RMSE 9.63 cm 대 iMAP*의 36.67, DI-Fusion의 78.89; 어블레이션에서는 지역 BA와 색상 손실이 모두 중요함을 보여줍니다 (지역 BA 없이: 37.74).
- **TUM RGB-D**: fr1/desk, fr2/xyz, fr3/office에서 ATE RMSE 2.7 / 1.8 / 3.0 cm — 암시적 방법 중 최고입니다 (iMAP: 4.9 / 2.0 / 5.8). 다만 고전적인 ORB-SLAM2가 여전히 더 우수합니다 (1.6 / 0.4 / 1.0).
- **연산량**: 쿼리 점당 104.16×10³ FLOPs 대 iMAP의 443.91×10³; 반복당 추적 47 ms, 매핑 130 ms 대 iMAP의 101 / 448 ms.

## SLAM에서의 의미

NICE-SLAM은 신경 암시적 SLAM을 방 규모 및 그 이상의 환경으로 확장 가능하게 만들어, 이 분야를 iMAP의 개념 증명 단계에서 진전시켰습니다. 이 계층적 특징 그리드 설계는 ESLAM (트리플레인), Co-SLAM (해시 그리드), Point-SLAM (신경 포인트)과 같은 후속 연구들이 채택한 표준 패턴이 되었습니다. iMAP과 함께, 이후 대부분의 신경 SLAM 논문들이 사용하는 Replica / TUM RGB-D / ScanNet 평가 프로토콜을 확립했습니다.

## 관련 문서

- [iMAP](imap.md)
- [Co-SLAM](co-slam.md)
- [ESLAM](eslam.md)
- [Point-SLAM](point-slam.md)
- [NICER-SLAM](nicer-slam.md)
- [NeRF](../level-05-deep-learning/nerf.md)
