# EDS

> Hidalgo-Carrió 2022 · [논문](https://rpg.ifi.uzh.ch/docs/CVPR22_Hidalgo.pdf)

**한 줄 요약** — EDS(Event-aided Direct Sparse Odometry)는 이벤트와 프레임을 하나의 광도계 프레임워크에서 융합하는 최초의 직접 단안 VO입니다: 이벤트 생성 모델을 통해 키프레임에 대해 추적된 이벤트는, 빠른 움직임이 프레임 전용 직접 VO를 무너뜨리는 프레임 사이의 "맹점 시간"에도 추적을 유지시킵니다.

## 문제

DSO는 고그래디언트 희소 포인트 집합에 대한 광도계 번들 조정 덕분에 가장 정확한 프레임 기반 VO 시스템 중 하나이지만, 그 추적은 연속된 프레임이 광도계 정렬에 충분히 겹친다고 가정합니다. 이 가정은 빠른 카메라 움직임, 모션 블러, 낮은 프레임 레이트에서 무너집니다. 이벤트는 바로 그 간극에서 빠진 신호를 정확히 담고 있지만, 단순하게 끼워 넣을 수는 없습니다: 직접법은 절대 이미지 강도에서 작동하는 반면, 이벤트는 밝기 *변화*를 인코딩합니다. EDS는 이벤트 생성 모델을 통해 둘 사이의 원칙적인 변환을 제공합니다.

## 방법 및 아키텍처

**이벤트 생성 모델(EGM).** 이벤트 $e_k = (\mathbf{u}_k, t_k, p_k)$는 로그 밝기가 대비 감도 $C$만큼 변할 때 발화합니다: $\Delta L(\mathbf{u}_k, t_k) = p_k C$. $N_e$개 이벤트의 윈도우에 걸쳐 극성을 누적하면 밝기 증분 이미지 $\Delta L(\mathbf{u}) = \sum_{t_k \in \mathcal{T}} p_k C\, \delta(\mathbf{u} - \mathbf{u}_k)$를 얻습니다(EDS는 누적 블러를 줄이기 위해 *가우시안 가중* 극성 $w_k p_k$를 누적합니다). 이는 작은 $\Delta t$에 대해 다음과 같이 선형화됩니다:

$$\Delta L(\mathbf{u}) \approx -\nabla L(\mathbf{u}) \cdot \mathbf{v}(\mathbf{u})\, \Delta t.$$

**프론트엔드(추적).** 키프레임은 밝기 프레임 $\hat{L}$과 반밀집 역깊이 맵을 보유합니다. 이미지 포인트 속도는 순전히 기하학적입니다: $\mathbf{v}(\mathbf{u}) = \mathrm{J}(\mathbf{u}, d_{\mathbf{u}})\, \dot{\mathrm{T}}$, 여기서 $\mathrm{J}$는 깊이 $d_{\mathbf{u}}$를 가진 픽셀 $\mathbf{u}$의 $2\times 6$ 특징 감도 행렬이고 $\dot{\mathrm{T}} = (\mathbf{V}^\top, \boldsymbol{\omega}^\top)^\top$는 카메라의 선형/각속도입니다. 이는 프레임으로부터 밝기 변화 $\Delta \hat{L}(\mathbf{u}) \approx -\nabla \hat{L}(\mathbf{u}) \cdot \mathrm{J}(\mathbf{u}, d_{\mathbf{u}})\, \dot{\mathrm{T}}\, \Delta t$를 예측합니다. 카메라 추적은 6자유도 포즈 증분과 속도를 이벤트 패킷에 대해 공동 최적화하며, Huber 노름 $\gamma$ 아래 정규화된 증분을 매칭합니다:

$$(\delta \mathrm{T}^{\ast}, \dot{\mathrm{T}}^{\ast}) = \arg\min_{\delta \mathrm{T}, \dot{\mathrm{T}}} \left\| \frac{\Delta \hat{L}}{\|\Delta \hat{L}\|_2} - \frac{\Delta L}{\|\Delta L\|_2} \right\|_{\gamma},$$

이는 선택된 고그래디언트 윤곽 픽셀에서만 평가되며(예: 11×11 타일 방식으로 픽셀의 10~15%를 잘 분포시켜 유지), 이벤트 증분은 투영 $\mathbf{u}_e = \pi\big(T_{e,f}\, \pi^{-1}(\mathbf{u}_f, d_{\mathbf{u}_f})\big)$를 통해 키프레임으로 전달됩니다. 정규화는 미지의 대비 $C$를 상쇄합니다. 새로운 키프레임은 포인트의 20~30%가 시야를 벗어나거나 상대 회전이 임계값을 초과할 때 생성됩니다; 깊이는 k-d 트리 최근접 이웃 채움을 통해 새 키프레임으로 전파됩니다.

**백엔드.** 7개 키프레임의 슬라이딩 윈도우에 대한 광도계 번들 조정(2000~8000개 포인트, 8픽셀 잔차 패치, Huber 노름, Ceres)이 포즈와 역깊이를 정밀화하고, 이는 프론트엔드로 피드백됩니다 — 이 설계는 DSO의 PBA로 교체할 수 있을 만큼 모듈화되어 있습니다. 부트스트래핑은 프레임에 대해 고전적 다중 뷰 기하학, 학습된 단안 깊이, 또는 DSO의 대략적인 초기화기를 사용합니다.

## 실험 결과

- **스테레오 DAVIS 240C 데이터셋**(bin, boxes, desk, monitor; 모션 캡처 실측): EDS는 ATE 1.1 / 2.1 / 1.5 / 1.0 cm를 달성합니다 — *스테레오* 이벤트 방법 ESVO(2.8 / 5.8 / 3.2 / 3.3 cm), USLAM 이벤트+프레임+IMU(7.7 / 9.5 / 9.8 / 6.5 cm), EVO(13.2 / 14.2 / 5.2 / 7.8 cm, 두 시퀀스에서 조기 실패)보다 우수하며, 단안이고 IMU가 없음에도 그렇습니다. 회전 오차: 0.99 / 1.83 / 1.87 / 0.60도.
- 프레임 기반 기준선 대비, EDS는 이동 오차에서 단안 ORB-SLAM보다 일관되게 우수하고, DSO와 비슷하며(빠른 desk 시퀀스에서는 더 정확함, 1.5 cm 대 10.0 cm), 스테레오 ORB-SLAM보다는 약간 뒤처집니다.
- **저프레임레이트 연구**: 프레임 레이트가 떨어질수록 EDS의 오차는 거의 일정하게 유지되지만 DSO의 오차는 급격히 증가합니다(DSO의 복구 추적은 10 FPS 이하에서 실패); EDS는 루프 클로저 없는 ORB-SLAM도 능가합니다 — 이벤트가 멀리 떨어진 프레임 사이에서도 추적을 유지시킵니다.
- **민감도**: 추적은 깊이 잡음에는 점진적으로 저하되지만, 대비 임계값 잡음이 $\sigma_C > 0.15$를 초과하면 급격히 실패합니다.
- 이 연구는 하이브리드 시스템 평가를 위한 새로운 빔스플리터 리그 이벤트+프레임 데이터셋(EDS 데이터셋)도 도입했습니다.

## SLAM에서의 의미

EDS는 "이벤트를 향상 수단으로" 철학의 직접법 대응물입니다: EKLT가 특징 추적을 증강하고 Ultimate-SLAM이 특징 기반 VIO 백엔드를 증강하는 것처럼, EDS는 광도계 직접 오도메트리에서도 동일한 상호 보완성이 성립함을 보여줍니다. 이는 성숙한 프레임 기반 시스템이 전면 재설계 없이 표적화된 변경만으로 이벤트를 채택할 수 있음을 입증했으며 — 기존 직접 SLAM 파이프라인에 이벤트 강인성을 소급 적용하는 청사진입니다.

## 관련 문서

- [DSO](../level-03-monocular-slam/dso.md)
- [EVO](evo.md)
- [Ultimate-SLAM](ultimate-slam.md)
- [EKLT](eklt.md)
- [Event representations](event-representations.md)
