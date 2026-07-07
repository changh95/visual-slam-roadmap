# M-Estimator

일반 최소제곱법은 가우시안 노이즈 아래에서는 통계적으로 최적이지만 — 이상치 아래에서는 치명적으로 취약합니다. 제곱 손실이 무한히 커지기 때문에, 단 하나의 심한 이상치가 추정값을 임의로 멀리 끌고 갈 수 있습니다. **M-estimator**(최대우도형 추정기)는 큰 잔차에 대해 더 느리게 커지는 **강건 커널(robust kernel)** $\rho$로 제곱 손실을 대체하여 이를 해결합니다:

$$
\min_{\theta} \sum_i \rho\!\left(\frac{r_i(\theta)}{\sigma}\right)
$$

여기서 $r_i$는 $i$번째 잔차(예: 재투영 오차)이고 $\sigma$는 잔차를 노이즈 단위로 정규화하는 스케일 파라미터입니다.

## 흔히 쓰이는 강건 커널

- **Huber**: 작은 잔차에는 이차, 임계값 $k$를 넘으면 선형입니다:

$$
\rho(r) = \begin{cases} r^2/2 & |r| \leq k \\ k|r| - k^2/2 & |r| > k \end{cases}
$$

  볼록하고, 안전하며, 완만합니다 — 확실하지 않을 때의 기본 선택입니다.

- **Cauchy (Lorentzian)**: $\rho(r) = \frac{c^2}{2}\log\!\left(1 + r^2/c^2\right)$. 로그적으로 증가하며, 큰 이상치를 강하게 감쇠시키지만 비볼록입니다.

- **Tukey biweight**: 완전히 포화됩니다 — 임계값 $c$를 넘는 잔차는 상수 비용과 정확히 **0**의 기울기를 갖게 되어, 확정된 이상치는 해에 전혀 영향을 미치지 않게 됩니다. 이러한 *하강형(redescending)* 커널은 이상치를 가장 강하게 배제하지만, 먼 측정값이 추정값을 다시 끌어당길 수 없기 때문에 적절한 초기화가 필요합니다.

도함수 $\psi(r) = \rho'(r)$는 **영향 함수(influence function)**라고 불립니다: 잔차 $r$에 있는 데이터 하나가 추정값을 얼마나 끌어당기는지를 측정합니다. 최소제곱에서는 $\psi(r) = r$(무한한 영향)이고, Huber에서는 $\pm k$에서 클리핑되며, Tukey에서는 0으로 하강합니다.

## IRLS로 풀기

강건 비용의 기울기를 0으로 설정하면 $\sum_i \psi(r_i)\,\partial r_i/\partial\theta = 0$을 얻습니다. 가중값 $w_i = \psi(r_i)/r_i$를 정의하면 이는 **가중** 최소제곱 문제의 조건이 되며, 이는 **반복 재가중 최소제곱(Iteratively Reweighted Least Squares, IRLS)**을 시사합니다:

1. 현재 추정값에서 잔차 $r_i$를 계산합니다.
2. 가중값 $w_i = \rho'(r_i)/r_i$를 계산합니다(작은 잔차 → 가중값이 1에 가까움; 큰 잔차 → 가중값이 0에 가까움).
3. 가중 최소제곱 문제 $\min_\theta \sum_i w_i\, r_i(\theta)^2$를 풉니다(하나의 가우스-뉴턴/LM 스텝).
4. 수렴할 때까지 반복합니다.

실제로는 이것이 [가우스-뉴턴](gauss-newton.md)이나 [Levenberg-Marquardt](levenberg-marquardt.md) 루프에 매끄럽게 통합됩니다: 강건 커널은 각 잔차 블록의 야코비안과 오차를 다시 스케일링할 뿐입니다. Ceres는 이를 `LossFunction`이라고 부르고, g2o는 `RobustKernel`이라고 부릅니다.

스케일 $\sigma$도 커널만큼이나 중요합니다: 무엇을 "큰 것"으로 볼지를 정의합니다. 표준적인 강건 추정값은 중위수 절대 편차로부터 유도됩니다, $\hat{\sigma} = 1.4826 \cdot \mathrm{median}_i\,|r_i - \mathrm{median}(r)|$, 이 상수는 이를 가우시안 표준편차와 일치시킵니다.

## M-estimator 대 RANSAC

두 방법은 상호 보완적이며, 실제 파이프라인은 둘 다를 사용합니다:

- [RANSAC](ransac.md)은 **경직된(hard)** 내점/이상치 결정을 내리며 압도적인 이상치 비율에서도 회복할 수 있지만, 그 출력은 딱 하나의 최소 샘플만큼만 좋습니다.
- M-estimator는 **부드러운(soft)**, 연속적인 결정을 내리고 모든 파라미터를 함께 정제하지만, 올바른 분지(basin) 근처에서 시작해야만 수렴합니다.

표준적인 레시피: RANSAC으로 대략적인 모델과 내점 집합을 찾은 다음, 내점들에 대해 강건한 비선형 정제(Huber/Cauchy)를 수행하여 남은 불일치를 흡수합니다.

## SLAM에서의 의미

SLAM의 모든 잔차는 때때로 잘못됩니다: 잘못 매칭된 특징, 움직이는 물체, 잘못된 루프 클로저. 순수한 최소제곱 [번들 조정](bundle-adjustment.md)에 이들 중 몇 개만 들어가도 전체 궤적이 손상됩니다. 그래서 강건 커널은 어디에나 쓰입니다 — ORB-SLAM은 재투영 오차를 Huber 커널로 감싸고, 포즈 그래프 백엔드는 루프 클로저 에지를 Cauchy나 스위치 가능한 제약(switchable-constraint) 공식으로 감싸며, 현대의 전역적으로 강건한 방법들(graduated non-convexity)은 하강형 M-estimator 위에 직접 구축됩니다. 어떤 시스템이 어떤 커널을 사용하며 어떤 임계값에서 사용하는지 아는 것은, 프론트엔드가 시스템에 거짓 정보를 줄 때 그 시스템이 어떻게 행동할지를 말해줍니다.

## 관련 문서

- [RANSAC](ransac.md)
- [Non-linear optimization](non-linear-optimization.md)
- [Bundle Adjustment](bundle-adjustment.md)
- [Robust pose-graph optimization](robust-pose-graph-optimization.md)
- [GNC](../level-05-deep-learning/gnc.md)
