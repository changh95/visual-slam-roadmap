# QUASAR

> Yang 2019 · [논문](https://arxiv.org/abs/1905.12536)

**한 줄 요약** — 이상치가 존재하는 Wahba 문제(회전 탐색)에 대한 최초의 다항 시간 인증 가능 최적 솔버: Truncated Least Squares 비용을 단위 쿼터니언과 "binary cloning"을 통해 QCQP로 재작성한 후, 긴밀한 SDP 완화로 풀어낸다.

## 문제

Wahba 문제 — 잠정적 대응 관계가 주어진 두 벡터 관측 집합을 가장 잘 정렬하는 회전을 찾는 문제 — 는 포인트 클라우드 정합, 이미지 스티칭, 모션 추정, 인공위성 자세 결정에서 핵심적인 절차다. 이상치가 없는 버전 $\min_{\mathbf{R}\in\mathrm{SO}(3)}\sum_i w_i^2\Vert\mathbf{b}_i-\mathbf{R}\mathbf{a}_i\Vert^2$은 폐쇄형 해가 존재하지만, 특징 매칭에서 얻어지는 실제 대응 관계는 이상치가 95%에 달할 수 있다(예: FPFH 매칭). RANSAC의 실행 시간은 이상치 비율에 대해 지수적으로 증가하고 노이즈에도 성능이 저하되며, 강건한 지역 최적화(예: FGR)는 지역 최소값에서 멈출 수 있고, Branch-and-Bound는 전역 최적이지만 최악의 경우 지수적이다. QUASAR 이전에는 다수의 이상치를 갖는 회전 탐색에 대해 *인증 가능하게 최적인* 다항 시간 접근법이 존재하지 않았다.

## 방법 및 아키텍처

**TLS 형식화.** 각 측정값은 잔차가 작을 때만 최소제곱 항으로 기여하며, 임계값을 넘으면 포화되어 추정에 더 이상 영향을 주지 않는다:

$$\min_{\mathbf{R}\in\mathrm{SO}(3)} \sum_{i=1}^{N} \min\left( \frac{1}{\sigma_i^2}\Vert\mathbf{b}_i - \mathbf{R}\mathbf{a}_i\Vert^2,\ \bar{c}^2 \right),$$

여기서 $\sigma_i$는 인라이어 노이즈 표준편차이며, $\bar{c}^2$은 확률 $p$(예: $p=0.99$)에서의 $\chi^2(3)$ 분위수로 선택되므로 $\sigma_i^2\bar{c}^2$은 인라이어가 허용할 수 있는 최대 제곱 잔차가 된다.

**쿼터니언 재작성.** $\mathbf{R}$을 단위 쿼터니언 $\mathbf{q}\in\mathcal{S}^3$으로 표현하면 제약 집합 $\mathrm{SO}(3)$이 단위 구면으로 대체되며, $\mathbf{R}\mathbf{a}$는 쿼터니언 곱 $\mathbf{q}\otimes\hat{\mathbf{a}}\otimes\mathbf{q}^{-1}$을 통해 표현된다.

**Binary cloning을 통한 QCQP화.** $\min(x,y)=\min_{\theta\in\{\pm 1\}} \frac{1+\theta}{2}x+\frac{1-\theta}{2}y$를 이용하면, TLS 비용은 $\theta_i=+1$이 측정값 $i$를 인라이어로, $\theta_i=-1$이 이상치로 선언하는 혼합정수 프로그램이 된다 — 즉 이상치 분류가 최적화 *내부에* 존재하게 된다. 클론 쿼터니언 $\mathbf{q}_i = \theta_i\mathbf{q}$를 정의하면 정수 변수가 제거되며, $\mathbf{x}=\left[\mathbf{q}^{\mathsf{T}}\ \mathbf{q}_1^{\mathsf{T}}\ \dots\ \mathbf{q}_N^{\mathsf{T}}\right]^{\mathsf{T}}$로 쌓으면 정확히 동등한 Quadratically Constrained Quadratic Program이 만들어진다:

$$\min_{\mathbf{x}\in\mathbb{R}^{4(N+1)}} \sum_{i=1}^{N}\mathbf{x}^{\mathsf{T}}\mathbf{Q}_i\mathbf{x} \quad \text{s.t.} \quad \mathbf{x}_q^{\mathsf{T}}\mathbf{x}_q = 1,\quad \mathbf{x}_{q_i}\mathbf{x}_{q_i}^{\mathsf{T}} = \mathbf{x}_q\mathbf{x}_q^{\mathsf{T}}\ \forall i,$$

이때 $\mathbf{Q}_i$는 $\mathbf{a}_i,\mathbf{b}_i$로부터 구성되는 이미 알려진 대칭 행렬이다.

**긴밀한 SDP 완화.** $\mathbf{Z}=\mathbf{x}\mathbf{x}^{\mathsf{T}}\succeq 0$로 리프팅하고 랭크-1 제약을 제거하면 $\mathrm{tr}(\mathbf{Q}\mathbf{Z})$에 대한 컨벡스 SDP가 된다. *순진한(naive)* 완화(블록 대각 제약만 사용)는 노이즈와 이상치가 없을 때는 증명 가능하게 긴밀하지만(정리 7), 실제로 이상치가 있으면 깨진다. QUASAR은 비대각 블록에 대한 여분의 대칭 제약 $[\mathbf{Z}]_{qq_i}=[\mathbf{Z}]_{qq_i}^{\mathsf{T}}$ 및 $[\mathbf{Z}]_{q_iq_j}=[\mathbf{Z}]_{q_iq_j}^{\mathsf{T}}$을 추가하는데, 이는 큰 노이즈와 극단적인 이상치 비율 하에서도 완화가 경험적으로 긴밀하도록 만든다. 해가 랭크 1을 가질 때(완화 격차가 0일 때), 복원된 회전은 원래의 비컨벡스 TLS 문제에 대해 전역 최적임이 *인증*된다.

## 실험 결과

- **순진한 완화 대 긴밀한 완화**(합성 데이터, $N=40$, 노이즈 없음): 순진한 SDP는 이상치 10–40%에서부터 느슨해지기 시작해 40% 이상에서는 완전히 무너지지만, QUASAR은 이상치 90%에서도 인증 가능하게 최적인 랭크-1 해를 반환한다.
- **합성 벤치마크**($\sigma_i=0.01$): 폐쇄형 Wahba는 이상치가 없을 때만 동작하고, FGR은 70%까지 강건하지만 90%에서는 무너진다. RANSAC, GORE, QUASAR은 이상치 90%까지 강건하며 QUASAR이 소폭 더 정확하다. 극단적인 91–96% 이상치($N=100$)에서는 Wahba/FGR/RANSAC이 무너지고, GORE는 96%에서 한 번 실패하며, QUASAR은 모든 시험에서 매우 정확하다. 높은 노이즈($\sigma_i=0.1$)에서도 QUASAR은 다른 모든 방법이 실패하는 80% 이상치를 여전히 견딘다.
- **포인트 클라우드 정합**(Bunny, $N=40$, 불변 측정값을 통한 회전 부분문제): QUASAR은 두 노이즈 체제 모두에서 비교된 모든 기법을 압도한다.
- **이미지 스티칭**(PASSTA Lunch Room): 70개의 SURF 대응 중 46개(66%)가 이상치다. QUASAR($\sigma^2\bar{c}^2=0.001$)은 Matlab의 MSAC이 실패하는 곳에서 올바르게 스티칭한다.
- **긴밀성 지표**: 완화 격차와 랭크/안정 랭크가 합성 및 Bunny 실험 전반에서 정확성을 확인해준다. 주요 한계: 범용 SDP 솔버는 확장성이 나쁘다 — $N=100$개 대응에 대해 MOSEK로 약 1200초(SDPNAL+로 500초).

## SLAM에서의 의미

회전 추정은 포인트 클라우드 정합, 맵 병합, rotation averaging, 외부 파라미터 캘리브레이션 등 다수의 SLAM 서브문제 안에 자리한다. QUASAR은 "인증 가능한 인지(certifiable perception)" 연구 계열(SE-Sync 및 TEASER++와 함께, 대체로 동일한 그룹에서 나온)의 일부로, 로보틱스의 핵심 기하 문제들이 심각한 이상치 오염 속에서도 *증명 가능한* 전역 최적으로 풀릴 수 있음을 보여준다. TLS 비용, binary cloning, 여분 제약을 갖는 SDP라는 그 구성 요소들은 TEASER/TEASER++ 내부의 회전 서브솔버 기법이 되었다.

## 관련 문서

- [SE-Sync](se-sync.md) — SDP 완화를 통한 인증 가능한 pose graph optimization
- [TEASER++](teaserpp.md) — 동일한 회전 기법을 사용하는 인증 가능한 포인트 클라우드 정합
- [GNC](gnc.md) — 동일한 TLS 비용을 사용하는 강건 추정의 일반적인 graduated non-convexity 접근법
