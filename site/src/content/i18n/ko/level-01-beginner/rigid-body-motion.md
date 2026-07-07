# Rigid body motion

**강체 운동(rigid body motion, 강체 변환)**은 모든 점 사이의 거리를 보존합니다. 3D에서는 회전과 이동으로 구성되며, 이를 표현하는 수학적 구조인 $SO(3)$와 $SE(3)$는 SLAM의 핵심입니다: 카메라 포즈는 곧 $SE(3)$의 한 원소입니다.

## 회전 표현

**오일러 각도.** 회전은 고정축 또는 바디축에 대한 연속 회전을 나타내는 세 개의 각도 $(\phi, \theta, \psi)$로 매개변수화할 수 있습니다. 가능한 12가지 관례(ZYX, XYZ, ...) 각각은 서로 다른 각도 시퀀스를 만들어냅니다. **짐벌 락(gimbal lock)** 문제는 두 회전 축이 정렬될 때 발생하며, 이 경우 유효 자유도가 2로 줄어듭니다. 오일러 각도는 디스플레이 용도로는 직관적이지만 수치적으로 문제가 있으므로 반복적 최적화에는 사용을 피해야 합니다.

**회전 행렬.** 회전 행렬은 $R^TR = I$와 $\det(R) = +1$을 만족합니다. 이러한 행렬 전체의 집합은 **Special Orthogonal 군**을 형성합니다:

$$SO(3) = \{R \in \mathbb{R}^{3\times3} \mid R^TR = I,\ \det(R) = +1\}$$

회전 행렬은 계산에 있어 선호되는 표현입니다: 행렬 곱셈이 곧 합성 법칙이며, 역행렬은 단순히 전치 행렬입니다.

**쿼터니언.** 단위 쿼터니언 $q = w + xi + yj + zk$ ($w^2+x^2+y^2+z^2 = 1$)는 축 $[x,y,z]^T/\sin(\theta/2)$를 중심으로 각도 $\theta = 2\arccos(w)$만큼의 회전을 나타냅니다. 이는 컴팩트하고(9개 대신 4개의 수), 짐벌 락이 없으며, Hamilton 곱을 통해 합성됩니다. 이중 덮개(double cover)에 주의해야 합니다: $q$와 $-q$는 동일한 회전을 나타냅니다.

쿼터니언에서 회전 행렬로의 변환:

$$R = \begin{bmatrix}
1 - 2(y^2+z^2) & 2(xy - wz) & 2(xz + wy) \\
2(xy + wz) & 1 - 2(x^2+z^2) & 2(yz - wx) \\
2(xz - wy) & 2(yz + wx) & 1 - 2(x^2+y^2)
\end{bmatrix}$$

행렬이 유효한 회전인지 빠르게 확인하는 NumPy 코드는 다음과 같습니다.

```python
import numpy as np
# R is a rotation iff R^T R = I and det(R) = +1
print(np.allclose(R.T @ R, np.eye(3)), np.isclose(np.linalg.det(R), 1.0))
```

## 동차 변환: $T \in SE(3)$

강체 운동은 회전 $R$과 이동 $\mathbf{t}$를 동차 좌표에 작용하는 하나의 $4\times4$ 행렬로 결합합니다.

$$T = \begin{bmatrix} R & \mathbf{t} \\ \mathbf{0}^T & 1 \end{bmatrix} \in SE(3), \qquad
T\begin{bmatrix}\mathbf{X}\\1\end{bmatrix} = \begin{bmatrix} R\mathbf{X} + \mathbf{t} \\ 1 \end{bmatrix}$$

합성은 행렬 곱셈이며, 회전과 이동이 서로 얽힙니다.

$$T_1 T_2 = \begin{bmatrix} R_1R_2 & R_1\mathbf{t}_2 + \mathbf{t}_1 \\ \mathbf{0}^T & 1 \end{bmatrix}$$

---$\mathbf{t}_2$가 $R_1$에 의해 회전된다는 점에 주목하세요. 이 때문에 연쇄된 변환의 이동량은 단순히 더해지지 *않습니다*. 역변환은 닫힌 형태를 가집니다.

