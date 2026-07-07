# GNC

> Yang 2020 · [논문](https://arxiv.org/abs/1909.08605)

**한 줄 요약** — Graduated Non-Convexity: 볼록 서로게이트 비용에서 시작해 목표로 하는 강인한(비볼록) 비용으로 점진적으로 변형하는 범용 강인 추정 프레임워크로, 어떤 비최소 솔버든 감싸는 블랙박스 래퍼로 동작하며 초기 추정값이 필요 없다.

## 문제

준정부호 프로그래밍(SDP)과 Sums-of-Squares(SOS) 완화는 여러 로보틱스 및 비전 문제(포즈 그래프 최적화, 회전 평균화, 정합)에 대해 인증 가능하게 최적인 *비최소 솔버*를 만들어냈지만, 이 솔버들은 최소제곱 형식화에 의존하기 때문에 잘못된 루프 클로저나 잘못된 매칭 같은 이상치에 취약하다. 표준적인 해결책인 강인 비용 함수(Geman-McClure, Truncated Least Squares)는 비볼록성을 다시 도입하므로, 지역적 반복 최적화에는 좋은 초기 추정값이 필요하며 — 인증 가능한 솔버는 애초에 적용할 수조차 없다. GNC는 초기 추정값 없이도 비최소 솔버와 강인 추정을 동시에 사용할 수 있게 한다.

## 방법 및 아키텍처

이상치가 없는 추정은 최소제곱, 즉 $\min_{\mathbf{x}\in\mathcal{X}}\sum_{i=1}^{N} r^2(\mathbf{y}_i,\mathbf{x})$이며, 여기서 $r$은 추정치 $\mathbf{x}$에서 측정값 $\mathbf{y}_i$의 잔차다. 강인성은 이 이차식을 강인 비용 $\rho$로 대체한다. GNC는 대신 제어 파라미터 $\mu$로 지배되는 서로게이트 $\rho_\mu$를 최적화하는데, 이는 스케줄의 한쪽 끝에서는 볼록이고 다른 쪽 끝에서는 $\rho$와 같아진다. Geman-McClure(GM)의 경우:

$$\rho_\mu(r) = \frac{\mu\bar{c}^2 r^2}{\mu\bar{c}^2 + r^2},$$

이는 $\mu\to\infty$일 때 이차(볼록)가 되고 $\mu=1$에서 GM을 복원한다. $\bar{c}$는 인라이어에 대해 기대되는 최대 오차로 설정된다. Truncated Least Squares(TLS)에도 유사한 세 조각짜리 서로게이트가 유도되며, $\mu\to 0$일 때 볼록이고 $\mu\to\infty$일 때 정확해진다.

핵심적인 조력자는 **Black-Rangarajan 쌍대성**이다: $\sum_i \rho_\mu(r_i)$을 최소화하는 것은 가중된 최소제곱 문제와 *이상치 프로세스*의 합과 동등하다.

$$\min_{\mathbf{x}\in\mathcal{X},\ w_i\in[0,1]} \sum_{i=1}^{N} \Big( w_i\, r^2(\mathbf{y}_i,\mathbf{x}) + \Phi_{\rho_\mu}(w_i) \Big),$$

여기서 $w_i$는 측정값별 가중치이고 $\Phi_{\rho_\mu}$는 그에 대한 페널티다 — GM의 경우 $\Phi_{\rho_\mu}(w_i)=\mu\bar{c}^2(\sqrt{w_i}-1)^2$이고, TLS의 경우 $\Phi_{\rho_\mu}(w_i)=\frac{\mu(1-w_i)}{\mu+w_i}\bar{c}^2$이다. 각 고정된 $\mu$에서 알고리즘은 두 단계를 번갈아 수행한다:

1. **변수 갱신** — $\mathbf{x}^{(t)} = \arg\min_{\mathbf{x}\in\mathcal{X}} \sum_i w_i^{(t-1)} r^2(\mathbf{y}_i,\mathbf{x})$: 이상치 없는 문제의 *가중된* 버전으로, 기존의 비최소 솔버(Horn의 방법, SE-Sync, 메쉬 정합 SDP 등)로 전역적으로 풀린다.
2. **가중치 갱신** — 닫힌 형태로 계산된다. GNC-GM의 경우 잔차 $\hat{r}_i^2 = r^2 (\mathbf{y}_i,\mathbf{x}^{(t)})$에 대해:

$$w_i^{(t)} = \left( \frac{\mu\bar{c}^2}{\hat{r}_i^2 + \mu\bar{c}^2} \right)^{2};$$

GNC-TLS의 경우 세 갈래 규칙이 $\hat{r}_i^2 \le \frac{\mu}{\mu+1}\bar{c}^2$일 때 $w_i=1$, $\hat{r}_i^2 \ge \frac{\mu+1}{\mu}\bar{c}^2$일 때 $w_i=0$, 그 사이에서 $w_i = \frac{\bar{c}}{\hat{r}_i}\sqrt{\mu(\mu+1)} - \mu$로 설정한다.

바깥 루프는 이후 비볼록성의 양을 늘려간다: GNC-GM은 $\mu = 2r_{\max}^2/\bar{c}^2$로 초기화하고 $\mu<1$이 될 때까지 매 바깥 반복마다 1.4로 나눈다; GNC-TLS는 $\mu = \bar{c}^2/(2r_{\max}^2-\bar{c}^2)$로 초기화하고 가중된 잔차 합이 수렴할 때까지 1.4를 곱한다. 모든 가중치는 1에서 시작한다. 솔버에게 요구되는 것이 가중된 최소제곱을 푸는 것뿐이므로, GNC는 Ceres/g2o/GTSAM 스타일 백엔드나 인증 가능한 솔버를 감싸는 블랙박스로 동작한다. 추가적인 기여로, 이 논문은 형상 정렬(2D-3D 대응점으로부터의 약-투영 물체 포즈)을 위한 최초의 인증 가능하게 최적인 비최소 솔버를 제안한다 — 비단위 쿼터니언 $\mathbf{v}=\sqrt{s}\,\mathbf{q}$에 대한 4차 다항식을 SOS 완화로 최소화한다(경험적으로 항상 정확함).

## 실험 결과

- **포인트 클라우드 정합** (Stanford Bunny, $N=100$ 대응점, 잡음 $\sigma=0.01$): GNC-GM, GNC-TLS, RANSAC, ADAPT는 모두 이상치 90% 미만에서 유사한 정확도를 내며 90%에서 무너진다; 이상치 80%에서 평균 실행 시간은 218ms(RANSAC), 22ms(GNC-GM), 23ms(GNC-TLS)이다. TEASER는 더 강건하지만 대규모 인스턴스에서는 5분 이상 걸린다.
- **메쉬 정합** (PASCAL+ "car-2"; 점-점 대응점 40개, 점-선 80개, 점-면 80개): GNC-GM, GNC-TLS, ADAPT는 이상치 80%에도 강건하지만, 12점 최소 솔버를 쓰는 RANSAC는 50%에서 무너진다; GNC의 반복 횟수는 거의 일정하게 유지되는 반면 ADAPT의 반복 횟수는 이상치 비율에 선형으로 증가한다.
- **포즈 그래프 최적화** (오염된 루프 클로저를 가진 INTEL과 CSAIL, g2o, DCS, PCM, ADAPT와 비교): GNC-TLS가 압도적이다 — INTEL에서 이상치 40%까지 영향을 받지 않고 70–80%에서도 받아들일 만하며, CSAIL에서는 이상치 90%에도 강건하다; g2o는 전반적으로 성능이 나쁘고 DCS/PCM은 점진적으로 저하된다.
- **형상 정렬** (FG3DCar, 전체 600 이미지): GNC-GM/TLS와 ADAPT는 이상치 70%에 강건하다; RANSAC는 60%에서 무너진다; Zhou의 볼록 완화는 빠르게 저하된다. SOS 풀이 한 번에 약 80ms가 걸린다.

핵심 주장: 강인한 비최소 솔버는 이상치 70–80%를 견디고, RANSAC를 능가하며, 특화된 지역 솔버보다 정확하고 특화된 전역 솔버보다 빠르다 — 다만 GNC의 전역 최적성은 보장할 수 없다.

## SLAM에서의 의미

이상치 제거는 사용 가능한 지도와 오염된 지도의 차이를 만든다. GNC는 모든 SLAM 백엔드에 문제별 볼록 완화가 필요 없는 간단하고 범용적인 강건화를 제공한다. GTSAM에 `GncOptimizer`로 탑재되어 강건한 포즈 그래프 최적화, 포인트 클라우드 정합, 회전 평균화에 사용된다. Carlone 그룹 내에서는 인증 가능한 솔버(SE-Sync, TEASER++)를 보완하는 실용적이고 범용적인 도구로 자리한다.

## 관련 문서

- [SE-Sync](se-sync.md) — 인증 가능하게 최적인 포즈 그래프 최적화
- [TEASER++](teaserpp.md) — GNC 아이디어도 활용하는 인증 가능한 강인 정합
- [QUASAR](quasar.md) — 극단적 이상치 하에서의 인증 가능한 회전 탐색으로, GNC가 사용하는 것과 동일한 TLS 비용을 사용
- [Robust pose-graph optimization](../level-02-getting-familiar/robust-pose-graph-optimization.md) — GNC가 다루는 문제 설정
- [ICP](../level-04-rgbd-slam/icp.md) — GNC가 강건화할 수 있는 정합 파이프라인
