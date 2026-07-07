# DISK

> Tyszkiewicz 2020 · [논문](https://arxiv.org/abs/2006.13566)

**한 줄 요약** — policy gradient를 이용해 keypoint 검출기와 디스크립터를 종단간으로 함께 학습시키며, 이산적인 keypoint 선택을 보상이 올바른 다운스트림 매칭 개수인 확률적 정책(stochastic policy)으로 취급한다.

## 문제

지역 특징(local feature) 프레임워크는 희소 keypoint를 선택하고 매칭하는 데 내재된 이산성(discreteness) 때문에 종단간으로 학습하기 어렵다: NMS와 top-$k$ 선택은 미분 불가능하다. 기존 방법들은 proxy 손실이나 부정확한 근사(SuperPoint의 homographic adaptation, R2D2의 신뢰성 맵, 디스크립터 공간에 대한 가정)로 이를 우회했지만, 그중 어느 것도 실제로 중요한 것 — 올바른 매칭의 개수 — 을 직접 최적화하지는 않는다. DISK(DIScrete Keypoints)는 대신 강화학습을 활용하며, 학습과 추론 체계를 서로 가깝게 유지하면서도 처음부터 안정적으로 수렴할 수 있을 만큼 표현력이 충분한 확률 모델을 사용한다.

## 방법 및 아키텍처

U-Net(4개의 다운/업 블록, 파라미터 110만 개, 수용 영역 219×219)이 이미지 $I$를 검출 히트맵 $K$와 밀집된 $N{=}128$차원 디스크립터 맵으로 매핑한다. 기대 보상(expected reward)의 그래디언트를 추정할 수 있도록 이후의 모든 것이 분포(distribution)로 정의된다.

**특징 분포.** 히트맵은 $h \times h$ 격자 셀($h{=}8$)로 분할된다; 셀 $u$당 최대 하나의 특징이 히트맵 크롭 $K^u$로부터 샘플링된다. 픽셀 $\mathbf{p}$는 상대적 확률로 제안된 뒤 절대적 확률로 받아들여져서 다음을 준다

$$ P(\mathbf{p} \mid K^u) = \mathrm{softmax}(K^u)_\mathbf{p} \cdot \sigma(K^u_\mathbf{p}) $$

여기서 $\sigma$는 sigmoid다. 받아들여진 위치는 그 픽셀에서 $\ell_2$-정규화된 디스크립터를 취한다. 추론 시에는 softmax가 argmax가 되고 sigmoid는 sign 함수가 되며, 히트맵에 대한 NMS가 추가된다.

**매칭 분포.** cycle-consistent 매칭이 완화된다: 디스크립터 거리 행렬 $\mathbf{d}$가 주어지면, 정방향 매칭은 $P_{A \to B}(j \mid \mathbf{d}, i) = \mathrm{softmax}(-\tau\, \mathbf{d}(i,\cdot))_j$에서 뽑히며(역방향은 열(column)에서 유사하게), $i \leftrightarrow j$는 양방향 모두 샘플링될 경우에 매칭된다. 매칭 확률은 닫힌 형태 $P(i \leftrightarrow j) = P_{A \to B}(j \mid \mathbf{d}, i) \cdot P_{B \to A}(i \mid \mathbf{d}, j)$를 가지므로, 매칭은 그래디언트 추정치에 **분산을 전혀 추가하지 않는다** — 안정적인 수렴의 핵심이다.

**보상.** $R(M_{AB}) = \sum_{(i,j)} r(i \leftrightarrow j)$이며, 올바른 매칭(두 점 모두 깊이 기반 재투영으로부터 $\epsilon$ 픽셀 이내)에는 $\lambda_{\mathrm{tp}} = 1$, 잘못된 매칭에는 $\lambda_{\mathrm{fp}} = -0.25$, "그럴듯한" 매칭(깊이는 없지만 epipolar 거리가 $\epsilon$ 이하)에는 중립, 그리고 매칭 불가능한 잡음을 억제하기 위한 keypoint당 작은 페널티 $\lambda_{\mathrm{kp}} = -0.001$이 더해진다.

**그래디언트 추정기(REINFORCE 스타일, 매칭에 대해서는 정확함).** 특징 분포로부터 샘플링된 $F_A, F_B$에 대해:

$$ \nabla_\theta \mathbb{E}_{M_{AB}} R(M_{AB}) = \mathbb{E}_{F_A, F_B} \sum_{i,j} P(i \leftrightarrow j \mid F_A, F_B, \theta_M)\, r(i \leftrightarrow j)\, \nabla_\theta \Gamma_{ij} $$

$$ \Gamma_{ij} = \log P(i \leftrightarrow j \mid F_A, F_B, \theta_M) + \log P(F_{A,i} \mid A, \theta_F) + \log P(F_{B,j} \mid B, \theta_F) $$

**학습.** MegaDepth 부분집합(135개 장면, 6만 3천 장, COLMAP 포즈/깊이); co-visible한 이미지 세 장으로 이루어진 triplet이 배치 원소당 세 개의 쌍을 만든다; 이미지는 768px; Adam, lr $10^{-4}$; $\lambda_{\mathrm{fp}}$와 $\lambda_{\mathrm{kp}}$는 첫 5 epoch 동안 0에서부터 annealing되어, 무작위로 초기화된 네트워크가 아무것도 검출하지 않는 쪽으로 몰리지 않게 한다.

## 실험 결과

- **Image Matching Challenge 2020**(9개의 비공개 테스트 장면, 10°에서의 mAA): 2k-특징 카테고리에서 DISK는 stereo mAA 0.5132, multiview mAA 0.7271을 기록하여, 리더보드의 모든 방법을 각각 9.4%, 6.7% 상대적으로 능가하며 RANSAC inlier도 약 50% 더 많다; 8k 특징에서는 stereo 0.5585, multiview 0.7502로, 모든 baseline보다 위이며 상위 세 개의 튜닝된 제출물보다는 살짝 낮다. 학습된 매처를 사용하는 제출물들 중, 단순한 $\ell_2$ 매칭을 사용한 DISK는 SuperGlue에만 뒤진 2위를 차지한다.
- **HPatches:** 최고 수준의 MMA — viewpoint 장면에서 1위, illumination에서 2위(DELF에 뒤짐), 가장 근접한 경쟁자인 Reinforced Feature Points를 5px까지의 AUC에서 12% 상대적으로 능가한다.
- **ETH-COLMAP SfM 벤치마크:** SIFT보다 더 많은 landmark를 더 긴 track과 비슷한 재투영 오차로 만들어낸다; "Fountain"에서 제한 없이 실행하면 6만 7천 개의 landmark를 만든다.
- 특징은 판별력을 유지하면서도 매우 밀집되게 추출될 수 있으며, DISK는 학습에서 본 in-plane 회전에는 강건하지만 보지 못한 큰 회전에서는 성능이 저하된다(augmentation으로 고칠 수 있음).

## SLAM에서의 의미

DISK는 매칭 성공을 직접 최적화하는 것이 수작업으로 설계된 proxy 손실보다 우수하다는 것을 입증했으며, SuperPoint와 R2D2와 함께 표준적인 학습된 프론트엔드 특징 중 하나가 되었다. 그것의 균일한 공간적 keypoint 분포는 이미지 전체에 걸친 제약이 필요한 SLAM 시스템에 유리하며, LightGlue에서 특징 backbone으로 지원되어 hloc localization 파이프라인에서 플러그-앤-플레이로 쓸 수 있는 선택지가 된다.

## 관련 문서

- [SuperPoint](superpoint.md) — 자기지도 학습 기반의 검출기/디스크립터 통합 대안
- [R2D2](r2d2.md) — 신뢰성을 인식하는 검출, "어디서 검출할 것인가"에 대한 또 다른 답
- [HardNet](hardnet.md) — DISK가 기반으로 삼는 디스크립터 손실 설계 계보
- [LightGlue](lightglue.md) — DISK를 네이티브로 지원하는 매처
- [hloc](hloc.md) — DISK가 바로 꽂힐 수 있는 localization 파이프라인
- [DeDoDe](dedode.md) — 검출과 기술(description)을 분리하는 이후의 재고찰
