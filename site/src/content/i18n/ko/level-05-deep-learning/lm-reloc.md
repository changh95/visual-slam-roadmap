# LM-Reloc

> von Stumberg 2020 · [논문](https://arxiv.org/abs/2010.06323)

**한 줄 요약** — 딥 direct 재위치추정: Levenberg-Marquardt 기반 direct 이미지 정합에 맞춰 CNN 특징을 학습하여, 특징 매칭이나 RANSAC 없이 query와 reference 이미지 간의 상대 pose를 추정한다.

## 문제

시각적 재위치추정(visual relocalization)은 거의 항상 특징 기반 방식으로 다뤄진다 — keypoint를 검출하고, descriptor를 매칭하고, RANSAC으로 outlier를 걸러내고, pose를 푼다. 이 파이프라인은 코너를 제외한 모든 것을 버린다. Direct 이미지 정합은 gradient가 있는 *어떤* 이미지 영역이든 활용할 수 있지만, 원시 광도(photometric) 정합은 조명, 날씨, 계절 변화 아래서 무너지며, 좁은 수렴 영역(basin of convergence) 때문에 재위치추정에서 일반적인 넓은 baseline 아래서는 취약하다. LM-Reloc은 direct 방식을 유지하면서도 다양한 조건에서 강인하게 만드는 방법을 묻는다.

## 방법 및 아키텍처

LM-Reloc은 direct SLAM 시스템(Stereo DSO)으로부터 얻은 희소 깊이를 이용해, 이미지 $I$와 $I'$ 사이의 6DoF pose $\boldsymbol{\xi} \in SE(3)$를 추정한다. 세 요소가 함께 동작한다: **LM-Net**(다중 스케일 특징 맵 $F_l, F'_l$, $l = 1,\dots,4$를 생성하는 Siamese encoder-decoder), **CorrPoseNet**(조대한 pose 초기화), 그리고 고전적인 **Levenberg-Marquardt 최적화기**.

**학습된 특징에 대한 direct 정합.** 최적화기는 원시 명암값 대신 조대-정밀 피라미드에서 feature-metric 에너지를 최소화한다($F_1$은 $(w/8, h/8)$에서, $F_4$는 원해상도까지):

$$E(\boldsymbol{\xi})=\sum_{\mathbf{p}\in P}\big\lVert F_{l}^{\prime}(\mathbf{p}^{\prime})-F_{l}(\mathbf{p})\big\rVert_{\gamma}, \qquad \mathbf{p}^{\prime}=\Pi\left(\mathbf{R}\,\Pi^{-1}(\mathbf{p},d_{\mathbf{p}})+\mathbf{t}\right),$$

Huber norm $\lVert\cdot\rVert_\gamma$과 point별 깊이 $d_{\mathbf{p}}$를 사용한다. 각 LM iteration은 Gauss-Newton 시스템 $\mathbf{H}=\mathbf{J}^{T}\mathbf{W}\mathbf{J}$, $\mathbf{b}=-\mathbf{J}^{T}\mathbf{W}\mathbf{r}$을 구성하고, $\mathbf{H}'=\mathbf{H}+\lambda\mathbf{I}$(Levenberg) 또는 $\mathbf{H}'=\mathbf{H}+\lambda\,\mathrm{diag}(\mathbf{H})$(Marquardt)로 감쇠시킨 뒤 $\boldsymbol{\delta}=\mathbf{H}'^{-1}\mathbf{b}$, $\boldsymbol{\xi}^{i}=\boldsymbol{\delta}\boxplus\boldsymbol{\xi}^{i-1}$로 갱신한다; $\lambda$는 성공한 step 이후 반으로 줄고 실패한 step 이후 4배로 늘어난다.

**최적화기 주변에 설계된 손실.** 핵심 아이디어는 LM이 특징 위에서 잘 동작하도록 특징을 학습시키는 것이며, 이를 위해 최적화 중 투영된 point가 놓일 수 있는 네 가지 상태를 구분하고 각각에 자체의 샘플링된 대응점과 손실 항을 둔다:

