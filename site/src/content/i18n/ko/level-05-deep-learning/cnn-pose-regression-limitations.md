# CNN Pose Regression Limitations

> Sattler 2019 · [논문](https://arxiv.org/abs/1903.07504)

**한 줄 요약** — 이 CVPR 2019 분석 ("Understanding the Limitations of CNN-based Absolute Camera Pose Regression")은 PoseNet 스타일의 absolute pose regression이 진정한 3D 기하 기반 localization보다는 포즈 보간을 동반한 이미지 검색(image retrieval)처럼 동작한다는 것을 보였습니다.

## 문제

Visual localization — 알려진 장면에서의 정확한 카메라 포즈 추정 — 은 전통적으로 3D 기하로 해결되어 왔습니다: 2D-3D 매치를 확립한 후, RANSAC 내부에서 PnP 솔버를 실행합니다. 이미지를 포즈로 직접 매핑하는 종단간 absolute pose regression (APR) 네트워크 (PoseNet과 그 후속작들)는 속도와 단순성 덕분에 인기를 얻었지만, 구조 기반 방법의 정확도에는 일관되게 도달하지 못했습니다. 이 논문은 그 *이유*를 묻습니다: APR 네트워크는 실제로 무엇을 학습하며, 이 접근법의 근본적인 한계는 무엇일까요?

## 방법 및 아키텍처

이 논문은 PoseNet과 유사한 모든 아키텍처를 포괄하는 이론적 모델을 개발하는데, 이들은 세 단계를 공유합니다: convolutional feature extractor $F(\mathcal{I})$, (비선형) embedding $E(F(\mathcal{I})) = \alpha^{\mathcal{I}} \in \mathbb{R}^n$ (마지막에서 두 번째 레이어), 그리고 embedding을 포즈 공간으로 투영하는 마지막 선형 레이어입니다. 학습된 localization 함수는

$$L(\mathcal{I}) = \mathbf{b} + \mathtt{P} \cdot E(F(\mathcal{I})) = \mathbf{b} + \sum_{j=1}^{n} \alpha_j^{\mathcal{I}} \mathbf{P}_j,$$

여기서 $\mathtt{P} \in \mathbb{R}^{(3+r)\times n}$은 마지막 레이어의 투영 행렬, $\mathbf{b}$는 bias, $\mathbf{P}_j = (\mathbf{c}_j^T, \mathbf{r}_j^T)^T$는 translation과 orientation 부분으로 나뉜 그 열입니다. 분해하면, 예측된 포즈는

$$\begin{pmatrix}\hat{\mathbf{c}}_{\mathcal{I}}\\ \hat{\mathbf{r}}_{\mathcal{I}}\end{pmatrix}=\begin{pmatrix}\mathbf{c}_{b}+\sum_{j=1}^{n}\alpha_{j}^{\mathcal{I}}\mathbf{c}_{j}\\ \mathbf{r}_{b}+\sum_{j=1}^{n}\alpha_{j}^{\mathcal{I}}\mathbf{r}_{j}\end{pmatrix}.$$

**해석**: APR은 *기저 포즈(base pose)* 집합 $\mathcal{B} = \{(\mathbf{c}_j, \mathbf{r}_j)\}$를 학습하고 모든 예측을 이들의 선형 (실제로는 ReLU 때문에 원뿔형) 결합으로 표현하며, 이미지 외관은 오직 계수 $\alpha_j^{\mathcal{I}}$를 조정하는 역할만 합니다. 출력을 장면의 3D 구조에 묶는 것은 아무것도 없습니다. 두 가지 예측이 도출되며 실험적으로 검증됩니다:

- **보장된 실패 사례.** 모든 학습 위치가 직선 $\mathbf{o} + \delta\mathbf{d}$ 위에 있다면, 하나의 허용 가능한 학습 해는 모든 기저 translation을 그 직선 위에 배치합니다 — 그리고 직선 위 점들의 선형 결합은 그 직선 위에 남으므로, 네트워크는 일반화가 *불가능*합니다. PoseNet과 MapNet이 학습한 기저 translation의 시각화는 정확히 이 붕괴를 확인합니다 (에스컬레이터와 건물 외벽 장면).
- **APR ≈ 검색.** 테스트 embedding을 학습 embedding에 오프셋을 더한 것으로 쓰면, $\alpha^{\mathcal{I}} = \alpha^{\mathcal{J}} + \Delta^{\mathcal{I}}$가 되어

$$\begin{pmatrix}\hat{\mathbf{c}}_{\mathcal{I}}\\ \hat{\mathbf{r}}_{\mathcal{I}}\end{pmatrix} = \begin{pmatrix}\hat{\mathbf{c}}_{\mathcal{J}}\\ \hat{\mathbf{r}}_{\mathcal{J}}\end{pmatrix} + \begin{pmatrix}\sum_{j=1}^{n}\Delta_j^{\mathcal{I}}\mathbf{c}_{j}\\ \sum_{j=1}^{n}\Delta_j^{\mathcal{I}}\mathbf{r}_{j}\end{pmatrix},$$

  즉, APR은 구조적으로 *유사한 학습 이미지에 대한 상대적* 포즈를 예측합니다 — 이는 이미지 검색과 포즈 보간이 하는 것과 동일하며, relative pose regression과도 밀접하게 관련됩니다.

실험 도구: APR의 대표로서 PoseNet (학습된 손실 가중치)과 MapNet, 구조 기반의 표준(gold standard)으로서 Active Search (RootSIFT + P3P-RANSAC), 검색 기준선으로서 DenseVLAD (수작업 설계된 dense RootSIFT를 4096차원 VLAD descriptor로 풀링), 그리고 상위 $k$개 검색 이미지의 포즈를 보간하는 변형을 사용합니다.

## 실험 결과

- **Cambridge Landmarks & 7 Scenes**: "absolute 및 relative pose regression 접근법 중 어느 것도 검색 기준선을 일관되게 능가하지 못하며", APR 방법은 "구조 기반 방법보다는 이미지 검색에 성능이 더 가까운 경우가 많습니다" (median 위치/방향 오차, Table 2). 최고의 종단간 방법인 AnchorNet조차 가장 큰 장면(Street)에서 DenseVLAD를 이기지 못합니다.
- **TUM LSI** (텍스처가 부족한 실내): 저수준 SIFT 특징이 불리한 조건임에도 DenseVLAD가 여전히 pose regression을 능가합니다.
- **RobotCar**: MapNet+와 MapNet+PGO는 1.1km LOOP 장면에서 DenseVLAD를 이기지만, 9.6km FULL 장면에서는 "현저히 더 나쁜" 성능을 보입니다 — 확장성 실패입니다.
- **밀집 샘플링된 합성 데이터** (Shop Facade 렌더링, 학습 궤적으로부터 최대 3m까지 25cm 그리드 상의 추가 포즈): 더 많은 데이터가 도움이 되지만, PoseNet과 MapNet은 "데이터가 한 자릿수 더 많아도 Active Search에 근접한 성능을 내지 못합니다".
- **DeepLoc**: DenseVLAD가 단일 이미지 APR 방법을 능가하며, Active Search는 시퀀스 기반 VLocNet++ 변형조차 이깁니다.

## SLAM에서의 의미

이 논문은 "CNN으로 포즈를 그냥 회귀시키기"가 geometric relocalization의 대체재가 될 수 없는 이유에 대한 표준 참고 문헌입니다. SLAM에서의 relocalization과 loop closure 후보는 매핑된 궤적을 넘어 일반화되는 포즈를 필요로 하며, 이 분석은 어떤 학습 기반 접근법이 그것을 제공할 수 있는지 (구조에 기반한 방법: scene coordinate regression, 특징 매칭 + PnP)와 그렇지 못한지 (직접 회귀)를 설명합니다. 이 논문이 도입한 검색 기준선 sanity check는 이제 학습 기반 relocalizer를 평가하는 표준 관행이 되었습니다.

## 관련 문서

- [PoseNet](posenet.md)
- [DSAC](dsac.md)
- [DSAC\*](dsac-star.md)
- [ACE](ace.md)
- [HF-Net](hf-net.md)
- [NetVLAD](netvlad.md)
