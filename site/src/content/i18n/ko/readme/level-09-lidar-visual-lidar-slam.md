### 핵심 개념
- **[LiDAR-Visual-Inertial (LVI)](level-09-lidar-visual-lidar-slam/lidar-visual-inertial-lvi.md)** — 강건한 실외 SLAM을 위한 삼중 융합
- **[긴밀 결합 LiDAR-카메라](level-09-lidar-visual-lidar-slam/tightly-coupled-lidar-camera.md)** — 포인트 클라우드와 시각 특징의 공동 최적화
- **[직접 LiDAR-카메라 정렬](level-09-lidar-visual-lidar-slam/direct-lidar-camera-alignment.md)** — 특징 추출 없는 광도/기하학적 정렬
- **[성능 저하 처리](level-09-lidar-visual-lidar-slam/degradation-handling.md)** — 한 모달리티가 실패했을 때의 우아한 폴백(예: 비 오는 날의 LiDAR, 어두운 곳의 카메라)
- **[레인지 이미지](level-09-lidar-visual-lidar-slam/range-image.md)** — 효율적인 처리를 위한 LiDAR 스캔의 2D 투영 (SuMa, RangeNet++)

### LiDAR / LiDAR-관성 SLAM

| 시스템 | 저자/연도 | 핵심 개념 |
|--------|-------------|--------------|
| [**LOAM**](level-09-lidar-visual-lidar-slam/loam.md) | [Zhang 2014](https://www.ri.cmu.edu/pub_files/2014/7/Ji_LidarMapping_RSS2014_v8.pdf) | LiDAR 오도메트리 및 매핑(토대 논문), 에지 + 평면 특징 |
| [**SuMa**](level-09-lidar-visual-lidar-slam/suma.md) | [Behley (Bonn) 2018](http://www.roboticsproceedings.org/rss14/p16.pdf) | 서펠 기반 LiDAR SLAM, 레인지 이미지에 대한 투영 ICP |
| [**SuMa++**](level-09-lidar-visual-lidar-slam/sumapp.md) | [Chen (Bonn) 2019](https://www.ipb.uni-bonn.de/pdfs/chen2019iros.pdf) | SuMa + RangeNet++ 시맨틱, 시맨틱 ICP 가중치, 동적 객체 필터링 |
| [**LIO-SAM**](level-09-lidar-visual-lidar-slam/lio-sam.md) | [Shan 2020](https://arxiv.org/abs/2007.00258) | 긴밀 결합 LiDAR-관성, 팩터 그래프, GPS 융합 |
| [**FAST-LIO2**](level-09-lidar-visual-lidar-slam/fast-lio2.md) | [Xu 2022](https://arxiv.org/abs/2107.06829) | 직접 LiDAR-관성, ikd-Tree, 매우 빠름 |
| [**PIN-SLAM**](level-09-lidar-visual-lidar-slam/pin-slam.md) | [Pan (Bonn) 2024](https://arxiv.org/abs/2401.09101) | 신경망 포인트 클라우드 LiDAR SLAM, point-to-SDF 정합, 루프 클로저를 위한 탄성 맵 변형 |

### Visual-LiDAR 융합 SLAM

| 시스템 | 저자/연도 | 핵심 개념 |
|--------|-------------|--------------|
| [**LVI-SAM**](level-09-lidar-visual-lidar-slam/lvi-sam.md) | [Shan 2021](https://arxiv.org/abs/2104.10831) | 팩터 그래프를 통한 LiDAR-Visual-Inertial, LIO-SAM + VINS-Mono |
| [**R3LIVE**](level-09-lidar-visual-lidar-slam/r3live.md) | [Lin 2022](https://arxiv.org/abs/2109.07982) | 실시간 LiDAR-Visual-Inertial, 밀도 RGB 포인트 클라우드 맵 |
| [**R3LIVE++**](level-09-lidar-visual-lidar-slam/r3livepp.md) | [Lin 2023](https://arxiv.org/abs/2209.03666) | 메시 재구성을 추가한 개선된 R3LIVE |
| [**FAST-LIVO**](level-09-lidar-visual-lidar-slam/fast-livo.md) | [Zheng 2022](https://arxiv.org/abs/2203.00893) | FAST-LIO + 직접 시각 오도메트리, 긴밀 결합 LVI |
| [**FAST-LIVO2**](level-09-lidar-visual-lidar-slam/fast-livo2.md) | [Zheng 2024](https://arxiv.org/abs/2408.14035) | 개선된 버전, 순차적 이미지 처리, 직접 광도 융합 |
| [**OKVIS2-X**](level-06-vio-vins/okvis2-x.md) | [Boche 2025](https://arxiv.org/abs/2510.04612) | 시각+관성+깊이+LiDAR+GNSS 구성 가능 (레벨 6에도 등장) |

### 자료

| 자료 | 저자/연도 | 핵심 개념 |
|----------|-------------|--------------|
| [Multi-Sensor Fusion SLAM Survey](level-09-lidar-visual-lidar-slam/multi-sensor-fusion-slam-survey.md) | [Zhu 2024](https://www.sciopen.com/article/10.26599/TST.2023.9010010) | 카메라 + LiDAR + IMU 융합 SLAM — 포괄적인 서베이 |
