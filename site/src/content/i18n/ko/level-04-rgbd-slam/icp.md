# ICP

> Besl & McKay 1992 · [논문](https://ieeexplore.ieee.org/document/121791)

**한 줄 요약** — 점 쌍 거리를 반복적으로 최소화하여 3D 포인트 집합을 강체 정합하는 기초적 방법인 Iterative Closest Point (ICP) 알고리즘을 도입.

## 문제

서로 다른 시점이나 센서에서 획득한 3D 형상을 정합하는 것은 객체 인식, 검사, 재건에 필수적입니다. 기존 방법들은 수동으로 지정된 대응점이나 형상 위상에 대한 제한적인 가정을 필요로 했습니다. 어떤 점이 어떤 점에 대응하는지 알지 못한 채 원시 점 데이터에서 동작하는, 자유 형상 3D 데이터를 정렬하는 일반적이고 자동화된 방법이 필요했습니다.

## 방법 및 아키텍처

ICP는 각각이 정합 오차를 줄일 수만 있는 두 단계를 반복합니다:

1. **최근접 점 대응.** 소스 집합 $\mathcal{P}$의 각 점 $\mathbf{p}_i$에 대해, 현재 변환 추정치 하에서 타겟 집합 $\mathcal{Q}$에서 가장 가까운 점 $\mathbf{q}_i$를 찾습니다. 알 수 없는 데이터 연관은 최근접 이웃으로 *근사*되며, 정합이 개선될수록 그 근사도 함께 개선됩니다 — 수동 대응점 지정이나 특징 매칭이 필요 없습니다.
2. **최적 강체 변환.** 대응점이 주어지면, 다음의 평균 제곱 목적 함수를 최소화하는 회전 $\mathbf{R}$과 이동 $\mathbf{t}$를 계산합니다.

$$E(\mathbf{R}, \mathbf{t}) = \frac{1}{N}\sum_{i=1}^{N} \|\mathbf{q}_i - (\mathbf{R}\,\mathbf{p}_i + \mathbf{t})\|^2$$

   이는 중심화된 점 집합의 교차 공분산 행렬에 대한 SVD를 통해, 또는 원 논문에서 사용된 단위 쿼터니언 방법과 동등하게, 닫힌 형태로 계산됩니다.
3. **수렴까지 반복.** 변환을 적용하고, 최근접 점 대응을 다시 계산하며, 평균 제곱 오차의 변화가 임계값 이하로 떨어질 때까지 반복합니다.

두 단계 모두 오차를 감소시키므로, 이 반복은 평균 제곱 거리의 *지역* 최솟값으로 단조롭게 수렴합니다.

$$E(\mathbf{R}_{k+1}, \mathbf{t}_{k+1}) \leq E(\mathbf{R}_k, \mathbf{t}_k) \quad \forall k$$

ICP가 실제로 어떻게 사용되는지를 결정하는 핵심 특성과 개선안들:

- **지역 수렴만 보장**: ICP는 상당히 좋은 초기화가 필요합니다. 큰 오정렬은 잘못된 지역 최솟값으로 이어집니다. SLAM에서는 이 초기화가 이전 프레임의 포즈, 등속도 모션 모델, 또는 거칠기-에서-세밀도 피라미드로부터 주어집니다.
- **점-대-평면 변형**(Chen & Medioni 1992): 점-대-점 잔차를 $\mathbf{n}_i^\top(\mathbf{T}\mathbf{v}_i - \mathbf{u}_i)$로 대체하면(여기서 $\mathbf{n}_i$는 타겟 표면의 법선), 평평한 영역이 서로를 따라 미끄러질 수 있게 되어 구조화된 장면에서 훨씬 빠르게 수렴합니다 — KinectFusion이 프레임-대-모델 추적에 사용하는 변형이 바로 이것입니다.
- **엔지니어링 도구 모음**(Rusinkiewicz & Levoy 2001의 조사): 최근접 이웃 탐색을 위한 k-d 트리, 서브샘플링, 거리/법선 호환성에 의한 나쁜 대응 제거, 강건한 가중치 부여. 이후의 변형으로는 Generalized ICP, trimmed ICP(부분 중첩), symmetric ICP, colored ICP가 있습니다.

## 실험 결과

TPAMI 1992 원 논문은 기하학적 프리미티브(구, 원기둥)와 복잡한 자유 형상 표면의 정합을 시연했으며, 수렴은 대개 10~50회 반복 내에 이루어졌고, 오늘날까지도 ICP의 실패 모드로 남아 있는 초기화 민감성 또한 함께 기록했습니다(전문은 유료화되어 있음. 결과는 이 로드맵과 짝을 이루는 책 챕터에 정리된 요약이며, 전체 평가는 원문 참조). ICP는 3D 포인트 클라우드 정합의 표준 알고리즘이 되었습니다: 거의 모든 RGB-D 밀도 SLAM 시스템이 추적에 ICP 변형을 사용하며, LiDAR SLAM의 스캔 매칭에도 기초가 되었고, 의료 영상과 산업 검사 분야로도 확산되었습니다.

## SLAM에서의 의미

ICP는 3D-3D 정합의 기초입니다: 거의 모든 RGB-D 밀도 SLAM 시스템(KinectFusion, ElasticFusion, InfiniTAM)이 입력 깊이 프레임과 맵 사이에 어떤 형태의 ICP 변형을 실행하여 카메라를 추적합니다. 스캔 매칭이 본질적으로 엔지니어링 개선을 더한 ICP인 LiDAR SLAM에서도 마찬가지로 핵심적입니다. ICP의 비용 함수, 닫힌 형태 해, 실패 모드를 이해하는 것은 레벨 4 전체에서 다루는 프레임-대-모델 추적을 이해하기 위한 전제 조건입니다.

## 실습

- [ICP 실습](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch03_06)
- [고급 ICP 실습](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch03_07)

## 관련 문서

- [3D-3D correspondence](../level-02-getting-familiar/3d-3d-correspondence.md)
- [KinectFusion](kinectfusion.md)
- [Frame-to-model tracking](frame-to-model-tracking.md)
- [LOAM](../level-09-lidar-visual-lidar-slam/loam.md)
