# NetVLAD

> Arandjelović 2016 · [논문](https://arxiv.org/abs/1511.07247)

**한 줄 요약** — 대규모 visual place recognition을 위한 종단간 학습 가능한 CNN으로, 노이즈가 포함된 GPS 태그 스트리트뷰 이미지로부터 약지도 학습되는 미분 가능한 VLAD 풀링 레이어를 중심으로 구성된다.

## 문제

대규모 visual place recognition — 질의 사진이 어디에서 촬영되었는지 빠르고 정확하게 인식하는 것 — 에는 간결하면서도 판별력 있는 이미지 수준 descriptor가 필요하다. 고전적인 VLAD(Vector of Locally Aggregated Descriptors)는 로컬 descriptor를 잘 집약하지만 하드 클러스터 할당을 사용하기 때문에 종단간 학습이 불가능하며, 기성(off-the-shelf) CNN 특징은 place recognition 과제에 맞춰 최적화된 적이 없다(conv5 활성값조차 유클리드 거리 하에서 비교 가능하도록 학습되지 않았다). 또 다른 장애물은 지도(supervision)이다: 어느 이미지가 같은 장소를 보여주는지 사람이 직접 라벨링하지 않으므로, 학습은 노이즈가 있는 약지도 GPS 태그 데이터로부터 이루어져야 한다.

## 방법 및 아키텍처

기반 CNN(VGG-16 또는 AlexNet, ReLU 이전의 conv5에서 절단)은 이미지를 $N$개의 D차원 로컬 descriptor $\mathbf{x}_i$로 변환하고, NetVLAD 레이어는 이를 $K$개의 클러스터 중심 $\mathbf{c}_k$에 대해 집약한다. 고전적인 VLAD는 클러스터별 잔차 합을 저장한다: $V(j,k)=\sum_{i=1}^{N}a_{k}(\mathbf{x}_{i})\left(x_{i}(j)-c_{k}(j)\right)$, 여기서 하드 할당 $a_k \in \{0,1\}$이 미분 불가능성의 원인이다. NetVLAD는 이를 학습된 소프트 할당(중심까지의 거리에 대한 softmax, descriptor 노름 항은 소거된다)으로 대체한다:

$$\bar{a}_{k}(\mathbf{x}_{i})=\frac{e^{\mathbf{w}_{k}^{T}\mathbf{x}_{i}+b_{k}}}{\sum_{k'}e^{\mathbf{w}_{k'}^{T}\mathbf{x}_{i}+b_{k'}}}, \qquad V(j,k)=\sum_{i=1}^{N}\bar{a}_{k}(\mathbf{x}_{i})\left(x_{i}(j)-c_{k}(j)\right)$$

클러스터링으로부터 초기화하면, $\mathbf{w}_{k}=2\alpha\mathbf{c}_{k}$와 $b_{k}=-\alpha\lVert\mathbf{c}_{k}\rVert^{2}$는 $\alpha\to\infty$일 때 VLAD를 복원한다; 중요한 점은 $\{\mathbf{w}_k\},\{b_k\},\{\mathbf{c}_k\}$가 세 개의 *분리된* 학습 가능 파라미터 집합이라는 것이며, 이는 VLAD보다 더 큰 유연성을 준다(anchor point가 이동하여 매칭되지 않는 이미지들의 잔차를 서로 다르게 만들 수 있다). 이 레이어는 표준 연산들 — $1{\times}1$ 합성곱, softmax, 잔차 집약 코어, intra-normalization, 최종 L2 정규화 — 로 분해되므로 어떤 CNN에도 끼워 넣을 수 있고 역전파가 가능하다. $K=64$일 때 출력은 32k차원(VGG-16)이며, PCA whitening을 거쳐 최근접 이웃 검색용 4096차원 전역 descriptor가 된다.

학습에는 Google Street View Time Machine 파노라마를 사용한다: 몇 년의 시간차를 두고 촬영된 같은 장소의 이미지들은 질의 $q$마다 GPS 기반의 *가능성 있는(potential)* 양성 후보 $\{p_i^q\}$(근처에 있지만 다른 방향을 향하고 있을 수도 있음)와 확실한 음성 $\{n_j^q\}$(멀리 있음)를 제공한다. 약지도 triplet 순위 손실은 min 연산을 통해 자동으로 가장 잘 매칭되는 양성을 선택한다:

$$L_{\theta}=\sum_{j}l\Big(\min_{i}d_{\theta}^{2}(q,p_{i}^{q})+m-d_{\theta}^{2}(q,n_{j}^{q})\Big)$$

여기서 $l(x)=\max(x,0)$은 힌지 함수이고 $m$은 마진이다 — 노이즈가 있는 GPS 라벨을 견딜 수 있게 하는 multiple-instance-learning 관점의 triplet loss 변형이다. 전체 네트워크는 SGD로 학습된다.

## 실험 결과

평가는 Pittsburgh 250k(데이터베이스 이미지 25만 장, 질의 24,000개)와 Tokyo 24/7(데이터베이스 이미지 76,000장, 일몰/야간을 포함한 폰 촬영 질의 315개를 낮 데이터베이스에 대해 매칭)에서 recall@N(상위 N개 데이터베이스 이미지 중 25m 이내가 있으면 정답)으로 측정된다. 종단간 학습이 결정적이다: Pitts250k-test에서 학습된 AlexNet+NetVLAD는 recall@1 81.0%에 도달하는데, 표준 VLAD를 쓴 기성 AlexNet 특징은 55.0%에 그친다 — 47%의 상대적 향상이다. 4096차원 VGG-16 NetVLAD+whitening descriptor는 모든 벤치마크에서 최신 성능을 세우며, 최고의 로컬 특징 기반 압축 descriptor(dense RootSIFT+VLAD+whitening)와 Torii et al.의 view-synthesis 방법을 능가한다. NetVLAD는 또한 완만하게 성능이 저하된다: 128차원 NetVLAD는 512차원 Max pooling과 맞먹는다(Tokyo 24/7에서 recall@1 42.9% vs 38.4%). Time Machine 데이터 자체가 결정적이다 — Pitts30k-val에서 AlexNet Max pooling의 recall@1은 33.5%(기성)에서 38.7%(Time Machine 없이 학습)로, 그리고 68.5%(Time Machine으로 학습)로 상승한다. 동시간대의 질의/데이터베이스 쌍은 주차된 차량을 기억하는 것 같은 편법(shortcut)을 네트워크에게 가르치기 때문이다.

## SLAM에서의 의미

Loop closure 검출과 재위치추정(relocalization)은 place recognition 문제이며, NetVLAD의 descriptor는 수년간 이들의 사실상 표준이었다 — 이는 hloc 파이프라인과 수많은 SLAM 시스템의 전역 검색 단계이다. 또한 NetVLAD는 학습된 place recognition의 템플릿(CNN backbone + 학습 가능한 집약 + 약한 metric-learning 지도)을 확립했으며, Patch-NetVLAD, CosPlace, MixVPR, 그리고 오늘날의 파운데이션 모델 기반 VPR 방법들도 여전히 이를 따르고 있다.

## 실습

- [Deep global feature detection](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch01_10)

## 관련 문서

- [Patch NetVLAD](patch-netvlad.md) — 공간적 재순위화를 갖춘 다중 스케일 패치 수준 후속 연구
- [HF-Net](hf-net.md) — NetVLAD 검색 위에 구축된 계층적 위치 인식
- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md) — SLAM 맥락에서의 이 과제
- [SuperPoint](superpoint.md) — 학습 기반 위치 인식 파이프라인에서의 로컬 특징 대응판
