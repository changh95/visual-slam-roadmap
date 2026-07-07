# ORB-SLAM

> Mur-Artal 2015 · [논문](https://arxiv.org/abs/1502.00956)

**한 줄 요약** — ORB 특징점을 추적, 매핑, 재지역화, 루프 클로징 등 모든 작업에 사용하고, 자동 초기화와 적자생존(survival-of-the-fittest) 방식의 지도 관리 기능을 갖춘 완전하고 다용도적인 단안 SLAM 시스템입니다.

## 문제

이전의 단안 SLAM 시스템들은 문제의 일부만을 해결했습니다: PTAM은 키프레임 BA를 갖췄지만 루프 클로저가 없었고, 패치 특징점은 장소 인식에 쓸모가 없었으며 수동 초기화가 필요했습니다. 다른 시스템들은 대규모 환경을 다루지 못했거나 추적 실패로부터 복구할 수 없었습니다. ORB-SLAM(IEEE TRO 2015, University of Zaragoza)은 PTAM의 핵심 아이디어, DBoW2 장소 인식, 스케일을 고려한 루프 클로징을 기반으로 하여, 이 모든 문제를 하나의 통합 프레임워크에서 해결하며 크고 작은, 실내와 실외 환경 모두에서 실시간으로 동작합니다.

## 방법 및 아키텍처

**모든 것을 위한 하나의 특징점.** 동일한 ORB 특징점(방향 불변 FAST + 회전된 BRIEF, 해밍 거리로 매칭)이 추적, 매핑, 재지역화, 루프 감지를 모두 담당하여 중복 작업이 없습니다.

**자동 초기화.** 동일한 대응점 $\mathbf{x}_c \leftrightarrow \mathbf{x}_r$로부터 단응 행렬과 기초 행렬이 병렬로 계산됩니다. 즉 $\mathbf{x}_c = \mathbf{H}_{cr}\,\mathbf{x}_r$ 대 $\mathbf{x}_c^{\top}\mathbf{F}_{cr}\,\mathbf{x}_r = 0$이며, 각각 이상값을 절단하는 커널을 갖는 대칭 전달 오차(symmetric transfer error)로 점수가 매겨집니다:

$$
S_M = \sum_i \Big( \rho_M\big(d_{cr}^2(\mathbf{x}_c^i, \mathbf{x}_r^i, M)\big) + \rho_M\big(d_{rc}^2(\mathbf{x}_c^i, \mathbf{x}_r^i, M)\big) \Big), \qquad
\rho_M(d^2) = \begin{cases} \Gamma - d^2 & \text{if } d^2 < T_M \\ 0 & \text{if } d^2 \geq T_M \end{cases}
$$

$\chi^2$ 임계값은 $T_H = 5.99$, $T_F = 3.84$입니다. 휴리스틱 $R_H = \frac{S_H}{S_H + S_F}$는 $R_H > 0.45$일 때 단응 행렬을 선택하고(평면적/저시차 장면), 그렇지 않으면 기초 행렬을 선택합니다($\mathbf{E}_{rc} = \mathbf{K}^{\top}\mathbf{F}_{rc}\,\mathbf{K}$); 퇴화(degenerate)되거나 모호한 구성은 감지되어 초기화가 지연됩니다.

**세 개의 병렬 스레드.**
- *추적(Tracking)*은 지역 지도(local map)에 매칭하고 운동만의(motion-only) BA로 정제하여 매 프레임을 지역화합니다. 모든 최적화는 포즈 $\mathbf{T}_{iw} \in \mathrm{SE}(3)$와 점 $\mathbf{X}_{w,j} \in \mathbb{R}^3$에 대한 강건한 재투영 오차를 최소화합니다:

$$
C = \sum_{i,j} \rho_h\big(\mathbf{e}_{i,j}^{\top}\,\mathbf{\Omega}_{i,j}^{-1}\,\mathbf{e}_{i,j}\big), \qquad
\mathbf{e}_{i,j} = \mathbf{x}_{i,j} - \pi_i(\mathbf{T}_{iw}, \mathbf{X}_{w,j}),
$$

  Huber 커널 $\rho_h$와, 키포인트의 피라미드 스케일에 결부된 $\mathbf{\Omega}_{i,j} = \sigma_{i,j}^2 \mathbf{I}_{2\times 2}$가 사용됩니다. 키프레임은 관대하게(generously) 삽입됩니다(예: 프레임이 참조 키프레임 포인트의 90% 미만을 추적할 때마다).
- *지역 매핑(Local Mapping)*은 새로운 포인트를 삼각측량하고, 공시야성(covisibility) 이웃에 대한 지역 BA를 실행하며, 적극적으로 걸러냅니다: 새 포인트는 그것을 보일 것으로 예측한 프레임의 25% 초과에서 발견되어야 하고 최소 세 개의 키프레임에서 관측되어야 합니다; 자신의 포인트 중 90%가 다른 세 개 이상의 키프레임에서도 보이는 키프레임은 삭제됩니다. *공시야성 그래프(covisibility graph)*는 최소 15개의 포인트 관측을 공유하는 키프레임들을 연결합니다(엣지 가중치 $\theta$ = 공유 포인트 수).
- *루프 클로징(Loop Closing)*은 DBoW2로 후보를 감지하고, 양뷰 제약 $\mathbf{e}_1 = \mathbf{x}_{1,i} - \pi_1(\mathbf{S}_{12}, \mathbf{X}_{2,j})$, $\mathbf{e}_2 = \mathbf{x}_{2,j} - \pi_2(\mathbf{S}_{12}^{-1}, \mathbf{X}_{1,i})$로부터 7-DoF $\mathrm{Sim}(3)$ 정렬(단안 스케일 드리프트 포함)을 계산한 다음, *필수 그래프(essential graph)* — 신장 트리 + $\theta_{\min} = 100$인 공시야성 엣지 + 루프 엣지 — 에 대한 포즈 그래프 최적화로 드리프트를 보정하여 다음을 최소화합니다

$$
C = \sum_{i,j} \mathbf{e}_{i,j}^{\top} \mathbf{\Lambda}_{i,j}\, \mathbf{e}_{i,j}, \qquad
\mathbf{e}_{i,j} = \log_{\mathrm{Sim}(3)}\big(\mathbf{S}_{ij}\,\mathbf{S}_{jw}\,\mathbf{S}_{iw}^{-1}\big) \in \mathbb{R}^7,
$$

  이후 선택적으로 전역 BA가 수행됩니다.

## 실험 결과

모든 실험은 Intel Core i7-4700MQ(4코어 @ 2.40 GHz), 8 GB RAM에서 이미지를 실제 프레임 속도로 처리하며 수행되었습니다:

- **NewCollege (2.2 km 로봇 시퀀스)**: 전체 시퀀스를 처리한 것으로 보고된 최초의 단안 시스템입니다. 중앙값 추적 시간은 30.57 ms/프레임(ORB 추출 11.10 ms, 초기 포즈 3.38 ms, 지역 지도 추적 14.84 ms)이며, 지역 매핑 중앙값은 383.59 ms/키프레임으로, 지역 BA(296.08 ms)가 대부분을 차지합니다.
- **TUM RGB-D (16개 시퀀스)**: 키프레임 궤적 RMSE, 예를 들어 fr1_xyz 0.90 cm(PTAM 1.15, LSD-SLAM 9.00), fr2_xyz 0.30 cm, fr2_desk_person 0.63 cm(LSD-SLAM 31.73). PTAM은 8개 시퀀스에서, LSD-SLAM은 3개 시퀀스에서 추적을 잃었습니다; ORB-SLAM은 fr3_nstr_tex_far를 제외한 모든 시퀀스를 실행했는데, 이 시퀀스에서는 이중 평면 모호성을 올바르게 감지하고 초기화를 거부합니다.
- **재지역화**: fr2_xyz 지도로부터 재현율 78.4% 대 PTAM의 34.9%; walking_xyz 프레임을 sitting_xyz 지도(심한 가림)에 대해 재지역화하면 77.9% 대 PTAM의 0%.
- **장기 운용(lifelong operation)**: PTAM 방식 정책이 무한히 증가하는 반면 키프레임 수는 포화됩니다 — 지도는 시간이 아니라 장면 콘텐츠에 따라 증가합니다.
- **KITTI (10개 시퀀스)**: 고속도로 시퀀스 01을 제외한 모든 시퀀스를 10 fps로 실시간 처리합니다; 궤적 오차는 일반적으로 지도 크기의 약 1%(03에서 0.3%, 루프가 없는 08에서 5%)이며, 20회의 전역 BA 반복으로 약간 개선됩니다.

## SLAM에서의 의미

ORB-SLAM은 지난 10년간의 최고의 아이디어들 — PTAM의 병렬 추적/매핑, 키프레임 BA, bag-of-words 장소 인식, 공시야성, Sim(3) 루프 클로징 — 을 하나의 견고한 오픈소스 시스템으로 통합하여 수년간 사실상의(de facto) 표준 단안 SLAM 기준선이 되었습니다. H/F 초기화, 공시야성/필수 그래프 메커니즘, 적자생존 방식의 정리(culling)는 이후 거의 모든 특징점 기반 시스템에 채택되었으며, 오늘날까지 SLAM 벤치마킹의 근간이 되는 ORB-SLAM2/3 계보를 낳았습니다.

## 관련 문서

- [PTAM](ptam.md)
- [ORB-SLAM2](orb-slam2.md)
- [ORB-SLAM3](orb-slam3.md)
- [Covisibility graph](covisibility-graph.md)
- [Visual Place Recognition (VPR)](visual-place-recognition-vpr.md)
- [Keypoints](../level-02-getting-familiar/keypoints.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md) — 필수 그래프 보정 단계
