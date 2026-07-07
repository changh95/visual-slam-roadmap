# QUASAR

> Yang 2019 · [論文](https://arxiv.org/abs/1905.12536)

**一行要約** — 外れ値を含むWahba問題(回転探索)に対する初の多項式時間で証明可能に最適な解法。Truncated Least Squaresコストを単位クォータニオンと「バイナリクローニング」を用いてQCQPに書き換え、緊密なSDP緩和によって解く。

## 問題

Wahba問題 — 想定された対応関係が与えられた2つのベクトル観測集合を最もよく整合させる回転を求める問題 — は点群位置合わせ、画像スティッチング、モーション推定、衛星姿勢決定における基本的な処理である。外れ値のないバージョン $\min_{\mathbf{R}\in\mathrm{SO}(3)}\sum_i w_i^2\Vert\mathbf{b}_i-\mathbf{R}\mathbf{a}_i\Vert^2$ には閉形式解があるが、特徴マッチングから得られる実際の対応関係は95%が外れ値であることもある(例: FPFHマッチング)。RANSACの実行時間は外れ値率に対して指数的に増大し、ノイズに対しても性能が劣化する。ロバストな局所最適化(例: FGR)は局所最小値で停滞し得るし、Branch-and-Boundは大域的に最適だが最悪ケースで指数的である。QUASAR以前には、多数の外れ値を含む回転探索に対する多項式時間の*証明可能に最適な*手法は存在しなかった。

## 手法とアーキテクチャ

**TLS(Truncated Least Squares)の定式化。** 各測定値は、残差が小さい間のみ最小二乗項として寄与する。閾値を超えると飽和し、推定に影響を与えなくなる:

$$\min_{\mathbf{R}\in\mathrm{SO}(3)} \sum_{i=1}^{N} \min\left( \frac{1}{\sigma_i^2}\Vert\mathbf{b}_i - \mathbf{R}\mathbf{a}_i\Vert^2,\ \bar{c}^2 \right),$$

ここで $\sigma_i$ はインライアのノイズ標準偏差であり、$\bar{c}^2$ は確率 $p$(例: $p=0.99$)における $\chi^2(3)$ 分位点として選ばれる。したがって $\sigma_i^2\bar{c}^2$ はインライアとして許容される最大の二乗残差となる。

**クォータニオンによる書き換え。** $\mathbf{R}$ を単位クォータニオン $\mathbf{q}\in\mathcal{S}^3$ で表現することで、制約集合 $\mathrm{SO}(3)$ を単位球に置き換え、$\mathbf{R}\mathbf{a}$ はクォータニオン積 $\mathbf{q}\otimes\hat{\mathbf{a}}\otimes\mathbf{q}^{-1}$ で表現される。

**バイナリクローニングによるQCQP化。** $\min(x,y)=\min_{\theta\in\{\pm 1\}} \frac{1+\theta}{2}x+\frac{1-\theta}{2}y$ を用いると、TLSコストは混合整数プログラムとなり、$\theta_i=+1$ は測定値 $i$ をインライアとして、$\theta_i=-1$ はアウトライアとして宣言する — つまり外れ値の分類が最適化の*内部*に存在する。クローンクォータニオン $\mathbf{q}_i = \theta_i\mathbf{q}$ を定義すると整数変数が除去され、$\mathbf{x}=\left[\mathbf{q}^{\mathsf{T}}\ \mathbf{q}_1^{\mathsf{T}}\ \dots\ \mathbf{q}_N^{\mathsf{T}}\right]^{\mathsf{T}}$ をスタックすると、厳密に等価な二次制約付き二次計画(QCQP)が得られる:

$$\min_{\mathbf{x}\in\mathbb{R}^{4(N+1)}} \sum_{i=1}^{N}\mathbf{x}^{\mathsf{T}}\mathbf{Q}_i\mathbf{x} \quad \text{s.t.} \quad \mathbf{x}_q^{\mathsf{T}}\mathbf{x}_q = 1,\quad \mathbf{x}_{q_i}\mathbf{x}_{q_i}^{\mathsf{T}} = \mathbf{x}_q\mathbf{x}_q^{\mathsf{T}}\ \forall i,$$

ここで既知の対称行列 $\mathbf{Q}_i$ は $\mathbf{a}_i,\mathbf{b}_i$ から構築される。

**緊密なSDP緩和。** $\mathbf{Z}=\mathbf{x}\mathbf{x}^{\mathsf{T}}\succeq 0$ に持ち上げ、ランク1制約を落とすことで、$\mathrm{tr}(\mathbf{Q}\mathbf{Z})$ に関する凸なSDPが得られる。*ナイーブな*緩和(ブロック対角制約のみ)は、ノイズも外れ値もない場合に証明可能に緊密である(定理7)が、実際に外れ値があると破綻する。QUASARはオフダイアゴナルブロックに冗長な対称性制約 $[\mathbf{Z}]_{qq_i}=[\mathbf{Z}]_{qq_i}^{\mathsf{T}}$ および $[\mathbf{Z}]_{q_iq_j}=[\mathbf{Z}]_{q_iq_j}^{\mathsf{T}}$ を追加し、これによって大きなノイズと極端な外れ値率の下でも緩和が経験的に緊密になる。解のランクが1(緩和ギャップがゼロ)の場合、復元された回転は元の非凸なTLS問題に対して大域的に最適であることが*証明*される。

## 実験結果

- **ナイーブな緩和 対 緊密な緩和**(合成データ、$N=40$、ノイズなし): ナイーブなSDPは10〜40%の外れ値で緩みが生じ始め、40%を超えると完全に破綻する。一方QUASARは90%の外れ値でも証明可能に最適なランク1解を返す。
- **合成ベンチマーク**($\sigma_i=0.01$): 閉形式のWahba解は外れ値がない場合にのみ機能する。FGRは70%までロバストだが90%で破綻する。RANSAC、GORE、QUASARは90%の外れ値までロバストであり、QUASARがわずかに高精度である。極端な91〜96%の外れ値($N=100$)では、Wahba/FGR/RANSACは破綻し、GOREは96%で一度失敗するが、QUASARはすべてのテストで高精度を維持する。高ノイズ($\sigma_i=0.1$)下でも、QUASARは他のすべての手法が失敗する80%の外れ値に耐える。
- **点群位置合わせ**(Bunny、$N=40$、不変量測定を介した回転部分問題): QUASARは両方のノイズレジームで比較対象のすべての手法を上回る。
- **画像スティッチング**(PASSTA Lunch Room): 70個のSURF対応関係のうち46個(66%)が外れ値である。QUASAR($\sigma^2\bar{c}^2=0.001$)はMatlabのMSACが失敗する場合でも正しくスティッチングする。
- **緊密性の指標**: 緩和ギャップとランク/安定ランクは、合成データとBunnyテストの両方で厳密性を確認する。主な限界: 汎用SDPソルバーは規模拡大に弱く、$N=100$の対応関係でMOSEKで約1200秒(SDPNAL+で500秒)を要する。

## SLAMにおける意義

回転推定は、点群位置合わせ、マップ統合、回転平均化、外部パラメータキャリブレーションなど多くのSLAM部分問題の中に存在する。QUASARは「証明可能な知覚」という研究の流れ(SE-Sync、TEASER++と共に、主に同じグループによる)の一部であり、ロボティクスにおける主要な幾何問題が、重い外れ値汚染の下でも*証明可能に*大域最適に解けることを示している。TLSコスト、バイナリクローニング、冗長制約付きSDPというその構成要素は、TEASER/TEASER++内部の回転部分ソルバーの機構となった。

## 関連ノート

- [SE-Sync](se-sync.md) — SDP緩和による証明可能なポーズグラフ最適化
- [TEASER++](teaserpp.md) — 同じ回転機構を用いた証明可能な点群位置合わせ
- [GNC](gnc.md) — 同じTLSコストを用いたロバスト推定への一般的なgraduated non-convexityアプローチ
