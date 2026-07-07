# DPT

> Ranftl 2021 · [논문](https://arxiv.org/abs/2103.13413)

**한 줄 요약** — Dense prediction (깊이, 세그멘테이션)을 위해 CNN backbone을 Vision Transformer로 대체하여, 모든 레이어에서 전역 self-attention을 활용해 전역적으로 일관된 깊이 맵을 생성합니다.

## 문제

완전 합성곱 네트워크가 dense prediction을 지배하고 있지만, 그 encoder는 점진적으로 다운샘플링을 수행합니다: 깊은 단계에서 손실된 특징 해상도와 세밀함은 decoder에서 복구하기 어렵고, 개별 컨볼루션은 제한된 수용 영역 (receptive field)을 가지므로 넓은 컨텍스트는 매우 깊은 스택의 후반부에서야 획득됩니다. 단안 깊이와 같은 픽셀 단위 작업에서는 이로 인해 지역적으로 불일치하고 전역적으로 흔들리는 예측이 발생합니다. DPT는 Vision Transformer backbone — 일정한 표현 해상도, 모든 단계에서 전역 수용 영역 — 이 더 세밀하고 전역적으로 더 일관된 dense prediction을 산출하는지를 질문합니다.

## 방법 및 아키텍처

**Transformer encoder.** 이미지는 $p^2$ 픽셀 ($p=16$)의 겹치지 않는 패치들로 분해되며, 각 패치는 펼쳐져서 토큰으로 선형 투영됩니다. 학습 가능한 위치 임베딩과 특별한 *readout 토큰*이 추가되어, 토큰 $t^0 = \{t_0^0, \dots, t_{N_p}^0\}$, $t_n^0 \in \mathbb{R}^D$ ($N_p = \frac{HW}{p^2}$)를 만듭니다. $L$개의 multi-head self-attention transformer 레이어가 이를 $t^l$로 변환합니다. 토큰이 패치와 일대일로 대응하므로, 공간 해상도는 모든 단계에서 일정하며, 모든 토큰은 첫 번째 레이어부터 다른 모든 토큰에 attend할 수 있습니다. 변형: ViT-Base ($D=768$, 12 레이어), ViT-Large ($D=1024$, 24 레이어), ViT-Hybrid (토큰으로 ResNet-50 특징 사용, 12 레이어).

**Reassemble.** 네 개의 transformer 깊이에서 나온 토큰들은 3단계 연산을 통해 다시 이미지 형태의 특징 맵으로 변환됩니다.

$$\mathrm{Reassemble}_{s}^{\hat{D}}(t) = (\mathrm{Resample}_{s} \circ \mathrm{Concatenate} \circ \mathrm{Read})(t)$$

여기서 $\mathrm{Read}: \mathbb{R}^{(N_p+1)\times D} \rightarrow \mathbb{R}^{N_p \times D}$는 readout 토큰을 패치 토큰에 접어 넣습니다 (기본값은 토큰별 연결 $\mathrm{mlp}(\mathrm{cat}(t_i, t_0))$을 투영), $\mathrm{Concatenate}$는 패치 위치에 따라 토큰을 $\frac{H}{p}\times\frac{W}{p}\times D$ 맵으로 재구성하며, $\mathrm{Resample}_s$는 $1{\times}1$ 투영과 (transpose-)컨볼루션을 통해 $\frac{H}{s}\times\frac{W}{s}\times\hat{D}$로 재조정합니다 ($\hat{D}=256$). ViT-Large의 경우 추출되는 레이어는 $l = \{5, 12, 18, 24\}$ (더 깊은 레이어는 더 낮은 해상도에서 조립됨)이고, ViT-Base는 $l = \{3,6,9,12\}$, ViT-Hybrid는 처음 두 ResNet 블록과 단계 $\{9, 12\}$를 사용합니다.

**합성곱 fusion decoder.** 잔차 컨볼루션 유닛을 가진 RefineNet 스타일 fusion 블록이 연속 단계의 특징 맵을 점진적으로 결합하여, 각 단계에서 2배씩 업샘플링합니다. 최종 표현은 입력 해상도의 절반이며 작업별 출력 헤드로 전달됩니다. 위치 임베딩은 즉석에서 선형 보간되므로, DPT는 FCN처럼 다양한 이미지 크기를 처리할 수 있습니다.

**깊이 학습 레시피.** MiDaS 프로토콜을 따릅니다 — 역깊이에 대한 스케일 및 이동 불변 trimmed loss와 다중 스케일 gradient matching — 하지만 **MIX 6** (MIX 5에 다섯 개의 추가 데이터셋을 더한 약 140만 장 규모의 메타 데이터셋, 당시 편성된 가장 큰 깊이 학습 데이터셋)에서, $384\times 384$ 해상도로 다중 목적 (Pareto) 데이터셋 혼합을 사용하여 60 에포크 동안 학습합니다.

## 실험 결과

Zero-shot cross-dataset transfer (모든 지표는 낮을수록 좋음): MIX 6로 학습한 DPT-Large는 DIW WHDR 10.82, ETH3D AbsRel 0.089, Sintel AbsRel 0.270, $\delta > 1.25$ 이상치 비율 8.46 (KITTI), 8.32 (NYU), 9.97 (TUM)을 달성합니다. 이는 이전 최고 성능이던 완전 합성곱 MiDaS (MIX 5)의 12.46 / 0.129 / 0.327 / 23.90 / 9.55 / 14.29 대비 우수합니다. 평균 상대 개선율은 DPT-Large가 28%, DPT-Hybrid가 23%입니다. 동일한 MIX 6에서 합성곱 기반 MiDaS를 재학습해도 개선은 미미한 수준으로, FCN이 transformer와 같은 방식으로 추가 데이터를 활용할 수 없음을 보여줍니다. 미세 조정된 DPT-Hybrid는 NYUv2 ($\delta_1$ 0.904, AbsRel 0.110, RMSE 0.357)와 KITTI ($\delta_1$ 0.959, AbsRel 0.062, RMSE 2.573)에서 새로운 최고 성능을 기록했습니다. 의미론적 세그멘테이션의 경우, DPT-Hybrid는 ADE20K에서 mIoU 49.02%로, 그리고 미세 조정 후 Pascal Context에서 새로운 최고 성능을 기록했습니다.

## SLAM에서의 의미

DPT는 ViT encoder를 단안 깊이의 기본값으로 만들었습니다: DPT-Large는 MiDaS v3와 Depth Anything v1의 backbone이 되었으며, 이들은 단안 및 dense SLAM 시스템에 가장 흔히 주입되는 깊이 사전 정보입니다. 오늘날 SLAM 파이프라인이 "relative depth network"를 사용한다면, 그 내부는 십중팔구 DPT 스타일 아키텍처입니다. DPT의 전역적으로 일관된 깊이는 dense mapping에 정확히 필요한 것입니다 — 지역적으로 흔들리는 깊이 맵은 TSDF나 surfel fusion을 망가뜨립니다.

## 관련 문서

- [MiDaS](midas.md) — DPT가 연결하는 강인한 relative-depth 학습 레시피
- [MonoDepth](monodepth.md) — 더 이른 자기지도 단안 깊이 계보
- [ZoeDepth](zoedepth.md) — relative-depth 사전 학습 위에 metric scale을 추가
- [Depth Anything](depth-anything.md) — DPT 아키텍처 기반의 foundation 규모 깊이 모델
- [Metric3D](metric3d.md) — 대규모 혼합 데이터로도 학습하는 metric-depth 계보
