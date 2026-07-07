# VGGT-SLAM

> Maggio 2025 · [논문](https://arxiv.org/abs/2505.12549)

**한 줄 요약** — VGGT를 프론트엔드로 사용하는 밀집 단안 RGB SLAM으로, 피드포워드 서브맵 재구성을 SL(4) 매니폴드 위에서 최적화된 팩터 그래프로 점진적으로 정렬합니다 — 캘리브레이션되지 않은 서브맵은 단순한 유사변환이 아니라 완전한 15-DoF 사영변환만큼 서로 다를 수 있기 때문입니다.

## 문제

VGGT는 한 번의 순전파로 한 배치의 프레임을 재구성하지만, GPU 메모리는 RTX 4090(24GB)에서 한 번의 추론을 대략 60프레임으로 제한하므로, 긴 영상은 서브맵으로 나뉘어야 하고 이후 하나의 지도로 정렬되어야 합니다. 관련 연구들은 서브맵을 유사변환(회전 + 병진 + 스케일)으로 정렬하지만, VGGT-SLAM은 캘리브레이션되지 않은 카메라에는 이것이 부적합함을 보입니다: 사영 재구성 정리(Projective Reconstruction Theorem)에 의해, 카메라 운동, 장면 구조, 내부 파라미터에 대한 가정이 전혀 없다면, 장면은 실제 기하학의 15자유도 사영변환까지만 복원 가능합니다. 따라서 7-DoF Sim(3) 정렬은 두 서브맵을 항상 일치시킬 수 없습니다 — 특히 프레임 간 시차가 작아 VGGT의 학습된 미터 단위 사전 정보가 신뢰할 수 없게 될 때, 서브맵 사이에 전단(shear), 스트레치, 원근 왜곡이 잔여로 남습니다.

## 방법 및 아키텍처

- **서브맵 생성**: 프레임은 이전 키프레임에 대한 Lucas-Kanade 시차가 $\tau_{\text{disparity}}$를 초과할 때 키프레임이 됩니다. $w$개의 키프레임이 축적되면, 서브맵의 이미지 집합이 $\mathcal{I}_{\mathrm{latest}} \leftarrow \{\mathbf{M}_{\mathrm{prior}}\} \cup \mathcal{I}_{\mathrm{latest}} \cup \mathcal{I}_{\mathrm{loop}}$로 구성됩니다 — 이전 서브맵의 마지막 비-루프클로저 프레임에, 검색된 최대 $w_{\text{loop}}$개의 루프 프레임을 더한 것 — 그리고 한 번의 순전파로 VGGT에 전달됩니다. 밀집 점 $\mathbf{X}^{\mathcal{S}}$는 VGGT의 카메라 추정치로 그 깊이 맵을 역투영하여 얻어지며(포인트 헤드보다 더 정확함), 신뢰도가 평균의 $\tau_{\text{conf}}$ 아래로 떨어지는 곳은 제거됩니다.
- **SL(4) 상의 서브맵 정렬**: 겹치는 두 서브맵 내의 대응점에 대해, 정렬은 $4\times 4$ 호모그래피입니다
  $$\mathbf{X}^{\mathcal{S}_i}_a = \mathbf{H}^i_j\,\mathbf{X}^{\mathcal{S}_j}_b, \qquad \mathbf{H}^i_j \in \mathrm{SL}(4),$$
  Sim(3)의 7 DoF 대신 15 DoF를 가집니다. 연속된 서브맵이 동일한 프레임을 하나 공유하기 때문에, 밀집 대응 관계는 *어떤 매칭도 없이* 알려집니다: $\mathbf{H}$는 동차 선형 시스템 $\mathbf{A}_k \mathbf{h} = 0$(여기서 $\mathbf{h} \in \mathbb{R}^{16}$은 평탄화된 호모그래피를 담음)으로부터 복원되며, RANSAC 내부의 5점 솔버로 풀리고, $\det \mathbf{H} = 1$이 되도록 그 행렬식의 네제곱근으로 재스케일됩니다. 카메라 행렬은 $\mathbf{P}_i = (\mathbf{H}^i_j)^{-1}\mathbf{P}_j$를 통해 보정됩니다.
- **루프 클로저**: 각 키프레임은 SALAD 디스크립터를 얻습니다. 이전 서브맵에 대한 검색(임계값 $\tau_{\text{desc}}$ 이상의 L2 유사도)은 최대 $w_{\text{loop}}$개의 프레임을 현재 서브맵에 추가하므로, 루프 클로저 호모그래피 역시 추정된 연관 관계가 아니라 정확히 공유된 프레임의 대응 관계로부터 얻어집니다.
- **백엔드 — SL(4) 매니폴드 상의 팩터 그래프**: 각 서브맵을 전역 프레임으로 매핑하는 절대 호모그래피 $\mathbf{H}_i$는 MAP 최적화로 추정됩니다
  $$\hat{\mathcal{H}} = \operatorname{argmin}_{\mathbf{H} \in \mathrm{SL}(4)} \sum_{(i,j) \in \mathcal{L}} \left\| \mathrm{Log}\left( \mathbf{H}^{-1}_i \mathbf{H}_j \left(\mathbf{H}^i_j\right)^{-1} \right) \right\|^2_{\Omega^{\mathbf{H}}_{ij}},$$
  여기서 $\mathcal{L}$은 오도메트리와 루프 클로저 제약을 인덱싱하고, $\mathrm{Log}$는 리 대수 $\mathfrak{sl}(4)$로 매핑하며, 15개의 생성자 $\mathbf{G}_k$에 대해 $\boldsymbol{\xi}^{\wedge} = \sum_{k=1}^{15} \boldsymbol{\xi}_k \mathbf{G}_k$로 파라미터화되는 $\boldsymbol{\xi} \in \mathbb{R}^{15}$를 사용합니다. 레벤버그-마쿼트는 포즈를 매니폴드 위에서 $\mathbf{H} \leftarrow \mathbf{H}\,\mathrm{Exp}(\hat{\boldsymbol{\delta}})$로 갱신하며, 야코비안은 $\mathbf{J}_i = -\mathrm{Ad}_{\mathbf{H}_i^{-1}\mathbf{H}_j}$, $\mathbf{J}_j = \mathbf{I}_{15\times 15}$입니다.
- 이 시스템은 카메라 내부 파라미터도, 프레임 간 일관된 캘리브레이션도, 추가 학습도 필요로 하지 않습니다. 비교를 위해 Sim(3) 변형(VGGT 포즈 + 스케일 정렬)도 함께 구축됩니다.

## 실험 결과

RTX 4090에서 5회 실행 평균으로, 7-Scenes와 TUM RGB-D(evo로 계산한 ATE RMSE)에서 평가되었습니다. 파라미터: $w_{\text{loop}}=1$, $\tau_{\text{disparity}}=25$px, $\tau_{\text{conf}}=25\%$, RANSAC 반복 300회.

- **TUM RGB-D(캘리브레이션 없음)**: $w=32$인 SL(4) 버전이 전반적으로 최고이며, 평균 ATE **0.053m**로 MASt3R-SLAM*의 0.060m, DROID-SLAM*(자동 캘리브레이션)의 0.158m, Sim(3) 변형의 0.074m와 대비됩니다.
- **7-Scenes(캘리브레이션 없음)**: $w=32$에서 SL(4)와 Sim(3) 변형 모두 평균 ATE 0.067m — 최고 기준선인 MASt3R-SLAM*(0.066m)와 거의 동일합니다.
- **밀집 재구성(7-Scenes)**: 비교된 방법 중 최고의 정확도(0.052m)와 Chamfer 거리(0.055m)를 보입니다(MASt3R-SLAM*는 정확도 0.068m/Chamfer 0.056m, Spann3R@20은 0.069/0.058).
- **정성적 결과**: 55m 오피스 복도 루프가 22개의 서브맵으로부터 전역적으로 일관된 지도로 합쳐집니다. 그림 예시들은 Sim(3)이 서브맵을 정렬하지 못하지만 SL(4)는 사영 모호성을 바로잡는 장면을 보여줍니다.
- **알려진 실패 모드**: 평면형 TUM `floor` 장면(0.141m) — 15-DoF 호모그래피는 평면 점들에 대해 퇴화되며, 15 DoF는 스케일/회전/병진뿐 아니라 장면 원근에서도 드리프트를 허용합니다. 두 문제 모두 VGGT-SLAM 2.0의 동기가 되었습니다.

## SLAM에서의 의미

VGGT-SLAM은 다중 뷰 피드포워드 파운데이션 모델을 제대로 된 SLAM 루프에 감싸는 최초의 시스템입니다 — 서브맵, 루프 클로저, 그리고 이러한 모델들이 해결하지 않고 남기는 재구성 모호성에 대한 원칙적인 처리를 갖췄습니다. 캘리브레이션되지 않은 피드포워드 서브맵은 Sim(3)이 아니라 SL(4) 위에서 정렬되어야 한다는 핵심 관찰은, 학습된 기하학 위에 SLAM을 구축하려는 누구에게나 개념적으로 중요하며, 그 SL(4) 팩터 그래프 솔버는 이후 GTSAM에 병합되었습니다. 이 시스템은 DROID-SLAM과 MASt3R-SLAM으로부터 점점 더 학습화되는 SLAM 스택으로 향하는 직선 계보 위에 위치합니다.

## 관련 문서

- [VGGT](vggt.md) — 피드포워드 프론트엔드 모델
- [VGGT-SLAM 2.0](vggt-slam-2-0.md) — 15-DoF 드리프트와 평면 퇴화를 제거하는 후속 시스템
- [MASt3R-SLAM](mast3r-slam.md) — 쌍별 포인트맵 예측 위에 구축된 SLAM
- [DROID-SLAM](droid-slam.md) — 최적화 백엔드를 가진 이전의 종단간 학습 기반 SLAM
- [Visual Place Recognition (VPR)](visual-place-recognition-vpr.md) — SALAD가 루프 클로저를 위해 해결하는 검색 문제
- [Epipolar geometry](../level-01-beginner/epipolar-geometry.md) — 사영 모호성 논증을 위한 배경 지식
