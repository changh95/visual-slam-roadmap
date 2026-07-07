# hloc

> Sarlin 2019 · [코드](https://github.com/cvg/Hierarchical-Localization)

**한 줄 요약** — HF-Net의 계층적 위치 인식 방식 — 조대 장소 검색(NetVLAD)에 이어 정밀 로컬 매칭(SuperPoint + SuperGlue)과 PnP를 수행 — 을 구현하는 오픈소스 툴박스로, 커뮤니티 표준 visual localization 파이프라인이 되었습니다.

## 문제

HF-Net("From Coarse to Fine: Robust Hierarchical Localization at Large Scale", CVPR 2019)의 조대-정밀(coarse-to-fine) 위치 인식 패러다임은 다단계 시스템입니다 — 글로벌 descriptor, 검색, 로컬 특징, 매칭, SfM 삼각측량, PnP — 그리고 이 체인을 처음부터 다시 구현하는 각 연구 그룹마다 결과의 재현과 비교가 어려워졌습니다. 대규모 위치 인식은 빨라야 하고(모든 데이터베이스 이미지와 매칭할 수 없음) 정확해야 합니다(검색만으로는 미터 수준의 대략적 위치만 제공). hloc은 전체 체인을 유지보수되는 소프트웨어로 패키징하여, 최신 위치 인식이 엔지니어링 프로젝트가 아니라 설정 선택이 되도록 만듭니다.

## 방법 및 아키텍처

이 툴박스는 계층적 위치 인식 파이프라인을 처음부터 끝까지 실행하는 스크립트들로 구성되어 있습니다(저장소 자체의 파이프라인 설명에 따름):

1. **로컬 특징 추출**: 모든 데이터베이스 및 쿼리 이미지에 대해 — `hloc/extractors/`를 통한 SuperPoint, DISK, D2-Net, SIFT, 또는 R2D2.
2. **참조 3D SfM 모델 구축**: covisible한 데이터베이스 쌍을 찾고(검색 또는 사전 SfM 모델을 통해), SuperGlue 또는 더 빠른 LightGlue(`hloc/matchers/`)로 매칭한 후, COLMAP으로 새 SfM 모델을 삼각측량합니다(v1.3부터는 순수 pycolmap이며 COLMAP 설치가 필요 없음). Lidar 스캔이 기하 정보를 제공하는 경우(예: InLoc), 이 단계는 생략됩니다.
3. **조대 검색**: 글로벌 descriptor — NetVLAD, AP-GeM/DIR, OpenIBL, 또는 MegaLoc — 가 각 쿼리와 관련된 상위 $k$개의 데이터베이스 이미지를 검색합니다(예: Aachen의 경우 NetVLAD 상위 50개).
4. **정밀 매칭**: 검색된 이미지와 쿼리 특징 간의 매칭(학습된 매처 또는 비율/거리/상호 검사를 사용하는 NN; dense LoFTR 매칭도 지원).
5. **위치 추정**: 결과로 얻은 2D-3D 대응점을 PnP + RANSAC 솔버에 입력하여 6-DoF 쿼리 포즈를 산출하며, 모든 추정기 파라미터를 노출하는 모듈형 API를 제공합니다.
6. **시각화 및 디버깅**: 각 실행은 쿼리별로 검색된 이미지, 매칭, RANSAC 인라이어와 같은 포즈 솔버 통계를 기록합니다.

특징과 매칭은 문서화된 레이아웃을 가진 HDF5 파일로 교환되므로, 어떤 PyTorch 추출기/매처든 `BaseModel`을 상속하여 손쉽게 추가할 수 있습니다 — 이는 정확히 DISK, LightGlue, LoFTR, SOSNet, CosPlace 등이 여러 버전에 걸쳐(v1.0 2020 → v1.4 2023) 흡수된 방식입니다. 준비된 `hloc/pipelines/`는 Aachen Day-Night, InLoc, Extended CMU Seasons, RobotCar Seasons, 4Seasons, Cambridge Landmarks, 7-Scenes를 다루며, 동일한 스택으로 정렬되지 않은 이미지에서 처음부터 SfM 복원을 실행할 수도 있습니다.

## 실험 결과

저장소에서 보고된 수치입니다(visuallocalization.net에서 평가), 벤치마크의 세 가지 정확도 임계값 내에서 위치 추정된 쿼리의 비율:

- **Aachen Day-Night**, NetVLAD 상위 50개 검색 + SuperPoint + SuperGlue: 낮 **89.6/95.4/98.8**, 밤 **86.7/93.9/100**. SuperGlue를 최근접 이웃 매칭으로 대체하면 야간 성능이 75.5/86.7/92.9로 떨어집니다 — 학습된 매처가 야간 강인성을 제공하는 핵심입니다.
- **InLoc**, SuperPoint + SuperGlue: DUC1 **46.5/65.7/78.3**, DUC2 **52.7/72.5/79.4**; 시간적 일관성을 적용하면 49.0/68.7/80.8 및 53.4/77.1/82.4.
- 이 SuperPoint + SuperGlue 조합은 오랫동안 Long-Term Visual Localization 벤치마크에서 지배적인 항목이었으며, hloc은 새로운 특징과 매처(DISK, LightGlue, LoFTR 등)가 자신의 가치를 입증하는 시험대로 남아 있습니다.

## SLAM에서의 의미

재위치 인식(relocalization), loop closure, 또는 맵 기반 위치 인식을 구축하는 사람이라면 hloc이 출발점이 되는 참조 구현입니다: 최신 학습 기반 구성 요소와 검증된 기본값으로 조대-정밀 패러다임을 운영화하며, 오프라인 COLMAP 매핑과 온라인 재위치 인식을 하나의 특징 스택으로 연결합니다. 많은 연구 시스템과 제품 프로토타입이 hloc을 직접 사용하거나, 자체 위치 인식 스택의 템플릿으로 사용합니다. 쿼리별 인라이어의 pickle 로그는 위치 인식 엔지니어링의 일상 업무인 실패 분석을 유난히 쉽게 만들어줍니다.

## 관련 문서

- [HF-Net](hf-net.md) — hloc이 구현하는 계층적 위치 인식 방식을 제안한 논문
- [NetVLAD](netvlad.md) — 조대 검색 descriptor
- [SuperPoint](superpoint.md) — 기본 로컬 특징
- [SuperGlue](superglue.md) — 정밀 단계의 학습된 매처
- [LightGlue](lightglue.md) — 이후 기본값이 된 더 빠른 매처
- [COLMAP](../level-03-monocular-slam/colmap.md) — hloc이 매핑하고 위치를 추정하는 대상이 되는 SfM 백본
- [DISK](disk.md) — 툴박스에 흡수된 학습된 특징
