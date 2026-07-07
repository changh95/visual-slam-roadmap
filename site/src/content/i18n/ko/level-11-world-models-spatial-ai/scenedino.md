# SceneDINO

> Jevtić 2025 · [논문](https://arxiv.org/abs/2507.06230)

**한 줄 요약** — SceneDINO는 자기지도 2D DINO 특징을 피드포워드 3D 특징 필드로 끌어올려, 단일 이미지로부터 기하학과 표현력 있는 3D 특징을 예측하고 이를 증류하여 최초의 완전 비지도 의미론적 장면 완성(SSC) 시스템을 구축합니다 — 어떠한 종류의 의미론적 또는 기하학적 정답도 필요 없습니다.

## 문제

의미론적 장면 완성은 모델이 단일 이미지로부터 장면의 3D 기하와 의미론 *모두*를 추론하도록 요구합니다 — 가려지고 한 번도 관찰되지 않은 영역을 포함해서입니다. 기존의 SSC 방법은 비용이 큰 실측 3D 복셀 레이블에 의존하며 흔히 추가적인 LiDAR 지도가 필요합니다; GaussTR과 같은 "레이블 없는" 변형조차도 강하게 지도된 기반 모델(SAM, Metric3Dv2)에 의존합니다. SceneDINO는 *완전 비지도* 환경에서 SSC에 접근하는 최초의 방법입니다: 훈련은 자기지도만으로 레이블 없는 다중 시점 이미지를 사용하고, 추론은 단일 RGB 이미지를 사용합니다.

## 방법 및 아키텍처

파이프라인은 Behind the Scenes(BTS)를 특징 헤드로 확장한 후, 3D 증류 단계를 추가합니다:

1. **피드포워드 특징 필드.** 2D 인코더-디코더 $\xi$(DINO ViT-B/8 백본 + 밀집 예측 디코더)가 입력 이미지 $I_0$를 픽셀당 임베딩 $E \in \mathbb{R}^{D_E \times H \times W}$로 매핑합니다. 카메라 거리 $d_x$에서 픽셀 $u = \pi_0(x)$로 투영된 3D 점 $x$에 대해, 2층 MLP $\phi$가 밀도와 $D{=}768$차원의 DINO 유사 특징을 예측합니다:
$$(\sigma_x, f_x) = \phi\big(e_u,\, \gamma(u, d_x)\big)$$
여기서 $e_u$는 $u$에서 양선형 보간된 $E$이고 $\gamma$는 위치 인코딩입니다.
2. **특징과 깊이의 체적 렌더링.** 각 광선을 따라 간격 $\delta_i$로 $L{=}32$개의 점을 샘플링하며, 가시성은 표준 체적 렌더링을 따릅니다, $\alpha_i = 1 - \exp(-\sigma_{x_i}\delta_i)$이고 $V_i = \prod_{j=1}^{i-1}(1-\alpha_j)$이며, 렌더링된 특징과 깊이를 줍니다
$$\tilde{f}_{u_r} = \sum_{i=1}^{L} V_i\, \alpha_i\, f_{x_i}, \qquad \tilde{d}_{u_r} = \sum_{i=1}^{L} V_i\, \alpha_i\, d_{x_i}.$$
3. **다중 시점 자기지도 훈련.** 시점은 소스/타깃 집합으로 분할되며; 타깃은 소스로부터 재구성됩니다. 손실은 광도 항 $\mathcal{L}_p = \min_{I_s}\big(\lambda_1 L_1 + \lambda_{\text{SSIM}} L_{\text{SSIM}}\big)$(BTS와 같이 다른 시점에서 색상을 샘플링), 에지 인식 깊이 평활도 $\mathcal{L}_s$, 2D DINO 특징 $F_t$에 대한 특징 재구성 항,
$$\mathcal{L}_f = 1 - \text{cos-sim}\big(F_t,\ \psi(\hat{F}_t) + F\big),$$
을 결합합니다. 여기서 $\psi$는 특징 다운샘플러이고 $F$는 ViT 위치 인코딩 아티팩트를 보정하는 학습된 상수 분해이며, 특징 평활도 $\mathcal{L}_{fs}$가 추가되고; 전체 손실은 $\mathcal{L} = \lambda_p\mathcal{L}_p + \lambda_s\mathcal{L}_s + \lambda_f\mathcal{L}_f + \lambda_{fs}\mathcal{L}_{fs}$입니다.
4. **3D 특징 증류.** 점별 헤드 $h$가 $f_x \in \mathbb{R}^D$를 저차원 코드 $z_x \in \mathbb{R}^K$($K{=}19$)로 매핑하며, 특징 유사도 행렬 $S_{ij}$(입력 공간)와 $S^h_{ij}$(증류된 공간)에 대한 STEGO의 대조적 상관 손실로 훈련됩니다:
$$\mathcal{L}_{\text{corr}}(f_X, f_Y, b) = -\sum_{i,j} (S_{ij} - b)\, \max(S^h_{ij}, 0)$$
자기, kNN, 무작위 쌍에 대해 합산됩니다. 특징 배치는 *3D에서* 샘플링됩니다: 깊이 계층화된 표면 중심점, $r = 0.5\,$m 내의 이웃, 밀도 $\sigma > 0.5$인 샘플만 유지합니다.
5. **비지도 프로빙.** 미니배치 코사인 k-평균이 증류된 공간을 클러스터링합니다; $p_x = \text{softmax}(\text{cos-sim}(h(f_x), \theta))$가 의사 클래스를 제공하며, 평가만을 위해 헝가리안 매칭을 통해 실측값에 정렬됩니다. 훈련은 단일 V100에서 약 2일이 걸립니다; 카메라 포즈는 비지도 ORB-SLAM3에서 얻을 수 있습니다.

## 실험 결과

**SSCBench-KITTI-360**(범위 12.8/25.6/51.2m, 헝가리안 매칭된 mIoU, %)에서:

| 방법 | 12.8 m | 25.6 m | 51.2 m |
|---|---|---|---|
| S4C + STEGO (비지도 기준선) | 10.53 | 9.26 | 6.60 |
| **SceneDINO (비지도)** | **10.76** | **10.01** | **8.00** |
| S4C (2D 지도 참조) | 16.94 | 13.94 | 10.19 |

기하학적 IoU는 49.54/42.27/37.60으로, 지도된 S4C의 54.64/45.57/39.35와 비교됩니다. KITTI-360에서의 **2D 비지도 분할**에서 SceneDINO는 77.74 Acc / 25.81 mIoU에 도달하여, DINO 특징을 사용한 STEGO(73.32/23.57)와 U2Seg(72.89/23.43)를 상회합니다. 증류된 특징(DINOv2 타깃)에 대한 **선형 프로빙**은 15.85/13.70/10.57 mIoU를 산출하여, 완전 지도된 S4C와의 격차를 좁히고 51.2m에서는 이를 약간 상회합니다. 데이터셋 포즈 대신 ORB-SLAM3로 추정된 포즈를 사용하면 mIoU가 0.12만 손실됩니다; DINO에서 DINOv2 타깃으로 전환하면 +1.08 mIoU를 얻습니다. Cityscapes/BDD100K로의 도메인 일반화와 다중 시점 특징 일관성(DINO, DINOv2, FiT3D 대비)도 최고 수준입니다.

## SLAM에서의 의미

SLAM 맵은 센서가 바라보지 않은 곳에서 비어 있습니다; 장면 완성은 학습된 구조적 사전으로 그 공백을 채우며, 이는 부분적으로 관찰된 환경에서의 탐색, 경로 계획, 안전한 내비게이션에 직접적으로 도움이 됩니다. SceneDINO는 이 레벨의 공간 AI 트렌드를 보여줍니다 — 3D 주석 없이 오픈 월드 3D 이해를 얻기 위해 자기지도 기반 모델 특징을 재사용하는 것입니다 — 그리고 그 파이프라인은 말 그대로 SLAM과 호환됩니다: 저자들은 ORB-SLAM3 포즈로 훈련해도 성능 손실이 미미함을 보여, 전체 스택을 비지도로 유지할 수 있습니다.

## 관련 문서

- [Spatial AI](spatial-ai.md)
- [Foundation models](../level-05-deep-learning/foundation-models.md)
- [OpenScene](../level-03-monocular-slam/openscene.md)
- [NeRF](../level-05-deep-learning/nerf.md)
- [World Labs / Marble](world-labs-marble.md)
