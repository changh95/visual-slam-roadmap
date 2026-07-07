# CodeMapping

> Matsuki 2021 · [논문](https://arxiv.org/abs/2107.08994)

**한 줄 요약** — CodeMapping (RA-L 2021)은 CodeSLAM 스타일의 학습된 dense mapper를 신뢰할 수 있는 sparse SLAM 시스템에 결합합니다: 밝기값, sparse depth, 재투영 오차 이미지를 조건으로 하는 VAE가 각 키프레임에 대해 불확실성을 인지하는 dense depth map을 예측하고, 이는 병렬 스레드에서의 multi-view code 최적화로 정제됩니다.

## 문제

최신 sparse visual SLAM 시스템은 정확하고 신뢰할 수 있는 카메라 궤적과 랜드마크 위치를 제공하지만, 그들의 sparse map은 "장애물 회피나 장면 이해 같은 다른 작업에는 사용할 수 없습니다". 완전한 dense SLAM은 (photometric noise로 인해) 취약하며 방대한 파라미터 수를 실시간으로 동시 최적화할 수 없는 반면, CodeSLAM/DeepFactors는 순수하게 흑백 이미지로부터 깊이를 예측하는데 이는 실제로는 부정확합니다. CodeMapping은 검증된 임의의 metric sparse SLAM 시스템에 손대거나 지연시키지 않으면서 — 그것의 실전 검증된 tracking 핵심부는 그대로 두고 — dense하고 불확실성을 인지하는 매핑을 추가하는 방법을 묻습니다.

## 방법 및 아키텍처

**느슨하게 결합된 두 개의 프로세스.** ORB-SLAM3는 수정 없이 실행됩니다 (tracking, local 및 global mapping). 매 local bundle adjustment 후, SLAM 스레드는 dense mapping 스레드에 카메라 포즈, sparse depth 이미지 (키프레임에 투영된 랜드마크), 재투영 오차 이미지 (랜드마크당 평균 재투영 거리; 매치되지 않은 새 점은 10으로 설정)를 포함한 4개 키프레임 (최신 프레임과 그 상위 3개 covisible 프레임)의 윈도우를 넘겨줍니다.

**Sparse-to-dense VAE.** U-Net이 sparse depth와 재투영 오차 맵 ($[0,1]$로 근접도 파라미터화됨)과 결합된 흑백 이미지를 입력받아 VAE를 조건화하며, 이는 latent code $\mathbf{c} \in \mathbb{R}^{32}$, dense depth map $D$, 불확실성 맵 $b$를 출력합니다. 학습은 KL 손실과 불확실성 가중 재구성 손실로 이루어집니다.

$$\sum_{\mathbf{x}\in\Omega} \frac{\| D[\mathbf{x}] - D_{gt}[\mathbf{x}] \|}{b[\mathbf{x}]} + \log(b[\mathbf{x}]) .$$

재투영 오차 입력은 네트워크가 이상치 랜드마크 (더 높은 평균 재투영 오차를 보이는)를 다운웨이트하게 합니다. 학습은 각각 1000개의 ORB로 선택된 sparse point를 가진 약 40만 장의 ScanNet 이미지를 사용합니다; 재투영 오차는 실제 ORB-SLAM3 실행에서 관찰된 exponential-Gaussian 분포를 따르도록 점을 광선을 따라 교란시켜 *시뮬레이션*됩니다 (10 epoch, 학습률 0.0001, 256×192).

**Multi-view code 최적화.** 깊이는 컴팩트한 code로 유지되므로, mapper는 GTSAM에서 DeepFactors 스타일의 factor로 일관성을 정제합니다 — code만 최적화하며 (sparse SLAM으로부터의 포즈는 신뢰되어 고정됨), 모든 factor에 Huber 비용을 적용합니다. 워프 $\omega_{ji}(\mathbf{x}, \mathbf{c}_i, I_i) = \pi(\mathbf{T}_{ji}\,\pi^{-1}(\mathbf{x}, D_i[\mathbf{x}]))$를 사용하여:

$$E_{photo}^{ij}(\mathbf{c}_i) = \sum_{\mathbf{x}\in\Omega} \| I_i[\mathbf{x}] - I_j[\omega_{ji}(\mathbf{x}, \mathbf{c}_i, I_i)] \|^2 \qquad E_{rep}^{ij}(\mathbf{c}_i) = \sum_{\mathbf{x},\mathbf{y}\in M_{ij}} \| \omega_{ji}(\mathbf{x}, \mathbf{c}_i, I_i) - \mathbf{y} \|^2$$

$$E_{dpt}^{ij}(\mathbf{c}_i) = \sum_{\mathbf{x}\in\Omega'} \| \,|\mathbf{T}_{ji}\,\pi^{-1}(\mathbf{x}, D_i[\mathbf{x}])|_z - D_j[\hat{\mathbf{x}}] \,\|^2 ,$$

기하학적 항에는 BRISK 매치 $M_{ij}$와 희소하게 샘플링된 픽셀 $\Omega'$을 사용합니다. sparse SLAM 궤적이 전역적으로 일관되므로, 정제된 키프레임 깊이는 마지막에 전역적으로 일관된 TSDF 모델로 융합될 수 있습니다.

## 실험 결과

- ScanNet 테스트 장면 (ORB-SLAM3 RGB-D; 렌더링된 ground truth 대비 미터 단위 MAE/RMSE): 전체 방법은 DeepFactors (밝기값만 조건화)와 Ma et al.의 sparse-to-dense 네트워크에 대해 7개 시퀀스 전체에서 승리합니다 — 예를 들어 scene0100_00에서 MAE 0.046 vs 0.185 (DeepFactors)와 0.141 (Ma et al.). Multi-view 최적화는 단일 뷰 예측을 약 10% 향상시킵니다.
- EuRoC MAV (visual-inertial 모드, LiDAR로 렌더링된 ground truth): 전체 방법은 V101에서 MAE 0.192m vs DeepFactors 0.842와 Ma et al. 0.495; sparse-point 조건화는 domain-shift 페널티를 현저히 줄이며, 재투영 오차 조건화는 EuRoC의 텍스처가 없는 벽에서 흔한 큰 이상치를 걸러냅니다.
- 실행 시간 (i9-10900 + RTX 3080, 두 데이터셋의 평균): TensorFlow C++ API를 통한 dense 예측 235ms (Python API로는 11ms), 4개 키프레임에 대한 multi-view 최적화 170ms — SLAM 프로세스를 지연시키지 않으면서 약 1Hz의 dense map 업데이트.
- 정성적 결과: Kimera의 Delaunay triangulation보다 더 부드럽고 정확한 local mesh; TSDF로 융합된 전역 복원; 스케일이 보정된 순수 단안 ORB-SLAM 출력에서도 동작합니다.

## SLAM에서의 의미

CodeMapping은 배포 가능한 시스템을 지배하는 실용적인 "하이브리드" 설계의 깔끔한 예입니다: 실전에서 검증된 sparse 프론트엔드를 유지하고, 고전적 방법이 약한 부분 (dense geometry)에만 학습을 추가하며, 네트워크의 실패가 tracking을 절대 죽이지 못하도록 느슨하게 결합합니다. 이는 CodeSLAM/DeepFactors의 latent-code 계보를 프로덕션에 적합한 아키텍처로 이어갔으며, 저자 (Matsuki)는 나중에 tracking과 병행한 dense-mapping 철학을 Gaussian-splatting SLAM (MonoGS)으로 이어갔습니다.

## 관련 문서

- [CodeSLAM](codeslam.md)
- [DeepFactors](deepfactors.md)
- [TANDEM](tandem.md)
- [ORB-SLAM3](../level-03-monocular-slam/orb-slam3.md)
- [MonoGS](monogs.md)
- [Kimera / 3D Dynamic Scene Graph](kimera-3d-dynamic-scene-graph.md) — 이 논문이 비교 대상으로 삼는 geometric 실시간 meshing 접근법
