# FlowNet 2.0

> Ilg 2017 · [논문](https://arxiv.org/abs/1612.01925)

**한 줄 요약** — 여러 FlowNet 모듈을 중간 워핑과 함께 스택하고 전용 소변위 서브네트워크를 추가하여, FlowNet의 추정 오차를 50% 이상 줄이고 상호작용 가능한 프레임레이트로 고전적 변분 optical flow에 필적한 최초의 딥러닝 방법이 되었습니다.

## 문제

FlowNet은 optical flow 추정이 학습 문제로 다뤄질 수 있음을 입증했지만, flow *품질*의 최고 수준은 여전히 전통적인 변분법, 특히 소변위와 실제 환경 데이터에서 정의되었으며, FlowNet은 여기서 경쟁력이 없었습니다. 단일 FlowNet을 단순히 더 깊거나 넓게 만드는 것은 도움이 되지 않았습니다. 빠진 요소는 반복적 정제였습니다: 고전적 방법은 대략적인 추정치를 점진적으로 정제하며, FlowNet 2.0은 이 메커니즘을 학습 가능한 파이프라인 내부에 재구축합니다.

## 방법 및 아키텍처

이 논문의 세 가지 기여가 파이프라인을 구성합니다:

**1. 데이터셋 스케줄.** 학습 데이터의 순서가 중요합니다: 단순한 FlyingChairs에서 먼저 FlowNetS/FlowNetC를 학습시킨 후 3D FlyingThings3D로 미세 조정하는 것이, 둘 중 하나만으로 학습하거나 혼합하여 학습하는 것보다 일관되게 우수합니다 — 추측컨대 Chairs가 3D 모션과 조명에 대한 혼란스러운 사전 정보를 네트워크가 발달시키기 전에 일반적인 색상 매칭을 가르치기 때문입니다. 세 가지 학습률 스케줄이 정의됩니다 ($S_{\mathit{short}}$는 60만 반복, $S_{\mathit{long}}$은 120만 반복, 그리고 저학습률 미세 조정 스케줄 $S_{\mathit{fine}}$). 스케줄 변경만으로도 FlowNetS 결과가 약 25%, FlowNetC가 약 30% 향상되었으며, 동일한 조건에서 학습할 때 (correlation layer를 가진) FlowNetC가 FlowNetS를 능가함을 보였습니다.

**2. 워핑을 사용한 스택 네트워크.** 부트스트랩 FlowNetC가 $I_1, I_2$를 받습니다; 이후 모든 FlowNetS는 $I_1$, $I_2$, 현재 flow 추정치 $w_i = (u_i, v_i)^\top$, 그리고 이 추정치로 bilinear 보간을 통해 워핑된 두 번째 이미지

$$\tilde{I}_{2,i}(x,y) = I_2(x + u_i,\ y + v_i)$$

와 밝기 오차 $e_i = \lVert \tilde{I}_{2,i} - I_1 \rVert$를 받으므로, 각 단계는 $I_1$과 $\tilde{I}_{2,i}$ 사이의 남은 증분만을 추정합니다. 워핑은 미분 가능하므로 스택은 종단간으로 학습될 수 있지만, 최고의 결과는 이전 네트워크를 고정시키고 한 번에 하나씩 학습시킬 때 나옵니다 (워핑 *없이* 스택하면 과적합됩니다). 스택은 그 구성 요소에 따라 이름이 붙습니다 — FlowNet2-CSS는 FlowNetC 다음에 두 개의 FlowNetS가 이어지는 것입니다; 소문자는 채널 수가 3/8인 얇은 변형을 나타냅니다. FlowNet2-CSS는 단일 FlowNet2-C 대비 약 30%, 원래의 FlowNetC 대비 약 50% 향상됩니다; 두 개의 작은 네트워크가 하나의 큰 네트워크를 능가합니다 (1100만 가중치의 FlowNet2-ss가 3800만 가중치의 FlowNet2-S를 능가).

**3. 소변위 서브네트워크와 융합.** 실제 환경 비디오 (예: UCF101)는 대부분 서브픽셀 모션을 가지고 있으며, 기존 학습 데이터에는 이것이 부족합니다; 저자들은 ChairsSDHom (소변위와 균일한 배경을 가진 Chairs 스타일 데이터)과 FlowNet2-SD — 첫 번째 레이어에서 stride-2가 제거되고, $7\times7$/$5\times5$ 커널이 여러 개의 $3\times3$ 커널로 대체되며, upconvolution 사이에 노이즈를 완화하는 추가 컨볼루션이 있는 FlowNetS 변형 — 를 구축합니다. 소규모 융합 네트워크가 두 브랜치의 flow, flow 크기, 워핑된 밝기 오차를 받아 최종 전체 해상도 추정치를 출력합니다; 전체 시스템은 FlowNet2라고 불립니다.

## 실험 결과

- FlowNet 2.0은 FlowNet의 추정 오차를 50% 이상 감소시키면서 속도는 약간만 느려지고, 상호작용 가능한 프레임레이트에서 최고 수준의 방법 (Sintel에서 FlowFields; 미세 조정 후 Sintel final에서 DeepDiscreteFlow)과 동등한 성능을 보입니다. PWC-Net 비교 표에 나열된 미세 조정 모델의 Sintel test EPE는 clean 4.16 / final 5.74입니다.
- 8에서 140 fps에 이르는 다양한 변형들이 있습니다; FlowNet2-s는 140 fps로 실행되면서 원래 FlowNet의 정확도와 동등합니다.
- KITTI: KITTI2012+2015로 미세 조정하면 오차가 대략 1/3로 감소합니다; KITTI2012에서 최고 EPE를 기록했고, non-stereo 방법 중 KITTI2015 벤치마크에서 1위를 차지했습니다.
- 실제 응용 (모션 세그멘테이션, 행동 인식)에서 원래의 FlowNet은 유용하지 않았지만, FlowNet2는 최고 수준의 전통적 flow만큼 신뢰할 수 있으면서도 몇 배나 빠른 속도를 보이며, 선명한 모션 경계와 압축 아티팩트 및 균일한 영역에 대한 강인성을 갖추고 있습니다.

## SLAM에서의 의미

FlowNet 2.0은 deep optical flow가 진정으로 실용화된 순간이었습니다: 신뢰할 수 있을 만큼 정확하고 온라인 파이프라인에 사용할 만큼 빨라서, dense flow가 visual odometry front-end의 현실적인 재료가 되었습니다. 그 스택-워핑 반복 정제 패러다임은 직접적으로 PWC-Net으로, 그리고 궁극적으로 오늘날 학습 기반 SLAM 시스템의 핵심인 RAFT의 순환적 업데이트로 이어졌습니다 — 또한 Chairs 다음 Things3D 순서의 커리큘럼은 flow와 stereo 네트워크를 학습시키는 표준 관행이 되었습니다.

## 관련 문서

- [FlowNet](flownet.md) — 이를 정제하는 원조 종단간 flow 네트워크
- [PWC-Net](pwc-net.md) — 동일한 아이디어를 훨씬 작은 아키텍처로 압축
- [RAFT](raft.md) — all-pairs correlation과 순환적 업데이트를 갖춘 현대적 후속 연구
- [FlowFormer](flowformer.md) — 정확도 경쟁의 Transformer 시대 연속
