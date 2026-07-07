# Visual Odometry

> Nistér 2004 · [논문](https://ieeexplore.ieee.org/document/1315094)

**한 줄 요약** — "visual odometry"라는 용어를 만들어냈고, 단안 및 스테레오 비디오로부터 실시간 프레임 단위 카메라 포즈 추정을 시연하여, VO를 실용적인 내비게이션 능력으로 확립했습니다.

## 문제

이 연구 이전에는 카메라 기반 자기 운동(ego-motion) 추정이 주로 오프라인 structure-from-motion 형태로 존재했습니다: 이미지 모음을 몇 분에서 몇 시간씩 처리하는 배치 파이프라인이었습니다. 자율 내비게이션에 필요한 것은 그 반대였습니다 — 비디오 스트림으로부터 증분적이고 실시간으로, 프레임 단위로 이루어지는 포즈 추정으로, 움직이는 차량에서 실행될 만큼 강건해야 했습니다. Nistér, Naroditsky, Bergen(CVPR 2004)은 이것이 실용적임을 보였습니다: 그들의 시스템은 "비디오 입력을 기반으로 스테레오 헤드 또는 단일 이동 카메라의 모션을 추정"하며, 낮은 지연으로 실시간 동작하여 그 모션 추정치를 내비게이션 목적으로 사용할 수 있습니다 — 그리고 그들은 이 능력을 바퀴 오도메트리(wheel odometry)에 유비하여 *visual odometry*라고 명명했습니다.

## 방법 및 아키텍처

파이프라인은 네 단계로 이루어진 프레임 단위 루프입니다(어디에도 전역 최적화는 없습니다):

1. **특징점 검출 및 매칭** — 각 프레임에서 Harris 코너를 검출하고, 지역 이미지 패치의 정규화된 상관을 이용해 연속 프레임 간에 매칭하여 비디오 속도로 특징점 트랙을 생성합니다.
2. **강건한 상대 포즈 추정** — 캘리브레이션된 뷰 간의 상대 포즈는 Nistér의 *5점 알고리즘*(같은 2004년에 발표된 자매 논문 "An Efficient Solution to the Five-Point Relative Pose Problem")을 이용한 RANSAC 가설-검증 루프 내에서 계산됩니다. 캘리브레이션된 이미지 점 $\mathbf{q} \leftrightarrow \mathbf{q}'$에 대해, 각 대응점은 에피폴라 제약을 통해 essential matrix를 제약합니다

$$
\mathbf{q}'^\top \mathbf{E}\,\mathbf{q} = 0, \qquad \mathbf{E} \equiv [\mathbf{t}]_\times \mathbf{R},
$$

   그리고 유효한 essential matrix는 추가로 다음의 3차 제약(5점 논문의 정리 1)을 만족해야 합니다

$$
\mathbf{E}\mathbf{E}^\top\mathbf{E} - \tfrac{1}{2}\,\mathrm{trace}\big(\mathbf{E}\mathbf{E}^\top\big)\,\mathbf{E} = \mathbf{0}.
$$

   다섯 개의 대응점은 $5 \times 9$ 선형 시스템을 주고, 그 4차원 널 공간 $\mathbf{E} = x\mathbf{X} + y\mathbf{Y} + z\mathbf{Z} + w\mathbf{W}$는 3차 제약을 통해 **10차 다항식**으로 축소되며, 그 실근이 후보 모션이 됩니다. *최소한*의 5점만 사용하면 각 RANSAC 가설의 계산이 저렴해지고 전부 인라이어인 샘플을 뽑을 확률이 최대화됩니다; 가설들은 모든 매칭에 대해 점수를 매겨 이상값을 걸러냅니다. 이후 $\mathbf{R}, \mathbf{t}$는 $\mathbf{E}$의 SVD로부터 복원됩니다.
3. **삼각측량** — 인라이어 매칭들은 3D 점으로 삼각측량됩니다(스테레오 구성에서는 알려진 기저선이 미터 단위 스케일을 고정하고, 단안의 경우 스케일은 관측 불가능합니다).
4. **증분적 포즈 연쇄** — 각 프레임 간 상대 포즈를 합성하여 전역 궤적을 얻습니다.

이 아키텍처의 핵심 특징은 무엇이 *없는가*입니다: 루프 클로저 없음, 전역 최적화 없음, 장소 인식 없음, 지도 재사용 없음 — 드리프트가 무한히 누적되며, 이것이 정확히 VO와 완전한 SLAM을 구분하는 지점입니다.

## 실험 결과

발표된 평가(IEEE 유료 열람 제한; 이 노트를 작성할 때 전문에 접근할 수 없었습니다 — 전체 평가는 논문을 참고하십시오)는 스테레오 헤드와 단일 이동 카메라 양쪽의 실제 비디오에서 낮은 지연으로 실시간 동작을 시연했으며, 그 추정치는 지상 차량 플랫폼의 내비게이션에 사용되었습니다; 확장된 저널 버전은 "Visual odometry for ground vehicle applications"(Journal of Field Robotics, 2006)로 발표되었습니다. 지속적인 정량적 유산은 아키텍처 측면입니다: 이 연구와 함께 소개된 5점 solver는 캘리브레이션된 2뷰 기하학의 표준 도구가 되었으며(OpenCV의 `findEssentialMat`이 여기서 유래했습니다), "visual odometry"는 하나의 전체 하위 분야를 가리키는 통용 명칭이 되었습니다.

## SLAM에서의 의미

이 논문은 visual odometry를 독립된 문제로 정의했고, 카메라가 주요 내비게이션 센서로 사용될 수 있음을 증명하여, 이후 등장한 모든 단안 SLAM 시스템의 토대를 마련했습니다. 특징점, 최소 solver + RANSAC, 삼각측량, 포즈 합성으로 이루어진 이 파이프라인은 여전히 대부분의 기하학적 프론트엔드의 골격입니다(PTAM조차 지도 초기화에 동일한 5점 알고리즘을 사용합니다). 이 논문이 결여한 것(루프 클로저, 전역 일관성)을 이해하는 것이 SLAM이 VO 위에 무엇을 더하는지를 이해하는 가장 명확한 방법입니다.

## 실습

- [MonoVO 실습](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch02_05)

## 관련 문서

- [VO vs SLAM](vo-vs-slam.md) — 이 논문이 동기를 부여하는 개념적 구분
- [MonoSLAM](monoslam.md) — 이 논문 직후 발표된 최초의 실시간 단안 SLAM
- [Epipolar geometry](../level-01-beginner/epipolar-geometry.md) — essential matrix의 배경 이론
- [Triangulation](../level-01-beginner/triangulation.md) — 두 뷰로부터 3D 점을 복원하기
- [2D-2D correspondence](../level-02-getting-familiar/2d-2d-correspondence.md) — VO의 근간이 되는 매칭 문제
- [Corner detector](../level-01-beginner/corner-detector.md) — 원본 파이프라인이 추적한 Harris 특징점
