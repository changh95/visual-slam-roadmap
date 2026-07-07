# DreamFusion

> Poole 2023 · [논문](https://arxiv.org/abs/2209.14988)

**한 줄 요약** — DreamFusion은 사전 훈련된 2D 텍스트-이미지 확산 모델(Imagen)을 동결된 사전(prior)으로 사용하여, 점수 증류 샘플링(Score Distillation Sampling, SDS) 손실을 통해 텍스트 프롬프트만으로 NeRF를 최적화함으로써, 3D 훈련 데이터 없이 텍스트-3D 생성을 가능하게 합니다.

## 문제

텍스트-이미지 합성은 수십억 개의 이미지-텍스트 쌍으로 훈련된 확산 모델에 의해 변혁되었지만, 이 레시피를 3D로 확장하려면 존재하지 않는 두 가지가 필요합니다: 대규모 레이블된 3D 데이터, 그리고 3D 데이터를 직접 노이즈 제거하는 효율적인 아키텍처입니다. NeRF는 3D 장면이 렌더링에 대한 이미지 공간 손실만으로 최적화되는 네트워크가 될 수 있음을 보여주었습니다. DreamFusion은 동결된 2D 확산 모델이 바로 그 이미지 공간 손실이 될 수 있는지를 묻습니다 — 픽셀 공간이 아니라 NeRF 매개변수 공간에서 샘플링하여, 모든 3D 지식이 순수한 2D 사전에서 증류되도록 합니다.

## 방법 및 아키텍처

**확산 사전.** 텍스트 조건부 확산 모델이 가중된 노이즈 제거 목적 함수로 훈련됩니다
$$\mathcal{L}_{\text{Diff}}(\phi, \mathbf{x}) = \mathbb{E}_{t \sim \mathcal{U}(0,1),\, \epsilon \sim \mathcal{N}(\mathbf{0},\mathbf{I})}\big[ w(t)\, \| \epsilon_\phi(\alpha_t \mathbf{x} + \sigma_t \epsilon; t) - \epsilon \|_2^2 \big],$$
그리고 DreamFusion은 특이하게 큰 안내 가중치 $\omega = 100$을 사용하는 classifier-free guidance 노이즈 예측 $\hat{\epsilon}_\phi(\mathbf{z}_t; y, t) = (1+\omega)\,\epsilon_\phi(\mathbf{z}_t; y, t) - \omega\,\epsilon_\phi(\mathbf{z}_t; t)$를 사용합니다.

**점수 증류 샘플링.** 미분 가능한 이미지 파라미터화 $\mathbf{x} = g(\theta)$(여기서는 NeRF 렌더러)가 렌더링 결과가 샘플처럼 보이도록 최적화됩니다. U-Net을 통해 $\mathcal{L}_{\text{Diff}}$를 미분하는 것은 비용이 많이 들고 조건이 나쁘므로, U-Net 자코비안을 생략하면 SDS 경사가 됩니다
$$\nabla_\theta \mathcal{L}_{\text{SDS}}(\phi, \mathbf{x} = g(\theta)) \triangleq \mathbb{E}_{t,\epsilon}\Big[ w(t)\big(\hat{\epsilon}_\phi(\mathbf{z}_t; y, t) - \epsilon\big) \tfrac{\partial \mathbf{x}}{\partial \theta} \Big],$$
논문은 이것이 가중된 확률 밀도 증류 손실 $\nabla_\theta\, \mathbb{E}_t\big[ (\sigma_t / \alpha_t)\, w(t)\, \text{KL}\big(q(\mathbf{z}_t \mid g(\theta); y, t)\ \|\ p_\phi(\mathbf{z}_t; y, t)\big)\big]$의 경사임을 증명합니다. 확산 모델을 통한 역전파는 필요하지 않습니다 — 확산 모델은 노이즈 잔차가 프롬프트 $y$에 대해 더 높은 밀도의 이미지를 가리키는 동결된 평가자 역할을 합니다.

**음영 처리를 포함한 NeRF.** 3D 캔버스는 밀도와 *알베도*를 출력하는 MLP를 갖는 mip-NeRF 360 변형입니다, $(\tau, \boldsymbol{\rho}) = \text{MLP}(\boldsymbol{\mu}; \theta)$, 표준 체적 렌더링 가중치 $w_i = \alpha_i \prod_{j<i}(1-\alpha_j)$, $\alpha_i = 1 - \exp(-\tau_i\|\boldsymbol{\mu}_i - \boldsymbol{\mu}_{i+1}\|)$로 합성됩니다. 표면 법선은 밀도 경사에서 나옵니다, $\mathbf{n} = -\nabla_{\boldsymbol{\mu}}\tau / \|\nabla_{\boldsymbol{\mu}}\tau\|$, 그리고 각 점은 무작위로 배치된 점광원 $\boldsymbol{\ell}$에 의해 램버트 음영 처리됩니다:
$$\mathbf{c} = \boldsymbol{\rho} \circ \big(\boldsymbol{\ell}_\rho \circ \max(0,\ \mathbf{n} \cdot (\boldsymbol{\ell} - \boldsymbol{\mu}) / \|\boldsymbol{\ell} - \boldsymbol{\mu}\|) + \boldsymbol{\ell}_a\big).$$
알베도를 무작위로 흰색으로 바꾸면 "무텍스처" 렌더링이 생성되어, 장면 내용이 평평한 형상에 그려지는 퇴화된 평면 광고판 해를 방지합니다.

**프롬프트별 최적화 루프.** 각 반복에서: (1) 무작위 카메라(고도각 $-10°$에서 $90°$, 전체 방위각, 거리 1–1.5)와 광원을 샘플링; (2) 조명이 있는 NeRF를 64×64로 렌더링, 조명 적용/알베도만/무텍스처 렌더링 중 선택; (3) 프롬프트에 시점 종속적 텍스트("정면/측면/후면/상단 시점")를 추가하고 동결된 64×64 Imagen 기본 모델로 SDS 경사를 계산($w(t)=\sigma_t^2$, $t \sim \mathcal{U}(0.02, 0.98)$); (4) Distributed Shampoo로 NeRF 가중치를 업데이트. 15,000회 반복은 4칩 TPUv4에서 약 1.5시간이 소요되며, 불투명도와 방향 정규화 항이 밀도 필드를 깨끗하게 유지합니다.

## 실험 결과

Dream Fields의 153개 객체 중심 COCO 프롬프트에서 색상 렌더링과 *무텍스처 기하*("Geo") 렌더링 모두에 대해 **CLIP R-Precision**(CLIP이 렌더링으로부터 올바른 캡션을 검색할 수 있는가?)으로 평가되었습니다:

| 방법 | B/32 Color | B/32 Geo | B/16 Color | B/16 Geo | L/14 Color | L/14 Geo |
|---|---|---|---|---|---|---|
| 실측 MS-COCO 이미지 | 77.1 | – | 79.1 | – | – | – |
| Dream Fields | 68.3 | – | 74.2 | – | – | – |
| CLIP-Mesh | 67.8 | – | 75.8 | – | 74.5 | – |
| **DreamFusion** | **75.1** | **42.5** | **77.5** | **46.6** | **79.7** | **58.5** |

DreamFusion은 색상 렌더링에서 실측 이미지에 근접한 일관성을 보이면서도, 강력한 기하 점수를 갖는 유일한 방법입니다(CLIP으로 훈련된 기준선들은 Geo 점수가 약 1로 붕괴하는데, 이는 평평한 형상에 텍스처가 그려졌음을 드러냅니다). Ablation 결과 시점 증강, 시점 종속적 프롬프트, 조명, 무텍스처 렌더링이 각각 기하를 개선하며, 전체 렌더링은 +12.5% 개선됩니다. 최적화된 모델은 임의의 각도에서 볼 수 있고, 재조명할 수 있으며, 3D 환경에 합성될 수 있습니다. 논문에서 알려진 한계: SDS는 모드 탐색적이어서 과포화/과평활화된 결과를 낳고 시드 간 다양성이 거의 없습니다.

## SLAM에서의 의미

DreamFusion은 이전에 분리되어 있던 두 흐름 — 신경 렌더링(NeRF)과 생성적 확산 모델 — 을 연결했으며, SDS 손실은 대규모 후속 텍스트-3D 연구군(Magic3D, ProlificDreamer 등)에서 즉시 재사용되었습니다. SLAM에서는 생성적 2D 사전이 타당한 3D 구조를 환각할 수 있다는 개념을 확립했습니다: 동일한 메커니즘이 원칙적으로 SLAM 맵의 관찰되지 않은 영역에서 텍스처와 기하를 완성할 수 있으며, 이는 생성적 맵 완성과 공간 AI 연구에서 반복적으로 나타나는 주제입니다.

## 관련 문서

- [NeRF](../level-05-deep-learning/nerf.md)
- [World Labs / Marble](world-labs-marble.md)
- [Sora / DiT](sora-dit.md)
- [Spatial AI](spatial-ai.md)
- [World model](world-model.md)
