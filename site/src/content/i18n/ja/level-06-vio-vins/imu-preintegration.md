# IMU preintegration

IMUは100〜1000 Hzで計測値を生成するが、カメラは10〜30 Hzでキーフレームを供給する。素朴なVIOの定式化では、すべてのIMU読み取り値を推定器に投入することになり、状態変数の数が爆発的に増加してしまう。さらに悪いことに、素朴な積分は世界座標系で行われる: 積分結果は区間開始時点の絶対姿勢に依存するため、最適化器がその姿勢を調整するたびに、すべての生のIMUデータを再積分する必要が生じてしまう。

**プレインテグレーション**(LuptonとSukkariehが2012年に導入)はこの両方の問題を解決する。2つのキーフレーム時刻 $i$ と $j$ の間のIMU計測値は*キーフレーム $i$ のローカル座標系で*積分され、コンパクトな相対運動の要約を生成する:

$$\left(\Delta\mathbf{R}_{ij},\; \Delta\mathbf{v}_{ij},\; \Delta\mathbf{p}_{ij}\right)$$

— 相対回転、速度変化、位置変化である。重要なのは、これらの量がIMU計測値とバイアス推定値のみに依存し、**絶対姿勢には依存しない**ことである。これらは一度計算され保存され、ファクターグラフ内で状態 $i$ と $j$ を結ぶ単一の「IMU因子」として機能する。最適化器が姿勢を移動させても、再積分は不要である。

## 数式

計測モデル $\tilde{\boldsymbol{\omega}}_t = \boldsymbol{\omega}_t + \mathbf{b}^g + \boldsymbol{\eta}^g$、$\;\tilde{\mathbf{a}}_t = \mathbf{R}_t^\top(\mathbf{a}_t - \mathbf{g}) + \mathbf{b}^a + \boldsymbol{\eta}^a$ から出発すると、プレインテグレーションされた項は $[i, j)$ 内のIMUサンプル全体にわたって累積される:

$$\Delta\mathbf{R}_{ij} = \prod_{t=i}^{j-1} \mathrm{Exp}\!\big((\tilde{\boldsymbol{\omega}}_t - \mathbf{b}^g_i)\,\delta t\big)$$

$$\Delta\mathbf{v}_{ij} = \sum_{t=i}^{j-1} \Delta\mathbf{R}_{it}\,(\tilde{\mathbf{a}}_t - \mathbf{b}^a_i)\,\delta t, \qquad
\Delta\mathbf{p}_{ij} = \sum_{t=i}^{j-1}\Big[\Delta\mathbf{v}_{it}\,\delta t + \tfrac{1}{2}\Delta\mathbf{R}_{it}\,(\tilde{\mathbf{a}}_t - \mathbf{b}^a_i)\,\delta t^2\Big]$$

ここで重力は**登場しない**ことに注意 — それは絶対姿勢が利用可能な、以下の残差においてのみ再導入される。疑似コードでは、この累積はキーフレーム区間ごとに一度実行される単純なループである:

```text
ΔR, Δv, Δp ← I, 0, 0
for each IMU sample (ω̃, ã, δt) in [i, j):
    Δp ← Δp + Δv·δt + ½·ΔR·(ã − bᵃ)·δt²
    Δv ← Δv + ΔR·(ã − bᵃ)·δt
    ΔR ← ΔR · Exp((ω̃ − bᵍ)·δt)
    (propagate covariance and bias Jacobians alongside)
```

## IMU残差

得られる因子は、(現在の姿勢・速度・バイアス推定値と重力からの)予測相対運動を、保存されたプレインテグレーション計測値と比較する。これは、再投影残差が予測画素と観測画素を比較する仕組みと完全に並行している:

$$\mathbf{r}_{\Delta R} = \mathrm{Log}\big(\Delta\mathbf{R}_{ij}^\top\,\mathbf{R}_i^\top\mathbf{R}_j\big), \qquad
\mathbf{r}_{\Delta v} = \mathbf{R}_i^\top\big(\mathbf{v}_j - \mathbf{v}_i - \mathbf{g}\,\Delta t_{ij}\big) - \Delta\mathbf{v}_{ij}$$

