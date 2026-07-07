# EFM3D

> Straub (Meta) 2024 · [논문](https://arxiv.org/abs/2406.10224)

**한 줄 요약** — 3D Egocentric Foundation Model을 향한 진전을 측정하기 위한 Meta Reality Labs의 벤치마크 — 주석이 달린 Project Aria egocentric 비디오에 대한 3D 객체 검출 및 표면 회귀 — 와 함께, 고정된 2D foundation 특징을 gravity-aligned 3D voxel grid로 끌어올리는 기준선 모델 EVL을 제안합니다.

## 문제

웨어러블 컴퓨터는 AI에게 새로운 종류의 컨텍스트 소스를 만들어줍니다: 세밀한 3D 위치 정보 (포즈, 캘리브레이션, semi-dense SLAM 포인트)를 갖춘 egocentric 센서 데이터입니다. 이는 3D 공간에 뿌리를 둔 *공간적* foundation model이라는 클래스 — 저자들이 Egocentric Foundation Model (EFM)이라고 부르는 것 — 의 기회를 열어주지만, 고품질의 3D 주석이 달린 egocentric 데이터로 구축된 벤치마크 없이는 진전을 측정할 수 없습니다. 기존 3D 데이터셋은 RGB-D 스캐닝 시퀀스 (ScanNet, ARKitScenes)이거나, 모든 표면을 "커버"하는 것을 목표로 하는 모션의 시뮬레이션입니다. 반면 Aria 데이터는 RGB 하나와 그레이스케일 두 개의 스트림, 오직 sparse semi-dense 깊이, 그리고 실제 head-motion 패턴을 가지고 있습니다 — 이러한 차이는 RGB-D 스캐닝 체제를 위해 설계된 모델을 망가뜨립니다.

## 방법 및 아키텍처

**데이터셋 기여.** (i) 시뮬레이션된 Aria Synthetic Environments (ASE) 데이터셋에 대한 43개 클래스에 걸친 약 300만 개의 3D oriented bounding box (OBB)와 이미지별 가시성 메타데이터; (ii) 실제 egocentric 모션을 위해 비전문가가 촬영한, 26개 장면에 9개 클래스에 걸친 584개 OBB 인스턴스를 가진 실세계 검증 세트 Aria Everyday Objects (AEO); (iii) ASE 검증 분할과 실제 Aria Digital Twin (ADT) 데이터셋에 대한 ground-truth 메시.

**EVL (Egocentric Voxel Lifting)** 은 범용 3D backbone입니다: 고정된 2D foundation model (DINOv2.5)이 각 비디오 스트림의 포즈가 알려진 $T$개 프레임에 대해 실행되고, 특징이 업샘플링된 다음, 지역적인 gravity-aligned $4m^3$ voxel grid의 중심들 (가장 최근의 gravity-aligned RGB 포즈에 고정됨)이 캘리브레이션된 fisheye 모델로 모든 이미지에 투영되어 bilinear 샘플링되며, 이는 스트림당 $T\times F\times D\times H\times W$ 볼륨을 산출합니다. 특징은 스트림과 시간에 대해 평균과 표준편차로 집계됩니다 ($2F\times D\times H\times W$). Semi-dense SLAM 포인트는 두 개의 binary 마스크 — 표면 포인트 마스크와 관측 ray를 따라 샘플링된 freespace 마스크 — 를 제공하며, 이는 볼륨에 연결된 후 3D U-Net (8배 다운샘플링/업샘플링)으로 처리됩니다. 작업 헤드는 출력 볼륨에서 실행됩니다:

- **3D OBB 헤드** (proposal 및 anchor가 없는, ImVoxelNet에서 영감을 받은): voxel마다 centerness 점수 $v^{c}$, 클래스 분포 $v^{cls}$, 그리고 7개의 box 파라미터 $v^{obb}$ (크기, 중심 오프셋, gravity 축에 대한 yaw)를 산출하며, 3D-IoU NMS로 필터링됩니다. $N_v$개의 voxel과 focal loss FL을 사용하면:

$$L_{obj}=\frac{1}{N_{v}}\sum^{N_{v}}_{n} w_{c}\,\mathrm{FL}(v_{n}^{c},\widehat{v_{n}^{c}})+w_{iou}\,\mathrm{IoU}(v_{n}^{obb},\widehat{v_{n}^{obb}})+w_{cls}\,\mathrm{FL}(v_{n}^{cls},\widehat{v_{n}^{cls}})$$

- **표면 회귀를 위한 Occupancy 헤드**: GT 깊이 값마다 free 포인트 하나, surface 포인트 하나, occupied 포인트 하나를 샘플링하여 (목표 확률 0.0 / 0.5 / 1.0) 지도하며, 여기에 total-variation 평활도 항이 추가됩니다:

$$L_{surf}=\frac{1}{N}\sum^{N}_{n}\mathrm{FL}(p_{\text{free}}^{n},0.0)+\mathrm{FL}(p_{\text{surf}}^{n},0.5)+\mathrm{FL}(p_{\text{occ}}^{n},1.0)$$

학습은 1초 10Hz 스니펫, 검출을 위한 6.25cm voxel ($64^3$)과 표면을 위한 4cm ($96^3$), $w_{cent}=100$, $w_{iou}=10$, $w_{class}=1$인 Adam ($2e^{-4}$)을 사용합니다. 시퀀스 수준 평가는 OBB 추적/융합과 marching cubes를 이용한 running-average occupancy 융합을 통해 예측을 유지합니다.

## 실험 결과

- **3D OBB 검출** (IoU 임계값 0.0–0.5에 대한 평균 mAP): EVL은 **ASE에서 스니펫 0.40 / 시퀀스 0.75 mAP, 실제 AEO에서 0.22**를 달성하며, ImVoxelNet 0.30/0.64/0.15, 3DETR 0.24/0.33/0.16, Cube R-CNN (ASE 학습) 0.21/0.36/0.08과 대조됩니다. 시퀀스 수준 추적은 모든 방법에서 스니펫 mAP를 대략 두 배로 늘립니다.
- **Sim-to-real 격차**: 이미지 기반 모델은 AEO에서 가장 크게 하락하지만 (Cube R-CNN -32, ImVoxelNet -49, EVL -48 mAP), 포인트만 사용하는 3DETR은 -17 mAP만 하락합니다 — 그러나 EVL은 합성 및 실제 데이터 모두에서 여전히 최고 성능입니다.
- **표면 복원** (ASE val): EVL은 Acc 0.057m / Comp 0.877m / Prec 0.822 / Recall 0.405 (5cm 임계값)를 달성하며, ASE에서 재학습된 NeuralRecon의 0.212 / 1.103 / 0.512 / 0.241과 대조됩니다; 실제 ADT에서는 EVL이 0.182m Acc와 0.594 Prec로 선두를 유지합니다. 깊이 기반 기준선 (ZoeDepth, SimpleRecon, ConsistentDepth)은 스케일 모호성과 노이즈가 있는 벽 때문에 융합이 잘 되지 않습니다.
- Ablation: 기하학적 증강, 평균+표준편차 집계, 그리고 포인트/freespace 마스크 모두 각각 측정 가능한 mAP 향상을 보입니다 (결합 시 스니펫 mAP 0.26에서 0.39로).

## SLAM에서의 의미

AR 안경은 SLAM의 주요 상업적 동력 중 하나이며, EFM3D는 이러한 환경에서 "우수한 3D 인지"가 무엇을 의미하는지를 정의합니다: 인간의 머리에 의해 결정되는 모션을 가진 웨어러블 rig로부터의 metric하게 정확하고 3D 일관성을 갖춘 이해입니다. 이는 이 분야가 나아가는 방향을 시사합니다 — SLAM이 제공하는 포즈, 캘리브레이션, semi-dense 포인트가 3D lifting을 가능하게 하는 뼈대가 됩니다 (EVL의 마스크는 문자 그대로 SLAM 출력입니다), 그리고 대규모 egocentric perception 모델은 다시 semantic 사전 정보를 공간적 추적 시스템으로 되돌려줍니다.

## 관련 문서

- [Foundation models](foundation-models.md) — 이 벤치마크가 목표로 하는 모델링 패러다임
- [Depth Anything](depth-anything.md) — 여기서 평가되는 종류의 대표적인 대규모 깊이 모델
- [DETR](detr.md) — 현대적 3D 검출기 이면의 검출 아키텍처 계열
- [Spatial AI](../level-11-world-models-spatial-ai/spatial-ai.md) — egocentric 기계 인지에 대한 더 넓은 비전
