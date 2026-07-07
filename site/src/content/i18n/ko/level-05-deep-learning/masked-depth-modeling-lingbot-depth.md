# Masked Depth Modeling (LingBot-Depth)

> Tan 2026 · [논문](https://arxiv.org/abs/2601.17895)

**한 줄 요약** — RGB-D 센서가 유리, 거울, 광택 있는 금속에 남기는 구멍을 masked-autoencoder 스타일 사전학습을 위한 *자연적인 마스크*로 취급한다: ViT가 RGB와 깊이의 결합 임베딩을 학습하여 손상된 센서 입력으로부터 완전한 metric 깊이를 복원하며, 정밀도와 커버리지 모두에서 최상급 RGB-D 카메라를 능가한다.

## 문제

RGB-D 카메라는 metric scale, 픽셀 정렬된 dense geometry, 실시간 획득을 동시에 제공하는 유일한 modality지만, 그 stereo/구조광 매칭은 외관 모호성 아래서 실패한다: 텍스처가 적은 표면, 정반사, 투명한 재질, 복잡한 조명. 그 결과는 심각한 데이터 손상과 결측값이며, 하필 실내 로봇이 기하 정보를 가장 필요로 하는 곳에서 발생한다. 이 논문은 이러한 실패를 버려야 할 noise로 취급하는 대신 재구성한다: 결측 영역은 본질적으로 기하학적 모호성을 반영하는 "마스킹된" 신호이므로, 깊이 completion은 전체 RGB 이미지를 구조 문맥으로 삼는 masked-modeling 문제가 된다.

## 방법 및 아키텍처

**Masked Depth Modeling (MDM)**은 MAE의 encoder-decoder 패러다임을 따르지만 외관 대신 깊이를 예측한다:

- **분리된 patch embedding.** RGB(3채널)와 깊이(1채널)는 (DINOv2를 따라) patch size 14의 독립적인 patch-embedding 레이어를 가지며, modality당 $N = HW/14^2$개의 토큰으로 이루어진 공간적으로 정렬된 토큰 grid를 만든다. 각 토큰은 공유되는 학습 가능한 2D 공간 위치 임베딩과 modality 임베딩(RGB는 1, 깊이는 2)을 함께 받는다.
- **자연적 마스킹.** 완전히 결측된 깊이 patch는 항상 마스킹되고, valid/invalid가 섞인 patch는 0.75의 확률로 마스킹되며, 무작위로 선택된 완전히 valid한 patch가 추가되어 전체 60–90%의 깊이 마스킹 비율을 채운다. 이러한 자연적 마스크는 (무작위 dropout이 아니라) 실제 모호성에서 발생하므로 재구성이 의도적으로 더 어렵게 되어 있으며 — *마스킹되지 않은* RGB 이미지는 항상 조건으로 제공된다. 동일한 프레임워크가 마스킹 전략만으로 두 과제를 통합한다: 깊이 토큰 전체를 마스킹 → 순수한 단안 깊이 추정; invalid 토큰만 마스킹 → 깊이 completion.
- **Encoder/Decoder.** 모든 RGB 토큰 + 마스킹되지 않은 깊이 토큰 + [cls] 토큰이 24블록 ViT-Large(ViT-L/14, DINOv2로 초기화)에 입력된다. 잠재 깊이 토큰은 그 후 폐기되고, [cls] 토큰은 문맥 토큰들에 broadcast-add되어 **ConvStack decoder**(MoGe에서 적용)를 구동한다: residual 블록과 transposed convolution(kernel 2, stride 2)의 피라미드가 $(h,w)$에서 $(16h,16w)$까지 업샘플링하며, 각 스케일에 UV 위치 인코딩이 주입된다. 지도학습은 valid한 ground-truth 픽셀에 대한 단순 L1 손실이다. Attention 시각화는 깊이 query가 공간적으로 대응하는 RGB 영역에 attend함을 확인해 준다.
- **학습.** 128개 GPU에서 글로벌 배치 1,024, 25만 iteration(BF16, 약 7.5일), AdamW($\beta_1{=}0.9$, $\beta_2{=}0.999$, weight decay 0.05), encoder lr $1\times10^{-5}$ / decoder lr $1\times10^{-4}$에 warm-up과 step decay 적용; 증강으로는 color jitter, JPEG artifact, motion blur, shot noise가 포함된다.
- **데이터 구축.** 합성 Blender 파이프라인이 442개의 실내 장면으로부터 RGB + 완벽한 깊이 + speckle-pattern stereo 쌍(baseline은 0.05–0.2 m, 초점 거리 16–28 mm 범위에서 샘플링)을 렌더링한 뒤 SGM stereo matching을 실행하여 실제와 같은 실패 구멍을 지닌 *센서와 유사한* 깊이를 만든다. 3D 프린팅된 모듈형 rig가 상용 카메라(RealSense, Orbbec Gemini, ZED)를 탑재하여 FoundationStereo에서 유도된(left-right 검증된) pseudo-depth 라벨과 함께 200만 개의 실제 캡처를 얻는다. 7개의 공개 RGB-D 데이터셋과 합쳐 전체 코퍼스는 약 1,000만 개 샘플에 이르며, 300만 개의 RGB-깊이 쌍(실제 200만 + 시뮬레이션 100만), 코드, 체크포인트가 공개된다.

## 실험 결과

- **깊이 completion, Protocol 1** (block-wise 마스킹 + Kinect 스타일 noise, 네 가지 난이도): iBims, NYUv2, DIODE에서 *모든* 난이도에서 최고의 RMSE/REL — 예를 들어 NYUv2 extreme RMSE 0.181 vs PromptDA 0.324; iBims extreme 0.345 vs 0.607; 실내 벤치마크에서 extreme 설정에서도 최우수 경쟁 모델 대비 RMSE가 40% 이상 감소한다.
- **Protocol 2** (입력으로 희소 SfM point 사용, ETH3D): 실내 RMSE 0.192(최우수 baseline인 PriorDA의 0.360보다 47% 낮음), 실외 RMSE 0.664(OMNI-DC의 1.069보다 38% 낮음), 실내 $\delta_1$ 0.982.
- **사전학습된 backbone으로서**: LingBot-Depth로 초기화한 MoGe가 10개의 단안 깊이 벤치마크 전반에서 DINOv2 초기화를 능가한다(예: NYUv2 affine-invariant REL 0.044 vs 0.056); FoundationStereo의 단안 사전으로 사용하면 더 빠르게 수렴하고(epoch-5 HAMMER EPE 0.27 vs 순수 버전 0.46) 어디서나 최고 또는 그에 준하는 성능으로 끝난다(epoch-15 Middlebury EPE 0.75, HAMMER 0.17).
- **추가 학습 없는 응용**: Orbbec과 ZED 센서가 모두 실패하는 곳(유리 로비, 체육관 거울, 수족관 터널)에서 640×480 해상도 30 FPS의 시간적으로 일관된 비디오 깊이 completion; 유리가 많은 장면에서 정제된 깊이를 이용한 더 부드러운 SpatialTrackerV2 카메라 궤적; 20회 시도 중 dexterous grasping 성공 횟수: 강철 컵 17 vs 13(raw 깊이), 투명 컵 16 vs 12, 장난감 자동차 16 vs 9, 투명 보관함은 10 vs raw 깊이로는 전혀 잡을 수 없음.

## SLAM에서의 의미

RGB-D SLAM 시스템(KinectFusion 스타일 fusion, RGB-D odometry)은 암묵적으로 센서를 신뢰하는데, 유리벽과 거울은 특히 실내에서 그런 표면이 어디에나 있기 때문에 가장 흔한 실세계 실패 사례 중 하나다. LingBot-Depth는 곧바로 끼워 넣을 수 있는 학습된 센서 프론트엔드로 동작한다 — 논문 자체의 카메라 tracking 실험은 raw 센서 깊이가 유리로 된 장면에서 심각한 drift를 유발하는 반면 completion된 깊이는 깨끗하게 추적됨을 보인다 — 이를 통해 SLAM 알고리즘 자체를 바꾸지 않고도 RGB-D SLAM이 동작할 수 있는 범위를 넓힌다. 자연적 마스크 사전학습이라는 아이디어는 또한 SLAM에 modality 간 정렬된 결합 RGB-깊이 표현을 제공한다.

## 관련 문서

- [Depth from sensor](../level-04-rgbd-slam/depth-from-sensor.md) — 깊이 센서의 동작 방식과 실패 지점
- [Depth Anything V2](depth-anything-v2.md) — 반사 표면에서도 강력한 단안 깊이 foundation model
- [Marigold](marigold.md) — 세밀한 디테일을 갖는 생성적 깊이 추정
- [KinectFusion](../level-04-rgbd-slam/kinectfusion.md) — 보정된 깊이를 소비하는 고전적 파이프라인
