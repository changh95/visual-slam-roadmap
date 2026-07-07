# DeepTAM

> Zhou 2018 · [논문](https://arxiv.org/abs/1808.01900)

**한 줄 요약** — DeepTAM(ECCV 2018)은 DTAM을 학습 기반으로 재구성한 것이다: coarse-to-fine 추적 네트워크가 합성된 키프레임 뷰에 대해 포즈 증분을 추정하고, 매핑 네트워크는 현재 추정값 주변의 좁은 대역(narrow band)에서 정제된 평면 스위프(plane-sweep) 비용 볼륨으로부터 키프레임 깊이를 추출한다.

## 문제

고전적인 밀집 추적 및 매핑(DTAM, LSD-SLAM)은 직접 광도 최소화와 수작업 정규화 항에 의존하며, 텍스처가 낮은 영역에서 취약하고 좋은 초기화를 필요로 한다. 단순한 학습 기반 대안들(DeepVO, SfM-Learner, UnDeepVO)은 두 프레임 사이의 모션을 회귀하며 학습 데이터셋의 모션 통계 — KITTI 스타일의 평면적 3-DoF 모션 — 를 그대로 물려받아, 완전한 6-DoF 추적으로는 잘 일반화되지 않는다. DeepTAM은 검증된 추적/매핑 아키텍처를 유지하면서도 키프레임 기반 밀집 카메라 추적과 깊이 맵 추정을 *완전히 학습*할 수 있는지를 묻는다.

## 방법 및 아키텍처

**추적.** 현재 이미지 $\mathbf{I}^C$와 키프레임 $(\mathbf{I}^K, \mathbf{D}^K)$(이미지 + 역깊이)가 주어지면, 목표는 변환 $\mathbf{T}^{KC}$이며 $\mathbf{T}^{C}=\mathbf{T}^{K}\mathbf{T}^{KC}$, 모두 $\mathbf{SE}(3)$ 위에 있다. 이를 직접 회귀하는 대신, DeepTAM은 현재 포즈 추정값 $\mathbf{T}^V$에서 *가상 키프레임(virtual keyframe)* $(\mathbf{I}^V, \mathbf{D}^V)$를 렌더링하고 작은 증분만을 학습한다.

$$\mathbf{T}^{C}=\mathbf{T}^{V}\,\delta\mathbf{T}, \qquad \delta\mathbf{T}=f(\mathbf{I}^{C},\mathbf{I}^{V},\mathbf{D}^{V}),$$

이는 "학습 문제를 크게 단순화하고 카메라 모션에 대한 데이터셋 편향을 완화한다." 세 개의 인코더-디코더 네트워크가 $80\times 60$, $160\times 120$, $320\times 240$ 해상도로 coarse-to-fine으로 실행되며, 각각은 새로 렌더링된 가상 키프레임에 대해 증분 $\delta\mathbf{T}_i$를 예측하고, 최종 포즈는 모든 증분의 곱이다. 보조 optical flow 브랜치(학습 중에만 활성화)는 인코더가 모션 특징을 학습하도록 강제한다. 하나의 포즈 대신, 가중치를 공유하는 $N=64$개의 완전 연결 브랜치가 가설 $\delta\boldsymbol{\xi}_i=(\mathbf{r}_i,\mathbf{t}_i)^{\top}$(각-축(angle-axis) 회전 + 이동)를 출력하며 다음과 같이 평균화된다:

$$\delta\boldsymbol{\xi}=\frac{1}{N}\sum_{i=1}^{N=64}\delta\boldsymbol{\xi}_{i}.$$

손실 $\mathcal{L}_{\text{tracking}}=\mathcal{L}_{\text{flow}}+\mathcal{L}_{\text{motion}}+\mathcal{L}_{\text{uncertainty}}$는 flow endpoint error, 가중 포즈 오차 $\mathcal{L}_{\text{motion}}=\alpha\lVert\mathbf{r}-\mathbf{r}_{\text{gt}}\rVert_2+\lVert\mathbf{t}-\mathbf{t}_{\text{gt}}\rVert_2$, 그리고 가설들의 분산(샘플로부터 추정된 공분산 $\mathbf{\Sigma}$)에 대한 다변량 라플라스 분포의 음의 로그 가능도를 결합하며, 이는 네트워크가 서로 다른 가설을 예측하도록 유도한다. 가상 키프레임은 데이터 증강 역할도 겸한다: ground truth 주변에서 $\mathbf{T}^V_0$를 샘플링함으로써 편향된 학습 데이터(SUN3D, SUNCG)에도 불구하고 모든 6-DoF 모션을 시뮬레이션한다.

**매핑.** 키프레임당 깊이는 평면 스위프 비용 볼륨으로부터 얻어진다. 픽셀 $\mathbf{x}$와 깊이 라벨 $d$에 대해, 광일치성(photoconsistency)은 $m$개의 프레임에 걸쳐 누적된다:

$$\mathbf{C}(\mathbf{x},d)=\sum_{i\in\{1,..,m\}}\rho_{i}(\mathbf{x},d)\cdot w_{i}(\mathbf{x}),$$

여기서 $\rho_i$는 키프레임과 워핑된 이미지 사이의 $3\times 3$ 패치의 SAD이고, $w_i$는 비용 곡선이 명확한 유일 최솟값 $d^*$를 가질 때 1에 가까운 매칭 신뢰도 가중치다. **고정 대역(fixed-band) 모듈**(깊이 범위에 균등하게 배치된 32개의 라벨, 입력은 $\mathbf{I}^K$ + 비용 볼륨)은 보간 계수 $\mathbf{s}_{fb}$를 회귀하여 $\mathbf{D}_{fb}=(1-\mathbf{s}_{fb})\cdot d_{min}+\mathbf{s}_{fb}\cdot d_{max}$를 얻는다 — 이는 일반화에 도움이 되는 스케일 무관 출력이다. 이어서 **좁은 대역(narrow-band) 모듈**이 반복적으로 동작한다: 이전 추정값을 중심으로 픽셀별 라벨 $b_{i}=d_{\text{prev}}+i\cdot\sigma_{\text{nb}}\cdot d_{\text{prev}}$(대역폭 $\sigma_{nb}=0.0125$)로 비용 볼륨을 재구성하고, 하나의 인코더-디코더가 이를 미분 가능한 soft argmin으로 읽어내는 학습된 비용 볼륨으로 변환하며, 두 번째 인코더-디코더가 그 결과를 정규화한다 — 이 조합은 변분 방법(variational method)의 데이터 항과 매끄러움 항을 교대로 적용하는 것과 유사하게 작동한다.

## 실험 결과

- **추적(TUM RGB-D 벤치마크, 이동 RMSE, m/s):** 평균 0.040 대 Kerl et al.의 프레임-대-키프레임 RGB-D SLAM 오도메트리의 0.060 — 키프레임에만 데이터셋 깊이를 사용했음에도 그렇다. Ablation: flow 과제 없이 0.050, 다중 가설 없이 0.043. 벤치마크에 대한 학습이나 미세 조정은 하지 않았다.
- **추적 + 매핑:** fr1 시퀀스 전체에서 평균 0.086 대 CNN-SLAM(포즈 그래프 최적화 없이 실행)의 0.253.
- **매핑(10프레임 시퀀스, MVS/SUNCG/SUN3D 테스트 분할):** 모든 지표와 데이터셋에서 최고 성능 — 예를 들어 MVS에서 L1-inv 0.036 대 DTAM 0.086, DeMoN 0.059; SUNCG에서 sc-inv 0.128 대 SGM 0.248, DTAM 0.343, DeMoN 0.383. 프레임이 많을수록 도움이 된다(MVS L1-inv 프레임 2개 0.117 대 프레임 10개 0.083)이며 좁은 대역 반복은 약 3회 이후 수렴한다(1회 반복 0.076 대 3회 반복 0.065).
- **강건성:** 포즈 노이즈가 증가할수록(표준편차 최대 $0.6|\boldsymbol{\xi}|$) SGM과 DTAM은 빠르게 저하되지만 DeepTAM은 장면 구조를 유지한다; 미세 조정 없이 KITTI로의 정성적 일반화도 확인된다.

## SLAM에서의 의미

DeepTAM은 고전적인 밀집 추적-및-매핑 아키텍처가 딥러닝으로의 전환을 견뎌낼 수 있음을 보여주었다: 구조(키프레임, 비용 볼륨, 증분적 정렬)는 유지하고, 고전적 방법이 잘하지 못하는 구성 요소(강건한 정렬, 깊이 정규화)를 학습한다. 이 증분 정렬 아이디어는 RAFT와 DROID-SLAM의 반복적 업데이트 연산자를 예고하며, DTAM 시대의 밀집 SLAM과 오늘날의 학습 기반 시스템 사이를 잇는 중요한 개념적 연결점이 된다.

## 관련 문서

- [DTAM](../level-03-monocular-slam/dtam.md)
- [DeepV2D](deepv2d.md)
- [DeMoN](demon.md)
- [TANDEM](tandem.md)
- [DVO](../level-04-rgbd-slam/dvo.md)
- [CNN-SLAM](../level-03-monocular-slam/cnn-slam.md)
