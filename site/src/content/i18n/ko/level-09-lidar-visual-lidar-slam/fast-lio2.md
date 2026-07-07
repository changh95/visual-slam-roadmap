# FAST-LIO2

> Xu 2022 · [논문](https://arxiv.org/abs/2107.06829)

**한 줄 요약** — FAST-LIO2는 맵으로서 증분 k-d 트리(ikd-Tree)를 사용하는 긴밀 결합 반복 칼만 필터 내부에서 원시 LiDAR 포인트를 맵에 직접 정합하는 것이, 특징 기반 LiDAR-관성 오도메트리보다 더 빠르면서도 *더* 정확함을 보여주었다.

## 문제

특징 기반 LiDAR 파이프라인은 모서리/평면 추출 과정에서 각 스캔의 대부분을 버려, 미세한 환경 구조를 낭비하고 뚜렷한 특징이 부족한 곳에서 실패한다—신흥 솔리드 스테이트 LiDAR의 좁은 시야각으로 이 문제는 더욱 악화된다. 특징 추출기 또한 스캐닝 패턴(회전형, 프리즘, MEMS)에 따라 달라지므로, 새로운 센서마다 수공 엔지니어링이 필요하다. 대신 *모든* 원시 포인트를 정합하려면 효율적인 kNN 쿼리를 지원하는 대규모 밀집 맵과 실시간 증분 업데이트가 모두 필요한데, 이것이 바로 FAST-LIO2가 제거하고자 한 실제 병목이다.

## 방법 및 아키텍처

원시 포인트는 스캔(10–100ms)으로 누적되고, 반복 칼만 필터를 통해 대규모 로컬 맵에 정합되며, 즉시 맵에 병합된다—오도메트리와 매핑이 동일한 속도로 실행된다.

- **매니폴드 상의 상태**: $\mathcal{M} \triangleq SO(3) \times \mathbb{R}^{15} \times SO(3) \times \mathbb{R}^3$ (차원 24)이며 $\mathbf{x} = [{}^{G}\mathbf{R}_I,\ {}^{G}\mathbf{p}_I,\ {}^{G}\mathbf{v}_I,\ \mathbf{b}_{\omega},\ \mathbf{b}_{a},\ {}^{G}\mathbf{g},\ {}^{I}\mathbf{R}_L,\ {}^{I}\mathbf{p}_L]$이다—포즈, 속도, IMU 바이어스, 중력, 그리고 *온라인으로 캘리브레이션된* LiDAR-IMU 외부 파라미터. IMU 샘플당 이산 전파: $\mathbf{x}_{i+1} = \mathbf{x}_i \boxplus \left(\Delta t\, \mathbf{f}(\mathbf{x}_i, \mathbf{u}_i, \mathbf{w}_i)\right)$.
- **역전파 디스큐잉**: IMU 측정값은 각 포인트의 개별 샘플링 시각에서의 LiDAR 포즈를 추정하며, 업데이트 전에 모든 포인트를 스캔 종료 시각으로 투영한다.
- **직접 포인트-투-평면 측정 모델**: 전역 프레임으로 투영된 각 측정 포인트는, 맵에서 가장 가까운 5개 이웃에 피팅된 작은 평면 위에 있어야 한다:

  $$\mathbf{0} = {}^{G}\mathbf{u}_j^{\top}\left({}^{G}\mathbf{T}_{I_k}\, {}^{I}\mathbf{T}_{L}\left({}^{L}\mathbf{p}_j + {}^{L}\mathbf{n}_j\right) - {}^{G}\mathbf{q}_j\right),$$

  여기서 ${}^{G}\mathbf{u}_j$는 평면 법선, ${}^{G}\mathbf{q}_j$는 그 평면 위의 한 점, ${}^{L}\mathbf{n}_j$는 측정 노이즈이다. 특징 추출이 없으므로—미세한 구조가 활용되며, 어떤 스캐닝 패턴에서도 작동한다.
- **매니폴드 상의 반복 업데이트**: 현재 반복점에서 선형화하면 잔차 $\mathbf{z}_j^{\kappa}$가 얻어지고, MAP 문제

  $$\min_{\widetilde{\mathbf{x}}_k^{\kappa}} \left( \lVert \mathbf{x}_k \boxminus \widehat{\mathbf{x}}_k \rVert_{\widehat{\mathbf{P}}_k}^2 + \sum_{j=1}^{m} \lVert \mathbf{z}_j^{\kappa} + \mathbf{H}_j^{\kappa}\widetilde{\mathbf{x}}_k^{\kappa} \rVert_{\mathbf{R}_j}^2 \right)$$

  은 이득 $\mathbf{K} = (\mathbf{H}^{\top}\mathbf{R}^{-1}\mathbf{H} + \mathbf{P}^{-1})^{-1}\mathbf{H}^{\top}\mathbf{R}^{-1}$을 가진 반복 칼만 필터로 풀리는데—측정 차원(수천 개 포인트)이 아닌 *상태* 차원(24)의 행렬을 역행렬화하는 것이 직접 정합을 다룰 만하게 만드는 트릭이다. $\lVert \widehat{\mathbf{x}}_k^{\kappa+1} \boxminus \widehat{\mathbf{x}}_k^{\kappa} \rVert < \epsilon$까지의 반복은 빠른 모션 하의 선형화 오차를 처리한다.
- **ikd-Tree 매핑**: 최적화된 스캔은 *트리 상에서 다운샘플링*하고, 지연 라벨을 통한 박스 단위 삭제와 병렬 스레드에서 실행되는 스케이프고트 방식의 부분 재균형을 지원하는 증분 k-d 트리에 삽입된다—전체 재구성이나 간헐적 지연이 없다. 맵은 길이 $L$짜리 정육면체(기본값 1000m)를 커버하며, LiDAR의 검출 구가 그 경계에 닿으면 슬라이드하고, 벗어나는 포인트를 박스 단위로 삭제한다.

## 실험 결과

- **정확도**: 다섯 개 오픈 데이터셋(lili, liosam, utbm, ulhk, nclt—솔리드 스테이트 및 회전형 LiDAR)의 19개 시퀀스에서, FAST-LIO2 또는 그 변형이 19개 중 18개에서 최고이다. RMSE 예시: liosam_1 4.58m vs LIO-SAM 4.75m, LILI-OM 18.78m, LINS 880.92m; 유일한 예외는 ulhk_4로 LILI-OM이 2.29m로 2.57m를 근소하게 이긴다. 직접 방법은 대부분의 시퀀스에서 동일 시스템의 특징 기반 변형을 능가한다.
- **속도**: DJI Manifold 2-C (i7-8550U)에서 스캔당 총 처리시간이 LILI-OM보다 약 ×8, LIO-SAM보다 ×10, LINS보다 ×6 빠르다; ARM Khadas VIM3에서 10Hz 실시간도 달성하는데—이전에 어떤 LIO 시스템도 보여주지 못한 결과이다.
- **ikd-Tree**: 18개 시퀀스에서 옥트리, R\*-트리, nanoflann k-d 트리와 비교 벤치마크한 결과, 증분 업데이트와 kNN 검색을 합친 전체 성능에서 최고를 달성한다.
- **강인성**: 쿼드로터 플립 실험에서 최고 각속도 1198°/s에 100Hz 오도메트리에서 스캔당 평균 처리시간 2.01ms를 달성한다; 빠른 핸드헬드 주행(최대 7 m/s)은 81m 루프를 종단 오차 < 0.06m로 닫는다.

## SLAM에서의 의미

FAST-LIO2는 이 분야의 기본값을 "특징을 추출한 다음 정합"에서 "모든 것을 빠르게 정합"으로 뒤집었다. 그 ikd-Tree는 널리 재사용되는 오픈소스 컴포넌트가 되었고, 매니폴드 상의 iEKF 공식화는 필터 기반 LiDAR-관성 오도메트리의 레퍼런스 설계이다. 이는 또한 HKU MARS 생태계의 토대이기도 하다—R3LIVE와 FAST-LIVO/FAST-LIVO2는 이 LIO 코어 위에 시각 융합을 구축한다—그리고 오늘날 순수 LiDAR-관성 오도메트리를 위한, 특히 저비용 솔리드 스테이트 센서에서의 실용적인 첫 선택지이다.

## 실습

- [FAST-LIO2 실행하기](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/fast_lio2)

## 관련 문서

- [LOAM](loam.md) — 이 시스템이 대체한 특징 기반 패러다임
- [LIO-SAM](lio-sam.md) — 루프 클로저와 GPS를 갖춘 팩터 그래프 대안
- [FAST-LIVO](fast-livo.md) — 동일한 맵 위에 직접 시각 융합을 추가
- [R3LIVE](r3live.md) — FAST-LIO를 기하학적 백본으로 사용
- [PIN-SLAM](pin-slam.md) — 직접 LiDAR 정합의 신경 맵 후속 연구
