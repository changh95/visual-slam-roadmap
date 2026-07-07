# RAFT-3D

> Teed 2021 · [논문](https://arxiv.org/abs/2012.00726)

**한 줄 요약** — 픽셀별 $SE(3)$ 강체 모션의 밀집 필드를 반복적으로 정제함으로써 RAFT를 2D optical flow에서 3D scene flow로 확장하며, 학습된 강체 운동 임베딩과 기하학적 일관성을 강제하는 미분 가능한 Dense-SE3 최적화 레이어를 사용한다.

## 문제

Scene flow — 스테레오 또는 RGB-D 비디오 프레임 쌍이 주어졌을 때 픽셀별 3D 모션을 추정하는 것 — 는 로봇이 카메라 자기 운동(ego-motion)과 독립적으로 움직이는 물체를 분리하는 데 필요한 정보다. 실제 장면은 대체로 강체로 움직이는 물체들의 집합이므로 그 3D 모션 필드는 $SE(3)$ 상에서 부분적으로 *상수*이지만, 기존 방법들은 제약 없는 점별 이동량을 예측하거나(예: FlowNet3D) 물체 검출/인스턴스 세그멘테이션 네트워크를 통해 강체성을 활용한다 — 이는 인스턴스 지도(supervision)를 필요로 하고, 미지의 물체를 처리할 수 없으며, 파이프라인에 미분 불가능한 구성 요소를 끌어들인다. RAFT-3D는 인스턴스 라벨 없이 RAFT류의 밀집 아키텍처 안에 강체성 사전 정보를 어떻게 내재화할 수 있는지를 묻는다.

## 방법 및 아키텍처

입력: 두 RGB-D 쌍 $(I_1, Z_1)$, $(I_2, Z_2)$(스테레오 입력의 경우 기성 스테레오 네트워크 GA-Net으로부터의 깊이); 출력: 밀집 변환 필드 $\mathbf{T} \in SE(3)^{H \times W}$. 3D 점을 픽셀 좌표와 역깊이 $d = 1/Z$로 매핑하는 확장된 pinhole 투영 $\pi$를 사용하면, 이 필드는 다음과 같은 대응 관계를 유도한다.

$$\mathbf{x}_i' = \pi(\mathbf{T}_i \cdot \pi^{-1}(\mathbf{x}_i))$$

$\mathbf{x}_i' - \mathbf{x}_i$의 처음 두 성분은 optical flow이며 세 번째 성분은 역깊이 변화다.

- **RAFT 기법**: 공유 특징 인코더(1/8 해상도에서 128차원 특징)가 4D all-pairs correlation volume $\mathbf{C}_{ijkh} = \langle f_\theta(I_1)_{ij}, f_\theta(I_2)_{kh} \rangle$를 만들며, 이는 4레벨 피라미드로 풀링되어 현재 대응 관계 주변에서 bilinear 샘플링으로 인덱싱된다. Context 인코더는 사전 학습된 ResNet50으로 업그레이드된다 — 픽셀을 강체 물체로 그룹화하려면 2D flow보다 더 많은 의미 정보와 수용 영역이 필요하기 때문이다.
- **업데이트 연산자**: ConvGRU가 유도된 flow 필드 $\mathbf{x}' - \mathbf{x}$, twist 필드 $\log_{SE3}(\mathbf{T})$, 깊이 잔차(역투영된 역깊이 대 대응 관계에서의 두 번째 프레임 깊이 맵), 그리고 상관 특징을 입력으로 받는다. 그 은닉 상태로부터 강체 운동 임베딩 $\mathbf{V}$, 개정(revision) 맵 $\mathbf{r}_x, \mathbf{r}_y, \mathbf{r}_z$(유도된 flow와 두 번째 프레임 역깊이에 대한 보정), 신뢰도 맵 $\mathbf{w} \in [0,1]$을 예측한다.
- **Dense-SE3 레이어**: 임베딩은 다음의 유사도(affinity)를 통해 픽셀을 부드럽게 강체 물체로 그룹화한다.

$$a_{ij} = 2\,\sigma(-\lVert \mathbf{v}_i - \mathbf{v}_j \rVert^2) \in [0, 1]$$

  그리고 각 픽셀의 변환은 가중된 재투영 목적 함수에 대한 Gauss-Newton 스텝 1회로 업데이트된다.

$$E(\delta) = \sum_{i \in \Omega} \sum_{j \in \mathcal{N}_i} a_{ij} \left\lVert \mathbf{r}_j + \pi(\mathbf{T}_j \mathbf{X}_j) - \pi(e^{\delta_i} \mathbf{T}_i \mathbf{X}_j) \right\rVert^2_{w_j}$$

  즉 각 픽셀은 자신의 이웃을 설명하는 모션을 찾으려 하지만, 유사한 임베딩을 가진 쌍만이 기여한다. 모든 항이 하나의 $\mathbf{T}_i$만 다루기 때문에, (FlyingThings3D 해상도에서 2억 개 방정식에 이르는) 거대한 시스템은 CUDA 내에서 그 자리에서 구성된 $H \times W$개의 독립적인 6변수 문제로 분해된다. 12회의 GRU 반복은 12회의 Gauss-Newton 업데이트를 산출한다.
- **보조 레이어**: 미분 가능한 bi-Laplacian 최적화 레이어(sparse Cholesky)가 GRU로 예측된 엣지 가중치를 사용하여 모션 경계 내에서 임베딩을 매끄럽게 만든다. SE3 업샘플링은 $\mathbf{T}$를 Lie 대수로 매핑하고, 그곳에서 convex 업샘플링을 수행한 후 지수 사상으로 다시 매핑한다.
- **지도(supervision)**: 유도된 flow / 역깊이 변화만 지도되며, $\mathcal{L} = \sum_k \gamma^{N-k} \lVert \mathbf{f}_{est}^k - \mathbf{f}_{gt} \rVert_1$($\gamma = 0.9$)이다 — 강체 운동 임베딩은 Dense-SE3를 통해 미분함으로써(LieTorch 라이브러리를 이용한 탄젠트 공간에서의 역전파) *암묵적으로* 학습된다. 바운딩 박스나 마스크 지도는 어디에도 없다.

## 실험 결과

- **FlyingThings3D**(FlowNet3D 분할에 대한 two-view 평가): 발표된 최고의 3D 정확도($\delta < 0.05$)를 34.3%에서 83.7%로 향상시켰다. 또한 3D로 확장된 RAFT 기준선들(역투영된 2D flow, flow + 깊이 변화, 직접적인 3D flow 예측)을 큰 차이로 능가하며, 장면을 강체 구성 요소로 분해하기 때문에 가려진 영역에 대해서도 모션을 추정할 수 있다. 임베딩에 대한 지도가 전혀 없이도 강체 세그멘테이션이 자연스럽게 나타난다.
- **KITTI scene flow leaderboard**: 오차 5.77로, PSMNet, PWC-Net, Cityscapes에서 사전 학습된 인스턴스 지도 기반 Mask-RCNN을 결합한 최고 발표 방법 DRISP(6.31)를 능가한다 — RAFT-3D는 인스턴스 라벨 없이 FlyingThings3D + KITTI만으로 학습한다.
- **Ablation**: 정확도는 약 16회의 업데이트 반복까지 향상된다. Dense-SE3의 이웃 반경 256은 더 작은 반경과 전체 이미지를 모두 능가한다. 역깊이 개정은 3D 지표를 향상시킨다. bi-Laplacian 레이어는 1px 정확도를 85.8에서 86.3으로, 3D 정확도를 87.1에서 87.8로 끌어올린다.
- 학습 가능 파라미터 4500만 개(ResNet50 context 백본에 4000만 개); 540x960 이미지에 대한 추론에는 1.6GB의 GPU 메모리가 필요하다(GTX 1080Ti, 16회 업데이트).

## SLAM에서의 의미

동적 환경은 SLAM의 핵심 실패 모드다: 움직이는 물체는 자기 운동 추정의 근간이 되는 정적 세계 가정을 위반한다. RAFT-3D의 픽셀별 강체 운동 필드는 동적 물체를 세그멘테이션하고 카메라와 별도로 그 모션을 추정하는 데 정확히 필요한 표현을 제공한다 — 이는 검출기 기반 파이프라인으로 동일한 문제를 다루는 동적 SLAM 시스템(VDO-SLAM, DynaSLAM II)이 인스턴스 지도 없이도 풀어낸 것과 같다. 학습된 반복적 정제와 내재된 미분 가능한 기하 최적화 레이어의 결합은 RAFT로부터 동일 저자들의 DROID-SLAM으로 이어지는 직접적인 계보 위에 있다.

## 관련 문서

- [RAFT](raft.md) — 2D optical flow의 기반
- [FlowNet3D](flownet3d.md) — 강체성 사전 정보 없는 초기의 포인트 클라우드 scene flow
- [DROID-SLAM](droid-slam.md) — 동일 저자들; 밀집 BA 레이어를 갖춘 완전한 SLAM 시스템
- [VDO-SLAM](../level-03-monocular-slam/vdo-slam.md) — 물체 모션을 추적하는 동적 SLAM
