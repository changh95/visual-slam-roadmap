# Depth Anything V2

> Yang 2024 · [논문](https://arxiv.org/abs/2406.09414)

**한 줄 요약** — Depth Anything V2는 세 가지 방법을 통해 V1보다 훨씬 정밀하고 견고한 단안 깊이를 만들어낸다: teacher를 정확한 합성 이미지만으로 학습시키고, teacher를 DINOv2-G까지 스케일업하며, 6200만 장의 pseudo-라벨된 실제 이미지를 통해 student 모델들을 학습시킨다.

## 문제

Depth Anything V1은 인상적인 일반화 성능을 보였지만, 그 teacher는 깊이 라벨이 노이즈가 많고 거친 라벨링된 *실제* 이미지로 학습되었다 — 깊이 센서는 투명한 물체에서 실패하고, 스테레오 매칭은 반복적인 패턴에서 실패하며, SfM은 동적 물체에서 실패한다 — 따라서 학습된 모델은 이런 오류들을 그대로 물려받는다(MiDaS와 V1은 Transparent Surface Challenge에서 각각 25.9%, 53.5%밖에 얻지 못한다). 합성 렌더링은 픽셀 단위로 정확한 깊이("진짜 GT")를 제공하지만 두 가지 장애물을 동반한다: 합성-실제 간 분포 차이(synthetic-to-real distribution shift, 합성 이미지는 너무 "깨끗"하고 "정돈"되어 있다)와 미리 정의된 장면 유형으로 인한 제한된 장면 커버리지. V2는 "화려한 기법을 추구하지 않고" 도메인 격차의 대가를 치르지 않으면서 합성 라벨의 정밀도를 얻는 방법을 묻는다.

## 방법 및 아키텍처

파이프라인은 세 단계로 구성된다(논문의 그림 7):

1. **합성 데이터만으로 학습된 Teacher.** DPT 깊이 디코더를 가진 DINOv2-G(13억 파라미터) 인코더가 5개 데이터셋에서 얻은 59만 5천 장의 정확한 합성 이미지만으로 학습된다(BlendedMVS 11만 5천, Hypersim 6만, IRS 10만 3천, TartanAir 30만 6천, VKITTI 2 2만). 예비 연구에서는 오직 DINOv2-G만이 합성-실제 전이(transfer)에서 살아남는다는 것을 보였다; BEiT, SAM, SynCLR, 그리고 더 작은 DINOv2 인코더들은 모두 심각한 일반화 문제를 겪는다.
2. **실제 이미지 Pseudo-라벨링.** teacher는 8개의 공개 데이터셋(BDD100K, Google Landmarks, ImageNet-21K, LSUN, Objects365, Open Images V7, Places365, SA-1B)에서 가져온 6200만 장의 라벨 없는 실제 이미지에 깊이를 할당한다. 이 pseudo-라벨은 수동 어노테이션보다 더 세밀하고 완전하다.
3. **Pseudo-라벨만으로 학습된 Student들.** 4개의 student 모델(DINOv2 small/base/large/giant, 2500만~13억 파라미터)이 pseudo-라벨된 실제 이미지만으로 학습된다 — ablation 결과 이 단계에서 합성 이미지를 제외하는 것이 오히려 더 작은 모델에는 약간의 도움이 된다는 것을 보여준다. 이는 label-level distillation을 추가적인 비라벨 데이터를 통해 수행하는 것으로, teacher-student 간 규모 차이가 큰 상황에서 feature-level distillation보다 더 안전하다.

라벨링된(합성) 이미지에 대한 학습 목표는 affine-invariant 역깊이에 대한 두 가지 MiDaS 스타일 손실을 결합한다: scale-and-shift invariant 손실 $\mathcal{L}_{ssi}$와 gradient matching 손실 $\mathcal{L}_{gm}$을 $1{:}2$ 가중치로 결합하며 — $\mathcal{L}_{gm}$은 라벨이 합성일 때 "깊이의 선명함에 매우 유익한" 것으로 나타난다. pseudo-라벨된 이미지에서는, 샘플당 손실이 가장 큰 상위 $n$ 영역($n=10\%$)이 잠재적으로 노이즈가 있는 것으로 간주되어 무시되며, feature alignment 손실(V1에서 가져온)이 DINOv2의 시맨틱 정보를 보존한다. 모든 이미지는 $518\times 518$로 학습된다: teacher는 배치 64로 16만 반복, student는 배치 192로 48만 반복, encoder/decoder 학습률 5e-6/5e-5의 Adam을 사용한다.

이 논문은 또한 **DA-2K**라는 평가 벤치마크도 제안한다. 이는 2K개의 희소한 상대 깊이 픽셀 쌍을 포함하는 1K개의 고해상도 다양한 이미지로 구성되며, 기존 테스트셋(NYU-D, KITTI)이 노이즈가 있는 라벨, 단일 장면에 대한 편향, 약 500×500 해상도라는 한계를 갖기 때문에 만들어졌다: SAM으로 프롬프트된 점 쌍에 대해 4개의 전문가 모델이 투표하고, 의견이 불일치하는 경우는 세 번 검토된 사람 어노테이션으로 넘어간다.

## 실험 결과

- **Zero-shot 상대 깊이**(표 2): V2 ViT-L은 KITTI에서 AbsRel 0.074 / $\delta_1$ 0.946, NYU-D에서 0.045 / 0.979에 도달한다 — MiDaS V3.1(KITTI 0.127/0.850)보다 우수하지만 V1과는 대등한 수준에 그치는데, 저자들은 이것이 모델 품질보다는 이 벤치마크들의 노이즈를 반영한다고 주장한다.
- **DA-2K**(표 3): V2 ViT-S는 95.3%의 정확도, ViT-B는 97.0%, ViT-L은 97.1%, ViT-G는 97.4%를 기록한다 — Marigold 86.8%, Geowizard 88.1%, DepthFM 85.8%, Depth Anything V1 88.5%와 비교된다. 가장 작은 V2조차 모든 커뮤니티 모델을 능가하며, 가장 큰 모델은 Marigold보다 10.6% 높다.
- **Transparent Surface Challenge**: zero-shot 83.6%, V1(53.5%)과 MiDaS(25.9%)와 비교된다.
- **미세 조정된 metric 깊이**(ZoeDepth 파이프라인, 표 4): ViT-L은 NYU-D에서 $\delta_1$ 0.984 / AbsRel 0.056 / RMSE 0.206, KITTI에서 $\delta_1$ 0.983 / AbsRel 0.045 / RMSE 1.861을 얻는다; ViT-S 변형조차 ZoeDepth와 같은 이전의 ViT-L 기반 방법들을 능가한다.
- **Ablation**: pseudo-라벨된 실제 이미지를 추가하면 ViT-S의 DA-2K 정확도가 89.8%에서 95.3%로 상승한다(표 5); DIML을 수동 라벨 대신 pseudo 라벨로 재학습하면 DA-2K 정확도가 80.2%에서 89.7%로 상승한다(표 6). SD 기반 모델과 비교하면 V2는 10배 이상 빠르고 더 정확하다.

## SLAM에서의 의미

선명하고 경계를 보존하는 깊이는 SLAM에 직접적으로 중요하다: 명확한 물체 경계는 더 깨끗한 TSDF/Gaussian 맵과 실루엣을 넘나드는 깊이 번짐(bleeding) 감소를 의미하며, 작은 변형 모델들은 평범한 하드웨어에서도 실시간으로 동작한다. 최신 dense SLAM 논문이 "단안 깊이 사전 정보를 사용한다"고 말할 때, 그것은 매우 자주 Depth Anything V2를 의미한다 — 그 실패 모드와 상대적/절대적(metric) 깊이 구분을 이해하는 것이 필수적인 실무 지식이 되었다. 합성 데이터를 우선하는 레시피(렌더링에서 정밀도를, pseudo-라벨된 실제 데이터에서 실재감을 얻는 것) 역시 기하학적 태스크를 위한 supervision 확보 방식을 재편했다.

## 관련 문서

- [Depth Anything](depth-anything.md)
- [Marigold](marigold.md)
- [Metric3D](metric3d.md)
- [MiDaS](midas.md)
- [Align3R](align3r.md)
