# Gauss-Newton

**가우스-뉴턴(Gauss-Newton)**은 비선형 최소제곱(nonlinear least squares) 문제의 근간이 되는 반복 알고리즘입니다 — 사실상 모든 SLAM 백엔드 계산(번들 조정, 포즈 그래프 최적화, PnP 정제, 직접 이미지 정합)이 귀결되는 문제 종류입니다. 비용의 특수한 *제곱합* 구조를 활용함으로써, 1차 도함수만 계산하면서도 2차에 가까운 수렴 속도를 얻어냅니다.

## 유도

상태 $\mathbf{x} \in \mathbb{R}^n$에 대한 잔차 벡터 $\mathbf{e}(\mathbf{x}) \in \mathbb{R}^m$로 구성된 비용을 최소화합니다:

$$
F(\mathbf{x}) = \frac{1}{2} \|\mathbf{e}(\mathbf{x})\|^2
$$

현재 추정값 $\mathbf{x}_k$에서 계산한 야코비안 $J_k = \partial \mathbf{e} / \partial \mathbf{x}$를 이용해 (비용이 아니라) 잔차를 선형화합니다:

$$
\mathbf{e}(\mathbf{x}_k + \Delta\mathbf{x}) \approx \mathbf{e}(\mathbf{x}_k) + J_k \Delta\mathbf{x}
$$

이를 대입하면 $\Delta\mathbf{x}$에 대한 비용의 *이차* 모델이 얻어집니다:

$$
F(\mathbf{x}_k + \Delta\mathbf{x}) \approx \frac{1}{2}\|\mathbf{e}_k\|^2 + \Delta\mathbf{x}^T J_k^T \mathbf{e}_k + \frac{1}{2} \Delta\mathbf{x}^T J_k^T J_k \Delta\mathbf{x}
$$

$\Delta\mathbf{x}$에 대한 도함수를 0으로 설정하면 **정규 방정식(normal equations)**이 얻어집니다:

$$
(J_k^T J_k)\, \Delta\mathbf{x} = -J_k^T \mathbf{e}_k
$$

$\Delta\mathbf{x}$를 구합니다(실제로는 명시적인 역행렬 계산이 아니라 희소한 $J^T J$의 콜레스키 분해를 통해). 업데이트 $\mathbf{x}_{k+1} = \mathbf{x}_k + \Delta\mathbf{x}$를 적용하고, 다시 선형화한 뒤, 업데이트나 비용 변화가 무시할 만한 수준이 될 때까지 반복합니다.

측정 공분산이 있는 경우, 잔차는 정보 행렬 $\Omega = \Sigma^{-1}$로 가중되며 정규 방정식은 $J^T \Omega J \,\Delta\mathbf{x} = -J^T \Omega\, \mathbf{e}$가 됩니다 — 대수는 동일하며, 이는 정확히 가우스 노이즈 하에서의 MAP 추정에 해당합니다.

## 뉴턴 방법과의 관계

뉴턴 방법은 $F$의 진짜 헤시안을 사용합니다:

$$
\nabla^2 F = J^T J + \sum_i e_i \, \nabla^2 e_i
$$

가우스-뉴턴은 **두 번째 항을 버려서** $H \approx J^T J$로 근사합니다. 이는 (2차 도함수가 필요 없어) 저렴하며, 최적해에서 잔차가 작을 때(모델이 데이터를 잘 맞출 때)나 거의 선형일 때 — 즉 수렴 중인 SLAM 문제의 전형적인 상태 — 정확합니다. 해 근처에서는 수렴이 거의 이차적입니다. 이 근사는 또한 $H \succeq 0$을 보장하므로, $H$가 비특이(nonsingular)인 한 계산된 스텝은 항상 하강 방향(descent direction)이 됩니다.

## 실패 모드

- **최적해에서 먼 곳에서의 발산**: 선형화가 너무 부정확해서 전체 스텝이 오히려 비용을 증가시킬 수 있습니다. 가우스-뉴턴에는 스텝 크기 제어가 없습니다. 레벤버그-마쿼트(Levenberg-Marquardt)는 정규 방정식을 감쇠시켜 이를 해결합니다.
- **특이 또는 조건이 나쁜 $J^T J$**: 관측 불가능한 방향들(단안 스케일, BA의 전역 게이지 자유도 — 전체 해가 자유롭게 이동/회전할 수 있는 경우)은 $H$를 랭크 결핍(rank-deficient) 상태로 만듭니다. 해결책: 하나의 자세를 고정하거나, 사전 분포를 추가하거나, LM의 감쇠를 사용합니다.
- **국소 최솟값**: 모든 국소적 방법과 마찬가지로, 시작한 유역(basin)으로 수렴합니다 — 이것이 SLAM이 좋은 초기화에 집착하는 이유입니다.

## 매니폴드 위에서

자세는 $\mathbb{R}^n$이 아니라 $\mathrm{SE}(3)$ 위에 존재하므로, 업데이트는 지수 사상(exponential map)을 통해 적용됩니다: 증분을 $\boldsymbol{\xi} \in \mathbb{R}^6$으로 매개변수화하고, $\boldsymbol{\xi}$에 대해 정규 방정식을 풀고, $T \leftarrow T \cdot \exp(\hat{\boldsymbol{\xi}})$로 업데이트합니다. 야코비안은 이 국소 섭동(local perturbation)에 대해 취해집니다. 모든 SLAM 솔버(g2o, Ceres, GTSAM)는 이러한 "국소 벡터를 최적화하고 매니폴드로 리트랙션(retract)한다" 형태로 가우스-뉴턴/LM을 구현합니다.

## SLAM에서의 의미

가우스-뉴턴은 SLAM의 *바로 그* 내부 루프입니다. 번들 조정은 재투영 오차에 대한 가우스-뉴턴/LM이며, 여기서 $J^T J$의 희소한 블록 구조(자세들은 관측을 통해서만 점들과 결합됨)는 슈어 컴플리먼트(Schur complement)를 통해 활용됩니다. 포즈 그래프 최적화는 상대 자세 잔차에 대한 가우스-뉴턴이며, 직접법(LSD-SLAM, DSO)은 포토메트릭 오차에 대해 이를 실행하고, ICP의 정합 단계조차도 하나의 가우스-뉴턴 반복입니다. 어떤 SLAM 백엔드 논문을 읽더라도 여기서 정의된 용어(잔차, 야코비안, 헤시안 근사, 정규 방정식, 감쇠)에 익숙해야 하며, 실무적인 디버깅(내 최적화가 왜 발산했는가? 내 헤시안이 왜 특이한가?) 대부분은 위에 나열된 가정들로 거슬러 올라갑니다.

## 관련 문서

- [Non-linear optimization](non-linear-optimization.md)
- [Levenberg-Marquardt](levenberg-marquardt.md)
- [Reprojection error](reprojection-error.md)
- [Bundle adjustment](bundle-adjustment.md)
- [Schur complement / Sparsity](schur-complement-sparsity.md)
