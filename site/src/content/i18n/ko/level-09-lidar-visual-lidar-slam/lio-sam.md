# LIO-SAM

> Shan 2020 · [논문](https://arxiv.org/abs/2007.00258)

**한 줄 요약** — LIO-SAM은 LiDAR-관성 오도메트리를 팩터 그래프 스무딩으로 재구성하여, IMU 사전통합, 스캔 매칭, GPS, 루프 클로저가 모두 하나의 MAP 추정 문제로 들어가게 하는 동시에, 키프레임만 로컬 슬라이딩 윈도우 맵과 매칭함으로써 실시간성을 유지했다.

## 문제

LOAM은 데이터를 전역 복셀 맵에 저장하는데, 이는 루프 클로저 감지나 GPS 같은 절대 측정값의 통합을 어렵게 만든다; 그 IMU는 스캔을 디스큐잉하고 모션 사전 정보를 제공하는 데만 사용되며(느슨한 결합), 복셀 맵이 밀집해질수록 최적화가 저하된다. LIOM 같은 긴밀 결합 대안은 모든 측정값을 공동으로 처리하지만 실시간의 약 0.6배로만 실행된다. LIO-SAM은 두 문제를 동시에 해결한다: 팩터 그래프는 이종의 상대적/절대적 측정값을 팩터로 받아들이고, *전역*이 아닌 *로컬* 스케일에서의 스캔 매칭이 계산량을 한정한다.

## 방법 및 아키텍처

로봇 상태는 $\mathbf{x} = [\,\mathbf{R}^{\top}, \mathbf{p}^{\top}, \mathbf{v}^{\top}, \mathbf{b}^{\top}\,]^{\top}$(자세, 위치, 속도, IMU 바이어스)이다. 포즈 변화가 임계값을 초과하면 새로운 상태 노드가 추가되며, 그래프는 네 가지 팩터 유형 하에서 iSAM2로 증분적으로 최적화된다:

- **IMU 사전통합 팩터**: 시각 $i$와 $j$ 사이에서, 원시 IMU 레이트가 상대 모션 제약으로 적분된다

  $$\Delta\mathbf{v}_{ij} = \mathbf{R}_i^{\top}(\mathbf{v}_j - \mathbf{v}_i - \mathbf{g}\Delta t_{ij}), \quad \Delta\mathbf{p}_{ij} = \mathbf{R}_i^{\top}\left(\mathbf{p}_j - \mathbf{p}_i - \mathbf{v}_i\Delta t_{ij} - \tfrac{1}{2}\mathbf{g}\Delta t_{ij}^2\right), \quad \Delta\mathbf{R}_{ij} = \mathbf{R}_i^{\top}\mathbf{R}_j.$$

  사전통합은 이중의 역할을 한다: 포인트 클라우드를 디스큐잉하고 스캔 매칭을 초기화한다; 최적화된 LiDAR 오도메트리는 다시 그래프 내의 IMU 바이어스를 추정한다.
- **LiDAR 오도메트리 팩터**: (로컬 거칠기 기준으로) 스캔마다 LOAM 스타일의 모서리 및 평면 특징이 추출된다. 포즈 변화가 1m 또는 10°를 넘으면 키프레임이 선택되며; 그 사이의 프레임은 버려진다. 새 키프레임은 전역 맵이 아니라 가장 최근의 $n = 25$개 서브-키프레임에서 병합된 복셀 맵(모서리 맵은 0.2m, 평면 맵은 0.4m로 다운샘플링)에 정합된다. 포인트-투-선 및 포인트-투-평면 거리, 예를 들어 모서리 특징의 경우

  $$\mathbf{d}_{e_k} = \frac{\left|(\mathbf{p}^{e}_{i+1,k}-\mathbf{p}^{e}_{i,u}) \times (\mathbf{p}^{e}_{i+1,k}-\mathbf{p}^{e}_{i,v})\right|}{\left|\mathbf{p}^{e}_{i,u}-\mathbf{p}^{e}_{i,v}\right|},$$

  가 가우스-뉴턴에 의해 $\mathbf{T}_{i+1}$에 대해 최소화된다, $\min_{\mathbf{T}_{i+1}} \{ \sum_k \mathbf{d}_{e_k} + \sum_k \mathbf{d}_{p_k} \}$, 그리고 결과 상대 변환 $\Delta\mathbf{T}_{i,i+1} = \mathbf{T}_i^{\top}\mathbf{T}_{i+1}$이 연속된 상태를 잇는 팩터가 된다.
- **GPS 팩터**: 절대 위치가 로컬 데카르트 좌표로 변환되며—LiDAR-관성 드리프트가 서서히 증가하므로—추정된 위치 공분산이 GPS 공분산을 초과할 때만 추가되고, 타임스탬프 정렬에는 선형 보간이 사용된다.
- **루프 클로저 팩터**: 단순하지만 효과적인 유클리드 검색이 새로운 상태로부터 15m 이내의 과거 상태를 찾는다; 새 키프레임은 후보 주변의 $2m+1$개 서브-키프레임($m = 12$)에 대해 스캔 매칭된다. 저자들의 실험에서 GPS 고도 오차가 100m에 근접했기 때문에, 루프는 특히 고도 드리프트 수정에 유용한 것으로 입증되었다.

## 실험 결과

세 개의 플랫폼—핸드헬드 장치, Clearpath Jackal UGV, Duffy 21 전동 보트—에서 자체 수집한 다섯 개 데이터셋(Rotation, Walking, Campus, Park, Amsterdam)으로, VLP-16, MicroStrain 3DM-GX5-25 IMU, Reach M GPS를 사용하여 i7-10710U CPU(GPU 없음)에서 평가되었다:

- **종단 병진 오차 (m)**: Campus (1437m): LOAM 192.43, LIO-odom(GPS/루프 없음) 9.44, LIO-GPS 6.87, LIO-SAM **0.12**. Park (2898m): LOAM 121.74, LIOM 34.60, LIO-GPS 2.93, LIO-SAM **0.04**. Amsterdam (19,065m, 3시간 운하 크루즈): LIO-GPS(1.21)와 LIO-SAM(**0.17**)만이 의미 있는 결과를 낸다.
- **GPS 그라운드 트루스와의 RMSE (Park)**: LIO-SAM 0.96m vs LOAM 47.31m, LIOM 28.96m, LIO-odom 23.96m.
- **강인성**: Rotation 테스트(정지 상태에서 최대 133.7°/s)에서 LIO-SAM은 LIOM이 초기화에 실패하는 곳에서 $SO(3)$에 정밀하게 등록한다; Walking 데이터셋은 213.9°/s에 도달한다.
- **런타임**: 스캔당 매핑 시간 예: Walking: LIO-SAM 58.4ms vs LOAM 253.6ms, LIOM 339.8ms; 스트레스 테스트는 최대 13배 실시간 재생에서도 올바른 동작을 보인다. LIOM은 실시간의 약 0.6배로만 실행되었다.

## SLAM에서의 의미

LIO-SAM은 VINS-Mono와 OKVIS가 카메라를 위해 한 일을 LiDAR를 위해 했다: 그래프 최적화를 통한 긴밀 결합 관성 융합을 기본 아키텍처로 만들었다. 측정 소스를 팩터로서 깔끔하게 분리한 것은 확장을 용이하게 하며—LVI-SAM은 이 위에 전체 시각-관성 서브시스템을 추가한다—여전히 FAST-LIO2 같은 필터 기반 시스템이 비교되는 표준 팩터 그래프 기준선이다. 루프 클로저, GPS 융합, 그리고 즉시 사용 가능한 스무딩 백엔드가 필요할 때 사용하라.

## 관련 문서

- [LOAM](loam.md) — 특징 추출 및 스캔 매칭의 토대
- [LVI-SAM](lvi-sam.md) — LiDAR-시각-관성 융합으로의 직접 확장
- [FAST-LIO2](fast-lio2.md) — 경쟁하는 직접, 필터 기반 접근법
- [IMU preintegration](../level-06-vio-vins/imu-preintegration.md) — 핵심 관성 메커니즘
- [Factor graph](../level-02-getting-familiar/factor-graph.md) — 백엔드 형식론
