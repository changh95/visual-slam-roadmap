# SuperPoint

> DeTone 2017 · [논문](https://arxiv.org/abs/1712.07629)

**한 줄 요약** — Homographic Adaptation을 통해 학습된 자기 지도 관심점 검출기 및 descriptor로, 이미지 전체에 대해 단 한 번의 순전파(약 70 FPS)로 keypoint와 256차원 descriptor를 생성합니다.

## 문제

고전적인 검출기와 descriptor(SIFT, ORB)는 수작업으로 설계되어 조명 및 시점 변화에 취약하며, keypoint의 지도 학습은 까다로운 사실에 의해 막혀 있습니다: 사람 신체의 keypoint와 달리, "관심점"이라는 개념은 의미적으로 명확히 정의되지 않아 주석을 달 정답(ground truth)이 존재하지 않습니다. 패치 기반 학습 descriptor 역시 검출 위치 주변을 잘라내야 했기 때문에 효율적인 전체 이미지 추론이 불가능했습니다. SuperPoint는 수작업 라벨 *없이* 실제 이미지에서 검출기와 descriptor를 공동으로 학습시키는 완전 합성곱(fully-convolutional) 모델을 어떻게 만들 것인지를 다루며, 픽셀 단위의 keypoint와 descriptor를 단 한 번의 순전파로 계산합니다.

## 방법 및 아키텍처

**공유 인코더, 두 개의 head.** VGG 스타일 인코더(3x3 conv 레이어 8개, 64-64-64-64-128-128-128-128 채널, 2x2 max-pool 3회)가 $H \times W$ 이미지를 $H_c \times W_c$ 개의 "셀" 그리드로 매핑합니다($H_c = H/8$, $W_c = W/8$). 두 개의 디코더 head가 이 표현을 공유합니다:

- *관심점 디코더*: $\mathcal{X}\in\mathbb{R}^{H_c\times W_c\times 65}$를 계산합니다 — 각 8x8 픽셀 셀 내부 위치에 대한 64개 채널과 "관심점 없음"을 나타내는 더스트빈(dustbin) 하나. 채널별 softmax와 파라미터 없는 재구성(서브픽셀 컨볼루션)을 통해 업컨볼루션 비용과 체커보드 아티팩트를 피하면서 전체 해상도의 점수(point-ness) 히트맵을 복원합니다.
- *Descriptor 디코더*: 준밀집(semi-dense) $\mathcal{D}\in\mathbb{R}^{H_c\times W_c\times 256}$를 계산한 뒤 bi-cubic 보간과 L2 정규화를 적용하여 임의 픽셀에서 단위 길이의 descriptor를 얻습니다.

**합성 데이터 사전 학습(MagicPoint).** 검출기 경로는 먼저 *Synthetic Shapes* — 사각형, 삼각형, 선, 타원을 렌더링한 것으로, 그 모서리 위치가 구조적으로 모호하지 않은 데이터 — 에서 학습됩니다. 이 데이터에서 MagicPoint는 이미징 노이즈 하에 0.971 mAP를 달성하며, FAST 0.061, Harris 0.213, Shi-Tomasi 0.157에 비해 크게 높습니다.

**Homographic Adaptation.** 합성 데이터와 실제 데이터 사이의 간극을 넘어서기 위해, 이상적인 검출기는 호모그래피에 대해 공변(covariant)해야 합니다: ${\bf x}=\mathcal{H}^{-1}f_{\theta}(\mathcal{H}(I))$. 실제 검출기는 완벽히 공변하지 않으므로, $N_h$개의 무작위 호모그래피 워핑에 대한 응답을 다음과 같이 집계합니다:

$$\hat{F}(I;f_{\theta})=\frac{1}{N_{h}}\sum_{i=1}^{N_{h}}\mathcal{H}_{i}^{-1}f_{\theta}(\mathcal{H}_{i}(I))$$

$N_h=100$으로 실행하면(그 이상은 수익 감소: 100회 워핑에서 반복성 +21%, 1000회에서 +22%) 240x320 해상도의 MS-COCO 이미지 8만 장에 대해 두 차례 반복 적용하여, 어디에도 인간 라벨이 없는 자기 지도 학습을 위한 유사 정답(pseudo-ground-truth) keypoint를 생성합니다.

**공동 학습 손실.** 알려진 호모그래피 $\mathcal{H}$로 워핑된 이미지 쌍이 두 head를 동시에 지도합니다:

$$\mathcal{L}(\mathcal{X},\mathcal{X}',\mathcal{D},\mathcal{D}';Y,Y',S)=\mathcal{L}_{p}(\mathcal{X},Y)+\mathcal{L}_{p}(\mathcal{X}',Y')+\lambda\mathcal{L}_{d}(\mathcal{D},\mathcal{D}',S)$$

$\mathcal{L}_p$는 65개 클래스에 대한 셀 단위 교차 엔트로피입니다. Descriptor 힌지 손실은 워핑된 셀 중심이 8픽셀 이내에 위치할 때만 $s_{hwh'w'}=1$이 되는 대응 라벨과 마진 $m_p=1$, $m_n=0.2$를 사용합니다:

$$l_{d}({\bf d},{\bf d}';s)=\lambda_{d}\, s\,\max(0,m_{p}-{\bf d}^{T}{\bf d}')+(1-s)\max(0,{\bf d}^{T}{\bf d}'-m_{n})$$

여기서 $\lambda_d=250$은 희소한 양성 샘플과 풍부한 음성 샘플 사이의 균형을 맞추고, $\lambda=0.0001$은 두 손실 사이의 균형을 맞춥니다.

## 실험 결과

- **실행 속도**: 480x640 이미지에 대해 단일 순전파가 약 11.15 ms(Titan X), 여기에 CPU descriptor 샘플링 약 1.5 ms를 더해 총 약 13 ms — 즉 **70 FPS**입니다.
- **HPatches 반복성**(240x320, 300개 점, NMS=4): SuperPoint는 조명 변화 57개 시나리오에서 0.652로 전체 최고 성능이며, Harris 0.620, FAST/MagicPoint 0.575보다 우수합니다. 시점 변화 59개 시나리오에서는 0.503으로 FAST(0.503)와 동등하고 Harris(0.556)보다는 낮지만 MagicPoint(0.322)보다는 훨씬 높습니다 — Homographic Adaptation이 시점 강인성을 제공하는 것입니다.
- **HPatches 호모그래피 추정**(1000개 점, 480x640): $\epsilon=3$에서의 정확도는 0.684로, SIFT 0.676, LIFT 0.598, ORB 0.395보다 높습니다. SuperPoint는 descriptor 지표에서 압도적입니다: NN mAP 0.821, 매칭 점수 0.470으로 SIFT의 0.694 / 0.313을 앞섭니다. 서브픽셀 정밀도($\epsilon=1$: 0.424 대 0.310)에서는 SIFT가 서브픽셀 정제 덕분에 우위를 유지합니다.
- ORB는 원시 반복성은 가장 높지만 검출점이 군집을 이루어 호모그래피 추정 결과는 가장 나쁩니다 — 반복성만으로는 좋은 매처가 되지 않습니다.

## SLAM에서의 의미

SuperPoint는 딥-SLAM 시대의 *대표적인* 학습 기반 로컬 특징이 되었습니다: ORB가 실패하는 조명 및 시점 변화에 강인하면서도 실시간 프론트엔드에 쓸 수 있을 만큼 빠릅니다. SuperGlue/LightGlue와 hloc 위치 인식 생태계의 표준 백본이며, ORB-SLAM 스타일 시스템에도 도입되었습니다(예: DXSLAM은 고전적 파이프라인 안에 학습 기반 특징을 사용합니다). Homographic Adaptation 자체도 기하학적 학습을 위한 널리 재사용되는 자기 지도 학습 기법이 되었습니다.

## 실습

- [학습 기반 로컬 특징 검출](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch01_04)

## 관련 문서

- [SuperGlue](superglue.md) — SuperPoint 특징 위에 구축된 GNN 매처
- [R2D2](r2d2.md) — 신뢰성 인식 기반의 대안 검출기/descriptor
- [DISK](disk.md) — 강화학습으로 학습된 대안
- [XFeat](xfeat.md) — 엣지 디바이스를 위한 경량 후속 모델
- [hloc](hloc.md) — SuperPoint가 근간이 되는 위치 인식 생태계
- [DXSLAM](../level-03-monocular-slam/dxslam.md) — 고전적 SLAM 시스템 내부의 학습 기반 특징
