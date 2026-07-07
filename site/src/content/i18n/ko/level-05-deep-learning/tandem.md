# TANDEM

> Koestler 2021 · [논문](https://arxiv.org/abs/2111.07418)

**한 줄 요약** — DSO 스타일의 광도 기반 bundle adjustment와 학습된 다중 뷰 스테레오 네트워크(CVA-MVSNet), TSDF 융합을 결합한 실시간 단안 밀집 SLAM으로, 새 프레임을 전역 모델로부터 렌더링된 깊이에 대해 추적합니다.

## 문제

단안 카메라로부터의 실시간 밀집 복원은 깊이를 그대로 읽어와 융합할 수 있는 RGB-D 매핑보다 훨씬 어렵습니다. 고전적인 직접법(DSO)은 정확하게 추적하지만 희소/반밀집 점만 복원하며, 정확한 다중 뷰 스테레오는 전통적으로 오프라인으로 실행되었고, 완전히 학습 기반인 밀집 SLAM은 추적 정확도에서 고전적 방법에 뒤처졌습니다. TANDEM은 단일 이동 카메라로부터 실시간 추적과 밀집하고 전역적으로 일관된 매핑을 동시에 얻는 방법을 다루며 — 학습 기반 MVS를 전통적인 최적화 기반 VO에 통합한 최초의 시스템입니다.

## 방법 및 아키텍처

세 가지 구성 요소가 긴밀한 루프로 동작합니다(VO는 CPU 스레드에서, MVS 추론과 TSDF 융합은 GPU에서 비동기적으로):

**1. 밀집 프론트엔드를 갖춘 visual odometry.** 백엔드는 DSO의 direct sparse windowed 광도 bundle adjustment입니다. 프론트엔드는 조합된 깊이 버퍼를 사용하여 각 새 프레임을 마지막 키프레임에 대해 밀집 직접 이미지 정렬(dense direct image alignment)로 추적합니다: 사용 가능한 경우 활성 윈도우 점들로부터의 희소 깊이 $D_{n}^{\text{DSO}}$, 그렇지 않으면 **점진적으로 구축되는 전역 TSDF 모델로부터 렌더링된** 밀집 깊이 $D_{n}^{\text{TSDF}}$ — 전역 모델에 대해 추적하는 최초의 단안 밀집 프론트엔드이며, 희소만 사용하는 추적에 비해 얻는 핵심적인 강건성 향상입니다.

**2. CVA-MVSNet.** 활성 키프레임 $\{(I_{i},\mathbf{T}_{i})\}_{i=1}^{n}$이 주어지면, 가중치를 공유하는 2D U-Net이 다중 스케일 특징 $\mathbf{F}_{i}^{s}$를 추출합니다. 참조 키프레임의 깊이는 해상도가 점점 높아지는 3단계 캐스케이드로 예측됩니다. 각 단계는 특징을 픽셀별 깊이 가설 $\mathbf{D}_{hyp}^{s}$에 워핑하여 특징 볼륨 $\mathbf{V}_{i}^{s}$를 형성합니다. 슬라이딩 윈도우 키프레임들은 기선(baseline)이 매우 불균등하기 때문(심한 가림 / 비겹침), 모든 뷰를 동등하게 가중하는 표준 분산 비용 척도 대신 **자기 적응형 뷰 집계**를 사용합니다:

$$\mathbf{C}^{s}=\frac{\sum_{i=1,i\neq j}^{n}(1+\mathbf{W}_{i}^{s})\,\odot\,(\mathbf{V}_{i}^{s}-\mathbf{V}_{j}^{s})^{2}}{n-1}$$

여기서 $\mathbf{W}_{i}^{s}$는 얕은 3D CNN이 $(\mathbf{V}_{i}^{s}-\mathbf{V}_{j}^{s})^{2}$로부터 예측하는 복셀별 가중치로, 네트워크가 잘못된 뷰의 가중치를 낮출 수 있게 합니다. 비용 볼륨은 3D U-Net으로 정규화되고 softmax를 통해 확률 볼륨 $\mathbf{P}^{s}$가 되며, 깊이는 그 기댓값입니다.

$$D^{s}[h,w]=\sum_{d=1}^{D^{s}}\;\mathbf{P}^{s}[d,h,w]\cdot\mathbf{D}_{hyp}^{s}[d,h,w]$$

이후 단계들은 업샘플된 이전 단계 깊이 주변의 적은 수의 가설만 샘플링하며(첫 단계 $D^{1}=48$개 평면이 전체 범위를 다루고, 이후 단계는 더 적음), 세 단계 전체에 합산된 $L_1$ 손실로 학습됩니다.

**3. TSDF 융합.** 예측된 깊이 맵은 voxel-hashed truncated signed distance function 격자로 융합되어, 시각화된 메시와 밀집 추적 프론트엔드 양쪽 모두가 참조하는 일관된 전역 모델을 제공합니다.

## 실험 결과

- **추적(EuRoC Vicon Room, ATE RMSE, 단위 m, Sim(3) 정렬, 5회 실행 평균)**: V101/V102/V201/V202에서 TANDEM 0.09 / 0.17 / 0.09 / 0.12, 대비 DSO 0.10 / 0.27 / 0.09 / 0.21, ORB-SLAM2 0.31 / 0.11 / 1.40 / 0.84, DeepFactors 1.48 / lost / 1.06 / 1.89. V102/V202에서 "DSO + 밀집 깊이" 변형 대비 얻는 향상이 전역 TSDF 모델에 대해 추적하는 이점을 분리해서 보여줍니다. IMU를 사용하는 visual-inertial CodeVIO(0.06–0.10)는 여전히 더 우수합니다.
- **밀집 깊이(GT의 10% 이내 픽셀 비율)**: ICL-NUIM 평균 90.71(Replica로 학습된 모델), 대비 Cas-MVSNet 86.94, Atlas 66.93(GT 포즈 사용), DeepFactors 30.17, CNN-SLAM 19.77; EuRoC 평균 94.40, 대비 CodeVIO 78.74.
- **Replica에서 iMAP과 비교**: 유사한 메시 정확도/완전성(예: room-1: Acc 4.26 대 3.69 cm, Comp 4.71 대 4.87 cm) — 단안 TANDEM이 RGB-D 시스템에 대응할 만한 성능을 냅니다.
- **Ablation**: 뷰 집계는 깊이 오차를 2.64 → 1.92 cm로 줄이며, 깊이 평면 수를 (48,4,4)로 줄이면 2.33 cm를 유지하면서 추론을 158 ms, 2917 MiB로 낮춥니다. 전체 시스템은 RTX 2080 Super(8 GB) + i7-9700K에서 약 20 FPS로 동작하며, 합성 Replica 궤적으로만 학습되었음에도 EuRoC와 ICL-NUIM에 일반화됩니다.

## SLAM에서의 의미

TANDEM은 고전적+학습 하이브리드 설계 패턴을 명료하게 보여줍니다: 포즈에는 이해가 잘 된 기하학적 추정기를 유지하고, 고전적 방법이 약한 지점(무텍스처 영역의 밀집 깊이)에 정확히 학습을 삽입하며, 밀집 맵이 다시 추적으로 피드백되도록 합니다. 단안 카메라가 깊이 센서 없이도 온라인으로 밀집 TSDF 맵을 만들 수 있음을 보였으며, DROID-SLAM 같은 완전 학습 기반 파이프라인과 iMAP/NICE-SLAM 같은 신경 암묵적 시스템에 대한 실용적인 대안으로 자리매김했습니다.

## 관련 문서

- [DSO](../level-03-monocular-slam/dso.md) — 직접 희소 오도메트리 백본
- [MonoRec](monorec.md) — 단안 비디오로부터의 관련 밀집 복원
- [DeepFactors](deepfactors.md) — 비교 대상인 코드 기반 밀집 SLAM
- [CodeMapping](codemapping.md) — 코드를 통한 희소 SLAM + 학습된 밀집 깊이
- [DROID-SLAM](../level-03-monocular-slam/droid-slam.md) — 완전 학습 기반 대안
- [iMAP](../level-03-monocular-slam/imap.md) — TANDEM이 단안으로 대응하는 RGB-D 신경 암묵적 시스템
- [NICE-SLAM](../level-03-monocular-slam/nice-slam.md) — 신경 암묵적 밀집 SLAM 대안
