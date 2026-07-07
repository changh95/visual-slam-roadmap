# DSAC++

> Brachmann 2018 · [논문](https://arxiv.org/abs/1711.10228)

**한 줄 요약** — "Learning less is more": DSAC 파이프라인을 단일 학습 가능 구성 요소 — scene coordinate를 회귀하는 FCN — 으로 축소하고, 파라미터가 없는 soft inlier count로 점수를 매기며, 3D 모델 없이도 RGB 이미지와 ground-truth 포즈만으로 학습하여 장면 기하를 발견할 수 있음을 보입니다.

## 문제

DSAC은 세 가지 단점이 있었습니다. 그 scoring CNN은 과적합됩니다 — 이미지 내에서 재투영 오차가 *어디에* 발생하는지를 암기하는데, 이 패턴은 보지 못한 뷰로 일반화되지 않습니다. 초기화 과정은 RGB-D 데이터나 3D 장면 모델로부터 얻은 scene coordinate ground truth를 필요로 하는데, 이는 존재하지 않을 수 있습니다 (특히 야외에서는 복원에 지루한 파라미터 탐색이 필요합니다). 그리고 종단간 학습은 포즈 정제 그래디언트가 유한 차분 (finite differences)으로 계산되어 그래디언트 분산이 높았기 때문에 불안정했습니다. DSAC++는 위치추정 파이프라인의 *단일* 구성 요소만 학습하는 것으로 충분한지, 그리고 카메라 포즈만으로도 학습이 가능한지를 질문합니다.

## 방법 및 아키텍처

DSAC 스타일 파이프라인 (scene coordinate regression, 4-tuple로부터의 PnP를 통한 가설 샘플링, 확률적 선택, 정제)은 유지되지만, 학습 가능한 구성 요소는 하나뿐입니다:

- **완전 합성곱 coordinate 네트워크** (VGG 스타일, 약 3000만 파라미터): 640x480 이미지를 41x41 px 수용 영역을 가진 80x60 scene coordinate $\mathbf{y}_i(\mathbf{w})$로 매핑합니다 — DSAC의 독립적인 패치와 달리 계산을 재사용하는 dense prediction입니다.
- **Soft inlier count가 Score CNN을 대체**: 가설 합의는 재투영 오차 $r_i(\mathbf{h},\mathbf{w})=\lVert C\mathbf{h}^{-1}\mathbf{y}_i(\mathbf{w})-\mathbf{p}_i\rVert$에 대한 시그모이드로 매끄럽게 처리된 inlier count입니다:

$$s(\mathbf{h})=\sum_i \mathrm{sig}\left(\tau-\beta\, r_i(\mathbf{h},\mathbf{w})\right)$$

  가설 $j$는 softmax $P(j;\mathbf{w},\alpha) \propto \exp(\alpha\, s(\mathbf{h}_j(\mathbf{w})))$를 통해 선택되며, 여기서 $\alpha$는 $|S(\alpha)-S^{*}|$에 대한 경사하강법으로 자동 조정됩니다 ($S(\alpha)$는 $P$의 섀넌 엔트로피) — 이는 분포를 넓게 유지하여 종단간 학습이 붕괴하지 않고 안정적으로 유지되도록 합니다.
- **3단계 학습**: (1) *초기화* — 목표값 $\mathbf{y}^{*}$에 대해 coordinate를 초기화합니다. 가능하다면 3D 모델로부터 렌더링하고, 그렇지 않으면 카메라 뷰를 서로 구분하는 것에 불과한 상수 깊이 휴리스틱 $\mathbf{y}_i^{*} \approx \mathbf{h}^{*}(\frac{d x_i}{f}, \frac{d y_i}{f}, d, 1)^T$을 사용합니다; (2) *재투영 오차 최적화* — ground-truth 포즈에 대해, $\tilde{\mathbf{w}}=\arg\min_{\mathbf{w}}\sum_i r_i(\mathbf{h}^{*},\mathbf{w})$ — 네트워크가 참깊이를 복원하는 단일 뷰 제약, 즉 3D 모델 없이 장면 기하를 발견합니다; (3) *종단간* — DSAC과 마찬가지로 기대 포즈 손실 $\mathbb{E}_{j\sim P}[\ell(\mathbf{R}(\mathbf{h}_j(\mathbf{w})),\mathbf{h}^{*})]$을 최소화합니다.
- **해석적 정제 그래디언트**: 정제는 인라이어 재투영 오차에 대한 Gauss-Newton 방식 $\mathbf{R}^{t+1}=\mathbf{R}^{t}-(J_{\mathbf{r}}^{T}J_{\mathbf{r}})^{-1}J_{\mathbf{r}}^{T}\mathbf{r}(\mathbf{R}^{t},\mathbf{w})$이며, 그 그래디언트는 최적점 $\mathbf{h}_\mathrm{O}$ 주변에서 선형화하여 근사됩니다: $\frac{\partial}{\partial\mathbf{w}}\mathbf{R}(\mathbf{h})\approx-(J_{\mathbf{r}}^{T}J_{\mathbf{r}})^{-1}J_{\mathbf{r}}^{T}\frac{\partial}{\partial\mathbf{w}}\mathbf{r}(\mathbf{h}_{\mathrm{O}},\mathbf{w})$ — DSAC의 불안정한 유한 차분을 대체합니다.

## 실험 결과

- **7Scenes** (5cm / 5도 이내 프레임 비율, 전체 세트): 3D 모델을 사용하는 경우 **76.1%** — RGB-D로 학습한 DSAC 대비 +13.6%; 렌더링된 모델로 학습한 DSAC은 추가로 6.6% 하락하므로, 3D 모델이 *전혀 없는* DSAC++ (60.4%)조차 모델 학습 DSAC을 4.5% 능가합니다.
- **12Scenes**: 모든 설정에서 최고 성능. DSAC 대비 16.7% 격차로 96.4%; 3D 모델 없이는 60.9%로, SIFT+PnP 기준선과 비슷합니다.
- **중간값 오차**: 예를 들어 7Scenes Chess에서 0.02m / 0.5도; Cambridge King's College에서 0.18m / 0.3도, Great Court에서 0.40m / 0.2도 — 여러 장면에서 PoseNet 변형 대비 약 10배, feature 기반 Active Search 대비 약 2배 우수합니다. 3D 모델이 없어도 대부분의 모델 기반 경쟁자를 여전히 능가합니다 (예: King's College 0.23m / 0.4도). DSAC과 마찬가지로, 규모가 훨씬 큰 Cambridge Street 장면에서는 실패합니다.
- **Ablation**: DSAC의 scoring CNN만 soft inlier count로 교체하면 7Scenes가 55.9%에서 58.9%로 (Heads +19%, Stairs +8%), 12Scenes가 79.7%에서 89.6%로 향상됩니다 — 점수 *회귀*는 일반화가 잘 안 되지만, coordinate 회귀는 잘 됩니다.

