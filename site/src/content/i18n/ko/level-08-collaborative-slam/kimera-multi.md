# Kimera-Multi

> Tian 2022 · [논문](https://arxiv.org/abs/2106.14386)

**한 줄 요약** — Kimera-Multi는 루프 클로저 이상값에 강인하면서, 오직 피어-투-피어 통신만으로 완전히 분산되어 있으며, 전역적으로 일관된 메트릭-시맨틱 3D 메쉬를 실시간으로 구축할 수 있는 최초의 멀티로봇 시스템이다.

## 문제

이전의 협업 SLAM 시스템들은 중앙 서버에 의존하거나 시맨틱 콘텐츠가 전혀 없는 순수 기하학적 맵을 생성했으며, 이들 모두 지각 앨리어싱에 노출되어 있었다: 시각적으로 비슷한 장소들이 공동 추정값을 손상시킬 수 있는 잘못된 로봇 간 및 로봇 내부 루프 클로저를 생성한다. 기존의 강인한 기법들은 초기화에 지나치게 의존하거나, (PCM의 최대 클리크처럼) 재현율이 낮은 휴리스틱 탐색을 사용한다. Kimera-Multi는 링크가 사용 가능할 때만 이웃과 통신하는 로봇 팀이, 허위 루프 클로저를 식별하고 제거하면서 전역적으로 일관된 *시맨틱* 3D 메쉬를 실시간으로 구축할 수 있는지를 묻는다.

## 방법 및 아키텍처

**로봇별 프론트엔드.** 각 로봇은 Kimera를 실행한다: 시각-관성 오도메트리를 위한 Kimera-VIO와, 면(face)에 시맨틱 레이블을 담는 로컬 3D 메쉬. 로봇들이 통신 범위 안에 들어오면 분산 장소 인식이 bag-of-words 벡터를 교환한다. 매칭이 발견되면 기하학적 검증이 트리거되고, 이는 키포인트와 특징 디스크립터를 전송해 잠재적 로봇 간 루프 클로저를 계산한다.

**1단계 — 강인한 초기화.** 로봇 $\alpha$의 포즈 $i$(프레임 $A$)와 로봇 $\beta$의 포즈 $j$ 사이의 루프 클로저는 다음의 후보 프레임 정렬을 산출한다

$$\widehat{X}^{A}_{B_{ij}} \triangleq \widehat{X}^{A}_{\alpha_i}\, \widetilde{X}^{\alpha_i}_{\beta_j}\, \big(\widehat{X}^{B}_{\beta_j}\big)^{-1},$$

여기서 $\widehat{X}$는 오도메트리 포즈 추정값이고 $\widetilde{X}^{\alpha_i}_{\beta_j}$는 측정된 루프 클로저이다. 인라이어 정렬은 서로 일치하므로, 상대 프레임 변환은 강인한 포즈 평균화로 찾는다, $\widehat{X}^{A}_{B} \in \arg\min_{X \in \mathrm{SE}(3)} \sum_{(i,j) \in L_{\alpha,\beta}} \rho(r_{ij}(X))$, 여기서 $\rho$는 truncated least squares(TLS) 비용이며 GNC(GTSAM)로 로컬에서 풀린다. 로봇 수준 종속성 그래프의 스패닝 트리가 한 로봇의 프레임을 팀 전체로 전파한다.

**2단계 — 분산형 graduated non-convexity(D-GNC).** 모든 궤적은 오도메트리(2차)와 루프 클로저(TLS)에 대한 강인한 PGO로 정제되며, 잔차는 코달(chordal) 거리로 측정된다. GNC는 Black–Rangarajan 쌍대성을 사용해 강인 추정을 다음으로 재작성한다

$$\min_{x\in\mathcal{X},\, w_i\in[0,1]}\; \sum_i \big[\, w_i\, r_i^2(x) + \Phi_{\rho_\mu}(w_i) \,\big],$$

여기서 $w_i$는 측정값별 신뢰 가중치, $\Phi_{\rho_\mu}$는 이상값 프로세스 페널티, 그리고 제어 파라미터 $\mu$는 대체 비용을 볼록에서 실제 TLS 비용을 향해 어닐링한다. D-GNC는 완전히 분산된 두 단계를 교대로 실행한다: (i) *변수 갱신* — 순위 제한 완화(기본값 랭크 5, 갱신당 15회 반복)에 대해 Riemannian block-coordinate descent(RBCD) 솔버로 가중 PGO를 풀며, 각 로봇은 자신의 궤적만 갱신하고 이웃과는 "공개 포즈"만 교환한다; 그리고 (ii) *가중치 갱신* — 루프 클로저별로 독립적으로 계산되는 TLS 닫힌 형식:

$$w_i \leftarrow \begin{cases} 0, & \widehat{r}_i^{\,2} \in \big[\tfrac{\mu+1}{\mu}\bar{c}^2,\, +\infty\big], \\ \frac{\bar{c}}{\widehat{r}_i}\sqrt{\mu(\mu+1)} - \mu, & \widehat{r}_i^{\,2} \in \big[\tfrac{\mu}{\mu+1}\bar{c}^2,\, \tfrac{\mu+1}{\mu}\bar{c}^2\big], \\ 1, & \widehat{r}_i^{\,2} \in \big[0,\, \tfrac{\mu}{\mu+1}\bar{c}^2\big], \end{cases}$$

여기서 $\widehat{r}_i$는 현재 잔차, $\bar{c}$는 TLS 임계값이다 — $\mu$가 어닐링됨에 따라 이상값 가중치는 0으로 몰린다. 마지막으로 각 로봇은 메쉬 변형으로 로컬 시맨틱 메쉬를 보정하여, 재구성이 최적화된 궤적과 일치하도록 유지한다.

## 실험 결과

- **시뮬레이션 + EuRoC (표 I, ATE 단위 m):** 포토리얼리스틱한 Medfield 장면(총 궤적 2396m)에서 D-GNC는 3.92m에 도달하며, 이는 나이브 최소자승법 64.2m, PCM 12.5m, *중앙집중식* GNC 3.88m와 비교된다. EuRoC Machine Hall(5개 시퀀스를 5대의 로봇으로, 466m)에서는 0.41m로, PCM 1.76m, 중앙집중식 0.52m와 비교된다. PCM 이후 GNC를 적용하는 방식은 PCM의 낮은 재현율 때문에 D-GNC 단독보다 일관되게 더 나쁘다.
- **통신 (표 II):** Medfield에서 전체 분산 파이프라인은 65.9MB를 사용한다(장소 인식 22.6 + 기하학적 검증 41.5 + DPGO 1.8), 이는 원시 이미지를 중앙집중화할 때의 2113MB(키포인트만이면 141MB)와 비교된다.
- **실제 실외 데이터셋 (Jackal UGV, RealSense D435i):** Medfield에서(로봇당 600/860/728m) 종단 간 오차가 18.74/14.84/24.55m(Kimera-VIO)에서 0.01/0.13/0.09m로 떨어지며 — 이는 중앙집중식 솔버와 동일하다. 15650개의 포즈 그래프에서 100회의 RBCD 반복은 53초가 걸린다. 더 어려운 MIT Stata 데이터셋(로봇 간 루프 클로저가 적음)에서는 오차가 0.03/33.13/1.26m로, 중앙집중식의 0.01/21.56/1.17m와 비교되며, 전체 변수 갱신(2000회 RBCD 반복, 14분)이 필요하다. D-GNC는 심한 이상값 오염을 제거한다, 예를 들어 Medfield에서 707개의 잠재적 로봇 1–로봇 2 루프 클로저 중 340개를 수용한다.

## SLAM에서의 의미

Kimera-Multi는 MIT SPARK Kimera 생태계를 로봇 팀으로 확장한 대표작으로, 현대 분산 SLAM 시스템이 갖춰야 할 표준을 세웠다: 강인성(DOOR-SLAM의 PCM이 연 길을 이어가는 GNC 이상값 제거), 중앙집중식 수준의 정확도를 갖춘 분산화, 그리고 다운스트림 계획에 사용 가능한 시맨틱하게 의미 있는 밀집 맵. 그 메트릭-시맨틱 메쉬 출력은 장면 그래프 계열 연구(Kimera, Hydra, Hydra-Multi)에도 공급된다. 오늘날 시맨틱을 갖춘 멀티로봇 매핑이 필요하다면 이것이 정전(canonical)적인 참조 시스템이다.

## 관련 문서

- [DOOR-SLAM](door-slam.md) — 강인한 분산 루프 클로저 제거의 선행 연구
- [Swarm-SLAM](swarm-slam.md) — 경쟁하는 분산형 C-SLAM 프레임워크
- [Kimera-VIO](../level-06-vio-vins/kimera-vio.md) — 단일 로봇 시각-관성 프론트엔드
- [Kimera / 3D Dynamic Scene Graph](../level-05-deep-learning/kimera-3d-dynamic-scene-graph.md) — 단일 로봇 메트릭-시맨틱 기반
- [Hydra-Multi](../level-05-deep-learning/hydra-multi.md) — 이 계보 위에 구축된 멀티로봇 장면 그래프
- [Robust pose-graph optimization](../level-02-getting-familiar/robust-pose-graph-optimization.md) — 단일 로봇 형태의 GNC
