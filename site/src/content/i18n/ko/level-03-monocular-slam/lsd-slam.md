# LSD-SLAM

> Engel 2014 · [논문](https://cvg.cit.tum.de/research/vslam/lsdslam)

**한 줄 요약** — 최초의 대규모 직접 단안 SLAM: 반밀집 확률적 깊이 지도를 CPU에서 광도 오차 최소화로 추적하며, 스케일 드리프트를 인식하는 $\mathrm{Sim}(3)$ 키프레임 정렬과 포즈 그래프 루프 클로저를 사용합니다.

## 문제

2014년까지 단안 SLAM에는 두 가지 기존 선택지가 있었고 각각 뚜렷한 한계가 있었습니다. 특징점 기반 시스템(PTAM 계열)은 정확했지만 키포인트를 제외한 모든 것을 버렸습니다 — "직선이나 곡선의 엣지에 담긴 정보는 … 버려집니다." 직접적인 밀집 방법(DTAM, variational VO)은 모든 이미지 데이터를 사용했지만 "계산량이 많고 최신 GPU가 필요"했으며, 존재하는 모든 직접법은 전역 지도나 루프 클로저가 없는 순수한 오도메트리였습니다. 게다가 어떤 단안 시스템이든 긴 궤적에서 *스케일*이 드리프트되는데, 6-DoF 포즈 그래프로는 이를 표현할 수 없습니다. LSD-SLAM(Engel, Schöps, Cremers, ECCV 2014)은 이 세 가지를 모두 겨냅니다: 직접적, 대규모에서 일관적, CPU 실시간.

## 방법 및 아키텍처

세 가지 구성 요소가 동시에 실행됩니다(논문의 Fig. 3): **추적**, **깊이 지도 추정**, **지도 최적화**.

- **추적(직접 $\mathfrak{se}(3)$ 정렬)**: 새 프레임 $I_j$마다 현재 키프레임 $K_i = (I_i, D_i, V_i)$(영상, 반밀집 역깊이 지도, 역깊이 *분산*)에 정렬됩니다. 유효한 깊이를 가진 모든 픽셀에 대해 분산으로 정규화된 광도 오차를 최소화하여 정렬합니다:

$$E_p(\boldsymbol{\xi}_{ji}) = \sum_{\mathbf{p}\in\Omega_{D_i}} \left\| \frac{r_p^2(\mathbf{p},\boldsymbol{\xi}_{ji})}{\sigma_{r_p(\mathbf{p},\boldsymbol{\xi}_{ji})}^{2}} \right\|_{\delta}, \qquad r_p := I_i(\mathbf{p}) - I_j\big(\omega(\mathbf{p}, D_i(\mathbf{p}), \boldsymbol{\xi}_{ji})\big),$$

$$\sigma_{r_p(\mathbf{p},\boldsymbol{\xi}_{ji})}^{2} := 2\sigma_I^2 + \left(\frac{\partial r_p(\mathbf{p},\boldsymbol{\xi}_{ji})}{\partial D_i(\mathbf{p})}\right)^{2} V_i(\mathbf{p}),$$

  여기서 $\omega$는 투영적 워프(warp), $\|\cdot\|_\delta$는 Huber 노름, $\sigma_I^2$는 영상 노이즈입니다. 각 픽셀의 깊이 분산을 잔차에 전파하는 것이 논문의 두 번째 핵심 novelty입니다: 깊이가 불확실한 픽셀은 자동으로 낮게 가중됩니다. 최소화는 Lie 매니폴드 상의 반복 재가중 Gauss–Newton입니다.
- **깊이 지도 추정**: 추적된 프레임들은 많은 픽셀별 소기선(small-baseline) 스테레오 비교를 통해 키프레임을 정제하며, 이는 확률적으로 필터링되어 $D_i, V_i$가 됩니다(Engel 2013을 따름). 깊이는 영상 기울기가 충분한 곳에만 존재합니다 — *반밀집*입니다. 카메라가 너무 멀리 움직이면($\mathrm{dist}(\boldsymbol{\xi}_{ji}) = \boldsymbol{\xi}_{ji}^T \mathbf{W} \boldsymbol{\xi}_{ji}$가 임계값을 초과하면) 기존 깊이 지도를 투영하여 새로운 키프레임이 만들어지고, 각 키프레임은 평균 역깊이가 1이 되도록 재스케일됩니다.
- **$\mathfrak{sim}(3)$ 키프레임 정렬(핵심 novelty 1)**: 키프레임이 스케일 정규화되어 있기 때문에, 키프레임 사이의 엣지는 7-DoF 유사 변환입니다. $\mathfrak{sim}(3)$에서의 직접 정렬은 깊이 잔차를 추가합니다 — 광도 오차만으로는 스케일을 관측할 수 없기 때문에 필요합니다:

$$E(\boldsymbol{\xi}_{ji}) := \sum_{\mathbf{p}\in\Omega_{D_i}} \left\| \frac{r_p^2(\mathbf{p},\boldsymbol{\xi}_{ji})}{\sigma_{r_p}^{2}} + \frac{r_d^2(\mathbf{p},\boldsymbol{\xi}_{ji})}{\sigma_{r_d}^{2}} \right\|_{\delta}, \qquad r_d := [\mathbf{p}']_3 - D_j\big([\mathbf{p}']_{1,2}\big),$$

  여기서 $\mathbf{p}' = \omega_s(\mathbf{p}, D_i(\mathbf{p}), \boldsymbol{\xi}_{ji})$입니다. 루프 후보는 가장 가까운 열 개의 키프레임과 외관 기반(FAB-MAP) 제안이며, 각각은 양방향 $\boldsymbol{\xi}_{jk i}$와 $\boldsymbol{\xi}_{i jk}$가 통계적으로 일치하는지 확인하는 상호 추적 검증을 통해 검증됩니다. ESM과 20×15 픽셀에서 시작하는 조대-정밀 피라미드가 수렴 반경을 넓힙니다.
