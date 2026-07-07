# PyCuVSLAM

> NVIDIA 2025 · [논문](https://github.com/NVlabs/pycuvslam)

**한 줄 요약** — NVIDIA cuVSLAM의 Python API: 1대에서 32대까지 임의의 카메라 리그를 지원하는 CUDA 가속 시각(-관성) 오도메트리 및 SLAM 라이브러리로, Jetson급 엣지 디바이스에서 실시간 성능을 낸다 (기술 보고서: arXiv 2506.04359, "cuVSLAM: CUDA accelerated visual odometry and mapping").

## 문제

고성능 SLAM 구현체는 거의 예외 없이 자체 빌드 시스템과 미들웨어에 강하게 결합된 C++ 코드베이스이며, 이는 Python 환경에서 활동하는 로보틱스 개발자와 ML 연구자에게 높은 진입 장벽이 된다. 패키징 문제를 넘어, 보고서는 기존 시스템의 세 가지 기술적 공백을 지적한다: "자원이 제한된 플랫폼에서 실시간 성능을 내는 데 어려움을 겪고, 센서 구성의 유연성이 제한적이며, 가용한 하드웨어 가속을 충분히 활용하지 못한다." cuVSLAM은 Isaac ROS와 Python(PyCuVSLAM) API 양쪽 뒤에 GPU 네이티브 파이프라인을 두어 이에 답한다.

## 방법 및 아키텍처

cuVSLAM은 **프론트엔드**(최근 $N$개 키프레임 포즈와 가시적인 3D 랜드마크로 구성된 지역 오도메트리 지도를 대상으로 하는 저지연 지역 포즈 추정)와 비동기 **백엔드**(전역 일관성을 위한 루프 클로징과 포즈 그래프 최적화)로 나뉜다.

- **2D 모듈**: 이미지를 $N \times M$ 격자로 분할하고, 각 패치는 $k > \lfloor K_I / (N \cdot M) \rfloor$를 만족하는 상위 $k$개의 Shi–Tomasi ("Good Features to Track") 키포인트를 제공하여, 균일한 커버리지로 전체 최소 $K_I$개를 확보한다. 추적은 각 최적화 단계에서 정규화된 상호상관 검사를 결합한 변형된 피라미드형 Lucas–Kanade를 사용한다. 생존한 트랙 수가 임계값 아래로 떨어지면 키프레임이 생성된다.
- **3D 모듈**: 각 키프레임마다 다중 뷰 관측으로부터 랜드마크를 삼각측량하고, 비동기 CUDA 희소 번들 조정(포즈를 먼저, 포인트를 그다음 푸는 슈어 보수 방식)으로 정제한다.

$$\hat{T}^{bw}_{1:N},\hat{p}^{w}_{1:M} = \arg\min_{T^{bw}_{1:N},\,p^{w}_{1:M}} \sum_{i=1}^{N}\sum_{j=1}^{M}\sum_{k=1}^{C} \left\| \pi\!\left(T^{cb}_{k} T^{bw}_{i} p^{w}_{j}\right) - o_{j,k} \right\|^{2}_{\Sigma}$$

  여기서 $T^{cb}_k$는 $k$번째 카메라-대-베이스 변환, $T^{bw}_i$는 베이스-대-월드 포즈, $p^w_j$는 랜드마크, $o_{j,k}$는 그 관측이다. 프레임별 포즈는 추적된 랜드마크에 대한 PnP로부터 얻는다.
- **모드**: *스테레오*(기본값), *멀티-스테레오* — 임의의 리그를 외부 파라미터로부터 자동으로 구축된 프러스텀 교집합 그래프(시야각 겹침을 검사)를 통해 스테레오 쌍들로 분해한다; *시각-관성* — IMU 프리인티그레이션(pre-integration) 인자, 중력 추정, VI 희소 BA를 갖춘 15자유도 상태 $S=[T \in SE(3),\, v,\, b^a,\, b^w]$; *Mono*(기초 행렬 부트스트랩, 스케일 불확정); *Mono-Depth* — 재투영, 강도, 깊이, 점-대-점 인자를 결합해 GPU Levenberg–Marquardt로 푸는 밀집 프레임 간 정렬.
- **백엔드**: 키프레임 특징은 각 피라미드 레벨에서 얻은 $9\times 9$ 패치이다. 루프 후보는 과거 포즈에 대한 kd-tree 반경 검색으로부터 얻고, 현재 이미지로 랜드마크 패치를 추적하여 검증한 뒤, 상대 포즈 $\hat{T}^{bm}$를 추정하고 $T_{1:N} = \arg\min_{T_{1:N}} \sum_{i,j \in E} \| \mathrm{Log}(D_{ij}^{-1} T_i^{-1} T_j) \|^2$로 포즈 그래프를 정제한다. 여기서 $D_{ij}$는 측정된 포즈 델타이다.

## 실험 결과

- **속도**: RTX 4090 데스크톱에서 프레임당 트랙 호출 시간은 0.4 ms(스테레오) / 0.9 ms(모노), Jetson AGX Orin(768×480 입력)에서는 1.8 ms / 2.7 ms이다. Isaac ROS를 통한 실시간 스테레오는 640×480, 60 FPS에서 Jetson AGX Orin의 CPU 약 5.5%, GPU 약 1.7%만 사용한다.
- **정확도**(avgRTE / RMSE APE, 스케일 보정): KITTI 스테레오 SLAM 0.27% / 1.98 m (대비 ORB-SLAM3 0.31% / 2.98 m, 단안 DPVO 21.69% / 195 m); EuRoC 스테레오 SLAM 0.17% / 0.054 m (대비 ORB-SLAM3 0.21% / 0.068 m); TUM-VI Room 스테레오-관성 0.12% / 0.12 m. 논문은 이를 KITTI에서 평균 궤적 오차 1% 미만, EuRoC에서 위치 오차 5 cm 미만으로 요약한다.
- **멀티-스테레오**: 실제 4대 스테레오 카메라 R2B 데이터셋에서 SLAM은 0.11% avgRTE / 0.18 m APE를 달성하며, 더 빈번한 루프 클로저 덕분에 순수 오도메트리 대비 약 40% 개선된다. 카메라를 20–60초 동안 무작위로 가리는 가림 스트레스 테스트에서도 스테레오 쌍 하나만 가려지지 않으면 궤적은 매끄럽게 유지되었다.

## SLAM에서의 의미

PyCuVSLAM은 두 가지 업계 흐름을 동시에 대표한다: 제품급 구성 요소로서의 하드웨어 가속 SLAM, 그리고 로보틱스 및 ML 개발자가 C++를 작성하지 않고도 SLAM을 통합할 수 있게 하는 Python 우선 API이다. 그 다중 카메라 공식화(프러스텀 그래프 + 리그 수준 PnP/BA)는 배포를 점점 더 지배하는 다중 센서 로봇을 위한 깔끔한 템플릿이기도 하며, ORB-SLAM3 같은 단일 카메라 연구 시스템과는 대조적이다.

## 실습

- [cuVSLAM 실행하기](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/cuvslam)

## 관련 문서

- [ORB-SLAM3](orb-slam3.md)
- [DPVO](dpvo.md)
- [C++/Python interop](../level-02-getting-familiar/cpp-python-interop.md)
- [Edge deployment](../level-02-getting-familiar/edge-deployment.md)
- [OpenVINS](../level-06-vio-vins/openvins.md)
