# DSP-SLAM

> Wang (UCL) 2021 · [논문](https://arxiv.org/abs/2108.09481)

**한 줄 요약** — 범주 수준(category-level) DeepSDF 형상 사전(shape prior)으로 ORB-SLAM2를 보강하여, 단안·스테레오·스테레오+LiDAR 입력으로부터 온라인으로 완전하고 밀도 높은 객체 모델을 재건.

## 문제

사전 정보 없는 객체 수준 SLAM 시스템(예: Fusion++)은 카메라가 관측한 만큼만 각 객체를 재건합니다. 부분적인 시점은 부분적이고 품질이 낮은 모델을 만들어내며, 반면 인스턴스 데이터베이스 기반 시스템(SLAM++)은 모든 객체를 사전에 스캔해야 합니다. DeepSDF와 같은 학습된 형상 사전은 희소한 관측으로부터 보이지 않는 객체 부분을 완성할 수 있지만, 심층 암묵적 형상 모델을 실시간 SLAM 루프에 통합하는 것 — 온라인 포즈 추적, 희소하고 부분적인 데이터, 그리고 결합 지도와 함께 — 은 열린 문제였습니다. FroDO와 같은 사전 기반 재건기는 느린 배치 방식이었고, NodeSLAM은 밀도 깊이가 필요했습니다. DSP-SLAM은 전경(foreground)에 대해서는 밀도 객체 모델을, 배경에 대해서는 희소 랜드마크 점을 갖는 결합 지도를 구축하여 이 간극을 메웁니다.

## 방법 및 아키텍처

ORB-SLAM2(단안 또는 스테레오)가 카메라 추적, 키프레임화, 희소 3D 포인트 클라우드를 제공합니다. 각 키프레임에서, Mask R-CNN 마스크와 3D 검출기가 각 객체 인스턴스 $I=\{\mathcal{B},\mathcal{M},\mathcal{D},\mathbf{T}_{co,0}\}$ — 2D 박스, 마스크, 희소 3D 점 관측(SLAM 점 또는 최소 50개의 LiDAR 점), 그리고 LiDAR/이미지 3D 검출기 또는 객체 점에 대한 PCA에서 얻은 초기 포즈를 제공합니다. 각 객체는 디코더 $s=G(\mathbf{x},\mathbf{z})$를 갖는 DeepSDF 잠재 코드 $\mathbf{z}\in\mathbb{R}^{64}$와 7-DoF 포즈 $\mathbf{T}_{co}\in \mathbf{Sim}(3)$로 표현됩니다. 형상과 포즈는 두 개의 에너지를 최소화하여 추정됩니다. 표면 일관성 항은 관측된 역투영 점을 영 레벨 셋(zero level set) 위로 밀어붙입니다.

$$E_{surf}=\frac{1}{\lvert\mathbf{\Omega}_{s}\rvert}\sum_{\mathbf{u}\in\mathbf{\Omega}_{s}}G^{2}\big(\mathbf{T}_{oc}\,\pi^{-1}\!\left(\mathbf{u},\mathcal{D}\right),\,\mathbf{z}\big)$$

이 항만으로는 부분 관측 하에서 형상이 과도하게 커질 수 있어, 실루엣을 인식하는 깊이 감독을 추가하는 미분 가능한 SDF 렌더러를 사용합니다. 각 픽셀 레이를 따라, $M$개의 샘플링된 깊이가 예측된 SDF(구간선형 절단, $\sigma=0.01$)로부터 점유율 $o_i$를 얻고, 레이 종료 사건 확률 $\phi_{i}=o_{i}\prod_{j=1}^{i-1}(1-o_{j})$와 기대 렌더링 깊이 $\hat{d}_{\mathbf{u}}=\sum_{i=1}^{M+1}\phi_{i}d_{i}$를 얻어 다음을 산출합니다.

$$E_{rend}=\frac{1}{\lvert\mathbf{\Omega}_{r}\rvert}\sum_{\mathbf{u}\in\mathbf{\Omega}_{r}}(d_{\mathbf{u}}-\hat{d}_{\mathbf{u}})^{2}$$

여기서 $\mathbf{\Omega}_{r}$은 박스 내부이면서 마스크 바깥에 있는 픽셀들을 추가하며, 이 픽셀들에는 배경 깊이 $1.1\,d_{max}$가 할당됩니다. 이는 실루엣 밖으로 새어나가는 형상에 페널티를 부과합니다. 전체 에너지 $E=\lambda_{s}E_{surf}+\lambda_{r}E_{rend}+\lambda_{c}\lVert\mathbf{z}\rVert^{2}$ ($\lambda_s=100$, $\lambda_r=2.5$, $\lambda_c=0.25$)는 $\mathbf{z}=\mathbf{0}$에서 시작하여 네트워크를 통과하는 해석적 야코비안을 갖는 Gauss-Newton으로 최소화됩니다. 이는 반복당 1차 하강법보다 약 한 자릿수 더 빠르며(두 항을 모두 사용할 때 20\,ms 대 183\,ms), 50회가 아닌 약 10회의 반복만 필요합니다. 재건된 객체는 이후 카메라 포즈 $C$, 객체 포즈 $O$, 점 $P$에 대한 결합 요인 그래프(factor graph)에 들어갑니다.

$$C^{*},O^{*},P^{*}=\mathop{\arg\min}_{\{C,O,P\}}\sum_{i,j}\big\lVert\mathbf{e}_{co}(\mathbf{T}_{wc_{i}},\mathbf{T}_{wo_{j}})\big\rVert_{\Sigma_{i,j}}+\sum_{i,k}\big\lVert\mathbf{e}_{cp}(\mathbf{T}_{wc_{i}},{}^{w}\mathbf{p}_{k})\big\rVert_{\Sigma_{i,k}}$$

카메라-객체 잔차는 $\mathbf{e}_{co}=\log(\mathbf{T}^{-1}_{co}\mathbf{T}^{-1}_{wc}\mathbf{T}_{wo})$이고 $\mathbf{e}_{cp}$는 표준 ORB-SLAM2 재투영 잔차이며, g2o에서 Levenberg-Marquardt로 풀립니다. 객체는 추가적인 랜드마크로 작동합니다. 데이터 연관은 3D 박스 거리(LiDAR) 또는 공유된 특징 매칭(단안/스테레오)으로 탐지 결과를 지도상의 객체와 매칭시킵니다. 재관측된 객체는 포즈만 갱신됩니다.

## 실험 결과

KITTI3D(7481 프레임, 단일 이미지 + LiDAR, 기준선과 동일한 DeepSDF 사전 및 초기화 사용)에서 DSP-SLAM은 거의 모든 객체 포즈 메트릭에서 자동 라벨링을 능가합니다: BEV AP@0.5 83.31 대 80.70 (Easy)와 75.28 대 63.36 (Moderate); nuScenes NS@0.5 88.01 대 86.52 (E)와 76.15 대 64.44 (M) — 시각적으로도 더 나은 형상을 보임(세단이 더 이상 "beetle" 형태로 재건되지 않음). KITTI 오도메트리 벤치마크에서, 스테레오+LiDAR DSP-SLAM은 평균 100\,m당 0.70%의 이동 오차 / 0.22\,deg의 회전 오차를 달성하여, 객체가 많은 시퀀스 03, 05, 06, 08에서 ORB-SLAM2 백본(0.72/0.22)을 개선하고, 프레임당 단 몇백 개의 LiDAR 점만 사용하면서도 SuMa++(0.70/0.29)와 대등한 성능을 보입니다. 객체당 50개 점으로 줄여도 정확도는 거의 변하지 않습니다(0.72/0.22). 스테레오 단독 실행은 0.75/0.25이며, 5\,Hz에서 키프레임당 BA를 수행하면 ORB-SLAM2와 일치합니다(0.72/0.22). 전체 시스템은 약 10\,fps로 실행되며, Freiburg Cars와 Redwood-OS chairs에서 단안 입력으로부터 완전한 객체 재건을 만들어냅니다.

## SLAM에서의 의미

DSP-SLAM은 온라인 객체 재건을 위해 학습된 암묵적 형상 사전을 통합한 최초의 SLAM 시스템으로, SLAM++의 비전 — 원시 기하가 아닌 객체로 이루어진 지도 — 을 딥러닝 시대에 맞게 갱신했습니다. 스캔된 CAD 모델 데이터베이스 대신 잠재 형상 공간이 범주 전체를 포괄합니다. 신경 SDF를 통한 2차 최적화는 딥 형상 피팅이 실시간 루프 안에서 동작할 수 있음을 보여주었으며, 고전적인 객체 수준 SLAM(SLAM++, Fusion++, NodeSLAM)과 이후의 신경 필드 기반 객체 매핑(vMAP) 사이의 핵심적인 다리 역할을 합니다. 서펠 뒤범벅이 아니라 의미론적으로 의미 있고 완전한 객체 모델이 필요할 때 좋은 참고가 됩니다.

## 실습

- [DSP-SLAM 실행하기](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/dsp_slam)

## 관련 문서

- [SLAM++](slampp.md) — CAD 모델 데이터베이스를 사용하는 원조 객체 지향 SLAM
- [Fusion++](fusionpp.md) — 형상 사전 없이 객체별 TSDF를 사용하는 방식
- [MoreFusion](morefusion.md) — 조작(manipulation)을 위한 포즈 추정을 갖춘 객체 수준 융합
- [ORB-SLAM2](../level-03-monocular-slam/orb-slam2.md) — 기반이 되는 SLAM 백본
- [NodeSLAM](../level-05-deep-learning/nodeslam.md) — 밀도 깊이로부터의 형상 사전 SLAM, 가장 가까운 동시대 연구
- [vMAP](../level-03-monocular-slam/vmap.md) — 다음 단계로서의 객체별 신경 필드
