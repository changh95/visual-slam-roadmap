# MASt3R-SLAM

> Murai 2024 · [논문](https://arxiv.org/abs/2412.12392)

**한 줄 요약** — 2-뷰 3D 재구성 사전 모델(MASt3R)로부터 밑바닥부터 설계된 최초의 실시간 밀도 SLAM 시스템으로, 보정되지 않은 단안 비디오로부터 15FPS로 전역적으로 일관된 포즈와 밀도 지도를 생성한다.

## 문제

고전적 밀도 단안 SLAM은 보정된 카메라를 필요로 하며, 기하는 깊이 센서 또는 취약한 다중 뷰 스테레오로부터 얻는다; 이는 실세계 비디오에서 성능이 크게 저하된다. MASt3R는 그 반대의 트레이드오프를 제공한다: 강건하고 보정이 필요 없는 강력한 2-뷰 재구성 및 매칭 사전 모델이지만, 키프레임, 전역 일관성, 실시간 동작이라는 개념이 전혀 없다 — 그 자체의 밀집 매칭만으로도 쌍당 약 2초가 걸린다. MASt3R-SLAM은 이 사전 모델 위에 밑바닥부터 완전한 SLAM 시스템을 구축하여, 그 범용성을 유지하면서 SLAM이 요구하는 모든 것을 추가한다.

## 방법 및 아키텍처

**파이프라인**: 각 프레임은 현재 키프레임과 짝지어져 MASt3R, $\mathcal{F}_M(\mathcal{I}^f, \mathcal{I}^k)$를 통과하며, 포인트맵 $\mathbf{X}$, 신뢰도 $\mathbf{C}$, 매칭 특징 $\mathbf{D}$, 특징 신뢰도 $\mathbf{Q}$를 산출한다. 추적은 상대 포즈를 추정하고 기하를 키프레임에 융합한다; 백엔드는 검색을 통해 루프 클로저 에지를 추가하고 2차 전역 최적화를 실행한다.

- **Sim(3) 상태, 범용 카메라**: 네트워크 예측의 스케일이 일관되지 않으므로, 모든 포즈는 $\mathbf{Sim}(3)$에 존재한다: $\mathbf{T} = \begin{bmatrix} s\mathbf{R} & \mathbf{t} \\ 0 & 1 \end{bmatrix}$, $\mathbf{T} \leftarrow \operatorname{Exp}(\boldsymbol{\tau}) \circ \mathbf{T}$로 갱신된다. 유일한 카메라 가정은 고유한 카메라 중심이다: $\psi(\mathbf{X}^i_i)$는 포인트맵을 단위 레이로 정규화하므로, *각 포인트맵이 자신만의 카메라 모델을 정의한다* — 줌과 왜곡을 별도의 처리 없이 다룰 수 있다.
- **반복적 투영 매칭**: 전역 특징 검색 대신, $\mathbf{X}^j_i$의 각 점 $\mathbf{x}$는 Levenberg–Marquardt로 픽셀 위치를 반복적으로 최적화하여 기준 프레임에 투영된다: $\mathbf{p}^* = \arg\min_{\mathbf{p}} \|\psi([\mathbf{X}^i_i]_{\mathbf{p}}) - \psi(\mathbf{x})\|^2$ (이는 레이 각도를 최소화하는 것과 동등한데, $\|\psi_1 - \psi_2\|^2 = 2(1 - \cos\theta)$이기 때문이다), 이후 지역 윈도우에서 특징 유사도로 정제된다. 커스텀 CUDA 커널이 이를 ~2ms에 수행한다 — MASt3R 자체의 매칭이 걸리는 2초에 비하면, 전체 시스템이 거의 40배 빨라진다.
- **레이 기반 추적**: 3D 점 오차를 최소화하는 방식은 일관되지 않은 깊이 예측에 의해 왜곡되므로, 추적은 대신 매치들에 대한 유계 각 레이 오차(Huber 노름 $\rho$, 신뢰도 가중치 $w(\mathbf{q}, \sigma_r^2)$, 여기서 $\mathbf{q}_{m,n} = \sqrt{\mathbf{Q}^f_{f,m} \mathbf{Q}^k_{f,n}}$)를 최소화한다:

$$E_r = \sum_{m,n \in \mathbf{m}_{f,k}} \left\| \frac{\psi\big(\tilde{\mathbf{X}}^k_{k,n}\big) - \psi\big(\mathbf{T}_{kf} \mathbf{X}^f_{f,m}\big)}{w(\mathbf{q}_{m,n}, \sigma_r^2)} \right\|_\rho ,$$

  Gauss–Newton IRLS로 풀린다, $(\mathbf{J}^\top \mathbf{W} \mathbf{J}) \boldsymbol{\tau} = -\mathbf{J}^\top \mathbf{W} \mathbf{r}$, 순수 회전 퇴화를 피하기 위한 작은 거리 항이 추가된다.
- **포인트맵 융합**: 추적되는 모든 프레임이 실행 중인 신뢰도 가중 평균을 통해 키프레임의 정규 포인트맵을 갱신한다: $\tilde{\mathbf{X}}^k_k \leftarrow \big(\tilde{\mathbf{C}}^k_k \tilde{\mathbf{X}}^k_k + \mathbf{C}^k_f (\mathbf{T}_{kf} \mathbf{X}^k_f)\big) / \big(\tilde{\mathbf{C}}^k_k + \mathbf{C}^k_f\big)$ — 기하뿐 아니라 카메라 모델 자체에 대해서도 필터링하는데, 레이가 카메라 모델을 정의하기 때문이다.
- **루프 클로저**: 새 키프레임은 인코딩된 MASt3R 특징으로 구축된 증분 ASMK 검색 데이터베이스에 질의한다; 검색된 후보는 MASt3R로 디코딩되고, 충분한 매치가 남으면 그래프 에지가 된다.
- **2차 백엔드**: 게이지 자유도는 첫 $\mathbf{Sim}(3)$ 포즈를 고정하여 처리된다; 모든 에지 $\mathcal{E}$에 대한 레이 오차 $E_g$($E_r$과 같은 형태, $\mathbf{T}_{ij} = \mathbf{T}_{WC_i}^{-1} \mathbf{T}_{WC_j}$)는 $7N \times 7N$ 헤시안에 대한 희소 Cholesky를 갖는 Gauss–Newton으로 최소화되며, 모든 야코비안은 해석적으로 계산되고 CUDA에서 누적된다.
- **보정 모드**: 내부 파라미터가 알려진 경우, 포인트맵은 알려진 레이를 따라 제약되고 잔차는 픽셀 재투영 $E_\Pi$로 전환된다 — 이 단순한 수정만으로 최고 수준의 정확도를 낸다.

## 실험 결과

i9-12900K + RTX 4090에서 ~15FPS로 실행(실시간을 모사하기 위해 프레임을 2배로 서브샘플링); 스케일 정렬된 궤적에 대한 ATE RMSE(미터 단위):

- **TUM RGB-D**: 보정 시 평균 ATE 0.030 — DROID-SLAM(0.038), GO-SLAM(0.035), DPV-SLAM++(0.054)보다 우수하다. 보정 없음: 0.060, GeoCalib 내부 파라미터를 사용한 DROID-SLAM의 0.158 대비 우수하며, 보정된 DPV-SLAM과 비슷한 수준이다.
- **7-Scenes**: 보정 시 평균 0.047(DROID-SLAM 0.049, NICER-SLAM 0.086); 보정 없는 0.066조차 깊이/법선/흐름 사전 정보를 사용하고 오프라인으로 동작하는 NICER-SLAM을 능가한다.
- **EuRoC**: 전체 11개 시퀀스 평균 0.041(그레이스케일 이미지로 학습을 보강한 DROID-SLAM에는 뒤진다).
- **ETH3D-SLAM**: 학습 시퀀스에서 단안 시스템 중 최고의 평균 ATE와 최고의 곡선하 면적 — 가장 긴 강건성 테일을 보인다.
- **밀도 기하** (7-Scenes): Chamfer 0.066(보정)/0.056(보정 없음) 대 DROID-SLAM 0.077, Spann3R 0.058.
- 에블레이션: 가중 포인트맵 융합이 최신/최초/중앙값 신뢰도 예측을 유지하는 방식보다 우수하다; 레이 오차가 3D 점 오차보다 우수하다; 2ms 투영 매처는 전체 MASt3R 매칭 정확도(보정 시 ATE 0.039 대 0.042)를 시간의 1/1000만으로 맞춘다; 루프 클로저는 포즈와 기하 모두를 개선한다.

## SLAM에서의 의미

MASt3R-SLAM은 플러그 앤 플레이다: 줌이나 왜곡이 변화하는 임의의 카메라로 촬영한 비디오를 넣으면, 깊이 센서도, 보정 절차도, 장면별 학습도 없이 밀도가 높고 전역적으로 일관된 기하를 얻을 수 있다. 이는 단안 밀도 SLAM이 무엇을 해낼 수 있어야 하는지에 대한 기준선을 재정의했으며, 그 아키텍처(학습된 2-뷰 사전 모델 + 고전적 Sim(3) 그래프 최적화)는 대부분의 파운데이션 모델 기반 SLAM 시스템이 따르는 틀이 되었다.

## 실습

- [MASt3R-SLAM 실행하기](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/mast3r_slam)

## 관련 문서

- [MASt3R](mast3r.md)
- [DUSt3R](dust3r.md)
- [DROID-SLAM](droid-slam.md)
- [VGGT-SLAM](vggt-slam.md)
- [MASt3R-Fusion](mast3r-fusion.md)
- [Covisibility graph](../level-03-monocular-slam/covisibility-graph.md)
