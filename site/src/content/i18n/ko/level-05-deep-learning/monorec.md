# MonoRec

> Wimbauer 2021 · [논문](https://arxiv.org/abs/2011.11814)

**한 줄 요약** — 다중 뷰 스테레오 cost volume의 광도 불일치로부터 움직이는 물체를 검출하여 동적 환경을 다룰 수 있는, 단일 이동 카메라 기반의 준지도 밀집 3D 복원.

## 문제

다중 뷰 스테레오는 단일 이동 카메라로부터 기하학적으로 근거 있는 밀집 깊이를 제공하지만, 정적 장면 가정에 의존한다: 움직이는 자동차와 보행자는 다중 뷰 제약을 위반하며 자율 시스템이 가장 신경 쓰는 바로 그 지점에서 cost volume을 훼손한다. 단일 이미지 depth 예측은 움직이는 물체를 다룰 수 있지만 특정 카메라 내부 파라미터에 묶인 학습된 관점 외관에 의존하므로 일반화가 잘 되지 않는다. 두 번째 장애물은 지도(supervision)이다 — 밀집 ground truth란 곧 LiDAR를 의미한다. MonoRec은 두 가지를 모두 목표로 한다: 동적 장면에서의 밀집 복원을, LiDAR 깊이 값 없이 학습한다.

## 방법 및 아키텍처

연속된 프레임 $\{I_1,\dots,I_N\}$과 희소 VO 시스템(DVSO)으로부터의 포즈가 주어지면, MonoRec은 키프레임 $I_t$에 대한 밀집 inverse depth map $D_t$를 예측한다. 두 모듈이 plane-sweep cost volume 위에서 동작한다.

**SSIM cost volume.** 일반적인 패치 단위 SAD 대신, 깊이 가설 $d$에서의 픽셀별 광도 오차는 $3\times3$ 패치를 사용한 SSIM으로 계산된다: $pe(\mathbf{x},d)=\frac{1-\text{SSIM}(I_{t^{\prime}}^{t}(\mathbf{x},d),I_{t}(\mathbf{x}))}{2}$이며, 이는 프레임 전체에 걸쳐

$$C(\mathbf{x},d)=1-2\cdot\frac{1}{\sum_{t^{\prime}}\omega_{t^{\prime}}}\cdot\sum_{t^{\prime}}pe_{t^{\prime}}^{t}(\mathbf{x},d)\cdot\omega_{t^{\prime}}(\mathbf{x})$$

로 집계된다. 여기서 가중치 $\omega_{t'}(\mathbf{x})$는 다른 깊이 단계에 대한 해당 프레임의 광도 오차 최솟값을 강조하여, 신뢰도가 높은 프레임이 더 많이 반영되도록 한다; $C\in[-1,1]$이다.

**MaskModule.** *단일 프레임* cost volume 집합 $C_{t'}$로부터 픽셀이 움직이는 물체에 속할 확률 $M_t(\mathbf{x})\in[0,1]$을 예측한다: 동적 픽셀은 서로 다른 $C_{t'}$ 사이에서 일관되지 않은 최적 깊이 단계를 만들어낸다. $I_t$에 대한 사전학습된 ResNet-18 특징이 시맨틱 사전(semantic prior)을 추가한다(기하 정보만으로는 저텍스처/비-람버시안 표면과 등속 운동 물체에서 혼란을 일으킨다). 가중치를 공유하는 U-Net encoder가 각 $C_{t'}$를 처리하고, 특징은 max-pool 후 디코딩된다 — 따라서 이 모듈은 임의 개수의 프레임에 대해 동작한다.

**DepthModule.** 예측된 마스크를 모든 깊이 단계에서 픽셀 단위로 곱한 후의 다중 프레임 cost volume $C$를 받는다 — 이로써 움직이는 물체 영역에는 (강한 사전 정보로 작동하는) 최댓값이 남지 않는다 — 이를 $I_t$와 결합(concatenate)하여, U-Net이 다중 스케일 inverse depth를 디코딩하고, 이미지 특징과 주변 정보로부터 움직이는 물체의 깊이를 추론하도록 강제한다.

**다단계 준지도 학습.** 부트스트래핑 단계는 $\mathcal{L}_{depth}=\sum_{s=0}^{3}\mathcal{L}_{self,s}+\alpha\mathcal{L}_{sparse,s}+\beta\mathcal{L}_{smooth,s}$로 DepthModule을 학습시키며, 이는 시간적 및 정적 스테레오 재투영에 대한 픽셀별 최솟값 광도 손실을 결합한다:

$$\mathcal{L}_{self,s}=\min_{t^{\star}\in t^{\prime}\cup\{t^{S}\}}\Big(\lambda\tfrac{1-\text{SSIM}(I_{t^{\star}}^{t},I_{t})}{2}+(1-\lambda)\,\lVert I_{t^{\star}}^{t}-I_{t}\rVert_{1}\Big),\quad \lambda=0.85$$

여기에 VO 포인트 클라우드로부터의 희소 깊이 지도 $\mathcal{L}_{sparse,s}=\lVert D_{t}-D_{VO}\rVert_{1}$가 더해진다 — LiDAR도, 수동 라벨도 필요 없다. MaskModule은 보조 마스크(시간적/정적 스테레오 불일치를 통해 움직임으로 표시된 Mask-RCNN 가동성 인스턴스)로 부트스트래핑된다. 이후 정제 단계는 두 모듈을 결합한다: 마스크는 정적 스테레오 손실과 시간적 스테레오 손실 사이의 보간 인자로 학습되고($\mathcal{L}_{m\_ref}$), 깊이 정제는 움직이는 픽셀에서 정적 스테레오 손실만을 역전파하며 스테레오 깊이 사전을 추가한다($\mathcal{L}_{d\_ref}$).

## 실험 결과

- **KITTI** (odometry ∩ Eigen split: 학습 13,714 / 테스트 8,634, 개선된 GT, 80m 제한): Abs Rel 0.050, Sq Rel 0.295, RMSE 2.266, RMSE-log 0.082, $\delta_1$ 0.973 — Colmap(Abs Rel 0.099), Monodepth2(0.082), LiDAR 사용 PackNet 준지도 학습(0.077), DORN(0.077), DeepMVS(사전학습 0.088), 정제를 포함한 DeepTAM(0.053, RMSE 2.480)을 모두 능가하는 전체 최고 성능이며, 이는 LiDAR ground truth 없이 학습한 것이다.
- **Ablation**: SSIM cost volume만으로도 SAD 방식 기준선 대비 RMSE가 2.624 → 2.444로 감소하며; MaskModule과 두 정제 단계를 모두 적용하면 전체 성능인 2.266에 도달한다.
- **일반화**: KITTI로 학습한 모델이 Oxford RobotCar와 핸드헬드 TUM-Mono 시퀀스로 전이되며, 이 데이터에서는 단안 방법들이 어려움을 겪고 다른 MVS 방법들은 움직이는 물체에서 아티팩트를 보인다.
- **런타임**: 512×256 입력, 배치 크기 1에서 2GB 메모리를 사용해 약 10 fps.

## SLAM에서의 의미

실제 세계에서의 밀집 단안 복원은 자동차와 보행자를 다루어야 하는데, MonoRec은 cost volume 자체가 이들을 찾는 데 필요한 증거를 담고 있음을 보여주었고, 추론 시점에 시맨틱 검출기를 덧붙이는 대신 동적 물체 검출과 깊이 추정을 통합했다. TUM의 direct-SLAM 그룹에서 나온 이 연구는 의도적으로 임의의 희소 VO 시스템으로부터 포즈를 입력받도록 설계되었으며(포즈 입력, 밀집 맵 출력), TANDEM과 같은 이후의 실시간 밀집 매핑 연구에 영향을 주었다.

## 관련 문서

- [TANDEM](tandem.md) — 같은 그룹의 실시간 추적 및 매핑
- [DVSO](../level-03-monocular-slam/dvso.md) — 포즈와 희소 깊이 지도를 제공하는 VO 시스템
- [D3VO](../level-03-monocular-slam/d3vo.md) — 포즈/깊이 계보를 제공하는 딥러닝 기반 VO
- [DeepV2D](deepv2d.md) — 깊이와 포즈 추정을 교대로 수행
- [Self-supervised depth](../level-03-monocular-slam/self-supervised-depth.md) — 학습 철학의 배경
- [DSO](../level-03-monocular-slam/dso.md) — MonoRec과 같은 시스템에 포즈를 제공하는 direct odometry 계보
