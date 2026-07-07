# Basic Linear Algebra

선형대수는 SLAM의 실무 언어입니다: 점, 포즈, 잔차, 관측값은 모두 벡터와 행렬이며, 모든 solver는 결국 행렬 연산으로 환원됩니다.

## 벡터와 행렬

**벡터** $\mathbf{v} \in \mathbb{R}^n$는 $n$개의 실수로 이루어진 열입니다. SLAM에서 벡터는 점, 이동, 속도, 잔차를 표현합니다. **행렬** $A \in \mathbb{R}^{m \times n}$는 $\mathbb{R}^n$에서 $\mathbb{R}^m$으로의 선형 사상을 표현합니다. SLAM 기하학에서 핵심 객체는 행렬-벡터 곱 $A\mathbf{x} = \mathbf{b}$입니다.

## 행렬식

정방 행렬의 행렬식 $\det(A)$는 선형 사상 $A$의 부호 있는 부피 배율을 측정합니다. 핵심 사실:

- $\det(A) \neq 0 \Leftrightarrow A$는 가역.
- 회전 행렬 $R \in SO(3)$에 대해: $\det(R) = +1$.
- $\det(AB) = \det(A)\det(B)$.

## 내적과 외적

$\mathbf{u}, \mathbf{v} \in \mathbb{R}^3$의 **내적**은 $\mathbf{u} \cdot \mathbf{v} = \mathbf{u}^T\mathbf{v} = \|\mathbf{u}\|\|\mathbf{v}\|\cos\theta$이며, 투영과 직교성 검사에 사용됩니다. **외적** $\mathbf{u} \times \mathbf{v}$는 두 벡터 모두에 수직인 벡터를 생성하며, 크기는 $\|\mathbf{u}\|\|\mathbf{v}\|\sin\theta$입니다. Essential 행렬의 왜대칭 행렬 표현과 표면 법선 계산에 등장합니다.

외적은 **왜대칭 행렬**을 이용한 행렬-벡터 곱으로 쓸 수 있습니다:

$$\mathbf{u} \times \mathbf{v} = [\mathbf{u}]_\times \mathbf{v}, \qquad [\mathbf{u}]_\times = \begin{bmatrix} 0 & -u_3 & u_2 \\ u_3 & 0 & -u_1 \\ -u_2 & u_1 & 0 \end{bmatrix}$$

이 작은 항등식은 SLAM 곳곳에 등장합니다: Essential 행렬은 $E = [\mathbf{t}]_\times R$이며, $\mathfrak{so}(3)$의 Lie 대수 원소는 왜대칭 행렬입니다.

## 계수, 역행렬, 전치

$A$의 **계수**는 열 공간의 차원입니다. SLAM에서 Fundamental 행렬은 구성상 계수 2를 가지며, 모든 점이 공평면에 있을 때 점 행렬은 계수 부족이 됩니다(SLAM 초기화의 퇴화 구성). **역행렬** $A^{-1}$는 $AA^{-1} = I$를 만족하며 $\det(A) \neq 0$일 때만 존재합니다. 회전 행렬에 대해서는 $R^{-1} = R^T$(직교성)---완전한 역행렬 계산을 피하기 위해 끊임없이 활용됩니다.

행렬이 유효한 회전인지 확인하는 간단한 NumPy 검증:

```python
import numpy as np

theta = np.pi / 4
R = np.array([[np.cos(theta), -np.sin(theta), 0],
              [np.sin(theta),  np.cos(theta), 0],
              [0,              0,             1]])

print(np.allclose(R.T @ R, np.eye(3)))  # True: orthogonal
print(np.linalg.det(R))                 # 1.0: proper rotation
```

## 선형 시스템 풀이

SLAM 백엔드는 절대로 행렬을 명시적으로 역행렬화하지 않습니다. 대신 *인수분해*하여 풀이합니다:

- **Cholesky 분해** ($A = LL^T$)는 대칭 양의 정부호 시스템에 사용됩니다---번들 조정의 정규 방정식 $J^TJ\,\Delta\mathbf{x} = -J^T\mathbf{e}$가 이 방식으로 풀립니다(실무에서는 희소 Cholesky).
- **QR 분해**는 최소제곱에 대해 수치적으로 더 안전한 대안으로, $J^TJ$를 형성하지 않고(조건수를 제곱시킴) $J$에 직접 작용합니다.
- **SVD**는 가장 강건하지만(그리고 가장 비용이 큰) 옵션으로, 계수 부족인 동차 시스템 $A\mathbf{x} = \mathbf{0}$을 깔끔하게 처리할 수 있는 유일한 방법입니다.

## 특이값 분해 (SVD)

SVD는 SLAM에서 가장 중요한 행렬 분해입니다. 임의의 행렬 $A \in \mathbb{R}^{m \times n}$은 다음과 같이 분해됩니다:

$$A = U \Sigma V^T$$

여기서 $U$와 $V$는 직교 행렬이고, $\Sigma$는 비음수 **특이값** $\sigma_1 \geq \sigma_2 \geq \cdots \geq 0$을 가진 대각 행렬입니다. 기하학적으로, 임의의 선형 사상은 회전/반사, 좌표별 스케일링, 또 다른 회전/반사의 합성입니다. SLAM에서의 활용:

- **Essential 행렬 분해**: $E$의 SVD는 4개의 후보 상대 포즈 $[R|\pm\mathbf{t}]$를 산출합니다.
- **DLT 삼각측량**: 해는 가장 작은 특이값에 해당하는 $A$의 오른쪽 특이 벡터입니다.
- **ICP 정렬**: 교차 공분산 행렬 $H = \sum_i \mathbf{p}_i \mathbf{q}_i^T$의 SVD가 최적 회전을 줍니다.

비율 $\sigma_1/\sigma_n$은 **조건수**입니다: 선형 풀이가 입력 노이즈를 얼마나 증폭시키는지 측정합니다. 조건이 나쁜 시스템(거대한 조건수)이 8점 알고리즘과 DLT에서 좌표 정규화가 중요한 이유입니다.

## 고유값과 고유벡터

$A\mathbf{v} = \lambda\mathbf{v}$를 만족하는 비영 벡터 $\mathbf{v}$와 스칼라 $\lambda$를 각각 $A$의 **고유벡터**와 **고유값**이라 합니다. Harris 코너 검출기는 구조 텐서의 고유값으로부터 이미지 패치를 분류하며, 포인트 클라우드의 PCA는 공분산 행렬의 고유벡터를 사용하여 주 방향을 찾습니다(예: 평면 피팅). 대칭 행렬(공분산, 구조 텐서, $J^TJ$)의 경우 고유값은 실수이고 고유벡터는 직교하며---고유값 분해는 SVD와 일치합니다.

## 흔한 함정

- **행렬을 명시적으로 역행렬화**(`inv(A) @ b`)하는 대신 풀이(`np.linalg.solve`, Cholesky)를 사용해야 함: 명시적 역행렬화는 더 느리고 부정확함.
- **동차 시스템을 풀기 전 정규화를 잊음**---DLT와 8점 알고리즘은 원본 픽셀 좌표에서 크게 성능이 저하됩니다.
- **SVD 기반 회전 복원에서의 부호/반사 모호성**: 항상 $\det(R) = +1$을 확인하고, 반사가 나왔다면 부호를 뒤집어 보정해야 합니다.

## SLAM에서의 의미

SLAM 파이프라인의 모든 단계는 사실 선형대수입니다: 점 투영은 행렬 곱을 사용하고, 최소 solver(8점, DLT, ICP)는 SVD로 환원되며, 번들 조정의 정규 방정식은 큰 희소 선형 시스템입니다. 특히 SVD, 직교 행렬, 계수에 대한 숙련도는 SLAM 논문을 읽고 기하학 코드를 디버깅하는 능력의 기반이 됩니다.

## 관련 문서

- [Basic Calculus](basic-calculus.md)
- [Epipolar geometry](epipolar-geometry.md)
- [Triangulation](triangulation.md)
- [Math libraries](../level-02-getting-familiar/math-libraries.md)
- [Schur complement / Sparsity](../level-02-getting-familiar/schur-complement-sparsity.md)
- [3D-3D correspondence](../level-02-getting-familiar/3d-3d-correspondence.md)