1. 올바른 위치: $E_{\text{pos}}=\lVert F^{\prime}(\mathbf{p}_{\text{gt}}^{\prime})-F(\mathbf{p})\rVert^{2}$는 사라져야 한다.
2. Outlier(어디서나 샘플링된 negative): $E_{\text{neg}}=\max\left(M-\lVert F^{\prime}(\mathbf{p}_{\text{neg}}^{\prime})-F(\mathbf{p})\rVert^{2},0\right)$, margin $M=1$ — 잘못된 매칭은 큰 residual을 만들어야 한다.
3. 최적점에서 먼 경우(negative는 약 5px 떨어짐, $\lambda$가 큼, gradient-descent 체제): 감쇠된 point별 flow step $\mathbf{p}_{\text{after}}^{\prime}=\mathbf{p}_{\nabla}^{\prime}+(\mathbf{H}_{\mathbf{p}}+\lambda_{f}\mathbf{I})^{-1}\mathbf{b}_{\mathbf{p}}$가 정답 쪽으로 이동해야 한다: $E_{\text{GD}}=\max\left(\lVert\mathbf{p}_{\text{after}}^{\prime}-\mathbf{p}_{\text{gt}}^{\prime}\rVert^{2}-\lVert\mathbf{p}_{\nabla}^{\prime}-\mathbf{p}_{\text{gt}}^{\prime}\rVert^{2}+\delta,0\right)$(수렴 영역을 넓힘; $\lambda_f{=}2.0$, $\delta{=}0.1$).
4. 최적점 근처(negative는 1px 이내, $\lambda$가 작음, Gauss-Newton 체제): GN-Net의 확률적 Gauss-Newton 손실 $E_{\text{GN}}=\frac{1}{2}(\mathbf{p}_{\text{after}}^{\prime}-\mathbf{p}_{\text{gt}}^{\prime})^{T}\mathbf{H}_{\mathbf{p}}(\mathbf{p}_{\text{after}}^{\prime}-\mathbf{p}_{\text{gt}}^{\prime})+\log(2\pi)-\frac{1}{2}\log(|\mathbf{H}_{\mathbf{p}}|)$(subpixel 정확도를 위해 최소점을 더 뾰족하게 만든다).

**초기화를 위한 CorrPoseNet.** 상관(correlation) 레이어를 가진 회귀 네트워크로, $\mathbf{c}(i,j,(i^{\prime},j^{\prime}))=\mathbf{f}_{\text{corr}}(i,j)^{T}\mathbf{f}_{\text{corr}}^{\prime}(i^{\prime},j^{\prime})$를 사용해 Euler 각과 이동을 회귀하여 큰 baseline/회전에서도 LM을 부트스트랩한다; 이는 강인하지만 부정확하므로 최종 추정치는 항상 기하학적 최적화에서 나온다.

## 실험 결과

재위치추정 tracking 벤치마크(CARLA + Oxford RobotCar)에서 평가하며, 0.5 m / 0.5° 이내의 누적 pose 오차 곡선의 AUC로 보고한다:

- **CARLA (test)**: LM-Reloc은 $t_{\text{AUC}}/R_{\text{AUC}}$가 **80.65 / 77.83**에 도달한다 — SuperGlue 78.99 / 59.31, R2D2 73.47 / 54.42, SuperPoint 72.76 / 53.38, D2-Net 47.62 / 16.47 대비 우수; CorrPoseNet을 제거하면 63.88 / 61.9, GN-Net은 43.72 / 44.08 — LM 손실만으로도 이미 GN-Net을 크게 앞선다.
- **Oxford RobotCar** (sunny/overcast/rainy/snowy 사이 6개의 조건 간 쌍): LM-Reloc은 거의 일관되게 회전 AUC에서 우세하고(예: Sunny-Overcast 55.48 vs SuperGlue의 52.83) 이동에서도 경쟁력을 유지한다; LiDAR-ICP ground truth 자체가 약 16 cm RMS 오차를 가지므로, 0.15 m 이하의 이동 개선은 이 오차에 가려진다.
- **GN-Net과의 직접 비교** (CorrPoseNet 없이, 동일한 정합 파이프라인): 여섯 시퀀스 모두에서 더 우수하다, 예를 들어 Sunny-Rainy 70.46 / 42.86 vs 64.58 / 37.27.
- **Ablation**: $E_{\text{GD}}$는 주로 강인성을 개선하고, $E_{\text{GN}}$은 정확도를 개선한다; 둘을 함께 사용해야만 양쪽 모두를 얻는다.

## SLAM에서의 의미

LM-Reloc은 TUM의 direct SLAM 계보(DSO와 그 후속작들)에서 나왔으며, direct 방법의 핵심 약점 — 외관 변화 아래서의 재위치추정과 지도 재사용 — 을 다룬다. 이는 생산적인 설계 패턴을 잘 보여준다 — 고전적인 기하학적 최적화기는 그대로 유지하되, 그것이 동작하는 표현을 학습하고, 최적화기의 실제 수렴 거동에 맞춰 학습 손실을 설계한다. Direct 방법의 정확도가 필요하지만 세션이나 조건이 바뀌어도 재위치추정을 해야 할 때 이 부류의 아이디어를 쓸 만하다.

## 관련 문서

- [DSO](../level-03-monocular-slam/dso.md) — 이 연구가 기반으로 하는 direct odometry 계보
- [D3VO](../level-03-monocular-slam/d3vo.md) — 같은 연구 그룹의 딥 direct odometry; CorrPoseNet에 영감을 줌
- [PoseNet](posenet.md) — 순수 pose 회귀로, 여기서는 초기화에만 사용됨
- [CNN Pose Regression Limitations](cnn-pose-regression-limitations.md) — 왜 회귀만으로는 충분하지 않은가
- [HF-Net](hf-net.md) — 재위치추정을 위한 특징 매칭 기반 대안
- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md) — 재위치추정을 위한 reference 이미지 검색
