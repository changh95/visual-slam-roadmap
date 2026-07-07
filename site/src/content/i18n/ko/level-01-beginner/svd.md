# SVD (Singular Value Decomposition)

**특이값 분해(singular value decomposition)**는 SLAM에서 가장 중요한 행렬 분해라고 할 수 있습니다. 임의의 행렬 $A \in \mathbb{R}^{m \times n}$은 다음과 같이 쓸 수 있습니다.

$$A = U \Sigma V^T$$

여기서 $U \in \mathbb{R}^{m \times m}$과 $V \in \mathbb{R}^{n \times n}$은 직교 행렬($U^T U = I$, $V^T V = I$)이고, $\Sigma \in \mathbb{R}^{m \times n}$은 비음수 원소 $\sigma_1 \geq \sigma_2 \geq \cdots \geq 0$(**특이값**)을 가진 대각 행렬입니다. $U$와 $V$의 열은 각각 좌특이벡터와 우특이벡터입니다.

**기하학적 해석**: 모든 선형 사상은 회전/반사($V^T$), 축에 정렬된 스케일링($\Sigma$), 또 다른 회전/반사($U$)로 이루어집니다. 특이값은 이 사상이 주 방향을 따라 공간을 얼마나 늘리는지를 측정합니다.

## SVD가 행렬에 대해 알려주는 것

- **계수(Rank)**: 0이 아닌 특이값의 개수. 마지막 특이값이 거의 0이면 (수치적으로) 계수 부족인 시스템---예를 들어 퇴화된 점 구성---을 나타냅니다.
- **조건수(Conditioning)**: 비율 $\sigma_1 / \sigma_r$(최댓값 대 0이 아닌 최솟값)이 조건수입니다. 값이 크면 관련된 최소제곱 문제가 조건이 나쁘고, 해가 노이즈에 민감하다는 의미입니다.
- **널 공간(Null space)**: 특이값이 0인 것에 대응하는 우특이벡터들이 $A$의 널 공간을 생성합니다---기하학에서 등장하는 동차 선형 시스템에 정확히 필요한 것입니다.

## SLAM에서의 주요 활용

**동차 최소제곱 (DLT).** 삼각측량, 호모그래피 추정, 카메라 보정, 8점 알고리즘과 같은 문제들은 모두 다음으로 환원됩니다.

$$\min_{\mathbf{x}} \lVert A\mathbf{x} \rVert \quad \text{subject to} \quad \lVert \mathbf{x} \rVert = 1$$

이 해는 $A$의 가장 작은 특이값에 대응하는 우특이벡터입니다.

**행렬 제약 강제.** 추정된 fundamental 행렬에 가장 가까운(프로베니우스 노름 기준) 계수 2 행렬은 가장 작은 특이값을 0으로 만들어서 얻습니다. 마찬가지로 유효한 essential 행렬은 특이값이 $(s, s, 0)$이어야 하는데, 이는 $\Sigma$를 $\mathrm{diag}(1, 1, 0)$으로 대체하여 강제합니다.

**Essential 행렬 분해.** $\Sigma = \mathrm{diag}(1,1,0)$인 $E = U \Sigma V^T$가 주어지면, 네 개의 후보 상대 포즈는 $R_1 = U W V^T$, $R_2 = U W^T V^T$, $\mathbf{t} = \pm\mathbf{u}_3$($U$의 세 번째 열)로부터 만들어집니다. 여기서

$$W = \begin{bmatrix} 0 & -1 & 0 \\ 1 & 0 & 0 \\ 0 & 0 & 1 \end{bmatrix}$$

올바른 포즈는 카이랄리티(cheirality) 검사(삼각측량된 점들이 두 카메라 모두의 앞쪽에 있어야 함)로 선택됩니다.

**점 집합의 강체 정합 (Kabsch / Procrustes).** 매칭되어 중심화된 3D 점 집합이 주어지면, 교차 공분산 $H = \sum_i \mathbf{p}_i \mathbf{q}_i^T$를 구성하고 $H = U \Sigma V^T$를 계산합니다. 최적 회전은

$$R = V\, \mathrm{diag}\big(1,\, 1,\, \det(V U^T)\big)\, U^T$$

이며, 행렬식 보정 항은 반사가 발생하지 않도록 방지합니다. 이 닫힌 형태의 해는 ICP의 내부 단계이며 3D-3D 대응 관계에 대한 표준적인 풀이 방법입니다.

**회전 군으로의 투영.** (평균화나 수치적 드리프트로 인해 생긴) 노이즈가 섞인 "거의 회전"인 행렬도 같은 방식으로 복구합니다: SVD를 취하고 단위 특이값과 행렬식 보정으로 다시 재구성합니다.

**유사역원과 저계수 근사.** Moore-Penrose 유사역원은 $A^{+} = V \Sigma^{+} U^T$(0이 아닌 특이값을 역산)이며, 최소 노름 최소제곱 해를 제공합니다. SVD를 $k$개 항에서 절단하면 $A$의 최선의 계수-$k$ 근사(Eckart-Young 정리)를 얻으며, 이는 차원 축소와 행렬 조건 분석에 사용됩니다.

## SLAM에서의 의미

SVD는 SLAM 파이프라인의 거의 모든 기하학적 단계에 등장합니다: essential 행렬로부터 상대 포즈를 초기화하고, DLT를 통해 랜드마크를 삼각측량하고, ICP 내부에서 포인트 클라우드를 정합하고, 추정된 fundamental/essential 행렬의 내부 제약을 강제하고, 특이값 간의 간극을 살펴봄으로써 퇴화(평면 장면, 순수 회전)를 진단합니다. "해는 가장 작은 특이값의 특이벡터이다"라는 발상에 익숙해지면 다중 뷰 기하학의 상당 부분을 풀어낼 수 있습니다.

## 관련 문서

- [Basic Linear Algebra](basic-linear-algebra.md)
- [Triangulation](triangulation.md)
- [Epipolar geometry](epipolar-geometry.md)
- [3D-3D correspondence](../level-02-getting-familiar/3d-3d-correspondence.md)
- [ICP](../level-04-rgbd-slam/icp.md)
