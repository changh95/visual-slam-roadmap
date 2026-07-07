# Basic Calculus

SLAM 백엔드는 대부분의 시간을 비선형 비용 함수를 최소화하는 데 사용합니다. 미적분학의 두 도구가 이를 가능하게 합니다: **미분**(야코비안)과 **테일러 전개**(선형화)입니다.

## 미분과 야코비안

스칼라 함수 $f: \mathbb{R}^n \to \mathbb{R}$은 그래디언트 $\nabla f = \left[\frac{\partial f}{\partial x_1}, \ldots, \frac{\partial f}{\partial x_n}\right]^T$를 가집니다. 벡터 함수 $\mathbf{f}: \mathbb{R}^n \to \mathbb{R}^m$은 **야코비안 행렬**을 가집니다:

$$J = \frac{\partial \mathbf{f}}{\partial \mathbf{x}} =
\begin{bmatrix}
\frac{\partial f_1}{\partial x_1} & \cdots & \frac{\partial f_1}{\partial x_n} \\
\vdots & \ddots & \vdots \\
\frac{\partial f_m}{\partial x_1} & \cdots & \frac{\partial f_m}{\partial x_n}
\end{bmatrix} \in \mathbb{R}^{m \times n}$$

야코비안은 SLAM 최적화의 핵심 도구입니다: 잔차 $\mathbf{e}(\mathbf{x})$(예를 들어 재투영 오차)가 주어지면, 그 야코비안 $J = \frac{\partial \mathbf{e}}{\partial \mathbf{x}}$는 상태의 작은 섭동에 대해 잔차가 어떻게 변하는지 알려줍니다---Gauss-Newton과 Levenberg-Marquardt에 정확히 필요한 정보입니다.

## SLAM 잔차에서의 연쇄 법칙

SLAM 잔차는 거의 항상 더 단순한 함수들의 *합성*이므로, 그 야코비안은 **연쇄 법칙**에서 나옵니다. 포즈 $T$ 하에서 픽셀 $\mathbf{z}$에서 관측된 지도점 $\mathbf{X}$의 재투영 오차는 다음과 같습니다:

$$\mathbf{e} = \mathbf{z} - \pi\big(T\,\mathbf{X}\big)$$

이는 (1) 강체 변환, (2) 원근 분할, (3) 내부 파라미터 사상의 합성입니다. 그 야코비안은 곱으로 인수분해됩니다:

$$\frac{\partial \mathbf{e}}{\partial \mathbf{x}} = -\,\frac{\partial \pi}{\partial \mathbf{X}_c}\cdot\frac{\partial \mathbf{X}_c}{\partial \mathbf{x}}$$

여기서 $\mathbf{X}_c = T\mathbf{X}$는 카메라 프레임에서의 점입니다. 각 인자를 개별적으로 유도한 뒤 곱하는 방식은 전체 표현식을 한 번에 미분하는 것보다 훨씬 오류가 적으며---SLAM 라이브러리가 해석적 야코비안을 구조화하는 방식이 정확히 이렇습니다.

## 테일러 전개

테일러 급수는 매끄러운 함수 $f$를 점 $x_0$ 주위에서 전개합니다:

$$f(x) = f(x_0) + f'(x_0)(x - x_0) + \frac{1}{2!}f''(x_0)(x - x_0)^2 + \cdots$$

다변량 함수 $f(\mathbf{x})$의 $\mathbf{x}_0$ 주위 전개:

$$f(\mathbf{x}) \approx f(\mathbf{x}_0) + J(\mathbf{x}_0)(\mathbf{x} - \mathbf{x}_0) + \frac{1}{2}(\mathbf{x} - \mathbf{x}_0)^T H(\mathbf{x}_0)(\mathbf{x} - \mathbf{x}_0)$$

여기서 $J$는 야코비안(1차), $H$는 헤시안 행렬(2차)입니다. 1차에서 절단하면 Gauss-Newton에서 사용하는 *선형 근사*가 되고, 2차에서 절단하면 뉴턴법에서 사용하는 *이차 근사*가 됩니다.

## 테일러 전개에서 Gauss-Newton으로

