# GO-SLAM

> Zhang 2023 · [논문](https://arxiv.org/abs/2309.02436)

**한 줄 요약** — 신경 암시적(implicit) SLAM에 온라인 루프 클로징과 전체 번들 조정을 도입했습니다: 전역 키프레임 그래프를 갖춘 DROID-SLAM 스타일의 학습된 추적에, 포즈가 전역적으로 보정될 때마다 즉시 재적합되는 Instant-NGP 기반 SDF 지도를 결합했습니다.

## 문제

신경 암시적 SLAM은 인상적인 밀집 결과를 보여왔지만, iMAP/NICE-SLAM 세대 시스템들은 오직 지역적으로만 최적화합니다: "루프 클로저(LC)나 전역 번들 조정(BA)과 같은 전역 온라인 최적화가 없기 때문에, 처리된 프레임 수가 늘어날수록 카메라 드리프트 오차가 누적되고 3D 재구성은 빠르게 붕괴됩니다." DROID-SLAM 프론트엔드를 공유하는 NeRF-SLAM조차도 "온라인 루프 클로징과 전체 BA가 결여되어 있습니다". GO-SLAM의 목표는 포즈와 재구성을 함께 전역적으로 최적화하는 딥러닝 기반 밀집 SLAM 프레임워크를 실시간으로 구현하는 것입니다 — 그리고 보정이 이루어질 때마다 신경 지도를 재적합하여, 궤적과 표면이 서로 어긋나지 않도록 합니다.

## 방법 및 아키텍처

**프론트엔드 추적 + 루프 클로징.** RAFT 기반의 순환 갱신 연산자가 마지막 키프레임에 대한 광학 흐름(optical flow)을 계산합니다. 평균 흐름이 $\tau_{flow}$를 초과하면 새로운 키프레임이 생성됩니다. 키프레임 그래프 $(\mathcal{V},\mathcal{E})$는 공시야성 행렬($N_{local} \times N_{KF}$)로부터 구축되며, 여기서 공시야성은 키프레임 쌍 사이의 평균 강체 흐름(rigid flow)입니다(흐름이 $\tau_{co}=25$를 넘는 쌍은 제외됩니다). 루프 에지는 공시야성 내림차순으로 행렬의 과거 부분에서 샘플링되며, 반경 $r_{loop}=N_{local}/2$의 인접 억제(neighbour suppression)가 적용됩니다. 루프는 3개의 연속된 후보가 검증된 뒤에만 수용됩니다. 에지는 실시간 최적화를 위해 $s_{edge}\cdot N_{local}$개로 제한됩니다. 모든 에지는 DROID-SLAM의 미분 가능한 밀집 번들 조정 레이어로 들어가며, 이는 포즈 $\mathbf{G} \in SE(3)$와 픽셀별 역깊이 $\mathbf{d}$에 대한 감쇠(damped) Gauss-Newton으로 최소화됩니다:

$$\mathbf{E}(\mathbf{G},\mathbf{d})=\sum_{(i,j)\in\mathcal{E}}\bigl\lVert\mathbf{p}_{ij}^{*}-\Pi_{c}\bigl(\mathbf{G}_{ij}\circ\Pi_{c}^{-1}(\mathbf{p}_{i},\mathbf{d}_{i})\bigr)\bigr\rVert_{\Sigma_{ij}}^{2}, \qquad \Sigma_{ij}=\operatorname{diag}\,\mathbf{w}_{ij},$$

여기서 $\mathbf{p}^*_{ij}$는 예측된 흐름, $\mathbf{w}_{ij}$는 그 신뢰도, $\Pi_c$/$\Pi_c^{-1}$은 투영/역투영입니다.

**백엔드 전체 BA**는 별도의 스레드에서 *전체* 키프레임 이력에 대해 실행되며(높은 공시야성 쌍과 시간적으로 인접한 쌍으로 구성된 자체 그래프, 반경 $r_{global}$로 중복이 억제됩니다), 루프 클로징이 이미 대부분의 오차를 제거했기 때문에 "수만 개의 입력 프레임까지도" 효율적으로 유지됩니다.

**즉시 매핑(Instant mapping).** 매핑 스레드는 모든 키프레임의 포즈/깊이를 스냅샷으로 저장한 뒤, 갱신할 키프레임을 선택합니다: 항상 최근 두 개와 아직 매핑되지 않은 것들, 마지막 매핑 이후 포즈 변화가 가장 큰 상위 10개, 그리고 망각을 방지하기 위한 계층화 샘플링 10개입니다. 각 3D 샘플 $\mathbf{x}$는 다중 해상도 해시 인코딩(Instant-NGP)을 얻습니다. 1계층 SDF MLP가 $\Phi(\mathbf{x}), \mathbf{g} = f_{\Theta_{sdf}}(\mathbf{x}, h_{\Theta_{hash}}(\mathbf{x}))$를 예측하고, 2계층 색상 MLP가 SDF 그래디언트 $\mathbf{n}$으로부터 $\Omega(\mathbf{x}) = f_{\Theta_{color}}(\mathbf{x}, \mathbf{n}, \mathbf{g})$를 예측합니다. 렌더링은 NeuS 스타일의 비편향(unbiased) 볼륨 렌더링으로, 가중치는 $w_i = \alpha_i \prod_{j=1}^{i-1}(1-\alpha_j)$이며 다음과 같습니다.

$$\alpha_{i}=\max\left(\frac{\sigma(\Phi(\mathbf{x}_{i}))-\sigma(\Phi(\mathbf{x}_{i+1}))}{\sigma(\Phi(\mathbf{x}_{i}))},\,0\right), \qquad \hat{\mathbf{c}}=\sum_{i=1}^{N_{ray}}w_{i}\,\Omega(\mathbf{x}_{i}), \quad \hat{\mathbf{D}}=\sum_{i=1}^{N_{ray}}w_{i}\,D_{i}^{ray}.$$

학습은 $\mathcal{L}=\lambda_{c}\mathcal{L}_{c}+\lambda_{dep}\mathcal{L}_{dep}+\lambda_{eik}\mathcal{L}_{eik}+\lambda_{sdf}\mathcal{L}_{sdf}$(가중치 1.0, 1.0, 0.1, 1.0)를 최소화합니다: L1 색상 손실, 렌더링된 깊이의 분산으로 가중치를 낮춘 깊이 손실 $\mathcal{L}_{dep}=\frac{1}{M}\sum_{m}\lvert\mathbf{D}_{m}-\hat{\mathbf{D}}_{m}\rvert/\sqrt{\hat{\mathbf{D}}_{m}^{var}}$, Eikonal 항, 그리고 $\mathbf{b}(\mathbf{x}_i)=\mathbf{D}_m - D^{ray}_{m,i}$를 유사 실측값으로 사용하는 SDF 손실입니다 — 16 cm 절단 밴드 내부에서는 $\mathcal{L}_{near}=\lvert\Phi(\mathbf{x}_{i})-\mathbf{b}(\mathbf{x}_{i})\rvert$이고, 자유 공간에서는 $\beta=5$인 완화된 형태 $\mathcal{L}_{free}=\max(e^{-\beta\Phi(\mathbf{x}_{i})}-1,\ \Phi(\mathbf{x}_{i})-\mathbf{b}(\mathbf{x}_{i}),\ 0)$입니다. 매핑은 전역적으로 최적화된 포즈/깊이를 *추가적인 정제 없이* 그대로 사용합니다. 동일한 프레임워크가 단안($N_{local}=50$), 스테레오, RGB-D($N_{local}=25$) 모두에서 동작하며, 메시는 SDF에 대한 마칭 큐브(marching cubes)로 생성됩니다.

## 실험 결과

- **ScanNet**(긴 실제 시퀀스, 8개 장면에 대한 평균 ATE RMSE): 단안 17.59 cm로, DROID-SLAM(52.60), DROID-SLAM(VO)(63.61), ORB-SLAM3(119.74)와 대비됩니다. RGB-D 7.02 cm로, DROID-SLAM(7.15), NICE-SLAM(13.05)과 대비됩니다.
- **어블레이션**(ScanNet): LC/전체 BA가 없는 베이스라인은 30 FPS에서 11.59 cm; +LC는 20 FPS에서 8.83; +전체 BA는 12 FPS에서 7.11; 둘 다 적용하면 10 FPS에서 7.02 cm입니다 — 루프 클로징만으로도 드리프트가 거의 무료로 제거됩니다.
- **Replica**(8개 장면 평균): RGB-D — ATE 0.34 cm, depth L1 3.38 cm, 완전성 비율(Completion Ratio) 88.09%, 8 FPS로, NICE-SLAM(ATE 1.95, L1 3.53, 1 FPS 미만)과 대비됩니다. 단안 — ATE 0.39 cm, depth L1 4.39 cm로, 동시대 연구인 NeRF-SLAM의 4.49, NICER-SLAM의 ATE 1.88과 대비됩니다.
- **TUM RGB-D**(RGB-D 모드): freiburg1/2/3 세트에서 ATE 0.015 / 0.006 / 0.013 m로, NICE-SLAM의 0.027 / 0.018 / 0.030과 대비됩니다. EuRoC 스테레오에서는 최신 스테레오 SLAM과 비교할 만한 성능을 보이면서도 밀집하고 일관된 재구성을 함께 제공합니다.
- 하드웨어: RTX 3090에서 Replica RGB-D 기준 약 15.6 GB GPU 사용(최대 18 GB), 8 FPS입니다. 프레임을 건너뛰어 2~8배 더 빠르게 실행해도 F-score와 ATE 저하는 미미합니다.

## SLAM에서의 의미

GO-SLAM은 신경 렌더링 기반 SLAM과 ORB-SLAM과 같은 성숙한 시스템 사이의 가장 명백한 격차인 전역 일관성 문제를 해결했습니다. ScanNet 단안 수치(17.59 대 52.60 cm)는 긴 궤적에서 루프 클로저가 없을 때 얼마나 치명적인 결과가 생기는지를 보여주며, 즉시 재적합되는 지도는 포즈 보정 이후에도 신경 지도가 고정되어 있을 필요가 없음을 입증했습니다. GO-SLAM의 DROID-SLAM 프론트엔드 + 신경 지도 백엔드 패턴은 (NeRF-SLAM과 공유되지만, NeRF-SLAM에 없던 전역 최적화를 더한 형태로) 전역적으로 일관된 밀집 신경 SLAM의 표준적인 방식이 되었으며, 단안/스테레오/RGB-D 지원 덕분에 더 배포 가능한 NeRF 기반 시스템 중 하나로 자리잡았습니다.

## 관련 문서

- [DROID-SLAM](droid-slam.md)
- [NICE-SLAM](nice-slam.md)
- [NeRF-SLAM](nerf-slam.md)
- [Co-SLAM](co-slam.md)
- [iMAP](imap.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)
