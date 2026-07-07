# Lietorch

> Teed 2021 · [論文](https://github.com/princeton-vl/lietorch)

**一行要約** — 3次元変換群(SO(3), RxSO3, SE(3), Sim(3))を第一級の微分可能テンソル型として実装したPyTorchライブラリ。各群要素の接空間(tangent space)で誤差逆伝播を行う(論文: "Tangent Space Backpropagation for 3D Transformation Groups", Teed & Deng, CVPR 2021, [arXiv:2103.12032](https://arxiv.org/abs/2103.12032))。

## 問題

カメラ姿勢を推定・洗練する深層ネットワークは、回転や剛体変換を通じて微分する必要があるが、これらは平坦なパラメータ空間ではなく曲がった多様体上に存在する。標準的な「埋め込み空間」自動微分(行列成分やクォータニオン成分を微分するもの)には、論文が指摘する2つの失敗モードがある。1つは、演算ごとに手動でチューニングされたテイラー近似勾配を必要とする$\psi / \sin\psi$のような数値的に不安定な項であり、もう1つは完全に特異な勾配である——例えばSO(3)の対数写像における$\cos^{-1}\big((\mathrm{tr}(X)-1)/2\big)$は恒等元において導関数が未定義であり、そのためPyTorch3Dの行列対数はそこでNaN勾配を返す。Lietorch以前は、すべての深層SLAMプロジェクトがこの多様体計算機構を手作業で再実装していた。

## 手法とアーキテクチャ

- **テンソル型としてのリー群。** `lietorch.SE3`は`torch.Tensor`がスカラーに対して持つ関係と同様に、SE(3)に対応する: インデックス付け、リシェイプ、ブロードキャスト、任意のバッチ形状をサポートする群要素の多次元配列である。回転は単位クォータニオンとして格納され、すべての群演算(Exp, Log, Inv, Mul, Adj, AdjT、点への作用Act)はCUDAとC++の両カーネルおよびカスタム勾配を持つ。
- **接空間の微分。** 多様体は加法に関して閉じていないため、通常の微分はリトラクション$\xi \oplus X = \operatorname{Exp}(\xi) \circ X$とその逆$X \ominus Y = \operatorname{Log}(X \circ Y^{-1})$を用いて一般化される:

$$Df(X)[\mathbf{v}] = \lim_{t\to 0} \frac{f(t\mathbf{v} \oplus X) \ominus f(X)}{t},$$

  これは$X$の接空間における摂動と$f(X)$の接空間における摂動を関連付ける。逆方向モードの自動微分は、連鎖律$\frac{\partial\mathcal{L}}{\partial X} = \frac{\partial\mathcal{L}}{\partial Y} \mathbf{J}$によって行ベクトル勾配を伝播する。ここで$\mathbf{J}$は接空間ヤコビアンであり——SO(3)の場合、autogradの9次元埋め込み勾配ではなく3次元の勾配となる。
- **演算ごとの解析的ヤコビアン。** 群の乗算$Z = X \circ Y$に対して、逆伝播は単純に$\frac{\partial\mathcal{L}}{\partial X} = \frac{\partial\mathcal{L}}{\partial Z}$および$\frac{\partial\mathcal{L}}{\partial Y} = \frac{\partial\mathcal{L}}{\partial Z}\,\mathbf{Adj}_X$である(SO(3)の$R$では$\mathbf{Adj}_R = R$)。対数写像$\phi = \operatorname{Log}(X)$に対しては、BCH公式により$\frac{\partial\mathcal{L}}{\partial X} = \frac{\partial\mathcal{L}}{\partial\phi}\,\mathbf{J}_l^{-1}(\phi)$が得られ、逆左ヤコビアン$\mathbf{J}_l^{-1}$はSO(3)/SE(3)については閉形式で与えられる。解析的な左ヤコビアンを持たないSim(3)については、級数$\mathbf{J}_l^{-1}(\phi) = \sum_n (-1)^n \frac{B_n}{n!} (\phi^{\curlywedge})^n$($B_n$はベルヌーイ数)を必要な精度まで打ち切る。このため逆伝播は順伝播と同様に振る舞いが良く——特異な勾配もチューニングされたテイラー閾値も不要である。
- **深層SLAMへのそのまま導入可能な適用。** 目標とする計算グラフは、まさに学習型SLAMの「反復更新」パターンである——ネットワークが増分$\delta_k$を予測し、$e^{\delta_1}e^{\delta_2}e^{\delta_3}\mathbf{G}_1$として適用され、測地損失で学習される:

$$\mathcal{L}(\mathbf{T}_1,\ldots,\mathbf{T}_K) = \sum_k \|\operatorname{Log}(\mathbf{T}_k^{-1} \cdot \mathbf{T}^{*})\|,$$

  ここで$\mathbf{T}^{*}$は正解の姿勢である——著者らはこの損失が標準的な誤差逆伝播で実装するのは困難であると指摘している。

## 実験結果

- **逆運動学**(1000回の実行、$10^{-4}$の許容誤差で1000反復以内に収束): 素朴なPyTorch+Autogradは問題の0%で収束、手動チューニングしたAutogradは99.8%(SO(3))/100%に達し、Lietorchはチューニング無しで100%収束する。
- **ポーズグラフ最適化**(Carloneらのベンチマーク; リーマン勾配降下法による初期化+7回のガウス-ニュートンステップ): parking-garage、sphere、torus、cubeにおいて弦(chordal)緩和の大域的最適コストに一致するが、g2oとGTSAM単体は劣った局所最適解に陥る(例: Sphere-Aでは$1.49\times 10^{6}$対g2oの$5.32\times 10^{10}$)。最大の問題(cube、$n{=}8000$、$m{=}22236$)では初期化に1.21秒かかるのに対し、chordal+gtsamは17.9秒、gradient+gtsamは26.4秒、Autogradは18.3秒——より単純なGPU逆伝播により、埋め込み空間Autogradに対して一貫して10~15倍の高速化を実現。
- **RGB-D Sim(3)レジストレーション**(TartanAir、RAFT型ネットワーク+反復ごとに3回の微分可能ガウス-ニュートン更新): チューニングなしのAutogradはNaNを出す(成功率0%)。Lietorchは並進約79%/回転91%/スケール98%の成功率に達する——相似変換を通じた誤差逆伝播の初の実証であり、1次/2次/3次の左ヤコビアン近似はほぼ同等の性能を示す。
- **RGB-D SLAM**(測地姿勢損失で再実装したDeepV2D、NYU+ScanNetで学習): TUM RGB-Dベンチマークにおける平均ATE RMSEは、(元のDeepV2Dの)0.113 m、(DeepTAMの)0.116 mに対し0.105 mに改善する。

## SLAMにおける意義

姿勢最適化を通じて学習するすべての深層SLAMや深層VOシステムは、SE(3)の要素に関する微分を必要とし、これを手作業で正しく行うのはエラーが起きやすい(特異点でのNaN、多様体からのずれ)。Lietorchは多様体上で正しい微分を再利用可能でテスト済みのライブラリとした。DROID-SLAMやDPVOなどをはじめとするシステムの姿勢層を提供している。Theseus(微分可能非線形最小二乗法)と合わせて、PyTorchにおける微分可能な幾何最適化の標準的なツールボックスを構成している。

## 関連ノート

- [Theseus](theseus.md) — 同じニーズの上に構築された微分可能非線形最小二乗法
- [DROID-SLAM](../level-03-monocular-slam/droid-slam.md) — Lietorchを基盤とする代表的システム
- [DPVO](../level-03-monocular-slam/dpvo.md) — 疎パッチベースの後継、同様にLietorchベース
- [DeepV2D](deepv2d.md) — Lietorchの測地損失で再学習された深層RGB-D SLAMシステム
- [Lie groups](../level-02-getting-familiar/lie-groups.md) — 基礎となる数学
- [Differentiability](differentiability.md) — 深層SLAMにおいて幾何を通じた勾配が重要な理由
