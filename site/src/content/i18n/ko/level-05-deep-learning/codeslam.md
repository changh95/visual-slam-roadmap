# CodeSLAM

> Bloesch 2018 · [논문](https://arxiv.org/abs/1804.00874)

**한 줄 요약** — CodeSLAM (CVPR 2018)은 각 키프레임의 dense depth map을 이미지 조건형 variational autoencoder로부터 나온 작은 latent code로 표현하여, dense geometry를 카메라 포즈와 함께 동시에 최적화할 수 있을 만큼 컴팩트하게 만듭니다.

## 문제

실시간 3D 인식에서 geometry의 표현은 여전히 중요한 미해결 문제로 남아 있습니다. Dense map은 완전한 표면 형태를 포착하지만 높은 차원성으로 인해 저장과 처리 비용이 크고 엄밀한 확률적 추론에 부적합합니다; sparse 특징 기반 표현은 구조와 모션의 결합 확률적 추론을 가능하게 하지만 장면 정보의 일부만 포착하며 주로 localization에만 유용합니다. 그러나 자연스러운 장면의 geometry는 매우 정돈되어 있습니다 — 이웃하는 깊이 값들은 강하게 상관되어 있으므로, dense한 표현이 실제로 많은 파라미터를 필요로 할 이유는 없습니다. CodeSLAM은 **dense하면서도 컴팩트하고 최적화 가능한** 표현을 추구합니다: 결합 확률적 최적화 안에 들어갈 수 있을 만큼 적은 파라미터로 완전한 표면 geometry를 표현하는 것입니다.

## 방법 및 아키텍처

**밝기값 조건형 깊이 오토인코딩.** Variational autoencoder가 키프레임의 depth map을 압축하지만, 이미지만으로 예측할 수 없는 것만 code가 유지하도록 밝기값 이미지를 조건으로 합니다:

$$D = D(I, \boldsymbol{c})$$

여기서 $I$는 밝기값 이미지이고 $\boldsymbol{c}$는 latent code (참조 네트워크에서 128차원)입니다. U-Net이 $I$를 다중 스케일 특징으로 분해하여 대응하는 해상도에서 깊이 encoder/decoder에 결합합니다; variational bottleneck (두 개의 512채널 fully connected 레이어, KL로 정규화됨)이 code-to-depth 매핑을 매끄럽게 유지합니다. $\boldsymbol{c}=0$으로 설정하면 가장 가능성 높은 단일 뷰 깊이 예측 $D(I,0)$이 나옵니다.

**불확실성을 인지하는 학습.** 네트워크는 픽셀별 평균 $\mu$와 불확실성 $b$를 예측하며, 관측된 깊이 $\tilde{d}$에 대해 4개의 pyramid 레벨에서 Laplace 분포의 negative log-likelihood로 학습됩니다:

$$-\log p(\tilde{d}\mid\mu,b) = \frac{|\tilde{d}-\mu|}{b} + \log(b)$$

깊이는 *근접도(proximity)* $p = a/(d+a)$ (평균 깊이 $a$)로 재파라미터화되어, $[0,\infty]$를 $[0,1]$로 매핑합니다. 학습은 SceneNet RGB-D를 ADAM으로 사용합니다 (학습률 $10^{-4}\to10^{-6}$, 6 epoch). **선형 decoder**가 사용되어 야코비안 $\partial D/\partial\boldsymbol{c}$ (그렇지 않으면 평가에 약 1초까지 걸림)를 키프레임당 한 번만 미리 계산할 수 있습니다.

**Dense 워핑과 결합 최적화.** 뷰들 사이의 포즈 $\boldsymbol{T}_A^B=(\boldsymbol{R}_A^B, {}_B\boldsymbol{t}_A^B)$를 가지고, 각 픽셀 $\boldsymbol{u}$는 다음과 같이 워프됩니다.

$$w(\boldsymbol{u},\boldsymbol{c}_{A},\boldsymbol{T}_{A}^{B})=\pi\big(\boldsymbol{R}_{A}^{B}\,\pi^{-1}(\boldsymbol{u},D_{A}[\boldsymbol{u}])+{}_{B}\boldsymbol{t}_{A}^{B}\big)$$

여기서 $\pi,\pi^{-1}$는 투영/역투영 연산자이고 $D_A[\boldsymbol{u}]$는 픽셀 조회입니다. N-frame structure-from-motion 백엔드는 모든 프레임에 미지의 code (초기값 0)와 포즈 (초기값 항등)를 할당하고, 겹치는 모든 프레임 쌍에 대해 photometric 및 geometric 잔차를 최소화합니다,

$$E_{\mathrm{pho}} = L_{p}\big(I_{A}[\boldsymbol{u}]-I_{B}[w(\boldsymbol{u},\boldsymbol{c}_{A},\boldsymbol{T}_{A}^{B})]\big), \qquad E_{\mathrm{geo}} = L_{g}\big(D_{A}[\boldsymbol{u}]-D_{B}[w(\boldsymbol{u},\boldsymbol{c}_{A},\boldsymbol{T}_{A}^{B})]\big)$$

여기서 손실 $L_p, L_g$는 유효하지 않은 대응점을 마스킹하고, 두 오차 유형에 가중치를 부여하며, Huber 가중치를 적용하고, 경사지거나 가려진 픽셀을 다운웨이트합니다. 감쇠된 Gauss–Newton 솔버가 모든 code와 포즈를 업데이트합니다. **Tracking**은 동일한 메커니즘 (photometric 비용만, coarse-to-fine)으로 현재 프레임을 마지막 키프레임에 정렬하며, 전체 PTAM 스타일 시스템은 tracking과 mapping을 번갈아 수행하면서 오래된 키프레임을 선형 사전 분포로 소거(marginalise)합니다.

## 실험 결과

- **Code 크기**: 복원 정확도는 code 크기 128에서 포화되며, 컬러 입력과 비선형 decoding은 유의미한 이득을 주지 않습니다. Code-entry 야코비안은 각 항목이 의미론적으로 일관된 이미지 영역을 제어함을 보여줍니다.
- **N-frame SfM (SceneNet RGB-D)**: 마스터 키프레임의 RMS 근접도 오차는 프레임이 추가될수록 단조적으로 감소합니다 — $2.65\times10^{-2}$ (1 프레임)에서 $2.14\times10^{-2}$ (6 프레임)로, 진정한 multi-view 정제가 dense geometry에 대해 이루어짐을 보여줍니다.
- **일반화**: 순수하게 합성 데이터로 학습했음에도 실제 EuRoC와 NYU V2 이미지에서의 two-frame 복원; EuRoC 결과는 스텝당 약 100ms로 50번의 최적화 스텝을 사용했습니다.
- **EuRoC MH_02에서의 VO**: sliding-window (4-키프레임) visual odometry로 실행되며, 오차는 9m 이동 후 약 1m입니다 — visual-inertial 시스템과 경쟁하지는 못하지만, 합성 데이터로 학습된 사전 분포를 가진 순수 vision-only 방법으로서는 상당한 수준입니다; map 업데이트 속도는 약 5Hz입니다.

## SLAM에서의 의미

CodeSLAM은 DTAM 이후 dense SLAM을 막고 있던 질문에 답했습니다: dense geometry를 사후에 융합하는 대신 결합 확률적 최적화 안에 포함시키는 방법입니다. 그 핵심 교훈 — 최적화기와 dense map 사이에 학습된 저차원 파라미터화를 두는 것 — 은 학습 기반 SLAM에서 가장 영향력 있는 아이디어 중 하나이며 (CVPR 2018 best paper honourable mention), SceneCode, DeepFactors, NodeSLAM, CodeMapping을 낳았고, 네트워크 파라미터가 다시 컴팩트한 최적화 가능 geometry로 기능하는 neural-implicit SLAM (iMAP, NICE-SLAM)을 개념적으로 예견했습니다.

## 관련 문서

- [DeepFactors](deepfactors.md)
- [SceneCode](scenecode.md)
- [NodeSLAM](nodeslam.md)
- [CodeMapping](codemapping.md)
- [iMAP](../level-03-monocular-slam/imap.md)
- [DTAM](../level-03-monocular-slam/dtam.md)
