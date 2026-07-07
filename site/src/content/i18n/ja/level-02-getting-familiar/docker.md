# Docker

Dockerはアプリケーションを、そのユーザースペース全体の環境 — OSライブラリ、コンパイラ、Pythonのバージョン、CUDAツールキット — とともに**コンテナイメージ**にパッケージ化し、どのLinuxホスト上でも同一に動作させる。SLAMの実務では、これが分野で最もよくある実務的な悩みを解決する。すなわち、Ubuntu、OpenCV、Eigen、Ceres、ROSの特定のバージョンの組み合わせでしかビルドできない研究コードの問題である。

典型的なSLAM用Dockerfileは、まさにその組み合わせを固定する。

```dockerfile
FROM ros:humble
RUN apt-get update && apt-get install -y \
    libeigen3-dev libopencv-dev libceres-dev \
 && rm -rf /var/lib/apt/lists/*
COPY . /ws/src/my_slam
RUN cd /ws && . /opt/ros/humble/setup.sh && colcon build
```

そして典型的な開発用の`run`実行コマンドは、必要になるであろうほとんどのフラグを組み合わせる。

```bash
docker build -t my_slam .
docker run -it --rm \
  --gpus all \                              # NVIDIA Container Toolkit: GPU inside
  -v ~/data:/data \                         # datasets live on the host
  -v $(pwd):/ws/src/my_slam \               # live-edit source from the host
  -e DISPLAY=$DISPLAY \
  -v /tmp/.X11-unix:/tmp/.X11-unix \        # X11 forwarding for visualizers
  --network host \                          # ROS discovery across host/container
  my_slam bash
```

慣れておくべき重要な考え方は次の通り。

- **イメージ vs. コンテナ** — イメージは凍結されたレシピ/結果であり、コンテナはその実行中インスタンスである。`docker build`、`docker run`、`docker exec`が日常の使用のほとんどを占める。
- **ボリューム** — データセットとソースコードをホストからマウントすることで、コンテナは使い捨て可能なままデータは永続化される。
- **GPUアクセス** — NVIDIA Container Toolkit（`--gpus all`）はホストのGPUをコンテナ内に公開する。これは学習済みフロントエンドやCUDAアクセラレーションされたマッピングをコンテナ内で実行する方法である。
- **GUI/X11フォワーディング** — SLAMのビジュアライザ（Pangolin、RViz）はディスプレイフォワーディング（上記の`DISPLAY`/X11ソケットのペア、しばしばホスト側で`xhost +local:`も併用）が必要である。これは一度学んでおく価値のある、よく知られたDockerの摩擦点である。
- **レイヤーキャッシュ** — Dockerfileのステップを変更頻度の低いものから高いものの順に並べることで、コード編集後の再ビルドが1時間かかるOpenCVの再コンパイルではなく数秒で済むようになる。
- **ハードウェアデバイス** — 実カメラやIMUには明示的なパススルー（`--device /dev/video0`）が必要であり、コンテナが物理ロボットに接するわずかな箇所の一つである。

## 基本を超えて

- **マルチステージビルド**は重い（コンパイラや`-dev`パッケージを含む）ビルド用イメージと、スリムなランタイム用イメージを分離する — 知覚スタックをロボットにデプロイする際のパターンである。
- **docker compose**はマルチコンテナ構成を宣言的に記述する。SLAMノード、可視化用コンテナ、データセット/バッグプレイヤーを1つの再現可能なスタックとして扱える。
- **クロスアーキテクチャビルド**（`docker buildx`）はx86ワークステーション上でARMイメージをビルドする — デスクトップでビルドしたイメージがJetson級のロボットに届く仕組みである。
- **開発コンテナ**（VS Codeなど）は、エディタ、デバッガ、IntelliSenseを固定された環境の*内側*で動かすことを可能にし、「Dockerではビルドできるが自分のIDEではビルドできない」という最後の不一致を取り除く。

実務上、今やほとんどすべての本格的なオープンソースSLAMリポジトリはDockerfileを備えており、論文の結果を再現する作業は通常`docker build`から始まる。Dockerはまた、SLAMが大規模に評価される仕組みでもある。CIパイプラインはコンテナ内でデータセットベンチマークを実行し、ロボットはクリーンな更新とロールバックのために知覚スタックをコンテナとしてデプロイすることが増えている。

## よくある落とし穴

- マウントされたボリューム上でコンテナ内で作成されたファイルはrootが所有者になる。`--user $(id -u):$(id -g)`で実行するか、イメージ内で所有権を修正すること。
- `--network host`（あるいは適切なDDS設定）を忘れると、コンテナ内外のROS 2ノードが互いを認識できなくなる。
- aptキャッシュやビルドツリーをイメージ内に残すと、数ギガバイト規模の肥大化を招く。同じ`RUN`レイヤー内でクリーンアップすること。
- コンテナは依存関係を分離するものであり、物理現象を分離するものではない。タイミングの決定性を改善したり、それ自体でリアルタイムスケジューリングを保証したりはしない。

## SLAMにおける意義

SLAMシステムは悪名高いほど重く脆弱な依存関係スタック（プロジェクト間で衝突する特定のOpenCV/Eigen/Ceres/ROSバージョン）を持つ。Dockerを使えば、ORB-SLAM3、VINS-Fusion、PyTorchベースのフロントエンドを1台のマシン上で、それぞれの依存関係を衝突させずに保持できる。また自分の研究を他者にも再現可能にし、CIベンチマークと実ロボットへのデプロイの両方における標準的なパッケージング単位である。

## 関連ノート

- [ROS/ROS2](ros-ros2.md)
- [CI/CD](ci-cd.md)
- [Git/GitHub](git-github.md)
- [Edge deployment](edge-deployment.md)
