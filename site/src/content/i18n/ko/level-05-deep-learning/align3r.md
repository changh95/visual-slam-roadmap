# Align3R

> Lu 2025 · [논문](https://arxiv.org/abs/2412.03079)

**한 줄 요약** — Align3R은 단안 깊이를 미세 조정된 DUSt3R에 주입하여, 프레임별로 깜빡이는 단안 깊이 예측을 시간적으로 일관된 비디오 깊이와 카메라 포즈로 동시에 변환합니다. DUSt3R이 예측하는 프레임 쌍별 3D pointmap이 이후 모든 프레임을 정렬합니다 (CVPR 2025 Highlight).

## 문제

최신 단안 깊이 추정 모델 (Depth Pro, Depth Anything V2)은 고품질의 단일 이미지 깊이를 생성하지만, 동적 비디오의 프레임 전반에 걸쳐 일관된 스케일 인자를 유지할 수 없어, 추정된 깊이 시퀀스가 깜빡입니다. 초기 해결책은 optical flow나 매칭 제약 조건을 사용한 추론 시점 최적화를 수행했지만, 이는 큰 움직임에서는 깨지고 수 시간이 걸립니다. 최근의 video-diffusion 접근법 (DepthCrafter, ChronoDepth)은 학습 비용이 높고, 고정 길이 클립으로 제한되며, *카메라 포즈 없이* 스케일 불변 깊이만 출력합니다 — 4D 복원이나 추적에는 불충분합니다. Align3R은 diffusion의 비용을 지불하지 않고 동적 단안 비디오에 대해 일관된 비디오 깊이와 포즈를 얻는 방법을 묻습니다.

## 방법 및 아키텍처

$N$개의 프레임 $\mathbf{I}_k$가 주어지면, 단안 추정기가 먼저 프레임별 깊이 $\hat{\mathbf{D}}_k$를 예측합니다. 그다음 수정된 DUSt3R이 이 깊이를 반영한 프레임 쌍별 pointmap을 예측하며, 마지막으로 전역 정렬이 깊이 $\mathbf{D}_k$와 포즈 $\pi_k\in\mathbb{SE}(3)$를 풉니다.

- **DUSt3R backbone.** 프레임 쌍 $(\mathbf{I}_n,\mathbf{I}_m)$에 대해, ViT가 신뢰도 $\mathbf{C}^e_n,\mathbf{C}^e_m$와 함께 pointmap $\mathbf{X}^e_n,\mathbf{X}^e_m$ (둘 다 프레임 $n$의 좌표계 기준)를 예측합니다. 쌍 그래프 $\mathcal{G}(\mathcal{V},\mathcal{E})$ 전체에 대해, 전역 정렬은 다음을 풉니다.

$$\arg\min_{\mathbf{D},\pi,\sigma}\sum_{e\in\mathcal{E}}\sum_{v\in e}\mathbf{C}^{e}_{v}\left\|\mathbf{D}_{v}-\sigma_{e}P_{e}(\pi_{v},\mathbf{X}^{e}_{v})\right\|_{2}^{2}$$

  여기서 $\sigma_e$는 엣지별 스케일 인자이고 $P_e$는 pointmap을 뷰 $v$로 투영하여 깊이 맵으로 만듭니다.
- **ControlNet 방식의 깊이 주입.** 깊이를 RGB 입력에 단순히 결합(concatenate)하면 사전 학습된 DUSt3R 인코더 특징을 "파괴적으로 손상시킵니다". 그 대신, 단안 깊이는 3D pointmap $\hat{\mathbf{X}}_i$로 역투영되고 (Depth Pro가 예측한 초점 거리, 또는 Depth Anything V2에는 고정 초점 거리 사용; 각 축은 $[-1,1]$로 정규화), 패치 임베딩된 후 새로운 ViT를 통과하며, 이 ViT의 다층 특징 $\hat{\mathbf{F}}^{(l)}_i$는 zero convolution을 통해 DUSt3R 디코더로 들어갑니다: $\hat{\mathbf{E}}^{(l)}_i=\mathrm{ZeroConv}(\hat{\mathbf{F}}^{(l)}_i)+\mathbf{E}^{(l)}_i$ ($l=1,\dots,s$, $s=6$), 초기화 시점에는 원래 예측을 그대로 유지합니다.
- **동적 장면을 위한 미세 조정.** 인코더는 동결하고, 디코더 + point-map ViT를 5개의 합성 데이터셋 (SceneFlow, VKITTI, 정적 영역만 사용하는 TartanAir, Spring, PointOdyssey)에서 시간적 간격 1~10으로 샘플링한 쌍으로 미세 조정합니다. 이미지별 정규화 인자 $z,\overline{z}$를 사용한 DUSt3R 회귀 손실 $L_{dust3r}=\left\|\frac{1}{z}\mathbf{X}^{e}_{v}-\frac{1}{\overline{z}}\overline{\mathbf{X}}^{e}_{v}\right\|_{2}$을 사용하며, 하늘이 손실을 지배하지 않도록 400m 이상의 깊이는 필터링됩니다. 학습: RTX 4090 6대, 배치 12, 50 epoch에 약 20시간, AdamW 학습률 $5\times10^{-5}$.
- **긴 비디오를 위한 계층적 최적화.** 약 30프레임을 넘는 비디오는 순수한 DUSt3R 정렬 방식에서 4090의 메모리를 초과하므로, 비디오를 $M=10$ 또는 $20$ 프레임 단위의 클립으로 분할합니다: 클립당 하나의 키프레임에 대한 전역 정렬로 키프레임 깊이/포즈/초점 거리를 초기화한 후, 각 클립을 지역 정렬로 채웁니다. MonST3R의 RAFT-flow 손실이 추론 시점에 추가되는데 — 깊이에는 거의 영향을 주지 않지만 포즈 정확도에는 중요합니다.

## 실험 결과

시퀀스당 하나의 scale/shift만 사용하여 (프레임당 정렬보다 더 엄격한 조건) 6개의 데이터셋에서 평가, Abs Rel $\downarrow$ / $\delta<1.25$ $\uparrow$:

- **비디오 깊이** (Table 2): Sintel 0.253/0.681 (Depth Anything V2 사용) vs MonST3R 0.335/0.586, DUSt3R 0.422/0.542, DepthCrafter 0.292/0.697; PointOdyssey val 0.077/0.930 (Depth Pro 버전) vs MonST3R 0.089/0.909; FlyingThings3D 0.102/0.895 vs MonST3R 0.132/0.836; Bonn 0.075/0.972, TUM dynamics 0.109/0.915 — 모든 데이터셋의 모든 지표에서 DUSt3R과 MonST3R을 능가하지만, 쉬운 실내 장면인 Bonn에서는 단일 프레임 Depth Pro (0.067/0.974)가 이미 일관성을 보입니다.
- **카메라 포즈** (Table 3): 세 벤치마크 모두에서 최고의 RTE/RRE 달성; TUM dynamics에서 ATE 0.011 (vs MonST3R 0.020, DUSt3R 0.093, COLMAP 0.076), Bonn에서 0.646×10⁻²; Sintel에서는 ATE 0.128–0.163으로 MonST3R의 0.111보다 약간 뒤처지지만 RRE는 더 우수 (0.419–0.432 vs 0.780).
- **Ablation** (Table 4): zero-conv ViT 주입은 깊이 없을 때 0.306, 단순 RGB-깊이 결합 시 0.399인 것에 비해 Sintel Abs Rel 0.263을 달성; 계층적 최적화는 Bonn 비디오당 메모리를 24.0→5.9GB, 시간을 2.9→1.1분으로 줄이면서도 거의 동일한 정확도를 유지합니다 (0.054→0.056 Abs Rel).

## SLAM에서의 의미

프레임 간에 일관된 깊이는 dense visual odometry와 매핑이 정확히 필요로 하는 것입니다: 프레임마다 스스로 어긋나는 단안 깊이 네트워크는 포즈 추정과 맵 융합을 오염시킵니다. Align3R은 실용적인 레시피를 보여줍니다 — 세부 사항을 위한 foundation model 깊이, 기하학적 접착제로서의 DUSt3R 방식 프레임 쌍 pointmap, 그리고 백엔드로서의 DUSt3R 자체 전역 정렬 — 이를 통해 단일 이미지 깊이 모델을 비디오/SLAM 프론트엔드로 사용할 수 있게 되며, 동적 시퀀스에서의 포즈 정확도는 DROID-SLAM과 같은 전용 시스템에 필적합니다. 이는 순차적이고 동적인 데이터에 적응하고 있는 빠르게 발전 중인 DUSt3R 계열 (MonST3R, MASt3R-SLAM)에 속합니다.

## 관련 문서

- [DUSt3R](dust3r.md)
- [MonST3R](../level-03-monocular-slam/monst3r.md)
- [Depth Anything V2](depth-anything-v2.md)
- [Marigold](marigold.md)
- [MASt3R-SLAM](mast3r-slam.md)
