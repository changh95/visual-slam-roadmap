# Frame-to-model tracking

프레임-대-모델(frame-to-model) 추적이란, 각 입력 프레임을 이전 프레임이 아니라 *누적된 지도(map)*에 정합하는 것을 의미합니다. 프레임-대-프레임(frame-to-frame) 추적에서는 매 쌍별 정합마다 작은 오차가 발생하고, 수백 개의 상대 포즈를 합성하면 드리프트가 빠르게 누적됩니다. 반면 누적된 모델은 많은 관측값을 평균화합니다: 그 표면은 어떤 단일 프레임보다 더 부드럽고 노이즈가 적으므로, 이에 대해 정합하는 것이 더 정확하고 더 안정적입니다.

## 모델 예측-정합-융합 루프

이 고전적인 방식은 KinectFusion에서 유래합니다.

1. 밀도 장면 모델(TSDF 볼륨 또는 서펠 맵)을 유지합니다.
2. 이전 카메라 포즈로부터 모델이 어떻게 보일지 *예측*합니다 — TSDF를 레이캐스팅하거나(또는 서펠을 렌더링하여) 정점/법선 맵을 합성합니다.
3. 새 깊이 프레임을 이 예측에 ICP로 정합합니다. 통상 점-대-평면 변형을 사용합니다.

$$E(\mathbf{T}) = \sum_i \big( (\mathbf{T}\,\mathbf{p}_i - \mathbf{q}_i) \cdot \mathbf{n}_i \big)^2$$

여기서 $\mathbf{p}_i$는 새 프레임의 점들이고, $\mathbf{q}_i, \mathbf{n}_i$는 대응하는 예측된 모델 점과 법선입니다. 대응 관계는 값비싼 최근접 이웃 탐색이 아니라 투영적 데이터 연관(모델 점을 새 프레임으로 투영)을 사용하며, 최적화는 GPU에서 거칠기-에서-세밀도로 실행됩니다.

4. 새로 정합된 프레임을 모델에 융합하여, 다음 프레임을 위한 예측을 개선합니다.

## 정합이 실제로 풀리는 방식

점-대-평면 ICP는 운동 업데이트를 트위스트 $\boldsymbol{\xi} = (\boldsymbol{\omega}, \mathbf{t}) \in \mathfrak{se}(3)$로 파라미터화하고 작다고 가정하면 아주 작은 선형 문제가 됩니다. 현재 추정치 $\hat{\mathbf{p}}_i = \hat{\mathbf{T}}\,\mathbf{p}_i$에 대해, 잔차는 다음과 같이 선형화됩니다.

$$r_i(\boldsymbol{\xi}) \approx \mathbf{n}_i^\top\big( \hat{\mathbf{p}}_i + \boldsymbol{\omega} \times \hat{\mathbf{p}}_i + \mathbf{t} - \mathbf{q}_i \big),$$

따라서 유효한 각 픽셀은 단 6개의 미지수를 가진 최소제곱 문제에 한 행을 제공합니다. $6\times 6$ 정규 방정식 $\mathbf{J}^\top\mathbf{J}\,\boldsymbol{\xi} = -\mathbf{J}^\top\mathbf{r}$은 GPU에서 병렬로 누적되며(수십만 개의 픽셀에 대한 리덕션), CPU에서 마이크로초 단위로 풀립니다. 피라미드 레벨마다 몇 번의 반복이면 충분합니다. 이것이 밀도 추적이 프레임 속도로 실행될 수 있는 이유입니다: *데이터*는 밀도가 높지만, *상태*는 단 하나의 포즈일 뿐입니다.

하이브리드 시스템은 광도(photometric) 항을 추가합니다. ElasticFusion은 서펠 맵의 렌더링된 컬러+깊이 예측에 대해 다음과 같은 가중 결합 비용을 최소화하여 추적합니다.

$$E = \sum_i \Big[ w_{\mathrm{icp}} \big(\mathbf{n}_i^\top(\mathbf{T}\mathbf{v}_i - \mathbf{u}_i)\big)^2 + w_{\mathrm{rgb}} \big(I(\pi(\mathbf{T}\mathbf{v}_i)) - \hat{I}(\mathbf{u}_i)\big)^2 \Big],$$

이는 기하만으로는 퇴화(degenerate)되는 상황에서도 추적을 제약된 상태로 유지시켜 줍니다(아래 참조). DVO 방식의 직접(direct) 방법들은 상호 보완적인 재료를 제공합니다: 희소 특징이 아니라 모든 픽셀에 대한 강건한 밀도 잔차입니다.

## 흔한 함정

- **모델 손상이 되먹임(feedback)됩니다**: 잘못된 정합이 모델에 융합되면, 손상된 모델이 이후의 추적을 잘못된 방향으로 유도합니다 — 오차가 평균화되어 사라지는 대신 누적될 수 있습니다. 융합 가중치와 이상치 인식 통합이 일반적인 방어책입니다.
- **작은 수렴 영역(convergence basin)**: ICP는 좋은 초기 추정치가 필요합니다. 빠른 회전이나 큰 변위는 이 영역을 벗어나 회복 불가능한 추적 손실을 일으킬 수 있습니다. 거칠기-에서-세밀도 피라미드는 이 영역을 넓혀주지만 그 한계를 제거하지는 못합니다.
- **기하학적 퇴화(degeneracy)**: 단일 평평한 벽에 대한 점-대-평면 ICP는 세 방향의 움직임(평면 내 이동과 법선 축에 대한 회전)을 제약하지 못한 채로 남겨둡니다 — $\mathbf{J}^\top\mathbf{J}$가 계수 결핍(rank-deficient) 상태가 되어 포즈가 미끄러집니다. 광도 항이나 특징을 추가하면 부족한 제약이 복원됩니다.
- **여전히 오도메트리입니다**: 프레임-대-모델 추적은 드리프트를 줄이지만 완전히 제거하지는 못합니다 — 모델 자체도 궤적과 함께 천천히 드리프트합니다. 완전한 시스템은 그 위에 루프 클로저를 추가합니다: 포즈 그래프, 지도 변형(ElasticFusion), 또는 TSDF 재통합(BundleFusion).

## SLAM에서의 의미

프레임-대-모델 추적은 밀도 RGB-D SLAM을 정의하는 핵심 기법입니다: 이것이 바로 2011년 KinectFusion이 번들 조정 없이도 드리프트가 없어 보이는 책상 규모의 재건을 만들어낼 수 있었던 이유입니다. 이후 거의 모든 밀도 시스템 — Kintinuous, ElasticFusion, InfiniTAM, BundleFusion — 은 어떤 형태로든 이를 중심으로 구축되며, 모델 예측-정합-융합 루프를 이해하는 것이 이러한 논문들을 읽는 핵심입니다.

## 관련 문서

- [ICP](icp.md) — 이 루프의 핵심이 되는 정합 알고리즘
- [KinectFusion](kinectfusion.md) — 정석적인 TSDF 프레임-대-모델 시스템
- [ElasticFusion](elasticfusion.md) — 서펠 기반 프레임-대-모델 추적
- [TSDF vs Surfel maps](tsdf-vs-surfel-maps.md) — 추적 대상이 되는 두 가지 모델 표현
- [DVO](dvo.md) — 강건한 직접 RGB-D 정렬
