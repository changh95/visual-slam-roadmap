# Stereo DSO

> Wang 2017 · [논문](https://arxiv.org/abs/1708.07878)

**한 줄 요약** — Stereo DSO는 DSO의 직접적인 희소 광도 번들 조정을 스테레오 카메라로 확장하여, 정적 스테레오(좌우) 제약과 시간적 다중 뷰 제약을 하나의 윈도우 최적화에서 결합함으로써 KITTI 규모에서 매우 정확한 미터 단위 직접 오도메트리를 산출한다.

## 문제

DSO 같은 단안 직접 방법은 스케일 드리프트를 축적하며 느리고 움직임에 의존하는 부트스트래핑 단계를 필요로 한다. 깊이는 오직 시간적 시차(parallax)로부터만 생겨나기 때문이다. 고정된 기선의 스테레오 리그는 둘 다 고친다 — 그러나 정적 스테레오만으로는 제한된 깊이 범위 내에서만 정확하게 삼각측량할 수 있고, 에피폴라 선과 평행한 스테레오 엣지는 퇴화(degenerate)한다. Stereo DSO는 정적 스테레오를 시간적 다중 뷰 스테레오의 직접적인 희소 번들 조정에 통합해서 두 가지가 서로를 보완하게 하는 방법을 묻는다: 스테레오는 절대 스케일과 깊이 초기화를 제공하고, 시간적 관측은 원거리 점과 퇴화 방향을 제약한다.

## 방법 및 아키텍처

**파이프라인.** 새 스테레오 프레임은 조대-정밀(coarse-to-fine) 직접 이미지 정합(이미지 피라미드에서 가우스-뉴턴, 등속 초기화)으로 최신 키프레임에 대해 추적된다. 포즈는 최근에 선택된 후보 점들의 깊이를 정련한다. 장면이나 조명이 충분히 변했다면(평균 제곱 광류, 상대 밝기 인자) 키프레임이 생성되어 활성 윈도우에 추가되며, 여기서 모든 키프레임의 포즈, 아핀 밝기 파라미터, 점의 역깊이, 카메라 내부 파라미터가 공동으로 최적화된다. 오래된 키프레임과 점은 슈어 보수(Schur complement)로 주변화된다. 시스템 초기화는 무작위 깊이 대신 정적 스테레오 매칭(수평 에피폴라 선을 따른 3×5 패치의 NCC)으로 얻은 반밀집 깊이 맵을 사용한다.

**광도 에너지.** 프레임 $I_i$의 점 $\mathcal{P}_i$가 $I_j$에서 관측될 때, 이미지별 아핀 밝기 파라미터 $a,b$가 있는 경우:

$$E_{ij}=\sum_{\mathbf{p}\in\mathcal{P}_{i}}\sum_{\tilde{\mathbf{p}}\in\mathcal{N}_{\mathbf{p}}}\omega_{\tilde{\mathbf{p}}}\left\|I_{j}[\tilde{\mathbf{p}}^{\prime}]-b_{j}-\frac{e^{a_{j}}}{e^{a_{i}}}\left(I_{i}[\tilde{\mathbf{p}}]-b_{i}\right)\right\|_{\gamma}$$

여기서 $\|\cdot\|_\gamma$는 후버 노름, $\mathcal{N}_{\mathbf{p}}$는 8점 잔차 패턴, $\omega_{\mathbf{p}}=c^{2}/(c^{2}+\|\nabla I_{i}(\mathbf{p})\|_{2}^{2})$는 고기울기 픽셀의 가중치를 낮추며, $\mathbf{p}'=\Pi_{\mathbf{K}}\left(\mathbf{T}_{ji}\,\Pi_{\mathbf{K}}^{-1}(\mathbf{p},d_{\mathbf{p}})\right)$는 역깊이 $d_{\mathbf{p}}$를 통해 재투영한다.

**스테레오 결합 — 핵심 기여.** 각 활성 점은 다른 키프레임을 향한 시간적 잔차 $r^{t}$와, 같은 순간의 우측 이미지를 향한 정적 스테레오 잔차 $r^{s}$를 만든다($\mathbf{T}_{ji}$는 기선으로 고정되므로, 기하학적 파라미터는 $(d,\mathbf{c})$뿐이다). 둘 다 결합 인자 $\lambda$로 가중된 하나의 에너지에 들어간다:

$$E=\sum_{i\in\mathcal{F}}\sum_{\mathbf{p}\in\mathcal{P}_{i}}\Big(\sum_{j\in obs^{t}(\mathbf{p})}E^{\mathbf{p}}_{ij}+\lambda E^{\mathbf{p}}_{is}\Big)$$

이는 가우스-뉴턴 $\delta\boldsymbol{\xi}=-(\mathbf{J}^{T}\mathbf{W}\mathbf{J})^{-1}\mathbf{J}^{T}\mathbf{W}\mathbf{r}$로, 모든 키프레임 포즈 $\mathbf{T}$, 역깊이 $d$, 내부 파라미터 $\mathbf{c}$, 좌/우 아핀 파라미터 $a^{L},b^{L},a^{R},b^{R}$에 대해 최소화되며, $\mathrm{SE}(3)$ 증분은 $\mathbf{x}\boxplus\mathbf{T}:=\exp(\hat{\mathbf{x}})\mathbf{T}$로 적용된다.

**점 관리와 주변화.** 후보 픽셀은 기울기 적응형 블록(이미지 크기에 비례하는 블록 크기, 이는 넓은 KITTI 이미지에 도움이 됨)에서 선택된다. 이들의 깊이는 정적 스테레오 NCC 매칭으로 초기화되어 — 단안의 0-부터-무한대 초기화보다 추적 정확도를 크게 높인다 — 활성화 전에 후속 비키프레임에 의해 정련된다. 주변화는 윈도우 크기를 제한한다: 유지되는 변수를 $\alpha$, 주변화되는 변수를 $\beta$라 하면,

$$\left(\mathbf{H}_{\alpha\alpha}-\mathbf{H}_{\alpha\beta}\mathbf{H}^{-1}_{\beta\beta}\mathbf{H}^{T}_{\alpha\beta}\right)\mathbf{x}_{\alpha}=\mathbf{b}_{\alpha}-\mathbf{H}_{\alpha\beta}\mathbf{H}^{-1}_{\beta\beta}\mathbf{b}_{\beta}$$

이 이후 최적화를 위한 사전(prior)으로 유지된다.

## 실험 결과

- **결합 인자**(KITTI Seq. 06): $\lambda=1,2$는 이동 오차와 회전 오차 모두를 크게 줄인다. $\lambda>3$은 정적 스테레오를 과신하여 잘못된 스테레오 매칭으로부터 성능이 저하된다.
- **KITTI 훈련 세트(00-10)**, 100-800 m 구간에서 평균한 이동 RMSE $t_{rel}$ (%) / 회전 RMSE $r_{rel}$ (deg/100 m): Stereo DSO **0.84 / 0.20** 평균, ORB-SLAM2 (VO 모드, 루프 클로저와 전역 BA 끈 상태) 0.81 / 0.26, Stereo LSD-VO 1.14 / 0.40과 비교. 회전 오차는 모든 시퀀스에서 ORB-SLAM2를 능가하며, 이동 오차는 혼재한다(예: Seq. 10: 0.49 대 0.58).
- **KITTI 테스트 세트(11-21)**: 순수 VO인 Stereo DSO가 (루프 클로저를 포함한) Stereo LSD-SLAM과 (루프 클로저와 전역 BA를 포함한) ORB-SLAM2의 완전한 SLAM 버전을 모든 거리 구간과 주행 속도에서 능가한다.
- **Cityscapes Frankfurt**: 긴 롤링 셔터 주행 구간(각 5000-6000프레임)에서의 정성적 추적과 3D 재구성으로, 직접 방법의 알려진 약점에 대한 강건성을 보여준다. 단안 베이스라인은 Stereo DSO가 보이지 않는 KITTI 00/06에서 명확한 스케일 드리프트를 보인다.

## SLAM에서의 의미

Stereo DSO는 직접 방법이 소규모 실내 장면에 한정되지 않음을 보였다: 스테레오 리그를 사용하면 순수 VO로서 루프 클로저를 갖춘 SLAM 시스템을 능가하는 최신 수준의 대규모 실외 오도메트리를 달성한다. 정적+시간적 스테레오를 하나의 광도 번들 조정에 담고 스테레오로 초기화된 점 깊이를 사용하는 방식은 표준 설계 패턴이 되었다: "가상 스테레오"를 사용하는 DVSO(CNN으로 예측한 우측 이미지)와 관성 확장인 VI-DSO 모두 이를 직접 기반으로 한다. DSO 다음에 이 문서를 살펴보면 직접 파이프라인이 두 번째 카메라를 어떻게 흡수하는지 알 수 있다.

## 관련 문서

- [DSO](../level-03-monocular-slam/dso.md)
- [VI-DSO](../level-06-vio-vins/vi-dso.md)
- [DVSO](../level-03-monocular-slam/dvso.md)
- [Disparity vs Depth](disparity-vs-depth.md)
- [ORB-SLAM2](../level-03-monocular-slam/orb-slam2.md)
