# ACE-SLAM

> Alzugaray 2025 · [논문](https://arxiv.org/abs/2512.14032)

**한 줄 요약** — 장면 좌표 회귀를 핵심 맵 표현으로 사용하는 최초의 신경 암묵적 RGB-D SLAM 시스템으로, 네트워크 가중치 자체가 맵 역할을 하면서 엄격한 실시간 운용을 달성한다.

## 문제

iMAP/NICE-SLAM 계열의 신경 암묵적 SLAM 시스템들은 네트워크가 밀집 맵으로 동작할 수 있음을 보여주었지만, 렌더링 기반 추적과 매핑은 카메라 광선을 따르는 비용이 큰 체적 적분을 필요로 하여 엄격한 실시간 예산을 놓치며, 추가적인 장치(분리된 프론트엔드, 번들 조정, 루프 클로저 모듈, 동적 물체를 위한 의미론적 마스킹)를 필요로 한다. 한편 장면 좌표 회귀는 (DSAC → ACE → ACE Zero를 거치며) 효율적이고, 메모리가 적으며, 프라이버시를 보존하고, 매우 빠른 재위치 인식이 가능한 암묵적 표현으로 성숙했다 — 하지만 오직 *오프라인* 매핑 도구로서만 그러했다. 열려 있는 질문은: SCR을 실시간 SLAM 루프 안에서, 추적, 매핑, 재위치 인식을 위한 단일 표현으로서 *온라인으로* 학습시킬 수 있을까 하는 것이다.

## 방법 및 아키텍처

**맵으로서의 SCR.** 각 RGB-D 프레임 $\{\mathcal{I}^t, \mathcal{D}^t\}$은 고정된 특징 추출기를 통과하여 $M$개의 특징 $\{(\mathbf{f}_i^t, \mathbf{x}_i^t, d_i^t)\}$(디스크립터, 2D 키포인트, 깊이)을 얻는다; 키포인트는 로컬 3D 좌표 $\mathbf{y}_i^t = \boldsymbol{\pi}^{-1}_{\mathbf{K}}(\mathbf{x}_i^t, d_i^t)$로 역투영된다. 맵 $\mathcal{M}$은 각 특징에 대해 전역 좌표 $\tilde{\mathbf{y}}_i = \mathcal{M}(\mathbf{f}_i) \in \mathbb{R}^3$를 직접 회귀하는 작은 장면 특화 네트워크다 — 완전히 병렬적이며 광선 샘플링이 필요 없다. SLAM은 픽셀별 잔차에 대한 포즈와 맵의 결합 자기지도 최적화다.

$$r_i^t(\mathcal{M}, \mathbf{P}^t) = \lVert \mathcal{M}(\mathbf{f}_i^t) - \mathbf{P}^t \mathbf{y}_i^t \rVert^2, \qquad \{\mathcal{M}^\ast, \mathcal{P}^\ast\} = \arg\min_{\mathcal{M}, \mathcal{P}} \sum_{\mathbf{P}^t \in \mathcal{P}} \sum_i r_i^t(\mathcal{M}, \mathbf{P}^t),$$

실측 지도 없이, 명시적인 특징 매칭 없이 이루어지며 — 프레임들은 오직 공유된 암묵적 맵을 통해서만 상호작용하고, 이로부터 창발적인 암묵적 매칭과 *소프트 루프 클로저*가 나온다.

**TriMLP 헤드.** ACE의 직접 회귀 MLP(HomMLP) 대신, 소형 MLP가 세 개의 직교 평면 위에 이산화된 그리드에 대한 분류 로짓을 예측한다: $C_i^{XY}, C_i^{XZ}, C_i^{YZ} = \mathrm{softmax}(\mathrm{MLP}(\mathbf{f}_i))$; 각 평면은 자신의 기저 그리드에 대한 가중 평균으로 좌표에 투표하며, 예를 들어 $(\tilde{x}_i^{XZ}, \tilde{z}_i^{XZ}) = \sum B^{XZ} \odot C_i^{XZ}$이고, 최종 좌표는 평면 간 호환되는 구성요소를 평균한다($\tilde{x}_i = \tfrac{1}{2}(\tilde{x}_i^{XY} + \tilde{x}_i^{XZ})$ 등). 이 투표 방식은 특징이 동일한 3D 점에 도달할 수 있는 여러 유효한 경로를 제공하는 귀납적 편향이며, 온라인 적응을 빠르게 한다.

**추적 = 재위치 인식.** 매 프레임의 포즈는 예측된 좌표와 관측된 좌표의 강체 정렬로 추정된다, $\mathbf{P}^t = \arg\min_{\mathbf{P}} \sum_i \lVert \tilde{\mathbf{y}}_i^t - \mathbf{P}\mathbf{y}_i^t \rVert^2$, 이는 샘플링된 삼중점(최대 $H$개의 가설)에 대한 RANSAC 내부에서 폐형(Kabsch–Umeyama)으로 풀린다. 승리한 가설의 인라이어 비율 $\lambda^t$는 품질 신호를 동시에 제공하므로, 포즈 사전 정보가 필요 없어 추적 손실 후 재위치 인식, 프레임 스킵, 동적 물체에 대한 강건성이 자연스럽게 뒤따른다.

**PTAM 스타일 루프.** 최적화 사이클은 윈도우 $\mathcal{W}$에 대한 포즈 추정과 매핑을 번갈아 수행한다: 가장 최근의 $W_L$개 키프레임, 최신 프레임, 그리고 $p^t \propto \tfrac{1}{|\mathcal{P}|} + \alpha(1 - \lambda^t)$의 확률로 샘플링된 최대 $W_G$개의 키프레임 — 정렬이 나쁜 프레임 쪽으로 편향된다(소프트 루프 클로저). 특징 샘플링도 같은 방식으로 편향되며, 매핑은 사이클당 잔차 손실에 대한 몇 번의 SGD 미니배치이므로 사이클당 연산량은 일정하게 유지된다. 특징은 기본적으로 1/8 해상도의 밀집 ACE 인코더 특징이다(희소 SuperPoint도 지원됨); 추출기는 고정된 채로 유지된다.

## 실험 결과

모든 실험은 RTX 4090 + i7-12700K에서 3회 실행 평균으로 수행된다; 처리가 프레임 간격을 초과하면 프레임이 *스킵*되어, 라이브 피드를 충실하게 모방한다.

- **효율성**(Replica, 기본 구성): ACE-SLAM은 1.11 MB 맵으로 등가 29.71 FPS = 실시간 비율 99.0%로 동작하며, ESLAM 7.35 FPS / 24.5% / 45.46 MB, NICE-SLAM 0.33 FPS / 1.1% / 95.86 MB, Point-SLAM 0.27 FPS / 0.9% / 27.23 MB, iMAP* 0.15 FPS / 0.5%와 비교해 최대 두 자릿수 더 빠르다. 새 프레임의 종단간 위치 추정은 11 ms(ACE 특징) 또는 13 ms(SuperPoint)가 걸린다.
- **정적 ATE RMSE**: iMAP*와 경쟁력 있고 NICE-SLAM에 근접한다. 예를 들어 Replica room-0에서 0.027 m(NICE-SLAM 0.017, iMAP* 0.031), TUM fr2/xyz 0.016 m, fr1/desk 0.083 m — 정확도는 최신 렌더링 기반 파이프라인에 미치지 못하지만, 엄격한 실시간으로 동작하는 유일한 시스템이다. TriMLP는 HomMLP를 명확히 능가한다(예: ScanNet 0000: 0.164 대 0.364 m; 0106: 0.319 대 0.765 m).
- **동적 TUM-RGBD**, 의미론적 사전 정보 *없이*: fr3/w/xyz 0.072 m 대 NICE-SLAM 0.302, 의미론 기반 NID-SLAM 0.071; fr3/s/static 0.007 m — 특화된 동적 SLAM 파이프라인과 대등하거나 그보다 우수한데, 이는 상시 동작하는 RANSAC 재위치 인식이 자연스럽게 움직이는 영역을 배제하기 때문이다.

## SLAM에서의 의미

ACE-SLAM은 DSAC, ACE, ACE Zero를 거치며 오프라인 재위치 인식 기법으로 성숙한 장면 좌표 회귀가, 메가바이트 규모의 프라이버시 보존 맵을 유지하면서 라이브 SLAM 루프에서 추적, 매핑, 재위치 인식, (소프트) 루프 클로저를 위한 *단일* 표현으로 동작할 수 있음을 보여준다. 이는 재위치 인식기 중심 SLAM 설계의 명확한 시연이며, 렌더링 기반 신경 암묵적 SLAM에 대한 엄격한 실시간 대안이자, (지금까지의) ACE 계보의 자연스러운 종착점이다.

## 관련 문서

- [ACE](ace.md)
- [ACE Zero](ace-zero.md)
- [iMAP](../level-03-monocular-slam/imap.md)
- [NICE-SLAM](../level-03-monocular-slam/nice-slam.md)
- [ACE-G](ace-g.md)
- [SuperPoint](superpoint.md)