$$\mathbf{r}_{\Delta p} = \mathbf{R}_i^\top\big(\mathbf{p}_j - \mathbf{p}_i - \mathbf{v}_i\,\Delta t_{ij} - \tfrac{1}{2}\mathbf{g}\,\Delta t_{ij}^2\big) - \Delta\mathbf{p}_{ij}$$

これは累積ループ中に伝播される共分散で重み付けされる([IMU noise model](imu-noise-model.md)のパラメータが入る場所である)。

## 実用化のための2つの改良

- **ヤコビアンによるバイアス補正。** プレインテグレーションされた項は、特定のバイアス推定値 $\mathbf{b}_i$ で計算されたものである。最適化器がバイアスを $\delta\mathbf{b}$ だけ更新すると、保存されたヤコビアンを用いた一次補正によって、生データに触れることなく因子が更新される:
  $$\Delta\tilde{\mathbf{R}}_{ij}(\mathbf{b} + \delta\mathbf{b}) \approx \Delta\mathbf{R}_{ij}\cdot\mathrm{Exp}\!\Big(\tfrac{\partial \Delta\mathbf{R}}{\partial \mathbf{b}^g}\,\delta\mathbf{b}^g\Big),$$
  $\Delta\mathbf{v}_{ij}, \Delta\mathbf{p}_{ij}$ についても $\partial/\partial\mathbf{b}^g$ と $\partial/\partial\mathbf{b}^a$ の項を用いて同様に行われる。バイアスが線形化点から大きく離れた場合にのみ、区間の再積分が必要となる。
- **オンマニフォルド定式化(Forsterら, 2015)。** 回転はベクトル空間ではなく、リー群 $SO(3)$上に存在する。Forsterの定式化は、積分とその雑音伝播を多様体上で正しく実行し、正しい共分散と解析的ヤコビアンを与える。これはGTSAM、VINS-Mono、ORB-SLAM3、Kimera-VIO、OKVIS2に実装されているバージョンである。

## よくある落とし穴

- **バイアス線形化の限界を忘れること。** 一次のバイアス補正は、保存された線形化点の近傍でのみ有効である; (初期化中などの)大きなバイアス更新の後は、プレインテグレーションされた項を再計算すべきである。
- **重力の符号/座標系の慣習。** $\mathbf{g}$ が上を向くか下を向くか、そして加速度計モデルがそれを引くか加えるかは、論文やコードベースによって異なる — このミスマッチは推定器を即座に発散させる。
- **タイムスタンプのジッタとサンプル欠落。** この累積は、サンプルごとの正確な $\delta t$ を前提としている; 計測されたタイムスタンプの代わりに名目上のレートを素朴に使うと、モデル化されていない誤差が入り込む。
- **共分散伝播の無視。** プレインテグレーションされた計測値は、その重みと同じくらいしか有用ではない; 適切な雑音伝播を省略すること(あるいはアドホックな一定の共分散を使うこと)は、IMU項と視覚項のバランスを崩す。

## SLAMにおける意義
プレインテグレーションは、最適化ベースのVIOをリアルタイムにした単一のアイデアである: それは高レートの数百の計測値を、正確に再線形化可能なままキーフレームペアごとの1つの因子に圧縮する。現代のあらゆる密結合VIOシステムはこれを基盤としており、$\Delta\mathbf{R}_{ij}$ がどのように形成され、バイアス補正されるかを理解することは、あらゆるVIOコードベースを理解するための最も速い道である。

## 関連ノート
- [IMU Preintegration on Manifold](imu-preintegration-on-manifold.md) — Forster 2015論文のノート。
- [IMU noise model](imu-noise-model.md) — 積分に入るバイアスと雑音の項。
- [Lie groups](../level-02-getting-familiar/lie-groups.md) — オンマニフォルド定式化の背後にある数学。
- [Factor graph](../level-02-getting-familiar/factor-graph.md) — プレインテグレーションされたIMU因子が存在する場所。
- [VINS-Mono](vins-mono.md) — プレインテグレーションされたIMU因子を中心に構築された完全なシステム。
