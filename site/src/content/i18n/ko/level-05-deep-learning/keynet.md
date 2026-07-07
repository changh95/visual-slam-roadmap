# KeyNet

> Barroso-Laguna 2019 · [논문](https://arxiv.org/abs/1904.00889)

**한 줄 요약** — Hand-crafted 미분 필터와 소수의 학습된 CNN 레이어를 결합한 얕은 멀티스케일 아키텍처인 학습된 keypoint 검출기(Key.Net)로, 스케일 전반에서 keypoint 반복성(repeatability)을 최대화하도록 학습됩니다.

## 문제

고전적 검출기(Harris, DoG)는 hand-crafted 미분 필터와 스케일 공간 휴리스틱으로 구축됩니다: 해석 가능하고 저비용이지만, 실제로 중요한 속성 — 실제 시점 및 스케일 변화 하에서의 반복성 — 에 대해 최적화되어 있지 않습니다. 완전히 학습된 검출기는 반대 극단으로 가지만, 2019년 당시 hand-crafted 검출기에 대한 그 우위는 명확히 입증되지 않았습니다: CNN 검출기는 특히 스케일에서 어려움을 겪었으며, 기울기 구조를 다시 발견하는 데 용량을 낭비했습니다. Key.Net은 올바른 hand-crafted 구조로 초기화(seed)된 소형 네트워크가 둘 다를 능가할 수 있는지 묻습니다.

## 방법 및 아키텍처

**Hand-crafted + 학습된 필터.** 첫 번째 레이어는 Harris와 Hessian 정신에 따른 10개의 미분 기반 필터로 구성된 고정된(frozen) 뱅크입니다: 1차 맵 $I_x$, $I_y$, $I_x I_y$, $I_x^2$, $I_y^2$와 2차 맵 $I_{xx}$, $I_{yy}$, $I_{xy}$, $I_{xx} I_{yy}$, $I_{xy}^2$. 이들은 소프트 앵커 역할을 하며, 그 뒤를 잇는 세 개의 학습된 블록(각각 $M=8$개 필터의 5x5 컨볼루션 + batch norm + ReLU)이 특징을 위치화, 채점, 순위화합니다. 하드코딩된 필터는 학습 가능한 파라미터 수를 줄이고 학습을 안정화합니다.

**네트워크 내부의 스케일 공간.** 입력은 세 개의 피라미드 레벨(1.2배씩 블러 및 다운샘플링)에서 처리되며, 모든 스트림이 가중치를 공유합니다. 특징 맵은 업샘플링, 연결(concatenate)된 후 최종 학습 필터로 융합되어 단일 응답 맵 $\mathcal{R}$이 됩니다. Ablation: 레벨 1개는 검증 반복성 72.5, 레벨 3개는 79.1이며, 3개를 초과하면 이득이 거의 없습니다.

**Index Proposal (IP) 레이어.** Keypoint 추출을 통해 미분 가능하게 학습하기 위해, $\mathcal{R}$의 각 $N\times N$ 윈도우 $w_i$는 공간 softmax에 의해 소프트 좌표로 변환됩니다.

$$m_{i}(u,v)=\frac{e^{w_{i}(u,v)}}{\sum_{j,k}^{N}e^{w_{i}(j,k)}}, \qquad [x_{i},y_{i}]^{T}=\sum_{u,v}^{N}[W\odot m_{i},\;W^{T}\odot m_{i}]^{T}+c_{w}$$

이는 non-maximum suppression을 대체하는 미분 가능한 방식입니다($W$는 인덱스 값을 담고 있고, $c_w$는 윈도우 코너입니다). 이미지 $I_a, I_b$ 사이의 ground-truth homography $H_{b,a}$가 주어지면, covariant 제약 손실은 한 이미지의 IP 좌표를 다른 이미지의 NMS 최댓값으로 회귀합니다:

$$\mathcal{L}_{IP}(I_{a},I_{b},H_{a,b},N)=\sum_{i}\alpha_{i}\,\|[x_{i},y_{i}]^{T}_{a}-H_{b,a}[\hat{x}_{i},\hat{y}_{i}]^{T}_{b}\|^{2}, \quad \alpha_{i}=\mathcal{R}_{a}(x_{i},y_{i})+\mathcal{R}_{b}(\hat{x}_{i},\hat{y}_{i})$$

이는 중요한 특징만 손실에 기여하도록 하며, 손실은 양방향으로 대칭적으로 계산됩니다.

**Multi-Scale Index Proposal (M-SIP).** 손실은 가중치 $\lambda_s\in\{256,64,16,4,1\}$과 함께 윈도우 크기 $N_s\in\{8,16,24,32,40\}$에 대해 평균화됩니다:

$$\mathcal{L}_{MSIP}(I_{a},I_{b},H_{a,b})=\sum_{s}\lambda_{s}\,\mathcal{L}_{IP}(I_{a},I_{b},H_{a,b},N_{s})$$

이는 네트워크가 여러 문맥 크기에서 지배적으로 남는 keypoint에 가장 높은 점수를 부여하도록 강제합니다 — 채점과 순위화가 손실 자체로부터 자연스럽게 나타납니다. Ablation: 5개 윈도우 전체는 79.1의 반복성을 주는 반면, 8x8 윈도우 단독으로는 70.5입니다.

**저비용 학습 데이터.** ImageNet으로부터 생성된 192x192 크기 이미지 쌍 12,000개, 무작위 스케일[0.5, 3.5], 왜곡(skew), 회전(±60°), photometric jitter를 포함 — 수작업 주석 없이 ground-truth 대응 관계를 무료로 얻습니다. Siamese 구성의 Key.Net 쌍은 약 30 epoch(GTX 1080 Ti에서 약 2시간)에 수렴합니다.

## 실험 결과

- **HPatches 반복성** (상위 1000개 점, IoU 오차 < 0.4): 시점(viewpoint) 시퀀스에서 Key.Net-SI가 최고로 60.5(스케일+위치)/73.2(위치만)이며, SuperPoint-TI는 33.3/67.1, LF-Net-SI는 32.3/62.2, 최고의 hand-crafted 방법인 MSER-SI는 56.4/62.8입니다. 조명(illumination) 시퀀스에서는 단일 스케일 Key.Net-TI가 72.0으로 우승하며, 이 설정을 위해 설계된 TILDE-TI(70.4)를 상회합니다.
- **매칭** (공통 HardNet descriptor 사용): Key.Net+HardNet은 시점 매칭 점수가 38.4로 최고이며, SuperPoint(자체 descriptor 사용 시 38.0, HardNet 사용 시 37.4)를 근소하게 앞섭니다. LF-Net+HardNet은 조명에서 우세합니다(43.8 대 Key.Net의 39.7).
- **복잡도**: SuperPoint의 검출기는 약 940k개의 학습 가능한 파라미터를 사용합니다 — Key.Net은 약 160배 더 적고, Tiny-Key.Net(모두 hand-crafted 필터 + 학습된 필터 1개)은 약 3,100배 더 적으면서도 SuperPoint의 시점 반복성을 여전히 상회합니다. 600x600 이미지 추론: Tiny는 5.7ms, Key.Net은 31ms입니다.

## SLAM에서의 의미

SLAM 프론트엔드는 검출기 반복성에 생사가 걸려 있습니다: 동일한 3D 점이 프레임 전반에서 재검출되지 않으면 어떤 descriptor도 매칭을 구할 수 없습니다. Key.Net은 고전적 검출기의 사전 지식(hand-crafted 필터, 스케일 공간)을 소형 학습 모델에 주입하면 순수 hand-crafted 검출기와 순수 학습 검출기 모두를 반복성 측면에서 능가하면서도 실시간 파이프라인에 충분히 가벼움을 유지할 수 있음을 보여주었습니다 — 임베디드 SLAM에 직접적으로 관련된 설계 지점입니다.

## 관련 문서

- [SuperPoint](superpoint.md) — 자기 지도 학습 기반 검출기-descriptor 결합 모델
- [HardNet](hardnet.md) — Key.Net과 흔히 짝을 이루는 학습된 descriptor
- [R2D2](r2d2.md) — 신뢰성 인식 검출 및 기술(description)
- [DISK](disk.md) — 강화학습으로 학습된 대안
- [Keypoints](../level-02-getting-familiar/keypoints.md) — 검출에 대한 고전적 배경 지식
- [Learned vs hand-crafted](learned-vs-hand-crafted.md) — Key.Net이 의도적으로 양다리를 걸치는 트레이드오프