제곱 잔차의 합 $F(\mathbf{x}) = \frac{1}{2}\|\mathbf{e}(\mathbf{x})\|^2$을 최소화하는 문제를 생각해봅시다. 현재 추정값 주위에서 잔차를 선형화하면 $\mathbf{e}(\mathbf{x} + \Delta\mathbf{x}) \approx \mathbf{e} + J\Delta\mathbf{x}$이고, 이를 대입하면:

$$F(\mathbf{x} + \Delta\mathbf{x}) \approx \frac{1}{2}\|\mathbf{e}\|^2 + \mathbf{e}^T J\,\Delta\mathbf{x} + \frac{1}{2}\Delta\mathbf{x}^T J^T J\,\Delta\mathbf{x}$$

이는 $\Delta\mathbf{x}$에 대한 이차식이며, 그 도함수를 0으로 설정하면 **정규 방정식**을 얻습니다:

$$(J^T J)\,\Delta\mathbf{x} = -J^T \mathbf{e}$$

따라서 Gauss-Newton은 "$H \approx J^T J$로 근사한 뉴턴법"이라 할 수 있습니다---실제 헤시안의 2차 도함수 항을 버리는 것인데, 잔차가 작을 때는 좋은 근사입니다. Levenberg-Marquardt는 감쇠 항을 추가하여 $(J^TJ + \lambda I)\Delta\mathbf{x} = -J^T\mathbf{e}$를 풀며, Gauss-Newton($\lambda \to 0$)과 그래디언트 하강법($\lambda$가 큼) 사이를 보간합니다.

## 야코비안 수치 검증

해석적 야코비안은 부호나 전치된 블록 같은 실수가 나기 쉽습니다. 표준적인 검증 방법은 **중앙 유한 차분**입니다: 상태의 한 차원씩 섭동을 주고 다음을 비교합니다:

$$J_{:,k} \approx \frac{\mathbf{e}(\mathbf{x} + h\,\mathbf{1}_k) - \mathbf{e}(\mathbf{x} - h\,\mathbf{1}_k)}{2h}$$

작은 스텝(예: $h \sim 10^{-6}$)을 사용합니다. 진지한 SLAM 코드베이스라면 각 잔차 유형마다 정확히 이 검증을 수행하는 유닛 테스트가 있습니다.

## 흔한 함정

- **부호 오류**: 잔차를 $\mathbf{z} - \pi(\cdot)$로 정의하느냐 $\pi(\cdot) - \mathbf{z}$로 정의하느냐에 따라 $J$의 부호가 뒤바뀝니다. 일관성을 유지해야 합니다.
- **회전을 순진하게 미분하기**: 회전 행렬은 제약이 걸려 있으므로, 도함수는 9개의 행렬 원소가 아니라 지역 섭동에 대해 취해야 합니다([Lie groups](../level-02-getting-familiar/lie-groups.md) 참고).
- **정규화나 왜곡 함수를 거치는 연쇄 법칙 인자를 빠뜨림**---위의 수치 검증이 이를 즉시 잡아냅니다.

## SLAM에서의 의미

번들 조정에서는 재투영 오차 $\mathbf{e}(\mathbf{x} + \Delta\mathbf{x}) \approx \mathbf{e}(\mathbf{x}) + J\Delta\mathbf{x}$를 현재 추정값 주위에서 선형화합니다. 이를 통해 비선형 최소제곱 문제가 반복적으로 풀리는 선형 시스템 $(J^T J)\Delta\mathbf{x} = -J^T \mathbf{e}$의 나열로 변환됩니다. 포즈 그래프 최적화부터 전체 번들 조정까지, 최적화 기반 SLAM 시스템은 모두 이 선형화-풀이-업데이트 루프 위에 구축되어 있으므로, 야코비안을 손으로 유도하고(그리고 수치적으로 검증하는) 능력은 핵심 역량입니다.

## 관련 문서

- [Basic Linear Algebra](basic-linear-algebra.md)
- [Logarithm & Exponential](logarithm-and-exponential.md)
- [MAP inference as sparse nonlinear least squares](../level-02-getting-familiar/map-inference-as-sparse-nonlinear-least-squares.md)
- [Lie groups](../level-02-getting-familiar/lie-groups.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)