$$T^{-1} = \begin{bmatrix} R^T & -R^T\mathbf{t} \\ \mathbf{0}^T & 1 \end{bmatrix}$$

동차 좌표는 **사영 공간(projective space)**에서 나옵니다: 1(점)이나 0(방향)을 덧붙이면 하나의 행렬로 회전과 이동을 함께 표현할 수 있습니다. 사영 기하학에서는 평행한 3D 직선들이 이미지 안의 한 **소실점(vanishing point)**에서 만나는데, 이는 인공 환경에서 회전을 추정할 때 유용한 단서이며, 이미지 형성이 유클리드적이 아니라 사영적이라는 사실을 상기시켜줍니다.

## 프레임을 명확히 관리하기

가장 효과적인 습관은 합성이 스스로 검증되도록 하는 하첨자 관례를 사용하는 것입니다: $T_{AB}$가 프레임 $B$의 좌표를 프레임 $A$로 매핑한다고 정의합시다. 그러면

$$T_{AC} = T_{AB}\,T_{BC}, \qquad \mathbf{X}_A = T_{AB}\,\mathbf{X}_B$$

이며, 인접한 하첨자는 단위처럼 "약분"되어야 합니다. 그렇지 않다면 그 식은 잘못된 것입니다---이 방법은 한눈에 놀라울 정도로 많은 포즈 연산 버그를 잡아냅니다. 저장된 "카메라 포즈"가 $T_{world,cam}$(카메라-투-월드, 즉 월드 안에서 카메라의 위치)을 의미하는지, 아니면 그 역인 $T_{cam,world}$(투영에 사용되는 외부 파라미터)를 의미하는지 명확히 해야 합니다. 두 관례 모두 코드베이스 사이에서 흔히 쓰입니다.

## 흔한 함정

- **Hamilton vs. JPL 쿼터니언 관례**: 서로 호환되지 않는 두 가지 쿼터니언 곱셈 정의가 문헌에 공존합니다(Eigen과 ROS는 Hamilton 방식을 사용합니다). 이를 섞어 쓰면 회전이 조용히 켤레(conjugate)로 바뀝니다.
- **쿼터니언 저장 순서**: `(w, x, y, z)`와 `(x, y, z, w)`는 라이브러리마다 다릅니다(예: Eigen의 생성자와 내부 레이아웃, ROS 메시지). 항상 알려진 회전으로 테스트해야 합니다.
- **매니폴드에서 벗어남**: 회전 행렬을 반복적으로 곱하거나 쿼터니언을 적분하면 수치 오차가 누적됩니다. 주기적으로 행렬을 재직교화(예: SVD를 통해)하거나 쿼터니언을 재정규화해야 합니다.
- **이중 덮개 하에서의 부호 반전**: $q$와 근처의 $-q'$ 사이를 보간하면 먼 길로 돌아갑니다. 내적이 음수이면 먼저 부호를 반전시켜야 합니다.

## SLAM에서의 의미

모든 SLAM 시스템은 근본적으로 $SE(3)$ 원소들의 궤적을 추정하고 있는 것입니다. 상대 운동을 연쇄하는 것($T_{world,cam} = T_{world,kf}\,T_{kf,cam}$), 변환을 역산하는 것, 쿼터니언(컴팩트한 저장, ROS 메시지)과 회전 행렬(계산) 사이를 변환하는 것은 일상적인 작업입니다. 프레임 관례를 올바르게 맞추는 것---변환이 어느 프레임에서 어느 프레임으로 매핑하는지---는 초보자들이 가장 흔히 저지르는 버그의 원인이므로, 다음 단계로 넘어가기 전에 반드시 이를 확실히 익혀야 합니다.

## 관련 문서

- [Logarithm & Exponential](logarithm-and-exponential.md)
- [Pinhole camera model](pinhole-camera-model.md)
- [Epipolar geometry](epipolar-geometry.md)
- [Lie groups](../level-02-getting-familiar/lie-groups.md)
- [Quaternion kinematics for error-state KF](../level-06-vio-vins/quaternion-kinematics-for-error-state-kf.md)
