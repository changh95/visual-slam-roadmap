# YOLO (v1→v11)
> Redmon 2016→2024 · [논문](https://arxiv.org/abs/1506.02640)

**한 줄 요약** — "You Only Look Once"는 물체 검출을 단 한 번의 CNN 순전파로 풀리는 단일 회귀 문제로 재구성하여, SLAM 시스템이 시맨틱 및 동적 물체 추론을 위해 가장 흔히 사용하는 실시간 검출 계열을 확립했습니다.

## 문제
YOLO 이전에는 물체 검출이 분류기를 재활용하는 방식으로 이루어졌습니다: DPM은 모든 위치와 스케일에 걸쳐 분류기를 슬라이딩시켰고, R-CNN 계열은 영역 제안(region proposal)을 생성한 뒤 각각을 분류하고, 후처리에서 경계 상자를 정제, 중복 제거, 재점수화했습니다. 이런 복잡한 파이프라인은 느렸으며 — 카메라 프레임 속도에 훨씬 못 미쳤고 — 각 구성 요소가 별도로 학습되기 때문에 최적화하기도 어려웠습니다. 로보틱스에는 단일 학습 목적 함수로 한 번의 패스, 영상 속도로 동작하는 검출이 필요했습니다.

## 방법 및 아키텍처
- **그리드 회귀.** 이미지는 $S \times S$ 그리드로 나뉘며, 물체의 중심을 포함하는 셀이 그 물체를 검출할 책임을 가집니다. 각 셀은 $B$개의 경계 상자를 예측합니다 — 각각 $x, y, w, h$와 $\Pr(\text{Object}) \cdot \text{IOU}^{\text{truth}}_{\text{pred}}$로 정의된 확신도(confidence)를 가지며 — 여기에 해당 셀의 상자들이 공유하는 $C$개의 조건부 클래스 확률 $\Pr(\text{Class}_i \mid \text{Object})$가 더해집니다. 전체 출력은 단일 $S \times S \times (B \cdot 5 + C)$ 텐서입니다. Pascal VOC에서 $S{=}7$, $B{=}2$, $C{=}20$은 $7\times7\times30$ 텐서(이미지당 98개 상자)를 만듭니다. 테스트 시 클래스별 점수는 $\Pr(\text{Class}_i \mid \text{Object}) \cdot \Pr(\text{Object}) \cdot \text{IOU}^{\text{truth}}_{\text{pred}} = \Pr(\text{Class}_i) \cdot \text{IOU}^{\text{truth}}_{\text{pred}}$입니다.
- **네트워크.** 24개의 컨볼루션 레이어($1\times1$ 축소 + $3\times3$ conv, GoogLeNet에서 영감을 받음) 뒤에 2개의 완전 연결 레이어가 이어집니다. Fast YOLO는 9개의 conv 레이어를 사용합니다. 처음 20개의 conv 레이어는 $224\times224$ 해상도로 ImageNet에서 사전 학습되며(top-5 88%), 그 후 검출은 leaky-ReLU 활성 함수 $\phi(x) = x$(단 $x > 0$일 때), 그렇지 않으면 $0.1x$를 사용하여 $448\times448$에서 미세 조정됩니다.
- **다중 항목 제곱합 손실**, $\lambda_\text{coord} = 5$, $\lambda_\text{noobj} = 0.5$, 그리고 물체를 "담당"하는(현재 IOU가 가장 높은) 예측자를 선택하는 $\mathbf{1}_{ij}^{\text{obj}}$를 사용합니다:

$$\begin{aligned}
& \lambda_{\text{coord}} \sum_{i=0}^{S^2} \sum_{j=0}^{B} \mathbf{1}_{ij}^{\text{obj}} \left[ (x_i - \hat{x}_i)^2 + (y_i - \hat{y}_i)^2 \right] + \lambda_{\text{coord}} \sum_{i=0}^{S^2} \sum_{j=0}^{B} \mathbf{1}_{ij}^{\text{obj}} \left[ \left(\sqrt{w_i} - \sqrt{\hat{w}_i}\right)^2 + \left(\sqrt{h_i} - \sqrt{\hat{h}_i}\right)^2 \right] \\
& + \sum_{i=0}^{S^2} \sum_{j=0}^{B} \mathbf{1}_{ij}^{\text{obj}} (C_i - \hat{C}_i)^2 + \lambda_{\text{noobj}} \sum_{i=0}^{S^2} \sum_{j=0}^{B} \mathbf{1}_{ij}^{\text{noobj}} (C_i - \hat{C}_i)^2 + \sum_{i=0}^{S^2} \mathbf{1}_{i}^{\text{obj}} \sum_{c \in \text{classes}} \left(p_i(c) - \hat{p}_i(c)\right)^2
\end{aligned}$$

  $w, h$의 제곱근을 취하면 작은 상자의 오차가 더 크게 반영됩니다. 분류 손실은 물체를 포함하는 셀에만 적용됩니다. VOC 2007+2012에서 약 135 epoch 학습(배치 64, 모멘텀 0.9, 감쇠 0.0005, 드롭아웃 0.5, 스케일/이동/HSV 증강).
- **전역 컨텍스트.** 네트워크는 (제안 영역의 잘라낸 이미지가 아니라) 전체 이미지를 보므로 맥락 정보를 인코딩합니다. NMS는 R-CNN/DPM에서처럼 구조적으로 필수적인 것이 아니라 선택적인 정리 단계입니다(+2–3% mAP).
- **명시된 한계**(후속 버전을 이끌어낸 요인): 각 셀이 두 개의 상자와 하나의 클래스만 예측하므로, 그룹을 이룬 작은 물체(새 무리)는 다루기 어렵습니다. 다운샘플링 후 특징이 조대해집니다. 손실은 작은 상자와 큰 상자의 오차를 동일하게 취급합니다 — 위치 오차가 YOLO의 주된 오차 원인이었습니다.
- **긴 진화 계보(v1→v11).** 이후 버전들은 anchor box와 다중 스케일 예측, 더 강력한 백본과 학습 기법, 최근 세대에서의 anchor-free head를 추가하며, 실시간 검출을 위한 속도/정확도 파레토 프론티어 근처를 계속 유지해 왔습니다. Ultralytics 생태계(학습, ONNX/TensorRT 내보내기, 엣지 배포)는 YOLO가 로보틱스에서 기본 검출기로 남아 있는 주된 실용적 이유입니다.

## 실험 결과
Pascal VOC 2007에서 YOLO는 45 FPS에서 **mAP 63.4%**를, Fast YOLO는 155 FPS에서 **mAP 52.7%**를 달성합니다 — 30Hz DPM의 26.1% mAP와 비교되며, 정확하지만 느린 방법들 중 Fast R-CNN(0.5 FPS에서 70.0% mAP)과 Faster R-CNN(VGG-16, 7 FPS에서 73.2%)이 있습니다. VGG-16 YOLO는 21 FPS에서 66.4%를 기록합니다. 오차 분석에 따르면 Fast R-CNN은 배경 오탐(상위 검출의 13.6%)을 예측할 가능성이 거의 3배 높으며, Fast R-CNN을 YOLO로 재점수화하면 VOC 2007 mAP가 71.8%에서 **75.0%**로 올라갑니다. VOC 2012 테스트에서 YOLO는 57.9% mAP를 기록하며, 주로 작은 물체(bottle, sheep, tv/monitor에서 R-CNN보다 8–10% 낮음)에서 최고 성능에 못 미칩니다. 미술 작품에 대한 일반화에서 YOLO의 person AP는 잘 유지되지만(VOC2007 59.2 → Picasso 53.3, People-Art 45), R-CNN은 붕괴합니다(54.2 → 10.4, 26).

이 45-FPS 동작점은 프레임 단위 검출을 실시간 인지 스택 내에서 처음으로 실용적으로 만들었으며, 이 계열의 진화는 이를 계속 유지시켰습니다 — Transformer 검출기(DETR → RT-DETR)가 나중에 두 축 모두에서 넘어서야 했던 벤치마크를 설정했습니다.

## SLAM에서의 의미
물체 검출은 SLAM 파이프라인에 시맨틱을 주입하는 가장 저렴한 방법입니다. YOLO 계열의 실시간 검출기는 동적 물체(사람, 차량)를 마스킹하여 특징 추적을 오염시키지 않도록 하고, 물체 SLAM을 위한 물체 수준 랜드마크를 제공하며(예: CubeSLAM은 2D 검출로부터 3D 큐보이드 랜드마크를 구축합니다), 하류 태스크를 위해 지도에 라벨을 붙이는 데 사용됩니다. SLAM 시스템이 로봇의 온보드 컴퓨터에서 프레임 속도로 "이미지에 무엇이 있는가"를 알아야 할 때, YOLO는 대개 가장 먼저 손이 가는 도구입니다 — 다만 설계상 closed-set이라는 한계가 있으며, 이는 Grounding DINO 같은 open-vocabulary 검출기를 낳은 동기입니다.

## 관련 문서
- [DETR](detr.md) — YOLO 스타일 검출에 대한 Transformer 기반 집합 예측 대안.
- [RT-DETR](rt-detr.md) — 속도와 정확도 양쪽에서 YOLO를 능가한 최초의 Transformer 검출기.
- [Grounding DINO](grounding-dino.md) — YOLO의 고정 클래스를 넘어서는 open-vocabulary 검출.
- [CubeSLAM](../level-03-monocular-slam/cubeslam.md) — 2D 검출을 기반으로 구축된 물체 SLAM.
- [DynaSLAM](../level-03-monocular-slam/dynaslam.md) — 검출/세그멘테이션을 이용해 동적 물체를 제거.
- [SAM](sam.md) — 프롬프트 가능한 세그멘테이션으로, 상자 수준 검출에 대응하는 픽셀 수준 대응 기법.
