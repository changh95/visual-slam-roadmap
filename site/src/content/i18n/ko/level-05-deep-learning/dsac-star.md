# DSAC\*

> Brachmann 2021 · [논문](https://arxiv.org/abs/2002.12324)

**한 줄 요약** — DSAC 계열을 통합한 TPAMI 버전: RGB 또는 RGB-D 이미지로부터의 시각적 재위치추정을 위한 단일 통합 scene-coordinate-regression 프레임워크로, 학습 안정성과 효율성을 대폭 개선했습니다.

## 문제

2020년까지 DSAC 계열은 서로 다른 설정 — RGB 대 RGB-D 입력, 3D 장면 모델의 사용 여부에 따른 학습 — 마다 별도의 레시피를 축적해 왔으며, 각각 고유의 초기화 단계와 안정성 관련 주의사항을 가지고 있었습니다. DSAC*는 이 변형들을 단일하고 신뢰할 수 있는 프레임워크로 통합하여, scene coordinate regression을 입력 modality와 supervision 체계에 관계없이 일관되게 적용할 수 있게 합니다.

## 방법 및 아키텍처

**Scene coordinate regression + 강인한 포즈 풀이.** 완전 합성곱 네트워크 $f$가 그레이스케일 이미지 $I$를 dense scene coordinate $\mathcal{Y}=f(I;\mathbf{w})$ — 각 픽셀이 관측하는 장면 공간 내 3D 포인트로, 카메라 공간 포인트와 $\mathbf{y}_i = \mathbf{h}\mathbf{e}_i$로 관계됨 — 로 매핑합니다. 출력은 8배로 서브샘플링되며, 각 예측은 81 px 수용 영역을 가지고, 맵은 *곧* 28MB의 네트워크 가중치입니다. 포즈 최적화는 고전적 RANSAC입니다: 최소 solver $\mathbf{h}_j = g(\mathcal{C}_j)$로 $M{=}64$개의 가설을 샘플링합니다 — RGB의 경우 2D-3D 대응점에 대한 P3P/PnP solver (잔차 $r^{\text{RGB}}(\mathbf{y}_i,\mathbf{h}) = ||\mathbf{p}_i - K\mathbf{h}^{-1}\mathbf{y}_i||$), RGB-D의 경우 3D-3D 대응점에 대한 Kabsch solver ($r^{\text{RGB-D}}(\mathbf{y}_i,\mathbf{h}) = ||\mathbf{e}_i - \mathbf{h}^{-1}\mathbf{y}_i||$) — 그런 다음 최대 인라이어 카운트 $s(\mathbf{h},\mathcal{Y})=\sum_{\mathbf{y}_i\in\mathcal{Y}}\mathbf{1}[\,r(\mathbf{y}_i,\mathbf{h})<\tau\,]$ ($\tau{=}$ RGB는 10 px / RGB-D는 10 cm)를 가진 가설을 선택하고, 그 인라이어들에 대해 반복적으로 정제합니다 (Levenberg-Marquardt PnP 또는 Kabsch).

**세 가지 설정에 대한 하나의 초기화 목적 함수.** DSAC*는 다음 중 어느 것으로도 학습합니다: RGB-D; RGB + 3D 모델 (렌더링된 ground-truth coordinate $\mathbf{y}^*_i$); 또는 RGB만. 통합된 픽셀별 손실은 예측이 유효해지면 3D 거리에서 재투영 오차로 *픽셀별로 동적으로* 전환됩니다:

$$\ell^{\text{RGB+M}}(\mathbf{y}_{i},\mathbf{y}^{*}_{i},\mathbf{h}^{*})=\begin{cases}\hat{r}^{\text{RGB}}(\mathbf{y}_{i},\mathbf{h}^{*})&\text{if }\mathbf{y}_{i}\in\mathcal{V}\\ ||\mathbf{y}^{*}_{i}-\mathbf{y}_{i}||&\text{otherwise},\end{cases}$$

여기서 $\hat{r}^{\text{RGB}}$는 재투영 오차를 부드럽게 클램핑합니다 (100 px를 넘으면 제곱근). 3D 모델이 없는 경우, $\mathbf{y}^*_i$는 상수 10m 깊이에서 가상으로 생성된 휴리스틱 목표값 $\bar{\mathbf{y}}_i = \mathbf{h}^*\bar{\mathbf{e}}_i$로 대체됩니다. 이는 DSAC++의 낭비적인 두 개의 별도 초기화 단계를 대체하여, 사전 학습을 4일에서 2일로 절반으로 줄입니다.

**미분 가능 RANSAC을 통한 종단간 학습.** 전체 파이프라인은 이후 $\gamma{=}100$인 포즈 손실 $\ell^{\text{Pose}}(\hat{\mathbf{h}},\mathbf{h}^{*})=||\hat{\mathbf{t}}-\mathbf{t}^{*}||+\gamma\measuredangle(\hat{\bm{\theta}},\bm{\theta}^{*})$에 대해 학습됩니다. 모든 구성 요소가 미분 가능하게 만들어집니다: Kabsch는 SVD 그래디언트를 통해; PnP는 마지막 Gauss-Newton 반복의 해석적 그래디언트를 통해, $\frac{\partial}{\partial\mathcal{Y}}\mathbf{h}(\mathcal{Y})\approx-J_{\mathbf{r}}^{+}\frac{\partial}{\partial\mathcal{Y}}\mathbf{r}_{\mathcal{I}}(\mathcal{Y},\mathbf{h}^{t=\infty})$; 인라이어 카운팅은 $\beta = 5/\tau$인 시그모이드 완화 $s(\mathbf{h},\mathcal{Y})=\sum_{i}\sigma[\beta\tau-\beta r(\mathbf{y}_{i},\mathbf{h})]$를 통해; 그리고 가설 선택은 DSAC을 통해 — 점수에 대한 softmax로부터 $j\sim p(j|\mathcal{Y})$를 샘플링하고 기대 포즈 손실을 최소화합니다

$$\mathcal{L}^{\text{Pose}}(\mathcal{Y},\mathbf{h}^{*})=\mathbb{E}_{j\sim p(j|\mathcal{Y})}\left[\hat{\ell}^{\text{Pose}}(\mathbf{R}(\cdot),\mathbf{h}^{*})\right],$$

이 그래디언트는 score-function 항 $\hat{\ell}^{\text{Pose}}(\cdot)\,\partial_{\mathcal{Y}}\log p(j|\mathcal{Y})$과 pathwise 도함수를 결합합니다. 학습 중 기하학적 데이터 증강 (±30° 회전, 66-150% 재조정)이 추가됩니다.

## 실험 결과

- **7Scenes** (5cm/5° 이내 프레임 비율): RGB + 3D 모델 설정에서 85.2% — SCoCR과 동등한 최고 성능을 훨씬 작은 모델 크기로 달성 (28MB 대비 165MB); RGB만으로 학습하면 DSAC++ 대비 +27.6% 향상; RGB-D 정확도는 (ICP 후처리 없이) OtF Forests의 93.4%를 약간 넘어섭니다. 데이터 증강은 설정에 따라 +9.1/+7.7/+4.1% (Stairs, RGB만의 경우 +51.5%)를 기여합니다.
- **12Scenes**: 모든 설정에서 최고 성능, 약 99% — "해결됨", DSAC*의 경우 RGB만으로도 그렇습니다.
- **Cambridge Landmarks** (중간값 이동 cm / 회전 °, 3D 모델 사용): St Mary's Church 13/0.4, Great Court 49/0.3, Old Hospital 21/0.4, King's College 15/0.3, Shop Facade 5/0.3 — DSAC++와 동등하지만 6일이 아닌 2.5일 만에 학습됩니다. 3D 모델이 *없는* 경우 DSAC*는 모든 장면에서 DSAC++를 능가합니다 (예: Great Court 34/0.2 — outlier가 많은 SfM 복원을 사용하는, 모델과 *함께* 학습된 어떤 방법보다도 우수).
- **효율성**: 50ms forward pass (DSAC++의 150ms 대비), 75ms 전체 추론 (200ms 대비); 4MB "Tiny" 변형도 여전히 73.6% (7Scenes)와 98.1% (12Scenes)를 달성합니다; 28MB DSAC*는 Cambridge에서의 scene 압축 비교에서 가장 높은 평균 정확도를 보입니다.

## SLAM에서의 의미

재위치추정 — 추적 손실 후 또는 알려진 환경에서 재시작할 때 이전에 매핑된 장면 내에서 6-DoF 카메라 포즈를 복구하는 것 — 은 SLAM 시스템에 필요한 기능입니다. DSAC*는 scene-coordinate-regression 방식의 성숙한 형태입니다: 맵은 네트워크 가중치에 암묵적으로 저장되고, 기하학적 PnP/Kabsch + RANSAC solver는 루프 내에 유지되어, 단일 이미지로부터 센티미터급 실내 정확도를 제공합니다. 이 안정적이고 통합된 학습 레시피는 이후 ACE 계열이 몇 배나 가속시킨 기준선이 되었습니다.

## 관련 문서

- [DSAC](dsac.md) — 카메라 위치추정을 위한 원조 미분 가능 RANSAC
- [DSAC++](dsacpp.md) — 카메라 포즈만으로 자기지도 학습
- [ACE](ace.md) — 몇 분의 학습으로 DSAC* 정확도에 도달
- [ACE Zero](ace-zero.md) — 처음부터 포즈와 맵을 함께 학습하도록 SCR을 확장
- [CNN Pose Regression Limitations](cnn-pose-regression-limitations.md) — SCR이 직접 포즈 회귀를 능가하는 이유
