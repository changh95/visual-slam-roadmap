# ORB-SLAM2

> Mur-Artal 2017 · [논문](https://arxiv.org/abs/1610.06475)

**한 줄 요약** — ORB-SLAM을 스테레오 및 RGB-D 카메라로 확장하여, 세 가지 센서 모달리티 모두에서 미터 단위 스케일과 최고 수준의 정확도를 갖춘 통합 오픈소스 SLAM 프레임워크를 제공합니다.

## 문제

ORB-SLAM은 단안 전용이었습니다: 깊이는 단일 카메라로부터 관측할 수 없으므로 지도와 궤적의 스케일을 알 수 없고, 부트스트래핑에는 다중 뷰 초기화가 필요하며, 시스템은 스케일 드리프트를 겪고 순수 회전 상황에서 실패할 수 있습니다. 스테레오와 RGB-D 카메라는 이러한 모든 문제를 해결하지만, 기존의 스테레오/RGB-D 시스템은 루프 클로징이 없거나, 일정 시간 동작을 위해 전역 일관성을 포기했거나, ICP/광도 정렬에 의존했습니다. ORB-SLAM2(IEEE TRO 2017)는 BA 기반 프레임워크를 일반화하여, 하나의 시스템이 "실내에서의 소규모 핸드헬드 시퀀스부터 산업 환경에서 비행하는 드론과 도시를 주행하는 자동차까지, 다양한 환경에서 표준 CPU상에서 실시간으로 동작"하도록 합니다.

## 방법 및 아키텍처

추적, 지역 매핑, 루프 클로징의 세 개의 병렬 스레드와, 루프 클로저 이후 전역 BA를 위한 네 번째 스레드로 구성됩니다. 추적은 운동만의 BA로 지역 지도에 대해 매 프레임을 지역화합니다; 지역 매핑은 공시야성 윈도우에 대한 지역 BA를 실행합니다; 루프 클로징은 DBoW2로 루프를 감지하고 공시야성 그래프/신장 트리에 대한 포즈 그래프 최적화로 드리프트를 보정한 다음, 신장 트리를 통해 키프레임 보정을 전파하여 결과를 다시 병합하는 전역 BA를 수행합니다.

- **입력 전처리**: 이미지는 한 번 ORB 특징점으로 축소되며, 나머지 시스템은 센서에 독립적입니다. 스테레오 키포인트는 에피폴라 행 매칭으로부터 얻은 $\mathbf{x}_{\mathrm{s}}=(u_L,v_L,u_R)$입니다; RGB-D의 경우 각 깊이 $d$는 *가상 오른쪽 좌표(virtual right coordinate)* $u_R=u_L-\frac{f_x b}{d}$로 변환됩니다. 여기서 $f_x$는 초점 거리이고 $b\approx 8$ cm는 Kinect/Xtion 기저선입니다 — 따라서 RGB-D 입력은 변경 없이 스테레오 파이프라인에 실립니다.
- **가깝고 먼 포인트 정책**: 스테레오 포인트는 깊이가 기저선의 40배 미만이면 *가깝다(close)*고 간주됩니다(Paz et al.의 임계값) — 단일 프레임으로부터 안전하게 삼각측량되어 스케일, 이동, 회전을 제공합니다; *먼(far)* 포인트는 여러 뷰에서 지지될 때만 삼각측량되며 주로 회전을 제약합니다. 단안 키포인트(스테레오/깊이 매칭이 없는 경우) 또한 기여합니다.
- **단안 + 스테레오 제약을 포함한 BA** (g2o, Levenberg–Marquardt): 운동만의 BA는 다음을 해결합니다

$$\{\mathbf{R},\mathbf{t}\}=\operatorname*{argmin}_{\mathbf{R},\mathbf{t}}\sum_{i\in\mathcal{X}}\rho\left(\left\|\mathbf{x}^{i}_{(\cdot)}-\pi_{(\cdot)}\left(\mathbf{R}\mathbf{X}^{i}+\mathbf{t}\right)\right\|^{2}_{\Sigma}\right)$$

  Huber 비용 $\rho$, 키포인트 스케일 공분산 $\Sigma$, 그리고 투영 함수 $\pi_{\mathrm{m}}=\left(f_x\frac{X}{Z}+c_x,\ f_y\frac{Y}{Z}+c_y\right)$와 세 번째 행 $f_x\frac{X-b}{Z}+c_x$를 추가하는 스테레오 $\pi_{\mathrm{s}}$가 사용됩니다. 지역 BA는 공시야 키프레임 $\mathcal{K}_L$과 그들의 포인트 $\mathcal{P}_L$을, 경계 키프레임 $\mathcal{K}_F$를 고정한 채 최적화합니다; 전역 BA는 원점 키프레임을 제외한 모든 것을 자유롭게 두는 것을 제외하면 동일합니다.
- **부트스트래핑 및 루프 클로징**: 단일 프레임으로부터의 깊이가 있으므로, 지도는 첫 번째 키프레임에서 초기화됩니다 — SfM 초기화가 필요 없습니다. 스케일이 관측 가능하므로, 루프 보정은 단안 모드에서 필요한 $\mathrm{Sim}(3)$이 아니라 리지드(rigid) $SE(3)$ 포즈 그래프 최적화를 사용합니다.
- **키프레임 삽입 및 지역화 모드**: 추적된 가까운 포인트가 $\tau_t=100$ 아래로 떨어지지만 $\tau_c=70$개의 새로운 가까운 포인트가 생성될 수 있을 때 키프레임을 삽입하는 새로운 조건이 있습니다 — 먼 포인트가 지배적인 장면(예: 고속도로)에서 중요합니다. 경량 지역화 모드는 매핑/루프 클로징을 비활성화하고, (매핑되지 않은 영역을 위한, 드리프트가 있는) 비주얼 오도메트리 매칭과 (제로 드리프트인) 지도점 매칭을 결합합니다.

## 실험 결과

29개의 공개 시퀀스에서 평가되었습니다(각각 5회 실행, 중앙값; Intel i7-4790):

- **KITTI 스테레오**(11개 시퀀스): 상대 이동 오차는 일반적으로 1% 미만입니다(예: 00: 0.70%, ATE 1.3 m; 05: 0.40%, 0.8 m), 대부분의 시퀀스에서 Stereo LSD-SLAM을 능가합니다; 단안 ORB-SLAM이 완전히 실패했던 고속도로 시퀀스 01은 1.39% / 10.4 m로 동작하며, 장기 추적된 먼 포인트 덕분에 회전 오차는 0.21°/100 m입니다.
- **EuRoC 스테레오**(11개 MAV 시퀀스): RMSE는 수 센티미터입니다, 예를 들어 V1_01 0.035 m 대 Stereo LSD-SLAM의 0.066 m, V1_02 0.020 m 대 0.074 m, MH_03 0.028 m; V2_03만 심한 모션 블러로 인해 손실됩니다.
- **TUM RGB-D**: BA 기반 유일한 참가자로서 대부분의 시퀀스에서 ElasticFusion, Kintinuous, DVO-SLAM, RGBD-SLAM을 능가합니다 — fr2/xyz 0.004 m, fr2/desk 0.009 m, fr3/office 0.010 m, fr1/desk 0.016 m(ElasticFusion 0.020 m, DVO-SLAM 0.021 m 대비).
- **타이밍**: 프레임당 평균 추적 시간은 테스트된 모든 설정에서 카메라 프레임 시간보다 낮습니다(예: 30 Hz TUM RGB-D에서 25.58 ms, 10 Hz KITTI 스테레오에서 49.47 ms) — 표준 CPU에서 실시간입니다.

## SLAM에서의 의미

ORB-SLAM2는 ORB-SLAM을 단안, 스테레오, RGB-D 센서를 포괄하는 범용 SLAM 라이브러리로 발전시켰으며, 수년간 SLAM 논문에서 지배적인 정확도 기준선으로 남았습니다; RGB-D를 위한 가상 스테레오 기법과 가깝고 먼 포인트 정책은 널리 복제되었습니다. 이는 단안 SLAM(레벨 3)에서 스테레오 SLAM(레벨 7)과 RGB-D SLAM(레벨 4)으로 이어지는 자연스러운 다리이며, ORB-SLAM3의 시각-관성, 다중 지도 시스템의 직접적인 전신입니다.

## 실습

- [ORB-SLAM2 실행하기](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/orb_slam2)

## 관련 문서

- [ORB-SLAM](orb-slam.md)
- [ORB-SLAM3](orb-slam3.md)
- [Scale ambiguity](scale-ambiguity.md)
- [OpenVSLAM](openvslam.md)
- [Disparity vs Depth](../level-07-stereo-slam/disparity-vs-depth.md)
- [Scale observability](../level-07-stereo-slam/scale-observability.md)
