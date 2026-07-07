# Levenberg-Marquardt

Levenberg-Marquardt (LM)은 SLAM에서 비선형 최소제곱 문제를 위한 표준 솔버입니다. 이는 [Gauss-Newton](gauss-newton.md)의 감쇠(damped) 버전으로, 가우스-뉴턴(최솟값 근처에서 빠름)과 경사 하강법(먼 곳에서도 안전함) 사이를 보간하여, 부실한 초기화에 훨씬 더 견고하게 만듭니다.

## Gauss-Newton에서 LM으로

비용 $F(\mathbf{x}) = \tfrac{1}{2}\|\mathbf{e}(\mathbf{x})\|^2$에 대해, 가우스-뉴턴은 잔차 $\mathbf{e}(\mathbf{x}_k + \Delta\mathbf{x}) \approx \mathbf{e}(\mathbf{x}_k) + J_k \Delta\mathbf{x}$를 선형화하고 정규 방정식을 풉니다

$$
(J_k^T J_k)\,\Delta\mathbf{x} = -J_k^T \mathbf{e}(\mathbf{x}_k)
$$

이는 선형화가 부정확한 근사일 때, 또는 $J_k^T J_k$가 (거의) 특이(singular)할 때 발산할 수 있습니다. LM은 **감쇠 항** $\lambda I$를 추가합니다:

$$
(J_k^T J_k + \lambda I)\,\Delta\mathbf{x} = -J_k^T \mathbf{e}(\mathbf{x}_k)
$$

여기서:

- $J_k$는 현재 추정값 $\mathbf{x}_k$에서 잔차 벡터의 야코비안이고,
- $\lambda > 0$은 감쇠 파라미터이며,
- $\Delta\mathbf{x}$는 업데이트로, $\mathbf{x}_{k+1} = \mathbf{x}_k + \Delta\mathbf{x}$로(또는 다양체 위 포즈의 경우 지수 사상을 통해) 적용됩니다.

두 극한이 그 동작을 설명합니다:

- $\lambda \to 0$: 방정식이 가우스-뉴턴으로 환원됩니다 — 최솟값 근처에서 거의 이차적인 수렴을 보이는 크고 적극적인 스텝.
- $\lambda \to \infty$: 방정식이 $\lambda\,\Delta\mathbf{x} = -J_k^T\mathbf{e}$에 가까워집니다. 즉 음의 기울기를 따르는 짧은 스텝 — 느리지만 신뢰할 수 있는 하강입니다.

Marquardt의 개선은 각 좌표의 곡률에 따라 감쇠를 스케일링하여, $\lambda I$를 $\lambda\,\mathrm{diag}(J_k^T J_k)$로 대체합니다. 이로써 약하게 제약된 방향은 더 많이 감쇠되고, 파라미터별 재스케일링에 대해 불변한 방법이 됩니다.

## 감쇠 적응

$\lambda$는 매 반복마다 그 스텝이 실제로 도움이 되었는지에 따라 조정됩니다:

1. 현재 $\lambda$로 $\Delta\mathbf{x}$를 풉니다.
2. $\mathbf{x}_k + \Delta\mathbf{x}$에서 실제 비용을 평가합니다.
3. 비용이 감소했다면: 스텝을 받아들이고 $\lambda$를 **감소**시킵니다(선형화를 더 신뢰합니다).
4. 비용이 증가했다면: 스텝을 거부하고 $\lambda$를 **증가**시킵니다(더 작고 경사 하강에 가까운 스텝을 취합니다), 그런 다음 다시 풉니다.

일반적인 개선은 실제 비용 감소를 선형화된 모델이 예측한 감소와 비교하는 것입니다(**이득 비율(gain ratio)**): 비율이 1에 가까우면 지역 이차 모델을 신뢰할 수 있다는 뜻이므로 $\lambda$를 적극적으로 줄일 수 있고, 비율이 작거나 음수이면 모델이 부실하다는 뜻이므로 $\lambda$를 늘려야 합니다. 이는 정확히 **트러스트 리전(trust-region) 방법**의 논리입니다 — LM은 $\mathbf{x}_k$ 주변에 선형화가 신뢰되는 영역을 암묵적으로 유지하는 것으로 읽을 수 있으며, $\lambda$는 그 영역의 반지름에 반비례합니다.

## SLAM 문제에 대한 실용적인 노트

- 감쇠된 시스템 행렬 $J^T J + \lambda I$는 $\lambda > 0$일 때 항상 양의 정부호(positive definite)이므로, Cholesky 분해가 항상 성공합니다 — 단안 번들 조정과 같이 게이지(gauge)가 미결정인 문제에서 중요합니다.
- SLAM 헤시안의 희소성은 보존됩니다: 감쇠는 대각선에만 영향을 주므로, 번들 조정을 위한 슈어 보완 트릭이 변경 없이 작동합니다.
- 강건 커널([M-estimator](m-estimator.md))은 반복 재가중 최소제곱으로 LM에 통합됩니다 — 가중값이 $J$와 $\mathbf{e}$를 수정할 뿐, LM 루프는 그 외에는 동일합니다.
- LM은 Ceres Solver, g2o, GTSAM의 기본 최적화기이며, 따라서 대부분의 SLAM 백엔드 내부에서 실제로 실행되는 알고리즘입니다.

## SLAM에서의 의미

현대 SLAM 파이프라인의 거의 모든 최적화 — [번들 조정](bundle-adjustment.md), 포즈 그래프 최적화, PnP 정제, 카메라 캘리브레이션 — 는 LM으로 풀립니다. SLAM 문제는 매우 비선형적이고(투영, 회전 다양체) 초기화가 보통 평범한 수준이기 때문에(모션 모델 예측, 잡음 있는 삼각측량), 순수한 가우스-뉴턴 스텝은 자주 오버슈트합니다. LM의 자동 감쇠는 이러한 솔버들이 손으로 튜닝하지 않고도 매 프레임마다 신뢰성 있게 수렴하게 만드는 요인이며, 이 때문에 수십 년 동안 SLAM 백엔드의 기본값이 되어 왔습니다.

## 관련 문서

- [Gauss-Newton](gauss-newton.md)
- [Non-linear optimization](non-linear-optimization.md)
- [Bundle Adjustment](bundle-adjustment.md)
- [Reprojection error](reprojection-error.md)
- [Math libraries (Eigen, Ceres, GTSAM, g2o)](math-libraries.md)
