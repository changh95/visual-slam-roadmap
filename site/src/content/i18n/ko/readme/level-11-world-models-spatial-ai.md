### 핵심 개념
- **[월드 모델](level-11-world-models-spatial-ai/world-model.md)** — 예측과 계획에 사용할 수 있는, 환경 역학의 학습된 생성 모델
- **[VLM vs VLA](level-11-world-models-spatial-ai/vlm-vs-vla.md)** — 비전-언어 모델은 이미지에 대해 추론하며, 비전-언어-행동 모델은 여기에 더해 로봇 행동을 출력함
- **[공간 AI](level-11-world-models-spatial-ai/spatial-ai.md)** — SLAM, 장면 이해, 학습된 월드 표현의 수렴 (Davison의 FutureMapping 비전)

### 월드 모델

| 시스템 | 저자/연도 | 핵심 개념 |
|--------|-------------|--------------|
| [**GAIA-1**](level-11-world-models-spatial-ai/gaia-1.md) | [Wayve 2023](https://arxiv.org/abs/2309.17080) | 주행 월드 모델, 행동 조건화 미래 장면 생성 |
| [**Sora / DiT**](level-11-world-models-spatial-ai/sora-dit.md) | [OpenAI 2024](https://openai.com/index/sora/) | Diffusion Transformer, 시공간 패치, 창발적 3D 이해 |
| [**NVIDIA Cosmos**](level-11-world-models-spatial-ai/nvidia-cosmos.md) | [NVIDIA 2025](https://github.com/NVIDIA/Cosmos) | Physical AI를 위한 월드 파운데이션 모델 플랫폼, 자율주행차/로봇을 위한 합성 데이터 |
| [**World Labs / Marble**](level-11-world-models-spatial-ai/world-labs-marble.md) | [Fei-Fei Li 2025](https://www.worldlabs.ai/) | 이미지/비디오/텍스트 프롬프트로부터 생성적 3D 세계(영속적인 가우시안 스플랫 장면) 생성 |
| [**WorldVLA**](level-11-world-models-spatial-ai/worldvla.md) | [Cen (Alibaba) 2025](https://arxiv.org/abs/2506.21539) | 자기회귀 행동 월드 모델, 행동 생성을 위한 물리 법칙 학습 |
| [**SceneDINO**](level-11-world-models-spatial-ai/scenedino.md) | [Jevtić 2025](https://arxiv.org/abs/2507.06230) | 피드포워드 비지도 시맨틱 장면 완성 |

### 생성적 3D

| 시스템 | 저자/연도 | 핵심 개념 |
|--------|-------------|--------------|
| [**DreamFusion**](level-11-world-models-spatial-ai/dreamfusion.md) | [Poole 2023](https://arxiv.org/abs/2209.14988) | Score Distillation Sampling(SDS) + NeRF를 통한 텍스트-투-3D |

### 비전-언어 모델 (VLM)

| 시스템 | 저자/연도 | 핵심 개념 |
|--------|-------------|--------------|
| [**CLIP**](level-11-world-models-spatial-ai/clip.md) | [Radford (OpenAI) 2021](https://arxiv.org/abs/2103.00020) | 대조적 이미지-텍스트 사전학습, 4억 쌍, 제로샷 |
| [**SigLIP**](level-11-world-models-spatial-ai/siglip.md) | [Zhai (Google) 2023](https://arxiv.org/abs/2303.15343) | 시그모이드 손실 기반 CLIP, 더 효율적, 작은 모델 크기에서 더 우수 |
| [**BLIP-2**](level-11-world-models-spatial-ai/blip-2.md) | [Li (Salesforce) 2023](https://arxiv.org/abs/2301.12597) | Q-Former가 고정된 LLM과 이미지 인코더를 연결 |
| [**LLaVA**](level-11-world-models-spatial-ai/llava.md) | [Liu 2023](https://arxiv.org/abs/2304.08485) | LLaMA + 비전, 대화형 VLM |

### 비전-언어-행동 모델 (VLA)

| 시스템 | 저자/연도 | 핵심 개념 |
|--------|-------------|--------------|
| [**RT-2**](level-11-world-models-spatial-ai/rt-2.md) | [Brohan (DeepMind) 2023](https://arxiv.org/abs/2307.15818) | 텍스트 토큰으로서의 로봇 행동, 창발적 일반화 |
| [**OpenVLA**](level-11-world-models-spatial-ai/openvla.md) | [Kim 2024](https://arxiv.org/abs/2406.09246) | 오픈소스 VLA, SigLIP + Llama 7B + Action Head |
| [**NaVILA**](level-11-world-models-spatial-ai/navila.md) | [Cheng 2024](https://arxiv.org/abs/2412.04453) | 내비게이션을 위한 다리형/바퀴형 로봇 비전-언어-행동 모델 |

### 자료

| 자료 | 저자/연도 | 핵심 개념 |
|----------|-------------|--------------|
| [Awesome-Transformer-based-SLAM](https://github.com/KwanWaiPang/Awesome-Transformer-based-SLAM) | KwanWaiPang | Transformer 기반 SLAM 방법론을 정리한 GitHub 목록 |
