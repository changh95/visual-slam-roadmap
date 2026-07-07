# TEASER++

> Yang 2020 · [논문](https://arxiv.org/abs/2001.07715)

**한 줄 요약** — Truncated Least Squares, 불변 측정량 분리(invariant-measurement decoupling), 최대 클리크(maximum-clique) 인라이어 선택을 통해 99%의 이상치 대응점에도 강인한, 최초의 빠르고 인증 가능한(certifiable) 3D 점 구름 정합 알고리즘입니다(T-RO/RSS 2020).

## 문제

가정된 대응점 $(\mathbf{a}_i, \mathbf{b}_i)$로부터 두 개의 3D 점 구름을 정합하는 것은 생성 모델 $\mathbf{b}_i = s^{\circ}\mathbf{R}^{\circ}\mathbf{a}_i + \mathbf{t}^{\circ} + \mathbf{o}_i + \boldsymbol{\epsilon}_i$을 따르며, 여기서 $\mathbf{o}_i$는 인라이어에 대해서는 0이고 이상치에 대해서는 임의의 값입니다. 이상치가 없다면 Horn/Arun의 닫힌 형태 해가 이를 풀지만, 단 하나의 이상치만으로도 이들은 깨집니다. 실제 descriptor 매칭은 대부분이 틀린 대응점입니다. ICP는 좋은 초기 추정치가 필요하고, RANSAC은 이상치 비율이 올라가면 급격히 성능이 저하되며, 기존의 인증 가능 솔버들은 온라인 사용에 너무 느렸습니다. TEASER는 이상치 모델 없이 인라이어 노이즈가 $\|\boldsymbol{\epsilon}_i\| \le \beta_i$로 유계라는 가정만 사용하는 Truncated Least Squares(TLS) 공식을 채택합니다:

$$\min_{s>0,\;\mathbf{R}\in SO(3),\;\mathbf{t}\in\mathbb{R}^3} \sum_{i=1}^{N} \min\!\left(\frac{1}{\beta_i^2}\big\lVert \mathbf{b}_i - s\mathbf{R}\mathbf{a}_i - \mathbf{t} \big\rVert^2,\; \bar{c}^2\right),$$

이렇게 하면 임계값을 넘는 잔차는 상수 값만 기여하게 되어 해를 왜곡시킬 수 없습니다 — 하지만 TLS 최소화는 볼록 정의역에서도 NP-hard입니다.

## 방법 및 아키텍처

- **불변 측정량이 문제를 캐스케이드로 분리합니다.** 대응점 쌍을 서로 빼면 이동(translation)이 상쇄되어 이동 불변 측정량(Translation Invariant Measurements) $\bar{\mathbf{b}}_{ij} = s\mathbf{R}\bar{\mathbf{a}}_{ij} + \mathbf{o}_{ij} + \boldsymbol{\epsilon}_{ij}$(TIM, 대응점 위의 그래프의 엣지, 노이즈 상한 $\delta_{ij} = \beta_i + \beta_j$)를 얻습니다. TIM 노름 비율을 취하면 회전도 상쇄되어 스칼라 TRIM $s_{ij} = s + o^{s}_{ij} + \epsilon^{s}_{ij}$($s_{ij} = \lVert\bar{\mathbf{b}}_{ij}\rVert / \lVert\bar{\mathbf{a}}_{ij}\rVert$)를 얻습니다. TEASER는 이후 스케일, 회전, 이동을 순서대로 각각 TLS로 풉니다.
- **정확한 다항 시간 스케일 및 이동 추정: 적응형 투표.** 스칼라 TLS($\hat{s} = \arg\min_s \sum_k \min\big((s-s_k)^2/\alpha_k^2, \bar{c}^2\big)$)는 최대 $2K{-}1$개의 서로 다른 합의 집합(consensus set)만 가지며, 그 경계는 구간 끝점 $s_k \pm \alpha_k\bar{c}$입니다 — 이를 열거하여 비용이 가장 적은 가중 평균을 취합니다(정리 7). 이동은 성분별로 같은 방식으로 풉니다.
- **최대 클리크 인라이어 가지치기(MCIS).** $\hat{s}$와 일치하지 않는 TRIM(즉 $|s_{ij} - \hat{s}| > \bar{c}\,\alpha_{ij}$)은 가지치기되며, 정리 6은 인라이어 TIM들이 남은 그래프의 클리크를 형성함을 보입니다. 따라서 최대 클리크를 계산하면 회전 추정 전에 상호 일관된 인라이어 집합을 분리할 수 있습니다.
- **긴밀한 SDP를 통한 인증 가능 회전 추정.** TLS 회전 문제는 단위 쿼터니언과 "binary cloning"($\mathbf{q}_k = \theta_k \mathbf{q}$, $\theta_k \in \{\pm 1\}$이 인라이어/이상치를 표시)을 통해 QCQP $\min_{\mathbf{x}} \mathbf{x}^{\mathsf{T}}\mathbf{Q}\mathbf{x}$로 재작성된 뒤, $\mathbf{Z} = \mathbf{x}\mathbf{x}^{\mathsf{T}}$의 랭크-1 제약을 제거하면서 완화를 긴밀하게 만드는 여분의 블록 대칭 제약을 추가하여 완화됩니다. 정리 13: SDP 해의 랭크가 1이면 그 인수(factor)는 *인증된 전역 최적해*입니다. 실험적으로 이 완화는 95% 이상치를 넘는 경우에도 긴밀함을 유지합니다.
- **TEASER++ = GNC + 빠른 인증.** SDP를 푸는 것은 느립니다(MOSEK으로 $K{=}100$일 때 약 1200초). TEASER++는 회전 하위 문제를 graduated non-convexity(GNC, 대략 80% 이상치 이하에서 신뢰할 수 있으며 — MCIS로 가지치기한 후에는 안전함)로 풀고, 이후 duality 상에서 Douglas–Rachford splitting을 통해 그 추정치를 *인증*합니다: 알고리즘 3은 준-최적성 경계 $\eta$를 반환하며 $(\hat{\mu} - \mu^{\star})/\hat{\mu} \le \eta$을 만족합니다. 이는 이중 인증서(dual certificate)의 최소 고윳값으로부터 계산되는 $\eta^{(t)} = |\lambda_1^{(t)}|(K+1)/\hat{\mu}$이며, 추정치가 최적이고 완화가 긴밀할 때 0으로 수렴합니다.
- **추정 보증.** 정리 15–17은 강건한 정합에 대한 최초의 추정 오차 경계를 제시합니다: 노이즈 없는 인라이어와 무작위 이상치의 경우, 이상치 개수와 무관하게 3개의 인라이어만으로 정확한 복원이 가능합니다. 적대적 이상치의 경우 인라이어의 다수가 필요합니다.

## 실험 결과

- **Bunny 벤치마크(N=100, FGR, GORE, RANSAC 대비):** TEASER, TEASER++, GORE, 60초 RANSAC 모두 90% 이상치에 강인합니다(FGR은 70%에서, RANSAC-1K는 90%에서 깨짐). 95–99%의 극단적 이상치($N{=}1000$)에서는 TEASER/TEASER++/GORE가 99%까지 살아남으며, TEASER++가 더 정확하고 GORE보다 10배 빠릅니다. TEASER++는 노트북에서 고이상치 문제를 10 ms 미만으로 풉니다(스케일 미지수인 경우 30 ms 미만).
- **인증:** DRS 인증기는 모든 정확한 GNC 해를 검증하고 모든 잘못된 해를 거부하며, 평균 24회 반복(C++에서 반복당 약 50 ms)이 걸립니다. MOSEK보다 몇 자릿수 빠르게 인증하며, MOSEK은 150 TIM을 넘으면 메모리가 부족해집니다.
- **대응점 없는 정합**(모든 조합 가설, 약 $10^4$개의 후보 쌍): ICP는 거의 항상 실패하고, Go-ICP는 트리밍에 민감하며 평균 16초가 걸립니다. TEASER++는 초기 추정치 없이도 약 10% 겹침까지 정확한 포즈를 복원합니다.
- **물체 포즈 추정**(RGB-D 데이터셋, FPFH 대응점, 인라이어 비율이 대개 5% 미만): 8개 장면에서 평균 회전 오차 0.066 rad, 평균 이동 오차 0.069 m.
- **3DMatch 스캔 매칭**(3DSmoothNet descriptor): TEASER++는 MIT Lab을 제외한 모든 장면에서 RANSAC-10K와 동등하거나 우수하며(예: Kitchen 98.6% 대 97.2% 성공률), 평균 실행 시간 0.059초입니다. 인증된 추정치만 사용하도록 제한하면(TEASER++ CERT) 성공률이 더 올라갑니다(Kitchen 99.4%) — SLAM의 잘못된 루프 클로저에 대한 자연스러운 필터입니다.

## SLAM에서의 의미

가정된 대응점을 이용한 정합은 SLAM 전역에 존재합니다: LiDAR 루프 클로저, 전역 재위치 추정, 다중 로봇 지도 병합, 물체 포즈 추정 — 모두 특징 매칭이 대부분 틀릴 수 있는 영역입니다. TEASER++는 "대응점의 90% 이상이 쓰레기"인 상황을 최적성 인증서와 함께 풀 수 있는 문제로 만들었으며, 인증됨/인증되지 않음의 구분은 루프 클로저 파이프라인에 원칙적인 거부 검정을 제공합니다. 오픈소스 C++ 라이브러리는 LiDAR SLAM 및 다중 로봇 시스템(예: Kimera-Multi 스타일의 지도 병합)에 널리 통합되어 있으며, SE-Sync와 QUASAR와 함께 인증 가능 인지(certifiable perception) 계열의 한 축입니다.

## 관련 문서

- [SE-Sync](se-sync.md) — 인증 가능 포즈 그래프 최적화
- [QUASAR](quasar.md) — 인증 가능한 쿼터니언 기반 회전 하위 솔버
- [GNC](gnc.md) — TEASER++가 인증하는 빠른 강건 휴리스틱
- [ICP](../level-04-rgbd-slam/icp.md) — TEASER++가 이상치에 강인하게 만드는 고전적인 로컬 정합 방법
- [Kimera-Multi](../level-08-collaborative-slam/kimera-multi.md) — 지도 병합에 강인한 정합을 사용하는 다중 로봇 시스템
- [Inter-robot loop closure](../level-08-collaborative-slam/inter-robot-loop-closure.md) — 인증된 정합의 핵심 활용 사례
