# 並行処理

リアルタイムSLAMシステムは並列性を積極的に利用する。約33ms(30Hz)というフレーム予算の中で、特徴抽出、マッチング、最適化、マップ管理をすべてカバーしなければならない。SLAMにおける並行処理は、命令レベルのSIMDからマルチスレッドアーキテクチャ、GPUオフロードまで、複数の階層にわたって存在する。

## SIMD: SSE/AVX/Neon

**SIMD**(Single Instruction, Multiple Data)命令は、1命令あたり4〜16個の値を処理する。x86ではSSE/AVX、ARM(つまりほとんどのロボット、スマートフォン、組み込みボード)では**Neon**が使われる。特徴点レベルの画像処理は、この典型的な恩恵を受ける対象である——ORB記述子の計算とマッチングは、ARM上のNeonイントリンシックから大きな利益を得る。定番の例は、ORBマッチングの内側ループであるバイナリ記述子間のハミング距離である。

```cpp
// Hamming distance of two 256-bit ORB descriptors: XOR + popcount
int hamming(const uint64_t* a, const uint64_t* b) {
    int d = 0;
    for (int i = 0; i < 4; ++i)
        d += __builtin_popcountll(a[i] ^ b[i]);  // 64 bits per instruction
    return d;
}
```

EigenやOpenCVのようなライブラリは内部でSIMDを使用しているが、SLAMフロントエンドのホットループはしばしば手動でベクトル化される。

## OpenMP

**OpenMP**は、コンパイラプラグマによる粗粒度のCPU並列性を提供する。

```cpp
#pragma omp parallel for
for (int i = 0; i < num_cells; ++i) {
    extractFeatures(image_grid[i]);   // per-patch feature extraction
}
```

これは、画像パッチ全体にわたる特徴抽出の並列化、点ごとの残差評価、ステレオマッチングの行など、データ並列な作業に適している——1行の記述で、明示的なスレッド管理も不要である。効果が出るのは、各イテレーションが独立していて、スレッドのフォーク/ジョインのコストを償却できるだけの十分な作業量がある場合に限られる。

## CUDA

**CUDA**は、大規模並列ワークロード向けにNVIDIA GPUをターゲットとする。密な深度推定、ニューラルネットワークの推論、密なボリュメトリックマッピング(KinectFusionのTSDF統合はGPU向けに設計された)がその対象である。トレードオフは、ホスト-デバイス間のメモリ転送コストと、追加されるデプロイの複雑さである——CPUで2msかかるステージも、往復コピーに3msかかるなら、GPUで0.5msにする価値がないかもしれない。ステージをGPUに移す前にプロファイルを取り、移す場合はパイプラインの各ステージ間でデータをデバイス上に保持し続けること。

## マルチスレッドSLAMアーキテクチャ

データ並列性を超えて、SLAMシステムは並行パイプラインとして構成される。時間的に重要なトラッキング(フレームごと)と、バックグラウンドのマッピング(キーフレームごと)には別々のスレッドが割り当てられる。ORB-SLAM3は、Tracking、Local Mapping、Loop Closingの3つのスレッドを使用し、ミューテックス下でマップを共有する。この分離はPTAMから継承されたもので、リアルタイムSLAMにおいて間違いなく最も影響力のあるアーキテクチャ上のアイデアの一つである。

重要なスキルは、C++のプリミティブとその規律ある使用法である。

```cpp
std::mutex map_mutex;

// Tracking thread: brief, fine-grained locking
{
    std::lock_guard<std::mutex> lock(map_mutex);
    local_points = map.getLocalPoints(current_pose);  // copy out, then unlock
}
trackAgainst(local_points);  // heavy work happens outside the lock
```

- **ロックの粒度**: ミューテックスは共有状態へのアクセス周辺だけで保持し、計算の周辺では決して保持しない。トラッカーが必要とするデータをコピーして解放すること。
- **条件変数/キュー**: プロデューサー-コンシューマー型のフレームキューは、カメラドライバとトラッキングを分離し、ジッターを吸収する。
- **データ競合**: ローカルBAによって変更中のマップを保護なしに読むと、「ランダムな発散」のように見える形で状態が破損する——スレッドサニタイザー(`-fsanitize=thread`)が助けになる。

## よくある落とし穴

- **粗粒度のグローバルロック**: 1つの大きなマップミューテックスがトラッキングとマッピングを直列化し、スレッド分割の利点を静かに破壊する。
- **オーバーサブスクリプション**: OpenMP、TBB(OpenCV内部)、そして自前のスレッドが、それぞれ同じ4コア上でプールを生成すると、スラッシングが起きる。スレッドはグローバルに予算管理すること。
- **フォールスシェアリング**: 同じキャッシュライン上の隣接する配列要素に複数スレッドが書き込むとスケールしにくい。パディングやブロック単位での分割を行うこと。
- **テストにおける非決定性**: スレッドスケジューリングは実行を再現不能にする。許容誤差を考慮した回帰テストを設計し、デバッグ用にシングルスレッドモードを用意すること。

## SLAMにおける意義

論文のプロトタイプと実運用可能なSLAMシステムの違いは、通常アルゴリズムの新規性ではなくエンジニアリングのスループットである。同じ数学でも、SIMDによる記述子計算、OpenMPフロントエンド、適切に分離されたスレッドアーキテクチャによって10倍速くなる。電力予算が厳しい組み込みプラットフォームでは、NeonとGPUを活用することがリアルタイム性を達成する唯一の手段になることも多い。

## ハンズオン

- [SIMD acceleration hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part5_ch03_06)
- [CUDA acceleration hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part5_ch03_08)

## 関連ノート

- [C++](cpp.md)
- [Edge deployment](edge-deployment.md)
- [Mobile](mobile.md)
- [PTAM](../level-03-monocular-slam/ptam.md)
- [ORB-SLAM3](../level-03-monocular-slam/orb-slam3.md)
