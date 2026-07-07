# Fusion++

> McCormac & Clark 2018 · [논문](https://arxiv.org/abs/1808.08378)

**한 줄 요약** — Mask-RCNN 인스턴스 분할을 사용하여 임의의 객체에 대한 객체별 TSDF 재건을 생성하는 객체 수준 체적 SLAM 시스템으로, 사전 모델이 필요 없으며 객체들이 6-DoF 포즈 그래프의 랜드마크 노드가 됨.

## 문제

SLAM++는 객체 수준 매핑을 시연했지만, 미리 스캔된 3D 모델 데이터베이스가 필요했기 때문에 매핑 가능한 모든 객체를 사전에 스캔해 두어야 하는 제어된 환경으로 국한되었습니다. 한편, 밀도 전체 장면 지도(서펠, 전역 TSDF)는 메모리를 많이 소모하며 객체와 잡동사니(clutter)를 동일하게 취급합니다. 필요했던 것은 임의의 객체를 즉석에서 *발견*하고, 각각을 컴팩트하게 재건하며, 그러한 지속적인 객체들을 지도 자체로 사용해 추적, 재위치추정(relocalization), 루프 클로저에 활용할 수 있는 시스템이었습니다.

## 방법 및 아키텍처

**파이프라인.** RGB-D 입력으로부터, 인스턴스에 무관한 거친 배경 TSDF($256^3$, 2\,cm 복셀, 카메라가 이동함에 따라 재설정)가 지역 프레임-대-모델 추적과 가림 처리를 지원합니다. 병렬 스레드에서 Mask R-CNN(ResNet-101, NYUv2에서 미세조정; 약 250\,ms/pass)이 인스턴스 마스크를 생성하며, 이는 필터링(상위 100개 검출, $\max p(l_i \mid I_k) > 0.5$, 마스크 면적 $> 50^2$\,px, 이미지 경계에서 떨어져 있음)을 거쳐 레이캐스트-마스크 중첩($a_{\mathrm{detect}} > 0.2$)으로 기존 지도상의 객체와 연관됩니다. 매칭되지 않은 검출은 새로운 객체 TSDF를 생성하고, 매칭된 것들은 기존 객체에 융합됩니다. 지속적인 지도는 *오직* 포즈 그래프 안의 객체 TSDF 집합뿐입니다.

**객체별 TSDF.** 마스크된 픽셀은 ${}_{W}\mathbf{p} = \tilde{\mathbf{T}}_{WC}^{k} \mathbf{K}^{-1} D_k(\mathbf{u})\, \mathbf{u}$로 역투영됩니다. 10번째/90번째 백분위 점들이 볼륨 중심과 정육면체 크기 $s_o$를 정의합니다(패딩 인자 $m = 1.5$, 최대 3\,m). 초기 해상도는 축당 $r_o = 64$입니다(128까지 증가 가능). 이에 따라 복셀 크기 $v_o = s_o / r_o$가 객체 크기에 적응합니다 — 작은 객체는 세밀한 디테일을 얻고, 큰 객체는 저비용으로 유지됩니다. 절단(truncation) $\mu = 4 v_o$ 내의 깊이는 *전체* 볼륨에 대한 가중 평균으로 융합됩니다. 어떤 복셀이 객체에 속하는지는 별도로 학습되며, 마스크 검출을 베타 사전분포를 갖는 이항 시행으로 융합합니다 — 전경/비전경 카운트 $F^o(\mathbf{v}), N^o(\mathbf{v})$는 다음을 제공합니다.

$$E[p^o(\mathbf{v})] = \frac{F^o(\mathbf{v})}{F^o(\mathbf{v}) + N^o(\mathbf{v})}$$

레이캐스팅은 $E[p^o(\mathbf{v})] > 0.5$인 곳에서만 표면을 렌더링합니다. 각 객체는 또한 평균화된 클래스 확률 $p(l_o \mid I_{1..k}) = \frac{1}{k}\sum_i p(l_o \mid I_i)$ (평균화가 과신하게 되는 곱셈적 베이즈보다 낫습니다)와, 베타 카운트 $(e_o, d_o)$를 갖는 *존재* 확률을 유지합니다. $E[p(o)] < 0.1$인 객체는 삭제됩니다.

**추적.** 배경 TSDF와 모든 객체 볼륨은 레이어드된 참조 프레임으로 레이캐스팅되며, 라이브 깊이는 투영적 점-대-평면 ICP로 정합됩니다.

$$r_{\mathrm{icp}}(\tilde{\mathbf{T}}_{WC_l}, \mathbf{u}_l) = N_r(\mathbf{u}_r) \cdot \big( V_r(\mathbf{u}_r) - \tilde{\mathbf{T}}_{WC_l} V_l(\mathbf{u}_l) \big)$$

이는 인스턴스별 오차 분할을 가지는 3단계 피라미드(레벨당 5회 반복)에서 Gauss-Newton으로 최소화됩니다. ICP RMSE가 0.05\,m를 초과하거나(또는 유효 픽셀이 너무 적으면) 추적 손실이 선언되며, 재위치추정을 촉발합니다: 깊이가 있는 BRISK 특징, 객체별 3D-3D RANSAC 후 장면 전체에 대한 공동 RANSAC(5\,cm 내에서 인라이어 50개 이상).

**객체 수준 포즈 그래프.** 노드는 카메라 포즈 $\mathbf{T}_{WC}$와 객체 포즈 $\mathbf{T}_{WO}$이며, 엣지는 분할된 ICP 항으로부터 나온 "가상" 상대 포즈 측정입니다. 예를 들어 $\mathbf{e}_{\mathrm{oc}} = \log\big( (\tilde{\mathbf{T}}^{\prime o}_{OC_k})^{-1} \mathbf{T}^{o}_{OW} \mathbf{T}_{WC_k} \big)$, 정보 행렬은 $\mathbf{H}_{\mathrm{pg}} = \mathbf{J}^{\top}_{\mathrm{pg}} ( \mathbf{J}^{o\top}_{\mathrm{icp}} \mathbf{J}^{o}_{\mathrm{icp}} ) \mathbf{J}_{\mathrm{pg}}$이며, 여기서 $\mathbf{J}_{\mathrm{pg}}$는 ICP와 포즈 그래프 섭동 규약 사이를 변환하는 $\mathbf{T}_{WC_k}$의 어드조인트(adjoint)입니다. 강건한(Huber) 그래프는 g2o에서 Levenberg-Marquardt로 풀립니다. 루프 클로저는 상대 객체 포즈를 조정하지만 TSDF 내부를 결코 변형시키지 않으므로, 재건 결과는 선명하게 유지됩니다.

## 실험 결과

제대로 제약되지 않는 ICP를 시험하기 위해 설계된 3,685 프레임짜리 오피스 루프에서, 시스템은 누적된 드리프트 이후 재위치추정을 수행하고 포즈 그래프를 보정하며, 반복된 루프에 걸쳐 재건된 105개의 객체 인스턴스를 재사용합니다. TUM RGB-D 벤치마크에서, Fusion++는 6개 시퀀스 중 5개에서 거친 TSDF 오도메트리 기준선보다 ATE RMSE를 개선합니다: fr1_desk 0.049 대 0.066\,m, fr1_room 0.235 대 0.305, fr2_desk 0.114 대 0.342, fr2_xyz 0.020 대 0.022, fr3_long_office 0.108 대 0.281 (fr1_desk2는 다소 나쁨, 0.153 대 0.146). 논문은 ElasticFusion/ORB-SLAM2의 정확도에는 도달하지 못한다고 밝히며, 사용 가능한 객체 지도를 우선시했다고 설명합니다. 객체 재건 품질은 YCB 비디오 데이터셋에서 실측 YCB 모델과 정성적으로 비교됩니다. 메모리는 객체당 약 4\,MB입니다(105개 객체에 대해 377\,MB, 동일한 예산으로 단일 볼륨을 사용하면 $900^3$에 해당). 최적화되지 않은 Python/C++/CUDA 시스템은 재위치추정을 제외하고 4--8\,Hz로 실행됩니다(추적 35\,ms, 레이캐스트 25\,ms + 가시 객체당 0.5\,ms, Mask R-CNN 260\,ms(스레드 내), 재위치추정 780\,ms).

## SLAM에서의 의미

Fusion++는 미리 구축된 CAD 데이터베이스라는 SLAM++의 가장 큰 한계를 제거했습니다. 상용 인스턴스 분할 CNN이 임의의 실내 장면에서 객체 수준 SLAM의 발견 메커니즘으로 사용될 수 있음을 보여주었으며, 강체인 객체별 TSDF들의 포즈 그래프가 모델 내부의 변형 없이도 루프 클로저 일관성을 제공한다는 것을 입증했습니다. 이는 밀도 융합 계보(KinectFusion 스타일 TSDF)와 의미론적 계보(SemanticFusion)의 교차점에 위치하며, MoreFusion, NodeSLAM, DSP-SLAM에 직접적인 영향을 미쳐, 이들은 원시 객체별 TSDF를 점진적으로 학습된 포즈 및 형상 사전으로 대체합니다.

## 관련 문서

- [SLAM++](slampp.md)
- [SemanticFusion](semanticfusion.md)
- [MoreFusion](morefusion.md)
- [DSP-SLAM](dsp-slam.md)
- [NodeSLAM](../level-05-deep-learning/nodeslam.md)
- [PointFusion / DenseFusion](pointfusion-densefusion.md)
