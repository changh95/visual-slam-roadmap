# HF-Net

> Sarlin 2019 · [논문](https://arxiv.org/abs/1812.03506)

**한 줄 요약** — 조대-정밀(coarse-to-fine) 계층적 위치 인식: 글로벌 검색으로 후보 장소를 좁힌 후, 로컬 특징 매칭으로 정밀한 6-DoF 포즈를 산출하며 — HF-Net은 두 특징 유형을 단일 CNN 순전파로 함께 계산합니다.

## 문제

강인하고 정확한 visual localization은 자율주행, 모바일 로보틱스, AR의 근본 요소이지만, 대규모 환경과 강한 외관 변화(낮/밤, 계절) 하에서는 여전히 어렵습니다. 직접 2D-3D 매칭 방법(Active Search, CSL)은 정확하지만 모델이 커지고 외관이 변할수록 모호해지고 느려집니다. 이미지 검색 기반 방법은 강인하지만 데이터베이스 이산화 수준의 포즈만 제공합니다. Hand-crafted 특징(SIFT)은 강인성을 제한하고, 학습된 dense 특징은 모바일에서는 다루기 어려우며 — 검색 네트워크와 로컬 특징 네트워크를 별도로 계산하는 것은 둘 다 동일한 저수준 이미지 신호에서 출발하므로 중복입니다.

## 방법 및 아키텍처

**계층적 위치 인식 파이프라인** (Sarlin 2018을 따르며, 학습된 특징으로 업그레이드):
1. *사전 검색(prior retrieval)*: 쿼리의 글로벌 descriptor를 데이터베이스 이미지들과 매칭합니다. k-최근접 이웃이 후보 위치가 됩니다.
2. *Covisibility 클러스터링*: 사전 프레임들을 *장소(place)*로 그룹화합니다 — 데이터베이스 이미지를 SfM 모델의 3D 점과 연결하는 covisibility 그래프의 연결 요소입니다.
3. *로컬 매칭*: 각 장소에 대해 쿼리 2D keypoint를 해당 장소의 3D 점과 매칭하고, PnP + RANSAC으로 6-DoF 포즈를 추정하며, 첫 유효한 포즈에서 멈춥니다. 변형된 비율 테스트는 두 최근접 이웃이 *서로 다른* 3D 점에 속할 때만 매칭을 거부하여, covisibility가 높은 영역의 매칭을 유지합니다.

가장 강력한 변형인 **NV+SP**는 검색에 NetVLAD를, 로컬 특징에 SuperPoint를 사용합니다. SfM 모델은 ground-truth 참조 포즈 하에서 COLMAP을 통해 SuperPoint keypoint로 재삼각측량됩니다.

**HF-Net.** 모바일에서 동작시키기 위해, 단일 MobileNetV2 인코더(depth multiplier 0.75)가 세 개의 head에 특징을 공급합니다: keypoint 점수와 dense 로컬 descriptor(SuperPoint의 파라미터 없는 디코딩 방식, 공간 해상도가 아직 높은 layer 7에서 분기)와, layer 18의 NetVLAD 글로벌 descriptor head입니다 — 로컬 특징은 이미지 전역 특징보다 저수준이므로 분기점이 다릅니다.

**멀티태스크 증류(distillation).** Ground-truth 로컬 대응점과 전역적으로 다양한 이미지는 어떤 데이터셋에도 공존하지 않으므로, HF-Net은 대신 세 개의 teacher — NetVLAD ($t_1$, global), SuperPoint ($t_2$ descriptor, $t_3$ keypoint) — 를 자기 균형(self-balancing) 손실 가중치 $w_{1,2,3}$ (Kendall et al.)와 함께 모방하도록 학습됩니다:

$$L=e^{-w_{1}}\|\mathbf{d}^{g}_{s}-\mathbf{d}^{g}_{t_{1}}\|_{2}^{2}+e^{-w_{2}}\|\mathbf{d}^{l}_{s}-\mathbf{d}^{l}_{t_{2}}\|_{2}^{2}+2e^{-w_{3}}\,\mathrm{CrossEntropy}(\mathbf{p}_{s},\mathbf{p}_{t_{3}})+\sum_{i}w_{i}$$

여기서 $\mathbf{d}^{g},\mathbf{d}^{l}$은 글로벌/로컬 descriptor이고 $\mathbf{p}$는 keypoint 점수입니다. 학습에는 185k개의 Google Landmarks 낮 시간대 이미지와 37k개의 밤/새벽 Berkeley Deep Drive 이미지(밤 데이터는 야간 검색에 결정적)를 photometric augmentation과 함께 사용하지만, teacher 타깃은 깨끗한 이미지에서 예측됩니다.

## 실험 결과

- **벤치마크** (거리/방향 임계값 내 recall): **Aachen Day-Night**에서 NV+SP는 (0.5m,2°)/(1m,5°)/(5m,10°)에서 야간 쿼리의 40.8/56.1/74.5%를 위치 추정하며, 이는 NV+SIFT의 30.6/43.9/58.2, Active Search의 19.4/30.6/43.9와 대조됩니다. **CMU Seasons** 도심에서 NV+SP는 91.7/94.6/97.7에 도달하며, semantic SMC 베이스라인의 75.0/82.1/87.8보다 우수합니다. **RobotCar Seasons** 야간에서는 6.6/17.1/32.2로 AS의 0.5/1.1/3.4보다 우수합니다. HF-Net은 평균 recall 2.6% 이내로 NV+SP 상한선을 추적합니다 (증류된 글로벌 descriptor가 흐릿한 RobotCar 야간 쿼리에서 제한 요소입니다).
- **증류가 teacher를 능가할 수 있음**: HF-Net의 로컬 특징을 NV+SP 파이프라인에 대체 투입한 (NV+HF-Net) 경우, Aachen에서 SuperPoint 자체를 약간 능가합니다 (예: 낮 0.25m에서 81.2 대 79.7).
- **더 가벼운 맵**: SuperPoint/HF-Net Aachen 모델은 SIFT의 1,899k에 비해 685k개의 3D 점을, 이미지당 10,230개에 비해 2,576개의 keypoint를 가지며, 매칭된 keypoint 비율은 더 높습니다 (33.8% 대 18.8%) — 더 희소하면서도 더 잘 위치 추정하는 모델입니다.
- **실행 시간** (GTX 1080): Aachen 낮 시간대에서 전체 위치 추정에 45ms 소요, NV+SP는 148ms, Active Search는 375ms, NV+SIFT는 1356ms — HF-Net 추론은 NetVLAD+SuperPoint를 별도로 실행하는 것보다 7배 빠르며, 전체 시스템이 20FPS 이상으로 동작하여 AS보다 약 10배 빠릅니다.

## SLAM에서의 의미

HF-Net이 확립한 조대-정밀 패러다임은 현재 SLAM에서의 재위치 인식(relocalization)과 loop closure 검증을 위한 보편적인 설계가 되었습니다: 사실상 모든 현대 시스템이 글로벌 descriptor로 장소를 검색하고 로컬 특징 매칭으로 이를 확인합니다. 동반 툴박스인 hloc은 경진대회와 연구에서 사용되는 표준 visual localization 파이프라인이 되었으며, 동일한 방식이 대규모 AR 위치 인식 서비스의 기반이 됩니다.

## 관련 문서

- [hloc](hloc.md) — 이 계층적 파이프라인을 구현하는 오픈소스 툴박스
- [NetVLAD](netvlad.md) — 글로벌 검색 descriptor
- [SuperPoint](superpoint.md) — 정밀 매칭에 사용되는 로컬 특징
- [SuperGlue](superglue.md) — 이후 정밀 단계를 업그레이드한 학습된 매처
- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md) — 조대 검색 문제 전반
