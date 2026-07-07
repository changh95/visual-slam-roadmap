# Depth Anything 3

> Lin 2025 · [논문](https://arxiv.org/abs/2511.10647)

**한 줄 요약** — 단일 plain transformer(구조적 특화가 전혀 없는 vanilla DINOv2)가 하나의 최소한의 목표 — 뷰별 깊이 맵과 픽셀별 ray 맵 — 만으로 학습되어, 포즈를 알든 모르든 임의 개수의 뷰로부터 일관된 기하와 카메라 포즈를 복원하며, 평균적으로 포즈 정확도에서 VGGT를 35.7%, 기하 정확도에서 23.6% 능가하는 동시에 단안 깊이에서도 Depth Anything V2를 뛰어넘습니다.

## 문제

단안 깊이, SfM, MVS, SLAM은 모두 이미지로부터 3D 구조를 복원하며, 종종 입력 뷰의 개수만으로 구분될 뿐인데도 이 분야는 각각에 특화된 모델을 별도로 만들어 왔습니다. 최근의 통합 모델(DUSt3R, VGGT)에는 핵심적인 한계가 있습니다: 복잡한 맞춤형 아키텍처, 처음부터 다시 학습하는 다중 태스크 공동 최적화, 그리고 대규모 사전학습 백본을 온전히 활용하지 못한다는 점입니다. DA3는 두 가지 최소 모델링 질문을 던지고 둘 다에 긍정적으로 답합니다: (1) *예측 목표의 최소 집합*이 존재하는가, 아니면 수많은 3D 태스크에 걸친 공동 모델링이 필요한가? (2) *단일 plain transformer*로 충분한가? 두 번째 장애물은 데이터입니다: 실세계 깊이(COLMAP, 능동 센서)는 노이즈가 많고 불완전한 반면, 깨끗한 합성 깊이만으로는 카메라 포즈 추정이 실세계로 일반화되지 않습니다.

## 방법 및 아키텍처

**Depth-ray 표현.** $N_v$개의 입력 이미지에 대해 모델은 뷰마다 깊이 맵 $\mathbf{D}_i$와 ray 맵 $\mathbf{M} \in \mathbb{R}^{H \times W \times 6}$을 예측합니다 — 각 픽셀은 ray의 원점 $\mathbf{t}$와 *정규화되지 않은* 방향 $\mathbf{d} = \mathbf{R}\mathbf{K}^{-1}\mathbf{p}$(크기가 투영 스케일을 보존함)를 저장하여, $\mathbf{R}$을 직접 회귀할 때 생기는 직교성 제약을 피해 갑니다. 그러면 월드 포인트는 단순한 원소별 조합이 됩니다:

$$\mathbf{P} = \mathbf{t} + \mathbf{D}(u,v) \cdot \mathbf{d}$$

카메라 파라미터는 ray 맵으로부터 복원할 수 있습니다: 중심은 ray 원점들의 평균이고, $\mathbf{d}_{\text{cam}} = \mathbf{K}\mathbf{R}\,\mathbf{p}$가 homography $\mathbf{H} = \mathbf{K}\mathbf{R}$를 정의하므로, $\mathbf{H}^{*} = \arg\min_{\lVert\mathbf{H}\rVert=1} \sum_{h,w} \lVert \mathbf{H}\mathbf{p}_{h,w} \times \mathbf{M}(h,w,3{:}) \rVert$를 DLT로 풀고 RQ 분해하면 $\mathbf{K}, \mathbf{R}$이 얻어집니다. 이는 추론 시 비용이 크기 때문에, 경량 카메라 헤드가 뷰당 하나의 카메라 토큰으로부터 FOV $\mathbf{f} \in \mathbb{R}^2$, 쿼터니언 $\mathbf{q} \in \mathbb{R}^4$, 병진 $\mathbf{t} \in \mathbb{R}^3$을 예측합니다(백본 연산량의 약 0.1%). Ablation 결과, depth+ray는 depth+camera보다 Auc3를 거의 두 배로 향상시키며 포인트맵이나 중복된 다중 타깃 설정을 능가합니다.

- **단일 transformer 백본**: 사전학습된 ViT(vanilla DINOv2)에 *입력 적응형 cross-view self-attention*을 적용한 것 — 아키텍처 변경 없이 토큰 재배열만으로 이루어집니다. 처음 $L_s$개 레이어는 각 이미지 내부에서만 어텐션을 수행하고, 나머지 $L_g$개 레이어는 cross-view 어텐션과 within-view 어텐션을 번갈아 수행합니다($L_s : L_g = 2{:}1$). 이미지가 하나일 때는 추가 비용 없이 자연스럽게 단안 깊이 모델로 축소됩니다.
- **카메라 조건 주입**: 각 뷰 앞에 카메라 토큰이 붙습니다 — 포즈를 알고 있을 때는 $\mathcal{E}_c(\mathbf{f}_i, \mathbf{q}_i, \mathbf{t}_i)$를 인코딩하는 MLP를, 그렇지 않을 때는 공유되는 학습 가능한 토큰을 사용하여 — 포즈가 있는 입력과 없는 입력을 하나의 모델로 처리합니다(학습 중 조건화는 확률 0.2로 활성화됨).
- **Dual-DPT 헤드**: 깊이와 ray 분기(branch)는 reassembly 모듈을 공유하고 fusion 레이어에서만 차이가 나며, 이는 두 예측 사이의 상호작용을 촉진합니다; 이를 두 개의 분리된 DPT 헤드로 바꾸는 ablation은 일관되게 성능을 저하시킵니다.
- **Teacher-student 학습**: 순수하게 합성 데이터로만 학습된 단안 상대 깊이 teacher(DINOv2 + DPT, DA2의 disparity 대신 *exponential depth*를 예측)가 실세계 데이터에 대한 밀집 pseudo-label을 생성하며, 이는 RANSAC 최소제곱 scale-shift로 희소하고 노이즈가 있는 metric 깊이에 정렬됩니다: $(\hat{s},\hat{t}) = \arg\min_{s>0,t} \sum_p m_p (s\tilde{\mathbf{D}}_p + t - \mathbf{D}_p)^2$. 이는 DA2 수준의 디테일을 더하면서도 pose-depth 일관성을 보존합니다.
- **손실 함수**: 유효한 점들의 평균 L2 norm으로 정규화된 $\mathcal{L} = \mathcal{L}_D + \mathcal{L}_M + \mathcal{L}_P + \beta \mathcal{L}_C + \alpha \mathcal{L}_{\text{grad}}$이며 $\alpha = \beta = 1$입니다 — 깊이, ray 맵, 합성된 포인트맵에 대한 신뢰도 가중 L1 항에 카메라 손실과 깊이-그래디언트 손실을 더한 것입니다.

공개된 학술 데이터셋만으로 학습되었습니다: H100 GPU 128개, 20만 스텝, 기본 해상도 504x504, 샘플당 2~18개 뷰, 12만 스텝 시점에 ground-truth에서 teacher 레이블로 전환됩니다. 동일한 레시피로 단안 student, metric-depth 모델, 그리고 피드포워드 3DGS 변형(픽셀 정렬 가우시안 파라미터를 예측하는 추가 GS-DPT 헤드)도 만들어집니다.

## 실험 결과

- **새로운 시각 기하 벤치마크**(HiRoom, ETH3D, DTU, 7Scenes, ScanNet++ — 장면 89개 이상): 20개 설정 중 18개에서 state of the art; 평균적으로 **이전 SOTA인 VGGT 대비 카메라 포즈 정확도 +35.7%, 기하 정확도 +23.6%**(초록 기준).
- **포즈(Auc3)**: HiRoom에서 DA3-Giant(11억)는 80.3으로 VGGT(11.9억)의 49.1, Pi3의 67.0과 대비됩니다; ScanNet++에서는 85.0 대 62.6(2위 대비 33% 상대적 향상); 모든 기준선 대비 최소 8%의 상대적 Auc3 향상.
- **재구성**: 평균적으로 VGGT 대비 +25.1%, Pi3 대비 +21.5%의 상대적 향상; VGGT보다 3배 작은 DA3-Large(백본 3억)조차 10개 설정 중 5개에서 VGGT를 능가합니다.
- **단안 깊이**($\delta_1$): DA3는 KITTI 95.3 / NYU 97.4 / SINTEL 75.5 / ETH3D 98.6 / DIODE 95.4를 기록하여 DA2(94.6 / 97.9 / 77.2 / 86.5 / 95.2)를 앞서며, 단안 student는 97.1 / 98.0 / 82.3 / 98.8 / 96.5에 도달해 ETH3D에서 DA2보다 10% 이상 우수합니다. DA3-metric은 ETH3D metric 깊이에서 SOTA입니다($\delta_1$ 0.917 대 UniDepthv2의 0.863).
- **피드포워드 NVS**: 미세조정된 DA3는 DL3DV에서 21.33 PSNR을 기록하여 VGGT 백본의 20.96, 특화된 DepthSplat의 19.24와 대비됩니다 — 기하 품질이 렌더링 품질로 직접 이어집니다.
- **효율성**: A100에서 504x336 해상도 기준 이미지당 37.6 FPS(DA3-Giant) 대 VGGT의 34.1; 80GB A100 한 대에서 900~1000장의 이미지를 처리하는 반면 VGGT는 400~500장입니다(DA3-Large: 78.4 FPS, 1500~1600장). 비슷한 크기의 VGGT 스타일 dual-transformer는 단일 백본 성능의 79.8%로 떨어지는데, 이 격차는 전체 사전학습 대비 블록의 3분의 2가 학습되지 않은 상태이기 때문으로 설명됩니다.

## SLAM에서의 의미

DA3는 이 로드맵이 추적해 온 두 갈래의 딥 기하학 흐름을 하나로 합칩니다. Depth Anything V2의 후속작으로서, dense mono SLAM을 위한 더 강력한 drop-in 단안 깊이 사전 정보이며 — metric 변형은 스케일 문제를 직접 해결합니다. DUSt3R/VGGT 스타일의 any-view 모델로서는, SLAM 시스템이 필요로 하는 프론트엔드 값들 — 한 번의 순전파로 깨끗한 포인트 클라우드로 융합 가능한, 뷰별로 일관된 깊이와 카메라 포즈 — 을 정확히 내놓으며, VGGT보다 더 나은 포즈 정확도와 대략 두 배의 뷰 처리 용량을 갖습니다. 이는 VGGT-SLAM과 같은 서브맵 기반 시스템에 중요합니다(논문은 이러한 SLAM 응용을 이 모델 계열의 소비자로 인용합니다). 카메라 토큰 조건화는 특히 SLAM에 주목할 만한데, 트래커의 포즈 추정치를 처음부터 다시 추정하는 대신 기하를 개선하기 위해 주입할 수 있습니다. 정직한 유의점: DA3는 SLAM이 아니라 피드포워드 재구성입니다 — 루프 클로저, 재위치추정(relocalization), 전역 번들 조정이 없으며, (metric 변형을 제외하면) 출력은 metric이 아니라 스케일 정규화된 값이고, 동적 장면은 향후 연구 과제로 명시적으로 미뤄져 있습니다.

## 관련 문서

- [Depth Anything V2](depth-anything-v2.md) — DA3가 any-view 기하로 일반화한 synthetic-teacher / pseudo-labeled-student 레시피의 단안 전작
- [DUSt3R](dust3r.md) — 피드포워드 포인트맵 회귀의 기원; DA3는 depth+ray가 더 나은 최소 타깃이라고 주장합니다
- [VGGT](vggt.md) — 다단계 아키텍처와 중복된 타깃을 가진 이전의 any-view SOTA로, DA3의 plain transformer가 이를 능가합니다
