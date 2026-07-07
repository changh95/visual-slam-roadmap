# PIN-SLAM

> Pan (Bonn) 2024 · [논문](https://arxiv.org/abs/2401.09101)

**한 줄 요약** — PIN-SLAM은 명시적인 포인트 클라우드 맵을 로컬 암묵적 SDF를 인코딩하는 희소한 최적화 가능 신경 포인트 집합으로 대체하여, 대응 없는 등록을 가능하게 하며—무엇보다도—루프 클로저가 궤적을 수정할 때 맵이 탄성적으로 변형되도록 한다.

## 문제

고전적인 LiDAR 맵—포인트 클라우드, 복셀 그리드, 서펠, TSDF 볼륨—은 강직하다: 루프 클로저가 누적된 드리프트를 수정할 때, 이미 구축된 맵은 수정된 궤적에 맞게 매끄럽게 재형성될 수 없으므로, 시스템은 맵을 재구축하거나 서브맵을 사용하거나 중복된 구조를 안고 살아간다. 신경 암묵적 맵은 컴팩트하고 연속적이지만, 이전 신경 SLAM 시스템은 룸 스케일 RGB-D 입력을 대상으로 했고 실외 LiDAR 속도에는 너무 느렸다(Nerf-LOAM: 프레임당 4초 초과). PIN-SLAM은 암묵적 신경 매핑을 LiDAR 규모로 끌어올리면서 전역 일관성을 맵 자체의 일급 속성으로 만든다.

## 방법 및 아키텍처

프레임마다: (1) 스캔을 디스큐잉하고 복셀 다운샘플링하여 등록 클라우드 $\mathcal{P}_r$와 매핑 클라우드 $\mathcal{P}_m$을 만든다; (2) $\mathcal{P}_r$를 로컬 맵의 SDF에 등록한다; (3) 증분 학습으로 맵을 업데이트한다; (4) 신경 포인트 디스크립터로 루프를 감지한다; (5) 포즈 그래프를 최적화하고 맵을 변형한다.

- **포인트 기반 암묵적 신경(PIN) 맵**: $\mathcal{M} = \{\mathbf{m}_i = (\mathbf{x}_i, \mathbf{q}_i, \mathbf{f}_i^{g}, t_i^{c}, t_i^{u}, \mu_i)\}$ — 위치, 방향 쿼터니언, 최적화 가능한 잠재 특징, 생성/업데이트 타임스텝, 안정성. 쿼리 $\mathbf{p}$에서의 SDF는 특징과 *상대* 좌표로부터 얕은 공유 MLP에 의해 각 이웃별로 디코딩된다,

  $$s_j = D_{\theta}^{g}\left(\mathbf{f}_j^{g}, \mathbf{d}_j\right), \qquad \mathbf{d}_j = \mathbf{q}_j\left(\mathbf{p} - \mathbf{x}_j\right)\mathbf{q}_j^{-1},$$

  그다음 역제곱 거리 가중치 $w_j = \lVert \mathbf{p} - \mathbf{x}_j \rVert^{-2}$로 가장 가까운 $K$개 신경 포인트에 대해 보간된다: $S(\mathbf{p}) = \sum_j \frac{w_j}{\sum_k w_k} s_j$. $\mathbf{d}_j$가 각 포인트 고유의 프레임으로 표현되기 때문에, 예측은 포인트들의 강체 변환에 대해 불변이다—이것이 맵의 탄성의 근원이다. 복셀 해싱(복셀당 하나의 활성 신경 포인트)은 상수 시간 이웃 탐색을 제공한다.
- **증분 맵 학습**: 각 레이를 따라(표면 인접 및 자유 공간) 투영 SDF 목표값으로 샘플이 추출되며, 이는 파괴적 망각에 대응하기 위해 슬라이딩 학습 풀 $\mathcal{D}_p$에 보관된다. 손실은 $\mathcal{L} = \mathcal{L}_{\text{bce}} + \lambda_e \mathcal{L}_{\text{eik}}$이다: 시그모이드로 매핑된 SDF 값(소프트 절단)에 대한 이진 교차 엔트로피 손실에 Eikonal 정규화항을 더한 것이다,

  $$\mathcal{L}_{\text{eik}} = \frac{1}{N}\sum_{i=1}^{N} \left( \lVert \nabla S(\mathbf{u}_W^{i}) \rVert_2 - 1 \right)^2.$$

  디코더는 처음 몇 프레임 이후 고정되며; 신경 포인트 특징만 계속 학습된다.
- **대응 없는 오도메트리**: 스캔은 모든 포인트를 제로 레벨 셋으로 밀어넣어 정렬된다,

  $$\mathbf{T}^{*} = \underset{\mathbf{T}}{\operatorname{argmin}} \sum_{\mathbf{p} \in \mathcal{P}_r} S\left(\mathbf{T}\mathbf{p}\right)^2,$$

  해석적 야코비안 $\mathbf{J}_i = [\,\mathbf{g}_i^{\top},\ (\mathbf{p}_i' \times \mathbf{g}_i)^{\top}\,]$($\mathbf{g}_i = \nabla S(\mathbf{p}_i')$)를 사용하는 레벤버그-마쿼트로 풀린다—최근접 이웃 데이터 연관이 필요 없으며, 필드가 방향과 크기를 모두 제공한다. Geman–McClure 강인 커널은 SDF 잔차와 기울기 이상 $\varepsilon_i = |\lVert \nabla S(\mathbf{p}_i') \rVert_2 - 1|$에 따라 포인트의 가중치를 낮추며, 헤시안에 대한 고유값 검사가 퇴화를 감지한다. $F_{\text{ba}}$프레임마다 실행되는 암묵적 로컬 번들 조정이 최근 포즈와 로컬 특징을 공동으로 정밀화한다.
- **동적 필터링**: *안정적인 자유 공간*에 있을 것으로 예측되는 측정 포인트—$S(\mathbf{p}_W) > \gamma_d$이고 안정성 $H(\mathbf{p}_W) > \gamma_\mu$인 경우—는 매핑에서 제외된다.
- **루프 클로저 및 탄성 맵 보정**: 전역 루프는 로컬 맵의 *신경 포인트 특징*을 비닝하는 극좌표 컨텍스트 디스크립터(Scan-Context 스타일, $\mathbf{U}_t \in \mathbb{R}^{H_r \times H_s \times F_g}$)로 감지된다—기하 인코딩과 장소 인식이 하나의 학습된 표현을 공유한다. 포즈 그래프 최적화 후, 모든 신경 포인트는 연관된 프레임과 함께 이동한다:

  $$\mathbf{x}_i \leftarrow \delta\mathbf{T}_{t_i^{m}}\, \mathbf{x}_i, \qquad \mathbf{q}_i \leftarrow \delta\mathbf{q}_{t_i^{m}}\, \mathbf{q}_i,$$

  그리하여 맵은 찢어지거나 유령처럼 겹치는 대신 수정된 궤적과 일관되게 변형된다.

## 실험 결과

- **KITTI 오도메트리**: 평균 상대 병진 오차 0.51%(10개 시드에 대해 표준편차 0.02%)—사전 학습 없이도 KISS-ICP와 CT-ICP와 동등하며, 비교된 모든 학습 기반 방법보다 우수하다.
- **KITTI SLAM**: 루프 시퀀스에서 평균 ATE RMSE 1.0 m(PIN 오도메트리 단독: 3.2 m), 전체 11개 시퀀스에서 1.2 m—SC-LeGO-LOAM과 SC-F-LOAM을 앞서고, 오프라인 HLBA 후처리 기준선조차 온라인으로 실행하면서 능가한다.
- **기타 도메인**: MulRan, IPB-Car, Newer College, Hilti-21에서 전체 최고 정확도를 기록한다; Newer College의 계단 시퀀스에서는 비교 방법의 절반이 실패하는 곳에서 6cm RMSE를 달성한다. RGB-D 확장판은 Replica에서 경쟁력이 있다.
- **맵 압축성**: KITTI 00 맵은 102.1 MB를 차지한다—원시 포인트 클라우드(13.6 GB)의 약 0.7%로, SuMa의 서펠 맵 887.7 MB, 그리드 기반 SHINE 맵 160.6 MB와 대비된다; 루프 보정은 중복된 신경 포인트를 제거함으로써 맵을 오히려 약 20% *축소*시킨다.
- **런타임**: 경량 버전은 단일 NVIDIA A4000 GPU에서 프레임당 일정한 시간으로 ~11 Hz(센서 프레임율)로 실행된다; 유일한 다른 암묵적 신경 LiDAR 오도메트리인 Nerf-LOAM은 약 30배 느리다. 코드: `PRBonn/PIN_SLAM`.

## SLAM에서의 의미

신경 암묵적 SLAM(iMAP, NICE-SLAM)은 느리고 룸 스케일인 RGB-D 방식으로 시작했다; PIN-SLAM은 암묵적 맵이 전역 일관성을 갖춘 채로 실외 LiDAR SLAM으로 확장될 수 있음을 보여준 시연이며—탄성 변형을 통해 신경 맵 자체를 루프 클로저 인식이 가능하도록 만든 최초의 시스템이다. 이는 FAST-LIO2와 LOAM이 고전적 구조로 지배하던 LiDAR 영역에 학습된 맵 표현이 신뢰할 만하게 진입했음을 알리며, 컴팩트하고, 밀집 재구성이 가능하며, 전역적으로 일관된 맵을 동시에 갖춘 방향을 가리킨다.

## 실습

- [PIN-SLAM 실행하기](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/pin_slam)

## 관련 문서

- [FAST-LIO2](fast-lio2.md) — 경쟁하는 고전적 직접 등록 기준선
- [SuMa](suma.md) — 이전의 밀집(서펠) LiDAR 맵 표현
- [iMAP](../level-05-deep-learning/imap.md) — 신경 암묵적 SLAM의 기원
- [NICE-SLAM](../level-05-deep-learning/nice-slam.md) — 계층적 신경 암묵적 RGB-D SLAM 선행 연구
- [Point-SLAM](../level-05-deep-learning/point-slam.md) — RGB-D SLAM을 위한 신경 포인트 표현
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md) — 탄성 맵이 흡수하는 전역 조정
