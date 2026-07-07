# 번들 조정

**번들 조정(Bundle Adjustment, BA)**은 총 재투영 오차를 최소화하는, 카메라 자세와 3D 랜드마크 위치의 공동 비선형 정제다. 이 이름은 각 카메라 중심에서 그것이 관측하는 3D 점들로 이어지는 "광선의 다발(bundles of rays)"에서 유래한다 — BA는 이 다발들이 이미지 측정값과 최대한 일치할 때까지 자세와 점을 조정한다. 이는 특징 기반 SLAM과 구조로부터의 모션(structure-from-motion)의 황금 표준 백엔드다.

## 비용 함수

카메라 자세 $T_i \in SE(3)$가 픽셀 측정값 $\mathbf{z}_{ij}$에서 랜드마크 $\mathbf{X}_j \in \mathbb{R}^3$를 관측할 때, **재투영 오차**는 다음과 같다:

$$\mathbf{e}_{ij} = \mathbf{z}_{ij} - \pi\big(T_i\, \mathbf{X}_j\big)$$

여기서 $\pi : \mathbb{R}^3 \to \mathbb{R}^2$는 카메라 투영 함수(핀홀 모델과 왜곡)다. BA는 다음을 푼다:

$$\min_{\{T_i\},\, \{\mathbf{X}_j\}} \sum_{(i,j) \in \mathcal{O}} \rho\big(\mathbf{e}_{ij}^T\, \Omega_{ij}\, \mathbf{e}_{ij}\big)$$

여기서 $\mathcal{O}$는 (자세, 점) 관측 쌍의 집합이고, $\Omega_{ij} = \Sigma_{ij}^{-1}$은 정보 행렬(측정 공분산의 역, 보통 피라미드 레벨별로 스케일이 조정됨)이며, $\rho$는 이상치 매칭의 영향을 제한하는 선택적 강건 커널(예: Huber)이다. 가우시안 잡음과 올바른 데이터 연관 하에서, 이는 정확히 최대 가능도 추정값(maximum-likelihood estimate)이다.

## 어떻게 풀리는가

BA는 비선형 최소제곱 문제로, 가우스-뉴턴이나 레벤버그-마쿼트로 반복적으로 풀린다. 각 반복은 현재 추정값 주변에서 잔차를 선형화한다: $\mathbf{e}(\mathbf{x} + \Delta\mathbf{x}) \approx \mathbf{e}(\mathbf{x}) + J\,\Delta\mathbf{x}$. 그리고 (댐핑된) 정규 방정식을 푼다:

$$\big(J^T \Omega J + \lambda I\big)\, \Delta\mathbf{x} = -J^T \Omega\, \mathbf{e}$$

자세는 $SE(3)$ 매니폴드 위에 존재하므로, 업데이트는 지역 파라미터화를 사용한다: 6차원 벡터 $\boldsymbol{\xi}$가 지수 사상(exponential map)을 통해 매핑되고 현재 자세와 합성된다, $T \leftarrow T \cdot \exp(\hat{\boldsymbol{\xi}})$. 이렇게 하면 매 단계마다 상태가 유효한 강체 변환으로 유지된다.

## 희소성과 슈어 보완

각 잔차는 정확히 **하나의 자세와 하나의 점**만 포함하므로, 헤시안 근사 $H = J^T \Omega J$는 다음과 같은 블록 구조를 가진다:

$$H = \begin{bmatrix} B & E \\ E^T & C \end{bmatrix}$$

여기서 $B$ ($6m \times 6m$)는 자세끼리만 결합하고, $C$ ($3n \times 3n$)는 점끼리만 결합하며, $E$는 자세-점 교차항이다. 결정적으로, $C$는 랜드마크마다 독립적인 $3 \times 3$ 블록을 가진 **블록 대각(block-diagonal)** 행렬이므로 자명하게 역행렬을 구할 수 있다. **슈어 보완(Schur complement)**은 먼저 점들을 제거한다:

$$\big(B - E\, C^{-1} E^T\big)\, \Delta\mathbf{x}_{\text{cam}} = -\mathbf{b}_{\text{cam}} + E\, C^{-1}\, \mathbf{b}_{\text{pts}}$$

이는 $(6m + 3n)$차원의 풀이를 $6m$차원의 풀이로 줄여 준다 — $n \gg m$일 때(수천 개의 점, 수십 개의 키프레임) 결정적인 이점이다. 랜드마크 업데이트는 이후 값싼 후방 대입(back-substitution)으로 복원된다. 이 구조적 활용이 실시간 BA를 가능하게 만드는 것이며, g2o, Ceres, GTSAM에 내장되어 있다.

**게이지 자유도(gauge freedom)**: 이 비용은 모든 자세와 점의 전역 강체 변환에 대해 불변이다(단안의 경우 스케일도 자유이므로 7 자유도). 솔버는 첫 번째 키프레임을 고정하거나(단안의 경우 스케일 기준도 하나 고정) 사전(prior)을 추가하여 이를 해결한다. 그렇지 않으면 $H$는 특이(singular) 행렬이 된다.

## 실전에서 쓰이는 변형들

- **모션 전용 BA (Motion-only BA)**: 랜드마크를 고정하고 하나의 카메라 자세만 최적화한다 — ORB-SLAM의 추적 스레드에서 이루어지는 자세 정제다.
- **로컬 BA (Local BA)**: 최근의/공동 가시성이 있는 키프레임 윈도우와 그 랜드마크들을 최적화하며, 인접 키프레임은 앵커로 고정한다 — 매핑 스레드에서 지속적으로 실행된다.
- **전역 BA (Global BA)**: 모든 것을 최적화하며, 보통 루프 클로저 이후에 실행되고, 비용이 큰 완전한 정제 전에 궤적을 가깝게 만들기 위해 포즈 그래프 최적화로 초기화되는 경우가 많다.
- **구조 전용 BA (Structure-only BA)**: 자세를 고정하고 점을 정제한다(예: 새 랜드마크를 삼각측량한 뒤).

## SLAM에서의 의미

BA는 현대 비주얼 SLAM의 정확도 엔진이다: 키프레임 기반 시스템은 원시 이미지 측정값에 대해 자세와 구조를 반복적으로 재최적화함으로써 정밀도를 얻으며, 증분 추정치를 그대로 신뢰하지 않는다. Strasdat 등이 보인 "최적화가 필터링을 이긴다"는 비주얼 SLAM에 대한 비교는 본질적으로 BA에 대한 진술이다. 그 희소 구조 — 그리고 슈어 트릭 — 를 이해하는 것은 진지한 SLAM 백엔드 라이브러리 전부의 아키텍처를 설명해 주며, 왜 키프레임 선택($m$을 작게 유지하는 것)이 그렇게 중요한지도 설명해 준다.

## 관련 문서

- [Reprojection error](reprojection-error.md)
- [Gauss-Newton](gauss-newton.md)
- [Levenberg-Marquardt](levenberg-marquardt.md)
- [Schur complement / Sparsity](schur-complement-sparsity.md)
- [M-estimator](m-estimator.md)
