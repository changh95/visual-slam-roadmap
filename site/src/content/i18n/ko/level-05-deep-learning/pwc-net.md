# PWC-Net

> Sun 2018 · [논문](https://arxiv.org/abs/1709.02371)

**한 줄 요약** — Pyramid, Warping, Cost volume이라는 세 가지 고전적 원리에 기반해 구축된 콤팩트한 optical flow 네트워크로, FlowNet2보다 17배 작고 추론이 2배 빠르면서도 주요 벤치마크에서 더 정확하다.

## 문제

FlowNet은 optical flow가 종단간으로 학습될 수 있음을 보여줬지만, 고전적 방법 수준의 정확도에 도달하기 위해서는 FlowNet2 — 640MB 메모리를 차지하며 과적합을 피하기 위해 서브 네트워크들을 순차적으로 학습해야 하는 네트워크 스택 — 가 필요했다.

수십 년에 걸친 고전적 flow 연구는 flow 추정을 가능하게 하는 요소들을 이미 밝혀냈다: coarse-to-fine 피라미드, 이미지 워핑, 매칭 비용 볼륨. PWC-Net은 이 단순하고 잘 정립된 원리들을 *아키텍처 안에* 직접 녹여 넣는 것이, 무차별적인 네트워크 스택킹보다 더 작고, 학습하기 쉬우며, 더 정확한 모델을 만들 수 있는지를 묻는다.

## 방법 및 아키텍처

- **학습 가능한 feature pyramid**: 공유 인코더가 $L$ 레벨(7개 레벨 사용)의 피라미드를 구축하며, 레벨마다 2배씩 다운샘플링하고 레벨 1–6의 특징 채널은 16, 32, 64, 96, 128, 196이다. 0번째 레벨은 입력 이미지 자체다. 학습된 특징은 고정된 이미지 피라미드를 대체하는데, 원시 픽셀은 그림자나 조명 변화에 취약하기 때문이다.
- **워핑 레이어**: 레벨 $l$에서, 두 번째 이미지의 특징은 레벨 $l{+}1$에서 2배 업샘플링된 flow를 이용해 첫 번째 이미지 쪽으로 워핑된다.

$$c_w^l(\mathbf{x}) = c_2^l\big(\mathbf{x} + \mathrm{up}_2(\mathbf{w}^{l+1})(\mathbf{x})\big)$$

  bilinear interpolation(미분 가능)으로 구현되므로, 각 레벨은 잔차 모션만을 추정한다 — 큰 변위는 픽셀 단위로 작게 나타나는 조대(coarse) 레벨에서 처리된다.
- **부분 cost volume**: 매칭 비용은 첫 번째 이미지 특징과 워핑된 두 번째 이미지 특징 간의 상관으로 계산된다.

$$\mathbf{cv}^l(\mathbf{x}_1, \mathbf{x}_2) = \frac{1}{N}\, c_1^l(\mathbf{x}_1)^\top c_w^l(\mathbf{x}_2), \qquad |\mathbf{x}_1 - \mathbf{x}_2|_\infty \le d$$

  레벨당 $d = 4$ 픽셀의 탐색 범위 안에서만 계산된다 — 최상위 레벨에서의 1픽셀 모션은 원본 해상도에서 $2^{L-1}$ 픽셀에 해당하므로, 작은 범위로도 충분하다. 워핑과 cost volume 레이어에는 *학습 가능한 파라미터가 전혀 없어* 모델을 작게 유지한다.
- **Optical flow estimator**: 다층 CNN(채널 128, 128, 96, 64, 32, 선택적으로 DenseNet 연결 포함)이 cost volume, 첫 번째 이미지 특징, 업샘플링된 flow를 입력받아 각 레벨의 flow를 예측한다(레벨별로 별도 가중치). 추정은 레벨 $l_0 = 2$, 즉 4분의 1 해상도에서 멈추고, 이후 bilinear 업샘플링이 이어진다.
- **Context network**: 7개의 dilated 3x3 컨볼루션(dilation 상수 1, 2, 4, 8, 16, 1, 1)이 큰 수용 영역으로 flow를 후처리하며, 고전적 median/bilateral 필터링의 역할을 한다.
- **학습**: FlowNet의 다중 스케일 손실 $\mathcal{L}(\Theta) = \sum_{l=l_0}^{L} \alpha_l \sum_{\mathbf{x}} |\mathbf{w}_\Theta^l(\mathbf{x}) - \mathbf{w}_{GT}^l(\mathbf{x})|_2 + \gamma |\Theta|_2$를 FlyingChairs 후 FlyingThings3D에 적용(FlowNet2의 $S_{long}$/$S_{fine}$ 스케줄)하고, 이어서 이상치 가중을 낮추는 $q < 1$을 사용한 강건 손실 $\sum_l \alpha_l \sum_{\mathbf{x}} \big(|\mathbf{w}_\Theta^l(\mathbf{x}) - \mathbf{w}_{GT}^l(\mathbf{x})| + \epsilon\big)^q + \gamma|\Theta|_2$로 벤치마크 파인튜닝을 진행한다.

## 실험 결과

- **MPI Sintel final pass(테스트)**: EPE 5.04(PWC-Net-ft-final) / 5.13(PWC-Net-ft) — 작성 시점 기준 발표된 모든 방법보다 낮으며(FlowNet2-ft: 5.74; DCFlow: 5.12), 이 벤치마크에서 종단간 방법이 잘 설계된 전통적 방법을 능가한 최초의 사례이자, 최상위 성능 방법들 중 가장 빠르다.
- **KITTI 2015(테스트)**: Fl-all 9.60%로, 발표된 모든 two-frame flow 방법을 능가한다(FlowNet2-ft: 10.41%). KITTI 2012에서는 Fl-Noc 4.22%로, 배경이 강체라고 가정하는 SDF에 이어 2위다.
- **크기와 속도**: FlowNet2보다 17배 작고 추론이 2배 빠르며, SpyNet과 FlowNet2보다 학습이 쉽다. Sintel 해상도(1024x436) 이미지에서 약 35fps다. DenseNet 연결을 제거하면(PWC-Net-small) 정확도 ~5%를 희생하고 속도가 40% 향상된다.

## SLAM에서의 의미

밀집 optical flow는 direct/dense SLAM 프론트엔드, 동적 객체 추론, 자기지도 깊이 학습을 위한 데이터 연관을 제공한다. PWC-Net은 고품질 flow를 실시간 로보틱스 파이프라인에 쓸 수 있을 만큼 저렴하게 만들었고, pyramid-warp-cost-volume 설계를 표준적인 딥 flow 아키텍처로 확립했다 — 이는 이후 RAFT의 all-pairs correlation이 그 대안으로 정의될 때 기준이 되었다. PWC-Net의 coarse-to-fine 한계(작고 빠르게 움직이는 물체가 조대 레벨에서 사라지고, 조대 단계의 오차가 이후 단계에 고정됨)는 바로 RAFT가 해결하고자 설계된 실패 모드다.

## 관련 문서

- [FlowNet](flownet.md) — 최초의 종단간 딥 optical flow 네트워크
- [FlowNet 2.0](flownet-2-0.md) — PWC-Net이 축소시킨 거대한 스택 기반 전작
- [RAFT](raft.md) — coarse-to-fine 설계를 대체한 all-pairs 후속작
- [SEA-RAFT](sea-raft.md) — 효율성에 초점을 둔 flow 계보가 현재 도달한 지점
