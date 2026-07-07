# SE-Sync

> Rosen 2019 · [논문](https://arxiv.org/abs/1611.00128)

**한 줄 요약** — pose graph optimization을 위한 최초의 인증 가능한 정확 알고리즘(certifiably correct algorithm): Riemannian 최적화로 풀리는 SDP 완화를 통해 최적성의 증명과 함께 전역 최적해를 복원합니다(arXiv 2016, IJRR 2019).

## 문제

$SE(d)$ synchronization — $m$개의 쌍별 상대 변환 $x_{ij} = x_i^{-1}x_j$에 대한 잡음 있는 측정으로부터 $n$개의 미지 포즈 $x_1,\dots,x_n \in SE(d)$를 추정하는 것 — 은 표준적인 SLAM 백엔드 문제입니다(pose-graph SLAM, 카메라 포즈 추정). 논문의 생성 모델(정밀도 $\tau_{ij}$를 가진 가우시안 이동 노이즈, 집중도 $\kappa_{ij}$를 가진 등방성 Langevin 회전 노이즈) 하에서, 최대 우도 추정치는 다음을 최소화합니다.

$$p^{*}_{\mathrm{MLE}} = \min_{t_i \in \mathbb{R}^d,\; R_i \in SO(d)} \sum_{(i,j)\in\vec{\mathcal{E}}} \kappa_{ij}\big\lVert R_j - R_i\tilde{R}_{ij}\big\rVert_F^2 + \tau_{ij}\big\lVert t_j - t_i - R_i\tilde{t}_{ij}\big\rVert_2^2 .$$

이는 고차원의 비볼록 비선형 프로그램으로, 일반적으로 계산적으로 어렵습니다: 지역적 솔버(g2o, GTSAM, Ceres)는 참 해와 거리가 먼 국소 최솟값으로 조용히 수렴할 수 있으며, 반환된 답이 전역적으로 최적인지 *알* 방법이 없습니다 — 안전이 중요한 자율성에는 받아들일 수 없는 일입니다.

## 방법 및 아키텍처

- **이동을 제거합니다.** 회전이 고정되면 문제는 $t$에 대한 무제약 이차식이 되며, 일반화된 Schur 여인수(Schur complement)를 통해 닫힌 형식으로 풀립니다. 이는 MLE를 순수한 회전 synchronization으로 축소합니다: $p^{*}_{\mathrm{MLE}} = \min_{R \in SO(d)^n} \operatorname{tr}(\tilde{Q} R^{\mathsf{T}} R)$. 여기서 데이터 행렬 $\tilde{Q} = L(\tilde{G}^{\rho}) + \tilde{T}^{\mathsf{T}} \Omega^{1/2} \Pi\, \Omega^{1/2} \tilde{T}$는 회전 연결 라플라시안(connection Laplacian) $L(\tilde{G}^{\rho})$와 이동 데이터 항을 결합합니다; (직교 사영인) $\Pi$는 가중 incidence 행렬의 thin LQ 분해를 통한 sparse 분해를 허용하므로, $\tilde{Q}$와의 곱은 절대로 밀집 행렬을 형성하지 않습니다. 최적 이동은 이후 $t^{*} = -\operatorname{vec}\big(R^{*}\tilde{V}^{\mathsf{T}} L(W^{\tau})^{\dagger}\big)$로 복원됩니다.
- **증명 가능하게 tight한 SDP 완화.** $SO(d)$를 $O(d)$로 완화하면 문제가 QCQP가 되며, 이것의 Lagrangian 쌍대는 다음의 반정치 프로그램(semidefinite program, SDP)입니다.

$$p^{*}_{\mathrm{SDP}} = \min_{Z \succeq 0}\; \operatorname{tr}(\tilde{Q} Z) \quad \text{s.t.} \quad \mathrm{BlockDiag}_{d\times d}(Z) = \mathrm{Diag}(I_d,\dots,I_d),$$

  따라서 $p^{*}_{\mathrm{SDP}} \le p^{*}_{\mathrm{MLE}}$입니다. **명제 1**: $\beta > 0$이 존재하여 $\lVert \tilde{Q} - \bar{Q} \rVert_2 < \beta$이면(여기서 $\bar{Q}$는 참인 잠재 변환들의 데이터 행렬입니다 — 즉 노이즈가 임계 임계값 이하일 때), SDP는 $R^{*} \in SO(d)^n$이 정확한 MLE인 $Z^{*} = R^{*\mathsf{T}}R^{*}$ 형태의 *유일한* 해를 가집니다. 반올림된(rounded) 추정치가 SDP 하한에 도달할 때마다, 그 등식은 전역 최적성의 *계산적 증명서(computational certificate)*가 됩니다.
- **리만 계단(Riemannian staircase).** 내부점(interior-point) SDP 솔버(수천 개 변수를 넘어서면 다루기 어려움) 대신, SE-Sync는 $Y \in \mathbb{R}^{r\times dn}$, $r \ll dn$인 Burer–Monteiro 분해 $Z = Y^{\mathsf{T}}Y$를 사용합니다; 블록 제약은 각 $Y_i$가 정규직교(orthonormal) 프레임이라고 말하며, 이는 Stiefel 다양체들의 곱 위에서의 무제약 문제를 만듭니다:

$$p^{*}_{\mathrm{SDPLR}} = \min_{Y \in \mathrm{St}(d,r)^n} \operatorname{tr}(\tilde{Q}\, Y^{\mathsf{T}} Y).$$

  **명제 2**(Boumal 등을 따름): 이 문제의 랭크 결핍(rank-deficient) 2차 임계점은 모두 *전역* 최소값이며 SDP 해를 산출합니다 — 따라서 랭크 결핍 임계점이 나타날 때까지 랭크 계층("리만 계단")을 오릅니다.
- **빠른 2차 지역 탐색.** 다양체 위에서, $\nabla F(Y) = 2Y\tilde{Q}$이고 헤시안-벡터 곱은 ambient 도함수의 사영입니다($\operatorname{grad} F(Y) = \operatorname{Proj}_Y \nabla F(Y)$), 모두 sparse 행렬 곱과 삼각 해법(triangular solve)으로 계산됩니다; truncated-Newton 리만 신뢰영역(trust-region, RTR) 방법이 고정밀 임계점을 찾습니다.
- **반올림.** $Y^{*}$의 랭크-$d$ thin SVD가 $\hat{R} = \Xi_d V_d^{\mathsf{T}}$를 주며; 대부분의 블록이 음의 행렬식을 가지면 방향을 뒤집고, 각 블록을 가장 가까운 회전 행렬로 사영합니다 — 완화가 tight할 때는 정확하고, 그렇지 않으면 근사적으로 타당합니다.

## 실험 결과

(Manopt 위의 MATLAB 구현, staircase는 $r=5$로 고정, $\mathrm{St}(3,5)^n$ 위의 *무작위* 점으로부터 초기화; 기준선: odometric 초기화를 사용한 Gauss-Newton, chordal 초기화를 사용한 GN, 그리고 사후 검증을 곁들인 GN-chordal.)

- **시뮬레이션된 cube world**($s^3$ 격자, 루프 클로저 확률 $p_{LC}$, 노이즈 $\sigma_T$, $\sigma_R$; 설정마다 30회 실행): SE-Sync는 무작위 초기화로부터 *인증 가능하게 전역 최적인* 해로, 최신 chordal 초기화를 사용한 GN과 비슷하거나 — 이 테스트들에서는 종종 더 빠른 — 시간 안에 수렴하며, GN + 별도 검증보다는 훨씬 빠릅니다. 예외는 회전 노이즈가 높은 영역으로, 여기서는 완화의 정확성(exactness)이 무너집니다.
- **대규모 실제/표준 3D SLAM 데이터셋** — sphere(2500 노드/4949 엣지), sphere-a(2200/8647), torus(5000/9048), cube(8000/22236), garage(1661/6275), cubicle(5750/16869): SE-Sync는 이들 *전부*에서 인증된 전역 최적을 달성합니다(예: sphere-a에서 목적함수 값 $1.249\times 10^{6}$ 대 odometry로 초기화된 GN의 $3.041\times 10^{6}$), 3.6–203초 만에, 완화가 어려운 실세계 인스턴스에서도 정확함을 유지함을 확인합니다.
- 초록(abstract)에 따르면, "로보틱스 응용에서 일반적으로 접하는 것보다 한 자릿수 이상 더 큰" 노이즈 하에서도 전역 최적성이 복원되며, 비용은 직접적인 Newton형 지역 탐색과 비슷한 규모로 증가합니다.

## SLAM에서의 의미

SE-Sync는 근본적인 질문에 답했습니다: PGO가 비볼록임에도, 실제 SLAM에서 나타나는 인스턴스들은 전역적으로 풀 수 있으며, 전역 최적을 얻었는지를 *알* 수 있다는 것입니다. 이것은 인증 가능한 인지(certifiable perception) 연구 프로그램(정합을 위한 TEASER++, 회전 탐색을 위한 QUASAR)을 촉발했고, SLAM 백엔드에 검증 도구를 제공했습니다 — 예를 들어, 오염되었을 수 있는 루프 클로저 이후 지역 솔버의 답이 실제로 최적인지 확인하는 것입니다.

## 관련 문서

- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md) — 인증되는 대상 문제
- [MAP inference as sparse nonlinear least squares](../level-02-getting-familiar/map-inference-as-sparse-nonlinear-least-squares.md) — 완화되는 MLE 공식
- [TEASER++](teaserpp.md) — 인증 가능한 포인트 클라우드 정합
- [QUASAR](quasar.md) — 인증 가능한 회전 탐색
- [GNC](gnc.md) — 이상치로 오염된 그래프를 위한 강건 추정 동반자
