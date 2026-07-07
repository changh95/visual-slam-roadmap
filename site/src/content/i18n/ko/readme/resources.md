### YouTube 강의 시리즈

| 강의 | 강사 | 링크 |
|---------|-----------|------|
| **SLAM & Photogrammetry** | Cyrill Stachniss (Uni Bonn) | [YouTube 재생목록](https://www.youtube.com/playlist?list=PLgnQpQtFTOGQh_J16IMwDlji18SWQ2PZ6) |
| **First Principles of Computer Vision** | Shree Nayar (Columbia) | [YouTube 채널](https://www.youtube.com/@firstprinciplesofcomputerv3258) |
| **Multiple View Geometry** | Daniel Cremers (TU Munich) | [YouTube 재생목록](https://www.youtube.com/playlist?list=PLTBdjV_4f-EJn6udZ34tht9EVIW7lbeo4) |

### 교재

| 교재 | 저자 | 핵심 주제 |
|------|--------|-----------|
| [**Introduction to Visual SLAM**](https://link.springer.com/book/10.1007/978-981-16-4939-4) | Xiang Gao et al. | VO, 최적화, 리 대수, 백엔드, 루프 클로저 — 입문자에게 최고의 SLAM 교재 |
| [**Photogrammetric Computer Vision**](https://link.springer.com/book/10.1007/978-3-319-11550-4) | Wolfgang Förstner & Bernhard Wrobel | 카메라 기하학, 추정, 3D 재구성 — 수학적으로 엄밀함 |
| [**Multiple View Geometry in Computer Vision**](https://www.cambridge.org/core/books/multiple-view-geometry-in-computer-vision/0B6F289C78B2B23F596CAA76D3D43F7A) | Richard Hartley & Andrew Zisserman | 에피폴라 기하학, 삼중초점 텐서(trifocal tensor), 재구성 — 바로 그 "바이블" |
| [**Computer Vision: Algorithms and Applications**](https://szeliski.org/Book/) | Richard Szeliski | 특징 검출, 스테레오, 모션, 3D — 포괄적인 레퍼런스 (2판 무료 PDF) |
| [**State Estimation for Robotics**](https://asrl.utias.utoronto.ca/~tdb/bib/barfoot_ser24.pdf) | Timothy Barfoot | 추정 이론, 리 군, 배치/순환 추정 — 무료 PDF (2판) |
| [**Probabilistic Robotics**](http://www.probabilistic-robotics.org/) | Thrun, Burgard & Fox | 베이즈 필터, EKF/파티클 필터 SLAM — 고전적인 확률론적 토대 |
| [**Factor Graphs for Robot Perception**](https://www.cs.cmu.edu/~kaess/pub/Dellaert17fnt.pdf) | Frank Dellaert & Michael Kaess | 팩터 그래프, 소거(elimination), iSAM2 — 백엔드의 바이블 (무료 PDF) |
| [**SLAM Handbook**](https://github.com/SLAM-Handbook-contributors/slam-handbook-public-release) | Carlone, Kim, Barfoot, Cremers, Dellaert (eds.) | 위치추정과 매핑에서 공간 지능까지 — 무료 커뮤니티 도서 (2024-25) |

### 서베이

| 서베이 | 저자/연도 | 핵심 개념 |
|--------|-------------|--------------|
| **Past, Present, and Future of SLAM** | [Cadena 2016](https://arxiv.org/abs/1606.05830) | 정통 방향 제시 서베이 — 강건한 인식(robust perception) 시대, 미해결 문제 |
| **Event-based Vision Survey** | [Gallego 2020](https://arxiv.org/abs/1904.08405) | 이벤트 카메라와 알고리즘 (→ 레벨 10에도 등장) |

### 코드와 실습

| 자료 | 링크 |
|----------|------|
| **SLAM Zero-to-Hero 코드 실습** | [GitHub](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero) — Docker 기반의 실습형 예제로, 이 로드맵의 주제들(특징 검출, 에피폴라 기하학, RANSAC, ICP, g2o/GTSAM/Ceres)과 시스템들(ORB-SLAM2, Basalt, Kimera, FAST-LIO2, MASt3R-SLAM 등)을 다룸; 각 실습은 해당하는 학습 노트에서 링크됨 |
| **changh95/slam_lecture_codes** | [GitHub](https://github.com/changh95/slam_lecture_codes) — 전체 SLAM 강의 코드 모음 |