## SLAM에서의 의미

DSAC++는 scene coordinate regression에서 가장 큰 실질적 장벽 — 3D ground truth의 필요성 — 을 제거하여, 이 접근법을 포즈를 제공하는 모든 SLAM/SfM 시스템의 출력과 호환되게 만들었습니다. 이 레시피 (단일 FCN + 고전적 기하 solver, soft inlier scoring, 해석적 Gauss-Newton 그래디언트, 재투영 기반 자기지도)는 DSAC*와 ACE 계열에 채택되는 템플릿이 되었으며, 단일 뷰 재투영 제약만으로 암묵적 신경 장면 맵을 발견할 수 있음을 일찍이 입증했습니다 — 이 아이디어는 신경 mapping 전반에서 반복적으로 등장합니다.

## 관련 문서

- [DSAC](dsac.md) — 원조 미분 가능 RANSAC 공식화
- [DSAC*](dsac-star.md) — 통합되고 더욱 개선된 프레임워크 (TPAMI)
- [ACE](ace.md) — SCR 학습을 몇 시간에서 몇 분으로 가속
- [ACE Zero](ace-zero.md) — 포즈 지도조차 제거하여 처음부터 맵을 학습
- [PoseNet](posenet.md) — SCR이 능가하는 absolute pose regression 접근법
