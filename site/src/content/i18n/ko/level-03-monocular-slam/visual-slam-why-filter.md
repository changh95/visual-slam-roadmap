# Visual-SLAM why filter?

> Strasdat 2012 · [논문](https://doi.org/10.1016/j.imavis.2012.02.009)

**한 줄 요약** — 키프레임 기반 번들 조정이 동일한 계산 시간당 필터링보다 더 높은 정확도를 준다는 것을 엄밀하게 보여, visual SLAM이 필터링에서 최적화로 이동한 패러다임 전환을 공식화했습니다.

## 문제

2012년 당시 실시간 단안 SLAM에 대해 두 가지 검증된 방법이 있었습니다: MonoSLAM(2007)은 EKF로 카메라 포즈와 랜드마크를 결합 추정했고, PTAM(2007)은 키프레임 기반 번들 조정을 도입했습니다. 둘 다 실시간으로 동작했지만, 커뮤니티는 원리적인 비교 결과를 갖고 있지 않았습니다. 두 패러다임은 SLAM 그래프에 대해 정반대의 구조적 선택을 합니다: 필터링은 과거의 모든 포즈를 *마지널라이즈*하여 현재 포즈와 모든 랜드마크에 대한 밀집 결합 분포를 남기는 반면, 키프레임 BA는 키프레임이 아닌 포즈와 그 관측값들을 단순히 *버려서* 문제를 희소하게 유지합니다. Strasdat, Montiel, Davison은 물었습니다: 동일한 계산 예산에서 어느 선택이 더 많은 정확도를 사는가?

## 방법 및 아키텍처

**신중하게 대응시킨 두 파이프라인**을 모두 구현하여 몬테카를로 시뮬레이션에서 실행했습니다.

*BA-SLAM*: 각 키프레임에서, 특징점이 시야를 벗어난 곳에 대체 포인트를 초기화하고, 모션만의 BA로 포즈를 추정하고, 구조만의 BA로 포인트를 정제한 다음, 모든 것을 결합 최적화합니다(g2o, Schur complement를 이용한 Levenberg–Marquardt):

$$
\chi^2(\mathbf{y}) = \sum_{\mathbf{z}_{i,j} \in Z_{0:i}} \big(\mathbf{z}_{i,j} - \hat{\mathbf{z}}(\mathbf{T}_i, \mathbf{x}_j)\big)^2, \qquad
\chi^2(\mathbf{T}_i) = \sum_{\mathbf{z}_j \in Z_i} \big(\mathbf{z}_j - \hat{\mathbf{z}}(\mathbf{T}_i, \mathbf{x}_j)\big)^2,
$$

$\mathbf{y} = (\mathbf{T}_1, ..., \mathbf{T}_i, \mathcal{X})^\top$ 위에서, 첫 프레임을 게이지(gauge)로 고정합니다.

*Filter-SLAM*: 필터링에 가장 유리한 조건이 되도록 의도적으로 구축된, 최신 기술 수준의 Gauss–Newton 정보 필터입니다: 포인트는 앵커링된 역깊이 좌표 $\boldsymbol{\psi}_j := \mathrm{inv\_d}(A_{a(j)}\, \mathbf{x}_j)$를 사용하며 $\mathrm{inv\_d}(\mathbf{a}) = \frac{1}{a_3}(a_1, a_2, 1)^\top$이고, 각 업데이트는 가우시안 지도 사전 분포에 대한 관측 잔차를 최소화합니다:

$$
\chi^2(\Phi_i, \mathbf{T}_i) = (\Phi_i \boxminus \Phi_{i-1})^\top \Lambda_{\Phi_{i-1}} (\Phi_i \boxminus \Phi_{i-1}) + \sum_{\mathbf{z}_j \in Z_i} \mathbf{d}_j^\top \Lambda_z \mathbf{d}_j,
$$

이어서 정보 행렬 업데이트 $\Lambda_i = \Lambda_{i-1} + D^\top \mathrm{diag}(\Sigma_z^{-1}, \ldots)\, D$가 이루어지며, 여기서 $D$는 재투영 야코비안을 쌓은 것입니다. 필터의 결정적인 특성: 흡수된 관측치의 선형화 지점은 영원히 고정되는 반면, BA는 매 반복마다 모든 것을 재선형화합니다.

**평가지표.** 정확도는 최종 포즈의 이동 오차이며, RMSE와 가장 약한 설정에 대한 상대적 *엔트로피 감소량*(비트 단위)으로 측정됩니다,

$$
E = \frac{1}{2} \log_2 \frac{\det(\Sigma_{\langle M_{\min},\,15 \rangle})}{\det(\Sigma_{\langle M,N \rangle})},
$$

중간 프레임 수 $M$과 포인트 수 $N$을 다양하게 바꾸며 측정합니다; 효율성은 계산 초당 엔트로피 감소량($E/c$, 초당 비트)입니다. 시간복잡도: BA는 $O(NM^2 + M^3)$이고(Schur complement + 축소 카메라 시스템), 필터링은 $O(MN^3)$입니다 — 포인트 수에 대해 선형 대 3차. 네 가지 카메라 모션이 테스트됩니다(전체 장면 겹침이 있는 측면 이동; 부분 겹침만 있는 측면 이동; 측면 이동 + 30° 회전; 급격한 전진 회전), 각각 단안과 스테레오로, 관측 잡음은 $\sigma_z = \frac{1}{2}$ 픽셀입니다.

## 실험 결과

- **랜드마크가 프레임을 이긴다** — 논문이 스스로 "가장 중요한 단일 결과"라고 밝힌 것: 포인트 수 $N$을 늘리면 모든 설정에서 엔트로피가 크게 줄어드는 반면, 프레임 수 $M$을 늘리는 것은 정확도에 미미한 영향만 줍니다(그 실질적인 역할은 강건성입니다, 예를 들어 $M=2$에서의 단안 초기화 실패에 대한 강건성).
- 잘 파라미터화된 필터는 세 가지 완만한 설정에서 BA의 정확도와 *일치*합니다 — 차이는 비용입니다: BA는 $N$에 대해 선형이고 필터링은 3차이므로, 정확도가 요구하는 많은 랜드마크를 감당할 수 있는 것은 오직 BA뿐입니다.
- 급격한 전진 회전의 단안 설정에서는 관측 야코비안이 결코 재선형화되지 않기 때문에 필터 정확도가 BA보다 *더 나빠집니다* — 전형적인 가우시안 필터 일관성 문제입니다.
- 정확도와 비용을 결합한 지표(초당 비트)에서는 일반적으로 BA가 더 효율적이며, 필터링은 낮은 정확도 요구 조건(작은 $M$과 작은 $N$)에서만 경쟁력이 있습니다.
- 결론은, 정신에 있어서 그대로 인용하면: 키프레임 BA는 계산 시간당 가장 많은 정확도를 주기 때문에 필터링을 능가합니다.

## SLAM에서의 의미

이 논문은 PTAM이 경험적으로 보여준 전환에 대한 이론적 정당성을 제공하여, 키프레임 기반 번들 조정을 표준 visual SLAM 백엔드로 확립했습니다. ORB-SLAM, LSD-SLAM, DSO 그리고 본질적으로 이후의 모든 시스템이 이 결론 위에 세워져 있으며, 정확도 대 예산이라는 방법론은 SLAM 설계 선택을 논증하는 표준적인 방식이 되었습니다. 오늘날에도 중요한 뉘앙스에 주목하십시오: 이 논증은 랜드마크가 많은 시각 전용 SLAM에 관한 것입니다 — 밀결합(tightly-coupled) VIO 시스템은 트레이드오프가 다른 상황에서 여전히 필터를 사용하며(예: MSCKF), 저자들 스스로도 이 주장의 범위를 지역 SLAM으로 한정하고 루프 클로저는 외관 기반 방법에 맡겼습니다.

## 관련 문서

- [MonoSLAM](monoslam.md) — 비교의 필터링 쪽
- [PTAM](ptam.md) — 비교의 키프레임 BA 쪽
- [ORB-SLAM](orb-slam.md) — 이 결론 위에 세워진 전형적인 시스템
- [Filter-based vs Optimization-based](../level-06-vio-vins/filter-based-vs-optimization-based.md) — VIO에서 이 트레이드오프가 어떻게 나타나는지
- [Schur complement / Sparsity](../level-02-getting-familiar/schur-complement-sparsity.md) — BA가 그렇게 잘 확장되는 이유
- [MAP inference as sparse nonlinear least squares](../level-02-getting-familiar/map-inference-as-sparse-nonlinear-least-squares.md) — 이 전체 논증의 근간이 되는 추정 관점