- **지도 최적화**: $\mathrm{Sim}(3)$ 제약을 가진 키프레임 포즈 그래프는 백그라운드에서(g2o) 지속적으로 최적화됩니다:

$$E(\boldsymbol{\xi}_{W1} \dots \boldsymbol{\xi}_{Wn}) := \sum_{(\boldsymbol{\xi}_{ji}, \Sigma_{ji}) \in \mathcal{E}} \big(\boldsymbol{\xi}_{ji} \circ \boldsymbol{\xi}_{Wi}^{-1} \circ \boldsymbol{\xi}_{Wj}\big)^T \Sigma_{ji}^{-1} \big(\boldsymbol{\xi}_{ji} \circ \boldsymbol{\xi}_{Wi}^{-1} \circ \boldsymbol{\xi}_{Wj}\big).$$

## 실험 결과

- **TUM RGB-D 벤치마크**(절대 궤적 RMSE, cm 단위; 단안, 스케일을 위해 첫 깊이 지도로 부트스트랩): fr2/desk **4.52**(키프레임 116개) 대 반밀집 mono-VO의 13.50, 키포인트 기반 mono-SLAM(PTAM)의 추적 실패, 센서 깊이를 사용하는 두 RGB-D 시스템의 1.77 / 9.5; fr2/xyz **1.47** 대 3.79(반밀집 VO)와 24.28(PTAM). 시뮬레이션 시퀀스: sim/desk 0.04, sim/slowmo 0.35.
- **대규모**: 약 500 m, 6분짜리 핸드헬드 야외 궤적이 정확히 클로징되며, 평균 역깊이가 20 cm 미만에서 10 m 이상까지 걸치는 시퀀스가 일관되게 매핑됩니다 — 루프 클로저 전에는 장면의 일부가 서로 다른 스케일로 두 번 존재했지만, 클로저 후에는 정렬됩니다.
- CPU에서 실시간으로 동작합니다(640×480, 30 Hz); 오도메트리 코어는 스마트폰에서 실행되는 것으로도 보여졌습니다. ESM과 추가 피라미드 레벨은 $\mathfrak{sim}(3)$ 수렴 반경을 늘리지만 수렴된 정확도는 늘리지 않습니다.

## SLAM에서의 의미

LSD-SLAM은 직접법이 특징점 기반 SLAM에 대한 진지하고 확장 가능한 대안이 될 수 있음을 증명했습니다: 영상을 더 많이 사용하고, 더 풍부한 반밀집 지도를 만들며, 코너가 드문 곳에서도 강건합니다. 이 논문이 남긴 두 가지 유산 — 추적의 기본 원리로 자리 잡은 분산 정규화 광도 정렬, 그리고 단안 스케일 드리프트를 위한 $\mathrm{Sim}(3)$ 포즈 그래프 — 는 이제 표준 어휘가 되었습니다(ORB-SLAM은 루프 클로징에 $\mathrm{Sim}(3)$ 필수 그래프 아이디어를 채택했습니다). 이는 DSO(같은 그룹이 포즈 그래프를 윈도우 광도 BA로 대체)와 CNN-SLAM(LSD-SLAM 골격 위에 학습된 깊이)의 직접적인 씨앗이 되었습니다.

## 관련 문서

- [DTAM](dtam.md)
- [DSO](dso.md)
- [CNN-SLAM](cnn-slam.md)
- [Scale ambiguity](scale-ambiguity.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)
- [LDSO](ldso.md)
