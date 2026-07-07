# SuMa

> Behley (Bonn) 2018 · [논문](http://www.roboticsproceedings.org/rss14/p16.pdf)

**한 줄 요약** — SuMa(Surfel-based Mapping)는 환경을 서펠 맵으로 유지하고, 렌더링된 레인지 이미지 뷰에 대한 투영적 프레임-투-모델 ICP로 각 새로운 스캔을 추적함으로써 실시간 LiDAR SLAM을 수행하며, 수공 특징 추출 없이도 온라인 루프 클로저를 갖춘 밀집 맵 LiDAR SLAM이 도시 규모에서 작동함을 보여준다.

## 문제

레이저 기반 매핑 시스템은 대체로 정렬 전에 3D 포인트 클라우드를 축소한다—특징(LOAM), 서브샘플링된 클라우드, 복셀 그리드, 또는 NDT 맵—반면 RGB-D SLAM(KinectFusion, ElasticFusion)에서 온 밀집 프레임-투-모델 접근법은 사용 가능한 모든 정보를 활용한다. 밀집 패러다임을 회전형 실외 LiDAR로 가져오려면 (1) 빠른 센서 모션으로 인한 스캔 간 큰 변위, (2) 상대적으로 희소한 포인트 클라우드, (3) 대규모 환경을 다루어야 하며—이 모두를 오프라인 후처리가 아닌 온라인으로 통합된 루프 클로저와 함께 실시간으로 처리해야 한다.

## 방법 및 아키텍처

파이프라인은 스캔마다 일곱 단계를 실행한다: 전처리, 모델 렌더링, 프레임-투-모델 ICP, 맵 업데이트, 루프 클로저 감지, 루프 클로저 검증, (별도 스레드에서의) 포즈 그래프 최적화.

- **버텍스/노멀 맵으로의 전처리**: 각 포인트 클라우드 $\mathcal{P}$는 구면 좌표를 사용한 $\Pi:\mathbb{R}^3 \mapsto \mathbb{R}^2$를 통해 버텍스 맵 $\mathcal{V}_D$(KITTI의 HDL-64E의 경우 900×64)로 투영된다,

  $$u = \tfrac{1}{2}\left(1 - \arctan(y, x)\,\pi^{-1}\right) w, \qquad v = \left(1 - \left(\arcsin(z\, r^{-1}) + f_{\mathrm{up}}\right) f^{-1}\right) h,$$

  여기서 $r = \lVert \mathbf{p} \rVert_2$이고 $f = f_{\mathrm{up}} + f_{\mathrm{down}}$은 수직 시야각이다. 노멀 맵 $\mathcal{N}_D$는 인접 버텍스의 전방 차분에 대한 외적으로 계산된다.
- **투영적 프레임-투-모델 ICP**: 활성 서펠 맵은 마지막 포즈에서 모델 맵 $\mathcal{V}_M, \mathcal{N}_M$으로 렌더링된다; 대응은 최근접 이웃 검색이 아니라 픽셀 조회로부터 얻어진다. 포인트-투-평면 오차

  $$E(\mathcal{V}_D, \mathcal{V}_M, \mathcal{N}_M) = \sum_{\mathbf{u} \in \mathcal{V}_D} \left( \mathbf{n}_u^{\top}\left( \mathbf{T}^{(k)}_{C_{t-1}C_t}\, \mathbf{u} - \mathbf{v}_u \right) \right)^2$$

  는 $\mathfrak{se}(3)$ 증분 $\delta = (\mathbf{J}^{\top}\mathbf{W}\mathbf{J})^{-1}\mathbf{J}^{\top}\mathbf{W}\mathbf{r}$을 사용한 가우스-뉴턴으로, Huber 가중치와 이상치 제거(거리 > 2 m 또는 법선 각도 > 30°)를 적용하여 최소화된다.
- **안정성 필터링을 갖춘 서펠 맵**: 각 서펠은 위치 $\mathbf{v}_s$, 법선 $\mathbf{n}_s$, 반경 $r_s$, 생성/업데이트 타임스탬프, 그리고 이진 베이즈 필터로 유지되는 안정성 로그-오즈 비율을 지닌다,

  $$l_s^{(t)} = l_s^{(t-1)} + \mathrm{odds}\left(p_{\text{stable}} \cdot e^{-\alpha^2/\sigma_\alpha^2}\, e^{-d^2/\sigma_d^2}\right) - \mathrm{odds}(p_{\text{prior}}),$$

  여기서 $\alpha$는 측정값과 서펠 사이의 각도이고 $d$는 거리이다. 오직 안정적인 서펠만 렌더링되며; 호환되는 측정값은 지수 이동 평균($\gamma = 0.9$)으로 서펠을 정밀화하고; 불안정한 오래된 서펠(동적 객체, 잡음)은 제거된다.
- **포즈를 통한 맵 변형**: 서펠 좌표는 생성 시점의 포즈 프레임에 존재하므로, 포즈 그래프 최적화 후 맵은 단순히 포즈를 업데이트함으로써 보정된다—과거 스캔의 재적분이 필요 없다.
- **맵 기반 루프 클로저**: 맵은 활성 부분($t_u \geq t - \Delta_{\text{active}}$, $\Delta_{\text{active}} = 100$)과 비활성 부분으로 나뉜다; 오도메트리는 전자만 사용하고, 루프 탐색은 후자만 사용한다. 50m 이내의 가장 가까운 비활성 포즈가 여러 ICP 초기화로 시도되며, 맵과 스캔을 합성한 *가상 뷰*에 대한 잔차가 $E_{\text{map}} < \kappa_{\text{residual}} \cdot E_{\text{odom}}$($\kappa_{\text{residual}} = 1.15$)을 만족할 때만 후보가 수락되고, 이후 5개의 후속 스캔에 걸쳐 검증된 다음에야 제약이 gtsam 포즈 그래프에 들어간다.

## 실험 결과

- KITTI 오도메트리 훈련 세트(100m당 상대 회전 오차 deg / 병진 오차 %): 프레임-투-프레임 ICP 0.9/2.9; 프레임-투-모델 0.3/0.7; 루프 클로저를 포함한 프레임-투-모델 0.3/0.8—LOAM −/0.8, Stereo LSD-SLAM 0.3/0.9, SOFT-SLAM 0.2/0.7과 비교된다. 루프 클로저는 KITTI 상대 지표를 거의 바꾸지 않지만 전역 궤적 일관성을 눈에 띄게 개선한다.
- KITTI 테스트 세트: 회전 오차 0.0032 deg/m, 병진 오차 1.4%(LOAM: 0.0017 deg/m, 0.7%).
- i7-6700 + GTX 960(4GB)에서의 런타임: 오도메트리 + 맵 업데이트는 평균 31ms(최대 71ms) 소요; 루프 클로저 감지와 검증을 포함하면 최대 189ms; 스캔당 전체 48ms—약 20Hz로, 센서 레이트의 두 배다.
- 보고된 실패 모드: 구조화된 객체가 적은 고속도로, 그리고 (교통 정체 등) 일관되게 움직이는 트래픽이 서펠로 잘못 통합되는 경우—바로 이 간극을 이후 SuMa++가 시맨틱스로 해결했다.

## SLAM에서의 의미

SuMa는 단거리 RGB-D 센서(ElasticFusion)를 위해 개척된 서펠 기반 밀집 매핑 아이디어를 실외 회전형 LiDAR로 가져와, 훨씬 더 큰 거리 범위와 불균일한 포인트 밀도를 다루었다. 이는 GPU로 렌더링된 레인지 이미지와 투영적 ICP를 표준 LiDAR 추적 메커니즘으로 확립하여 LOAM 같은 특징 기반 파이프라인에 대한 밀집 맵 대안을 제공했으며, 맵 기반 루프 클로저 기준은 낮은 스캔 중첩으로도 루프를 검증하는 방법을 보여주었다. 이 레인지 이미지 파이프라인은 시맨틱 확장인 SuMa++와 이후 LiDAR 레인지 이미지의 학습 기반 처리를 직접 가능하게 했다.

## 관련 문서

- [SuMa++](sumapp.md)
- [LOAM](loam.md)
- [Range image](range-image.md)
- [ElasticFusion](../level-04-rgbd-slam/elasticfusion.md)
- [ICP](../level-04-rgbd-slam/icp.md)
- [TSDF vs Surfel maps](../level-04-rgbd-slam/tsdf-vs-surfel-maps.md)
