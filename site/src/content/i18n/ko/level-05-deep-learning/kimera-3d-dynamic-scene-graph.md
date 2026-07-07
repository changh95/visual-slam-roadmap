# Kimera / 3D Dynamic Scene Graph

> Rosinol 2020 · [논문](https://arxiv.org/abs/2002.06289)

**한 줄 요약** — 메시, 객체, agent, 장소, 방, 건물에 걸친 계층적이고 활용 가능한(actionable) 세계 모델인 3D Dynamic Scene Graph (DSG)를 도입하고, 오픈소스 Kimera metric-semantic SLAM 라이브러리를 사용하여 스테레오 + IMU 데이터로부터 이를 구축하는 최초의 완전 자동 Spatial PerceptIon eNgine인 SPIN을 제시합니다.

## 문제

기하학적 SLAM은 포인트 클라우드, 메시, 볼류메트릭 모델과 같이 평면적이고 비구조적인 메트릭 맵을 생성하며, metric-semantic 매핑은 레이블을 추가하지만 여전히 비계층적입니다: 둘 다 "높은 건물의 2층에서 생존자를 찾아라" 같은 명령을 근거 지을 수 없고, 하나의 표현으로 모션 계획(정밀 메시)과 작업 계획(추상적 개념)을 동시에 지원할 수 없습니다. 초기 계층적 맵은 2D였고, 정적이었으며, 딥러닝 이전 시대의 것이었습니다. Armeni et al.과 Kim et al.의 선구적인 3D scene graph는 반자동 또는 오프라인으로 구축되었고, traversability 같은 활용 가능한 정보를 담지 못했으며, 동적 개체를 무시했습니다. 이 논문은 이동하는 agent — 특히 인간 — 을 시각-관성 데이터로부터 자동으로 구축된 하나의 계층적 공간 표현 안에서 어떻게 표현할지를 묻습니다.

## 방법 및 아키텍처

**DSG**는 노드가 공간적으로 근거를 둔 의미론적 개념이고 엣지가 쌍별 시공간적 관계("agent A는 시각 $t$에 방 B에 있다")인 계층적 방향 그래프입니다. 단일 층 실내 장면을 위한 다섯 개 레이어:

1. **Metric-semantic 메시** — 위치, 법선(normal), RGB, panoptic 레이블을 가진 정점, 위상은 면(face)으로 정의됩니다.
2. **객체와 agent** — 객체는 포즈, 바운딩 박스, 클래스를 가지며, agent(사람, 로봇)는 타임스탬프가 찍힌 3D 포즈 그래프, 메시 모델, 클래스를 가집니다.
3. **장소와 구조** — 장소는 자유 공간을 샘플링하고, 엣지는 직선 traversability를 인코딩합니다(계획을 위한 위상 맵). 구조는 벽/바닥/천장입니다.
4. **방** — 인접성(문) 엣지로 연결되며, 각각 포함하는 장소와 연결됩니다.
5. **건물** — 모든 방과 연결된 루트 노드입니다. 계층 구조는 조합 가능합니다(예: 다층 건물을 위한 "층(Level)" 레이어를 삽입할 수 있음).

**SPIN 파이프라인** (입력: 스테레오 + IMU; 메시와 agent는 실시간으로 점진적으로 구축되며, 상위 레이어는 실행 종료 시에 구축됨):

- **Kimera를 통한 레이어 1**: Kimera-VIO(IMU 사전적분 + 고정 래그 스무딩), Kimera-RPGO(강건 pose-graph 최적화), Kimera-Mesher, 그리고 Kimera-Semantics는 2D panoptic segmentation을 Bayesian 레이블 갱신을 사용하는 Voxblox 기반 볼류메트릭 모델에 융합하고 의미론적 메시와 ESDF를 추출합니다.
- **군중에 강건한 VIO (DVIO)**: Lucas-Kanade 추적기가 IMU 인지 optical flow로 대체되고, 5점 RANSAC은 IMU 회전을 사용하여 이상치 특징 추적을 제거하는 2점 RANSAC으로 대체됩니다.
- **인간 노드**: Graph-CNN이 검출당 SMPL 메시 정점(6890개 정점, 23개 관절)을 회귀하며, 전체 포즈는 PnP로 복원됩니다. 각 인간은 zero-velocity 모션 팩터와 검출당 사전(prior) 팩터를 가진 포즈 그래프로 추적됩니다. 검출 $d_{t}$는 모든 관절이 초당 3m 미만으로 움직일 때만 트랙 $h^{(i)}_{1:t-1}$에 연관됩니다(이미지 경계 근처 또는 30픽셀 미만의 검출은 거부됨). **동적 마스킹(dynamic masking)**은 사람 픽셀을 자유 공간 전용 광선으로 Kimera-Semantics에 되돌려주어, 보행자가 메시에 "잔상(contrail)"을 남기지 않도록 합니다.
- **객체 노드**: 클래스 레이블이 붙은 메시는 유클리드 클러스터링(0.1m voxel 크기의 2배 임계값)으로 인스턴스로 분할되어 중심점 + 바운딩 박스를 얻습니다. CAD 모델이 존재하는 경우, 3D Harris keypoint(0.15m 반경)를 매칭하고 TEASER++로 정합하여 전체 객체 포즈를 복원합니다.
- **장소와 방**: 위상 그래프는 ESDF로부터 샘플링되며, 방은 검출된 천장 아래 0.3m에서 자른 2D ESDF 단면으로부터 얻고 0.2m 위쪽에서 절단하여 문 개구부가 분리되도록 합니다 — 장소는 자신이 속한 연결 요소로 레이블되고, 나머지는 그래프 이웃에 대한 다수결로 레이블됩니다.

## 실험 결과

사실적인 65m x 65m Unity 오피스(공개된 uHumans 데이터셋: 12, 24, 60명의 사람이 있는 uH_01/02/03)와 EuRoC에서 평가:

- **군중 속 VIO** (ATE, cm): uH_03에서 5점 RANSAC 160 → 2점 111 → DVIO 88; 정적인 EuRoC에서는 이 접근법이 최신 기법과 비슷한 수준을 유지합니다(예: MH_01: 9.3 → 8.1).
- **동적 마스킹**: uH_03에서 ground-truth 포즈를 사용한 메시 RMSE가 0.192m에서 0.061m로 감소하며, 이 이득은 VIO 포즈에서도 유지됩니다.
- **인간 추적**: 평균 몸통(torso) 위치 오차가 1.20m(단일 이미지 검출, uH_03)에서 포즈 그래프 추적기 사용 시 0.63m로 개선되며, 형태를 모르는 객체는 1.31–1.70m 이내로, CAD로 맞춘(TEASER++) 객체는 0.20–0.38m 이내로 위치 추정됩니다.
- **방 파싱**: uH_01에서 장소-방 분류는 precision 99.89% / recall 99.84%에 도달하며, 오차는 출입구 근처에 집중됩니다.

## SLAM에서의 의미

이 논문은 시각-관성 SLAM을 밀집 인간 메시 추적과 조화시키고 SLAM을 "spatial perception engine"으로 일반화한 논문입니다 — SLAM은 관계, 동역학, 추상화도 추론하는 시스템 안의 한 모듈이 됩니다. DSG의 바운딩 볼륨 계층 구조는 빠른 충돌 검사를 제공하고, 장소 그래프는 계층적 계획을 제공하며, 계층적 가지치기는 장기 자율성을 위한 원칙적인 맵 압축을 제공합니다. Kimera는 metric-semantic SLAM을 위한 기본 오픈소스 연구 플랫폼이 되었으며, DSG 데이터 구조는 Hydra와 전체 계층적 scene graph 계열에 직접적인 씨앗이 되었습니다.

## 실습

- [Kimera 실행하기](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/kimera)

## 관련 문서

- [Kimera-VIO](../level-06-vio-vins/kimera-vio.md) — 시각-관성 프론트엔드에 대한 자세한 내용
- [Hydra](hydra.md) — DSG 구축을 실시간이고 점진적으로 만듦
- [Kimera-Multi](../level-08-collaborative-slam/kimera-multi.md) — 다중 로봇 확장
- [GNC](../level-02-getting-familiar/gnc.md) — 동일 연구실의 강건한 추정 기법으로, 이후 scene graph 최적화기에 사용됨
- [SemanticFusion](../level-04-rgbd-slam/semanticfusion.md) — dense SLAM에서의 초기 의미론적 레이블 융합
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md) — 로봇 및 인간 궤적 추정의 근간이 되는 백엔드 기법
