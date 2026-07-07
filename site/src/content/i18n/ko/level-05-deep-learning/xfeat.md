# XFeat
> Potje 2024 · [논문](https://arxiv.org/abs/2404.19174)

**한 줄 요약** — 공간 해상도를 높게 유지하고 채널 수를 줄임으로써 기존 학습 기반 특징보다 최대 5배 빠르게 동작하는(CVPR 2024) 초경량 학습 기반 로컬 특징으로, 64차원의 간결한 descriptor를 사용하며 노트북 CPU에서도 실시간으로 동작하여 학습 기반 매칭을 임베디드 하드웨어에서 실용적으로 만듭니다.

## 문제
최신 학습 기반 특징(SuperPoint, DISK, ALIKE)은 정확하지만 로봇이 실제로 탑재하는 하드웨어 — 드론, AR 글래스, 모바일 로봇 — 에는 너무 무겁습니다. 병목은 아키텍처적입니다: 정확한 매칭에는 "충분히 큰 이미지 해상도가 필요"하지만, 작은 VGG 스타일 백본이라도 고해상도 이미지를 통과시키면 연산량이 폭증합니다. 컨볼루션 레이어의 FLOP 수는 $F_{ops}=H_i\cdot W_i\cdot C_i\cdot C_{i+1}\cdot k^2$이며, 초기 레이어에서는 공간적 항 $H_i W_i$가 지배적입니다. XFeat는 엄격한 연산 예산 하에서 로컬 특징의 검출, 추출, 매칭에 대한 근본적인 CNN 설계 선택을 다시 검토합니다.

## 방법 및 아키텍처
**초경량 백본.** 그레이스케일 이미지 $\mathbf{I}\in\mathbb{R}^{H\times W\times 1}$로부터, 6개의 컨볼루션 블록("basic layer" — conv $k\in\{1,3\}$ + ReLU + BatchNorm — 23개 레이어)이 해상도를 절반씩 줄이면서 채널을 두 배가 아니라 *세 배*씩 늘립니다 — $C=4$에서 $H/32\times W/32$의 $C=128$까지 $\{4,8,24,64,64,128\}$. 4채널이라는 작은 시작점은 비용이 큰 고해상도 초기 레이어를 최소화하며, 세 배씩의 성장률은 저비용의 저해상도 레이어에서 표현력을 되살립니다.

**세 개의 head.** $\{1/8,1/16,1/32\}$ 스케일의 특징 피라미드 융합이 밀집한 64차원 descriptor 맵 $\mathbf{F}\in\mathbb{R}^{H/8\times W/8\times 64}$와, $\mathbf{F}_{i,j}$가 자신 있게 매칭될 수 있는 확률을 모델링하는 신뢰성 맵 $\mathbf{R}$, 그리고 *분리된* keypoint 브랜치를 생성합니다: 이미지는 $8\times8$ 셀(64차원 벡터)로 재구성되고, 빠른 $1\times1$ 컨볼루션이 64개의 셀 위치와 더스트빈 하나 중에서 keypoint 위치를 분류합니다: $\mathbf{K}\in\mathbb{R}^{H/8\times W/8\times 65}$(SuperPoint 방식이지만 분리되어 있음 — 공동 학습은 컴팩트한 CNN의 준밀집 매칭 성능을 떨어뜨립니다).

**준밀집 매칭 정제.** (LoFTR 방식의) 세밀한 특징 맵을 사용하는 대신, MLP가 매칭된 조대(coarse) descriptor 쌍만으로 픽셀 오프셋을 예측합니다: $\mathbf{o}=\text{MLP}(\text{concat}(\mathbf{f}_a,\mathbf{f}_b))$, 오프셋은 다음으로 선택됩니다.

$$(x,y)=\operatorname*{arg\,max}_{i,j\in\{1,\dots,8\}}\mathbf{o}(i,j)$$

여기서 $\mathbf{o}\in\mathbb{R}^{8\times 8}$은 오프셋 로짓을 담습니다 — 고해상도 특징이 전혀 없는 준밀집 매칭입니다.

**학습.** MegaDepth와 합성적으로 워핑된 COCO(6:4 혼합, 800×600)에서 픽셀 단위 대응점으로 지도 학습되며, 다중 태스크 손실 $\mathcal{L}=\alpha\mathcal{L}_{ds}+\beta\mathcal{L}_{rel}+\gamma\mathcal{L}_{fine}+\delta\mathcal{L}_{kp}$를 사용합니다: descriptor를 위한 유사도 행렬 $\mathbf{S}=\mathbf{F}_1\mathbf{F}_2^{\mathsf T}$에 대한 dual-softmax NLL, 신뢰도를 dual-softmax 확신도에 묶는 L1 손실 $\mathcal{L}_{rel}=|\sigma(\mathbf{R}_1)-\bar{\mathbf{R}}_1\odot\bar{\mathbf{R}}_2|+|\sigma(\mathbf{R}_2)-\bar{\mathbf{R}}_1\odot\bar{\mathbf{R}}_2|$, 오프셋 로짓에 대한 NLL, ALIKE-tiny로부터 증류된 keypoint를 사용합니다. 학습은 RTX 4090 한 대에서 6.5 GB VRAM으로 36시간에 수렴합니다. 추론: 희소 모드(XFeat, $\mathbf{K}_{i,j}\cdot\mathbf{R}_{i,j}$로 점수화된 4,096개 keypoint + mutual-nearest-neighbor) 또는 준밀집 모드(XFeat*, 신뢰성 상위 10k 특징 + 오프셋 정제)를 지원합니다.

## 실험 결과
- **MegaDepth-1500 상대 포즈**(LO-RANSAC, i5-1135G7에서의 VGA 해상도 CPU FPS): XFeat는 27.1 FPS에서 AUC@5° 42.6을 기록하며, SuperPoint 3.0 FPS에서의 37.3(9배 속도 향상), ALIKE 5.3 FPS에서의 49.4(5배 속도 향상)와 대비됩니다. XFeat*는 1885개의 인라이어로 19.2 FPS에서 AUC@5°/10°/20° 50.2/65.4/77.1을 달성하며 — DISK*(1.2 FPS에서 55.2/66.8/75.3, 16배 속도 향상)를 더 느슨한 임계값과 MIR(0.74 대 0.71)에서 능가합니다.
- **ScanNet-1500(실내, 재학습 없음)**: XFeat/XFeat*는 AUC@5° 16.7/18.4를 기록하며 SuperPoint 12.5, DISK 9.6/11.3보다 우수합니다 — 더 나은 일반화이며, DISK와 ALIKE는 랜드마크 데이터셋 편향을 보입니다.
- **HPatches homography**: 조명 변화 MHA@3 95.0, 시점 변화 68.6으로, 가장 정확한 descriptor들과 대등합니다.
- **학습 기반 매처와 비교**: XFeat*는 CPU에서 1.33 pairs/s로 LoFTR의 0.06(22배 빠름)과 비교되며, 정확도(50.2 대 68.3 AUC@5°)를 속도와 교환합니다. Patch2Pix(47.8)를 두 지표 모두에서 능가합니다.
- **임베디드**: 28달러짜리 Orange Pi Zero 3(Cortex-A53)에서 XFeat는 1.8 FPS로 동작하며, SuperPoint 0.16, ALIKE 0.58 대비 1 FPS를 넘는 유일한 학습 기반 방법입니다.

## SLAM에서의 의미
학습 기반 특징은 강건성 측면에서 수작업 설계된 특징(ORB, SIFT)을 명백히 앞섰지만, 연산 비용 때문에 임베디드 플랫폼 상의 실시간 SLAM 프론트엔드에서 배제되어 왔습니다. XFeat는 학습 기반 특징이 로봇이 실제로 탑재하는 종류의 하드웨어에서 SLAM 파이프라인에 넣을 수 있을 만큼 저렴해진 지점입니다. LightGlue와 같은 경량 매처와 결합하면, 엣지 디바이스에서 프레임 속도로 완전한 학습 기반 프론트엔드(검출, 기술, 매칭)를 가능하게 합니다.

## 관련 문서
- [SuperPoint](superpoint.md) — XFeat가 비교 기준으로 삼는 표준 학습 기반 특징.
- [LightGlue](lightglue.md) — XFeat와 흔히 결합되는 효율적인 학습 기반 매처.
- [LoFTR](loftr.md) — XFeat의 준밀집 모드가 훨씬 낮은 비용으로 근사하는 검출기 없는 밀집 매칭 대안.
- [DISK](disk.md) — 정확하지만 더 무거운 학습 기반 특징으로, 정확도/속도 트레이드오프를 보여줍니다.
- [Learned vs hand-crafted](learned-vs-hand-crafted.md) — 이를 둘러싼 설계 논쟁.
- [Edge deployment](../level-02-getting-familiar/edge-deployment.md) — XFeat가 설계된 배포 환경.
