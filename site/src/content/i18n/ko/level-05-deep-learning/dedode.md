# DeDoDe

> Edstedt 2024 · [논문](https://arxiv.org/abs/2308.08479)

**한 줄 요약** — DeDoDe("Detect, Don't Describe — Describe, Don't Detect")는 keypoint 검출과 기술(description)을 분리하여, 검출기는 대규모 SfM 트랙으로부터 얻은 3D 일관성을 직접 목표로 학습하고, descriptor는 별도로 상호 최근접 이웃 매칭 가능성을 목표로 학습한다.

## 문제

학습 기반 keypoint 검출의 핵심 어려움은 학습 목적함수 자체에 있다: 어떤 픽셀이 "좋은" keypoint인가? 기존의 학습 기반 방법(SuperPoint, DISK, SiLK)들은 descriptor와 keypoint를 함께 학습하며, 검출을 descriptor의 상호 최근접 이웃에 대한 이진 분류로 취급한다 — 이는 "3D 일관성 있는 keypoint를 생성한다는 보장이 없는" 대리 과제(proxy task)이며, keypoint를 특정 descriptor에 결부시켜 다운스트림 사용을 복잡하게 만든다. DeDoDe는 대신 keypoint를 3D 일관성으로부터 직접 학습하며, 그 부수 효과로 호환성(임의의 매처와 함께 사용 가능한 keypoint)과 모듈성을 얻는다.

## 방법 및 아키텍처

**검출기 목적함수.** 네트워크 $f_\theta(x|I)$는 이미지 전체에 대한 로그 밀도를 출력하며, "좋은" keypoint의 가능도를 최대화하도록 학습된다:

$$\max_{\theta}\sum_{j=1}^{|\mathcal{D}|}\sum_{i=1}^{K^{j}} f_{\theta}(x_i^j|I^j)-\log Z_{\theta}(I^j), \qquad Z_{\theta}(I^j)=\sum_{x^j\in I^j}\exp(f_{\theta}(x^j|I^j)).$$

"정답(ground truth)"은 MegaDepth SfM 재구성에서 3D 트랙으로 살아남은 SIFT 검출 결과다. 각 이미지는 자신의 트랙 중 일부만을 보므로, 이미지 쌍 $(I^{\mathcal{A}}, I^{\mathcal{B}})$을 샘플링하여 (MVS 깊이를 통한) 공시야(covisible) 검출들의 합집합을 사용한다.

**부드러운 two-view 사전 분포.** 트랙 검출 위치의 Dirac delta는 가우시안($\sigma=0.5$ px)과 작은 균일 상수로 블러링된 뒤, 깊이를 이용해 다른 뷰로 워핑되고 곱해진다: $p^{\mathcal{A}}_{\rm kp}\propto\tilde{p}_{\rm kp}^{\mathcal{A}}\cdot\tilde{p}_{\rm kp}^{\mathcal{B}\to\mathcal{A}}$ — 이는 *두* 이미지 모두에서 검출된 트랙에서 최댓값을 갖는다.

**반지도 사후 분포 + top-k 타깃.** 기본 검출기의 재현율(recall)이 충분하지 않기 때문에, 사전 분포는 네트워크 자신의 예측에 조건화된다: $p\propto p_{f_\theta}\cdot p_{\rm kp}$. 이는 DeDoDe가 SIFT가 놓친 keypoint를 발견할 수 있게 해준다. 타깃은 상위 $k=\text{batchsize}\cdot 1024$개의 검출에서 이진화되며(퇴화 해를 피함), $\mathcal{L}_{\rm detection}={\rm CE}(p_{f_\theta}, p_{\text{top-}k})$를 준다. 여기에 커버리지 정규화 항 $\mathcal{L}_{\rm coverage}={\rm CE}(\mathcal{N}(0,\sigma^2)*p_{f_\theta},\,\mathcal{N}(0,\sigma^2)*p_{\rm MVS})$($\sigma=12.5$ px)가 추가되어, 검출이 매칭 불가능한 영역(예: 하늘)을 피하도록 한다. 추론은 단순히 상위 $K$개의 점을 취하며, non-max suppression은 사용하지 않는다.

**별도로 학습되는 descriptor.** 두 번째 네트워크 $\mathbf{g}_\theta$(가중치 비공유)는 대칭 로그 가능도 $\ell_{g_\theta}=\log p_{g_\theta}(x^{\mathcal{A}}|x^{\mathcal{B}})+\log p_{g_\theta}(x^{\mathcal{B}}|x^{\mathcal{A}})$를 최대화한다. 여기서 $p_{g_\theta}$는 256차원 정규화된 기술자의 내적에 대한 softmax(온도 $1/20$)이며, *학습된 DeDoDe keypoint*(이미지당 $K=5000$)에서 평가된다 — 이로써 결합 학습 방법에서 다루기 힘든 정규화 상수가 사라진다.

**아키텍처.** 두 네트워크 모두 ImageNet으로 사전 학습된 VGG-19 인코더(stride 1–8, 채널 64–512)와 DKM 스타일의 depthwise convolution 정제 디코더를 사용하여 여러 스케일에 걸쳐 밀집한 logit/기술자 그리드를 residual하게 정제한다. **DeDoDe-G**는 stride 14의 동결된 DINOv2 특징을 추가 디코더 단계(차원 768)로 더한다. 검출기: 100k 스텝, 배치 8, 512×512, A100 1장에서 약 30시간; descriptor는 약 24시간; SotA 평가는 784×784에서 진행.

## 실험 결과

- **MegaDepth-1500 relative pose (MNN 매칭)**: DeDoDe-B 49.4 / 65.5 / 77.7 AUC@5°/10°/20°, DeDoDe-G 52.8 / 69.7 / 82.0 — 이에 비해 DISK 35.0, SiLK 39.9, ALIKED 41.9, SuperPoint 31.7 (AUC@5° 기준, DISK 대비 +17.8, SiLK 대비 +12.9, ALIKED 대비 +10.9); DeDoDe-G는 단순 최근접 이웃 매칭으로 LoFTR(52.8)에 필적한다.
- **IMC2022 (hidden test set, keypoint 30k개)**: DeDoDe-B 72.9, DeDoDe-G 75.8 mAA@10 — DISK 64.8, SiLK 68.5 (+7.4) 대비 우수하며, SuperPoint+SuperGlue(72.4)와 경쟁력 있다.
- **검출기 재현성(MegaDepth, keypoint 10k개, 0.1% 임계값)**: DeDoDe 40.1, DISK* 32.6, ALIKED* 26.4, SiLK 21.2.
- **구성 요소 교체**: SIFT/DeDoDe-B(41.1 AUC@5°)와 DISK/DeDoDe-B(41.5) 모두 원래의 SIFT(36.5) 및 DISK(35.0) 파이프라인을 능가하지만 — 완전한 DeDoDe보다는 약 8점 뒤처져, 검출기와 descriptor가 각각 기여함을 보여준다.
- **Ablation**: coverage loss를 제거하면 repeatability@0.1%가 37.1에서 29.7로 떨어진다; (사후 분포/top-k 없이) 사전 분포에 직접 지도학습을 적용하면 34.8로 떨어진다.

## SLAM에서의 의미

keypoint 품질은 특징 기반 SLAM에서 삼각측량, BA, 재지역화 등 이후의 모든 것을 좌우한다. DeDoDe의 핵심 통찰 — descriptor 매칭 대리 과제가 아니라 3D 일관성으로 검출을 지도학습한다 — 은 넓은 기선(baseline)과 시점 변화를 견디는 keypoint를 만들어내며, 이는 장기적인 SLAM과 매핑이 정확히 필요로 하는 것이다. 또한 이는 학습된 프론트엔드를 독립적으로 최적화 가능한 구성 요소들로 분해하여 매처(예: LightGlue)와 위치추정 스택에 끼워 넣는 현대적 흐름을 잘 보여준다.

## 관련 문서

- [SuperPoint](superpoint.md)
- [DISK](disk.md)
- [R2D2](r2d2.md)
- [LightGlue](lightglue.md)
- [RoMa](roma.md) — 동일 연구 그룹; DeDoDe-G에 사용된 동결 DINOv2 특징
- [Foundation models](foundation-models.md)
