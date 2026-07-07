# OKVIS2-X

> Boche & Leutenegger 2025 · [논문](https://arxiv.org/abs/2510.04612)

**한 줄 요약** — OKVIS2-X는 OKVIS2를 시각, 관성, 측정 또는 학습된 깊이, LiDAR, GNSS 측정값을 융합하는 통합 다중 센서 SLAM 시스템으로 확장하는 동시에, 추정기에 긴밀하게 결합된 조밀한 볼류메트릭 점유 서브맵을 구축하여 9\,km 시퀀스까지 실시간으로 확장됩니다.

## 문제

대부분의 최신 VI-SLAM 시스템은 다운스트림 작업에 필요한 기하학적 세부 정보가 부족한 희소 랜드마크 지도만 구축합니다(경로 계획에는 명시적인 *자유 공간*이 필요하지만, 포인트 클라우드와 메시는 이를 표현하지 못합니다), 그리고 각 시스템은 일반적으로 하나의 고정된 센서 구성을 중심으로 구축됩니다. 카메라, IMU, 깊이/LiDAR, GNSS 수신기를 탑재한 로봇은 전통적으로 별도의 VIO, LiDAR-관성, 지도 제작 스택을 함께 엮어야 했습니다. OKVIS2-X는 이 모든 것을 한 번에 요구합니다: 최고의 정확도와 강건성, 조밀하고 전역적으로 일관된 볼류메트릭 점유 지도, 대규모 운용, 그리고 실시간 성능—단일 설정 가능한 팩터 그래프 프레임워크 안에서.

## 방법 및 아키텍처

OKVIS2-X는 OKVIS2의 프론트엔드(BRISK 키포인트, DBoW2 장소 인식, 선택적 Fast-SCNN 하늘 세그멘테이션), 실시간 추정기, 비동기 루프 최적화를 유지하면서, 세 개의 모듈을 추가합니다: **깊이 네트워크**, **다중 센서 프로세서**(GNSS 잔차, LiDAR 모션 왜곡 보정, 프레임-대-지도 팩터), **서브맵 인터페이스**입니다. 모든 것은 하나의 목적 함수로 결합됩니다:

$$c(\mathbf{x}) = \frac{1}{2}\sum_{i,k,j} \rho_{\mathrm{c}}\left({\mathbf{e}_{\mathrm{r}}^{i,j,k}}^T \mathbf{W}_{\mathrm{r}} \mathbf{e}_{\mathrm{r}}^{i,j,k}\right) + \frac{1}{2}\sum_{k} {\mathbf{e}_{\mathrm{s}}^{k}}^T \mathbf{W}_{\mathrm{s}}^{k} \mathbf{e}_{\mathrm{s}}^{k} + \frac{1}{2}\sum_{r,c} {\mathbf{e}_{\mathrm{p}}^{r,c}}^T \mathbf{W}_{\mathrm{p}}^{r,c} \mathbf{e}_{\mathrm{p}}^{r,c} + \frac{1}{2}\sum \rho_{\mathrm{t}}\left(e_{\mathrm{m}}^2\right) + \frac{1}{2}\sum_{j\in\mathcal{G}} {\mathbf{e}_{\mathrm{g}}^{j}}^T \mathbf{W}_{\mathrm{g}}^{j} \mathbf{e}_{\mathrm{g}}^{j},$$

즉 재투영, 사전 적분된 IMU, 주변화에서 유래한 포즈 그래프, 지도 정렬(프레임-대-지도 및 지도-대-지도), GNSS 팩터로 구성되며, Cauchy($\rho_{\mathrm{c}}$)와 Tukey($\rho_{\mathrm{t}}$) 강건화기를 사용합니다.

- **볼류메트릭 점유 서브맵**(Supereight2, 다중 해상도): 각 서브맵은 키프레임에 고정되므로, 추정기 업데이트가 서브맵을 이동시키면서도 로컬 일관성을 유지합니다. 점유 로그-오즈 $l({}_M\mathbf{p}) = \log\frac{P_{\text{occ}}}{1 - P_{\text{occ}}}$는 재귀적으로 융합됩니다, $L_k = \frac{L_{k-1} w_{k-1} + l}{w_{k-1} + 1}$이며 포화 가중치 $w_k = \min(w_{k-1}+1,\, w_{\max})$를 사용합니다. 새로운 서브맵은 겹침/키프레임 수 기준으로 트리거됩니다(서브맵 내부의 드리프트는 무시할 만한 것으로 가정됩니다).
- **지도 정렬 팩터**는 지도 제작과 추정을 긴밀하게 결합합니다: 측정된 모든 점은 표면 위에 있어야 하며($L = 0$), 가장 가까운 표면으로부터의 거리는 점유 필드로부터 선형으로 외삽됩니다,
  $$e_{\mathrm{m}}^{a,b} = \frac{d}{\sigma} = \frac{L({}_{S_a}\mathbf{p})}{\sqrt{\frac{L_{\min}^2}{9} + \sigma_d^2\, \lvert \nabla L({}_{S_a}\mathbf{p}) \rvert^2}}, \qquad d = \frac{L}{\lvert\nabla L\rvert},$$
  프레임-대-지도(실시간 프레임 vs. 가장 최근에 완료된 서브맵)와 지도-대-지도(서브맵 완료 시 겹치는 서브맵 사이)에 적용됩니다.
- **센서로서의 학습된 깊이**: 스테레오 네트워크와 MVS 네트워크는 라플라시안 손실 하에서 학습된 불확실성 디코더로 보강됩니다, $\mathcal{L}_u = \sum_i \frac{\lvert u_i - u_{\text{gt}_i}\rvert}{\sigma_{u_i}} + \log \sigma_{u_i}$; 두 깊이 추정값은 역분산 최적 방식으로 융합됩니다, $\hat{d}_{\text{fuse}} = \sigma^2_{\text{fuse}}\left(\sigma^{-2}_{\text{st}} \hat{d}_{\text{st}} + \sigma^{-2}_{\text{mvs}} \hat{d}_{\text{mvs}}\right)$이며 $\sigma^2_{\text{fuse}} = \left(\sigma^{-2}_{\text{st}} + \sigma^{-2}_{\text{mvs}}\right)^{-1}$이고, 픽셀 단위 $\sigma_d$가 지도 팩터에 가중치를 부여합니다—휴리스틱한(LiDAR는 선형, RGB-D는 이차) 잡음 모델은 신경망 깊이에서는 통하지 않습니다.
- **GNSS 융합**: 상태는 ENU 프레임으로의 4-DoF 변환 $\mathbf{T}_{GW}$로 증강됩니다; 잔차 $\mathbf{e}_{\mathrm{g}}^{j} = \mathbf{z}^{j} - \left[\mathbf{C}_{GW}\left({}_W\hat{\mathbf{r}}_{S_j} + \hat{\mathbf{C}}_{WS_j}\, {}_S\mathbf{r}_A\right) + {}_G\mathbf{r}_W\right]$는 비동기 측정값에 대해 IMU로 전파된 자세를 사용하며 알려진 안테나 레버 암 ${}_S\mathbf{r}_A$을 사용합니다. 초기화는 추정된 변환의 요 분산에 따라 게이팅됩니다; 긴 단절은 루프 클로저와 유사한 전역 재정렬을 트리거합니다.
- **온라인 카메라-IMU 외부 파라미터 캘리브레이션**: 외부 파라미터는 재투영 팩터뿐만 아니라 상대 포즈 그래프 팩터에도 들어갑니다—양안 가우스-뉴턴 시스템이 랜드마크 주변화 전에 증강되며, 상대 자세 오차를 $N$개 카메라에 대해 $\mathbb{R}^{6+6N}$로 확장합니다.

## 실험 결과

- **EuRoC**: VIO(인과적, 루프 클로저 없음) 평균 ATE 0.066\,m vs OpenVINS 0.117 및 Kimera2 0.112—41\% 오차 감소; 비인과적 VI-SLAM 0.030\,m은 ORB-SLAM3(0.035)와 MAVIS-SLAM(0.034)을 능가하며, 최종 BA로는 0.028\,m입니다. V101–V103에서의 메시 정확도: 0.031–0.039\,m vs SimpleMapping의 0.071–0.086\,m, 완전성도 더 높습니다.
- **Hilti-Oxford (Hilti22)**: VI 구성은 리더보드의 모든 발표된 경쟁자를 능가합니다; VI-LiDAR 구성은 평균 위치 오차를 4.1\,cm(exp07 제외 시 2.8\,cm)로 줄여, LiDAR-관성 Wildcat과 경쟁력이 있으며, LiDAR는 시각을 무력화하는 어두운 방(exp03)을 통해 시스템을 이끌어갑니다.
- **VBR (로마, 최대 9\,km)**: ORB-SLAM3/OpenVINS 대비 우수한 VI 성능; VI-LiDAR는 이미 인과적으로 FAST-LIVO를 평균 오차 1.771\,m(궤적 길이의 0.06\%)로 능가하며, 경쟁자를 무너뜨리는 IMU 소실 구간에서도 생존합니다. Campus1에서 75초/450\,m 단절을 시뮬레이션한 RTK-GNSS: 최종 BA ATE는 약 3\,km에 걸쳐 0.169\,m입니다.
- **시간/메모리**(i7-13700 + RTX 3080): Ours-vi는 EuRoC MH05에서 최대 47\,Hz로 실행됩니다(프레임당 실제 시간 38.1\,ms vs ORB-SLAM3의 64.7\,ms); 깊이 네트워크는 ≥13\,Hz; GPU 메모리 3.51\,GB; NVIDIA Orin NX에서 드론에 탑재하여 실행되기도 합니다. 완전한 오픈소스입니다.

## SLAM에서의 의미

OKVIS2-X는 오픈소스 다중 센서 SLAM의 현재 최전선을 나타냅니다: OKVIS/OKVIS2가 개척한 슬라이딩 윈도우 + 포즈 그래프 아키텍처는 카메라-IMU 쌍에서 전체 센서 구성으로 깔끔하게 일반화되며, 조밀한 점유 지도 제작은 소극적인 부산물에서 궤적을 *개선하는* 일급 팩터로 승격됩니다. 실무자에게는 이전에는 별도의 VIO, LiDAR-관성, 지도 제작 스택을 엮어야 했던 사용 사례들을 다루는 단일 설정 가능한 시스템입니다(vi / vid / vil / vig / vidg / vilg)—그리고 그 지도는 자유 공간을 명시적으로 표현하며, 안전한 주행에 직접 사용할 수 있습니다.

## 관련 문서

- [OKVIS2](okvis2.md)
- [OKVIS](okvis.md)
- [LiDAR-Visual-Inertial (LVI)](../level-09-lidar-visual-lidar-slam/lidar-visual-inertial-lvi.md)
- [TSDF vs Surfel maps](../level-04-rgbd-slam/tsdf-vs-surfel-maps.md)
- [Multi-Sensor Fusion SLAM Survey](../level-09-lidar-visual-lidar-slam/multi-sensor-fusion-slam-survey.md)
- [Factor graph](../level-02-getting-familiar/factor-graph.md)
