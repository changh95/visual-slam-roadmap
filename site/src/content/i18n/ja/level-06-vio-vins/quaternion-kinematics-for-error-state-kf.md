# Quaternion kinematics for error-state KF

> Solà 2017 · [論文](https://arxiv.org/abs/1711.02508)

**一行要約** — 四元数の代数とキネマティクスを第一原理から導出し、IMU駆動の状態推定のための誤差状態カルマンフィルタ（ESKF）を構築する、自己完結型のチュートリアルである — VIOフィルタにおいて回転の取り扱いを*正しく*行うための標準的な参考文献。

## 問題

3D回転はあらゆる推定エンジンにおいて最もエラーを起こしやすい要素である。四元数はベクトル空間を成さず、競合する符号や順序の慣例（ハミルトンとJPL）が文献を汚染しており、回転の*摂動、微分、積分*の正しい定義は互いに矛盾する複数の出典に散らばっている。Solàの論文は「3D空間における四元数と回転に関する概念と数式、そしてそれらを誤差状態カルマンフィルタのような推定エンジンで正しく用いる方法についての網羅的な整理」であり、回転群とそのリー構造についての深い研究を含む — その明示的な目標は、IMU信号を統合する実用的なアプリケーションのための精密なESKFの定式化を考案することである。

## 手法とアーキテクチャ

- **厳密な四元数代数.** ハミルトン慣例（$ij = k$、$i^2 = j^2 = k^2 = ijk = -1$、スカラー部分が先頭）を固定し、積$\otimes$、共役、および回転ベクトルを単位四元数に結びつける指数写像（式101）を導出する。

  $$\mathbf{q} \triangleq \mathrm{Exp}(\phi\mathbf{u}) = e^{\phi\mathbf{u}/2} = \begin{bmatrix} \cos(\phi/2) \\ \mathbf{u}\sin(\phi/2) \end{bmatrix},$$

  半角を説明する二重積$\mathbf{x}' = \mathbf{q} \otimes \mathbf{x} \otimes \mathbf{q}^{*}$、および$\mathbf{R} = e^{\phi[\mathbf{u}]_\times}$からの行列側のロドリゲスの公式。専用の節では四種類の「四元数の流派」を整理しており、あらゆるコードベースにおけるハミルトン対JPLの混乱を診断できるようにしている。
- **真の状態、ノミナル状態、誤差状態.** 真の状態は*ノミナル状態*（大信号、IMUデータから非線形に統合される）と*誤差状態*$\delta\mathbf{x} = (\delta\mathbf{p}, \delta\mathbf{v}, \delta\boldsymbol{\theta}, \delta\mathbf{a}_b, \delta\boldsymbol{\omega}_b, \delta\mathbf{g})$（小信号、線形に統合可能で、線形ガウスフィルタリングに適する）の合成である。IMUモデルは$\mathbf{a}_m = \mathbf{R}_t^{\top}(\mathbf{a}_t - \mathbf{g}_t) + \mathbf{a}_{bt} + \mathbf{a}_n$、$\boldsymbol{\omega}_m = \boldsymbol{\omega}_t + \boldsymbol{\omega}_{bt} + \boldsymbol{\omega}_n$であり、真の四元数キネマティクスは$\dot{\mathbf{q}}_t = \tfrac{1}{2}\mathbf{q}_t \otimes \boldsymbol{\omega}_t$である。
- **ノミナル状態の伝播（離散、式260）.** $\mathbf{p} \leftarrow \mathbf{p} + \mathbf{v}\Delta t + \tfrac{1}{2}(\mathbf{R}(\mathbf{a}_m - \mathbf{a}_b) + \mathbf{g})\Delta t^2$、$\ \mathbf{v} \leftarrow \mathbf{v} + (\mathbf{R}(\mathbf{a}_m - \mathbf{a}_b) + \mathbf{g})\Delta t$、$\ \mathbf{q} \leftarrow \mathbf{q} \otimes \mathbf{q}\{(\boldsymbol{\omega}_m - \boldsymbol{\omega}_b)\Delta t\}$ — ノイズを無視した完全な非線形統合である。
- **誤差状態の力学（式238）.** 誤差についての合成方程式を解き、二次項を落とすと、カルマンフィルタが実際に動作する線形時間変化系が得られる。

  $$\dot{\delta\mathbf{v}} = -\mathbf{R}[\mathbf{a}_m - \mathbf{a}_b]_\times\,\delta\boldsymbol{\theta} - \mathbf{R}\,\delta\mathbf{a}_b + \delta\mathbf{g} - \mathbf{R}\mathbf{a}_n, \qquad \dot{\delta\boldsymbol{\theta}} = -[\boldsymbol{\omega}_m - \boldsymbol{\omega}_b]_\times\,\delta\boldsymbol{\theta} - \delta\boldsymbol{\omega}_b - \boldsymbol{\omega}_n,$$

  ここで$\dot{\delta\mathbf{p}} = \delta\mathbf{v}$であり、バイアスはランダムウォークである。姿勢誤差$\delta\boldsymbol{\theta} \in \mathbb{R}^3$はノミナル四元数に対して*局所的に*（乗法的に）定義される；大域的に定義された角度誤差を用いる変種は別章で扱われている。
- **ESKFサイクル.** 離散誤差力学を用いて誤差共分散を予測する；ビジョンやGPSといったIMU以外の観測があった場合、ノミナル状態を通じて連鎖するヤコビアンを用いた標準的なKF方程式で誤差状態を更新する；平均を**注入**してノミナル状態を更新する（$\mathbf{q} \leftarrow \mathbf{q} \otimes \mathbf{q}\{\hat{\delta\boldsymbol{\theta}}\}$、式283、ベクトル状態については単なる加算）；その後**リセット**して$\hat{\delta\mathbf{x}} \leftarrow 0$とし、共分散を$\mathbf{P} \leftarrow \mathbf{G}\mathbf{P}\mathbf{G}^{\top}$で更新することで、姿勢誤差を新しいノミナルフレームで再表現する。
- **なぜ誤差状態が有利なのか.** 誤差は常にゼロに近いため線形化が正確である；姿勢誤差は特異点から遠い最小の3パラメータ表現を用いる；そして大きく速い信号は、フィルタではなく厳密な非線形統合によって処理される。付録では、ルンゲ・クッタ法と閉形式の統合スキーム、切断級数による遷移行列、そして完全なIMU例に対するノイズインパルスの統合が提供されている。

## 実験結果

これはベンチマークされたシステムではなく、チュートリアル/参考文献であり — 実験は報告されておらず、その「結果」とは完結し内部で一貫した数式とヤコビアンのカタログ（回転写像、摂動、ESKF行列）であり、コードにそのまま書き写せる状態で提供されている。その影響は普及度で測ることができる — フィルタベースのVIOおよびIMU融合実装における標準的な引用文献の一つとなり、そこで示されているESKFの手順は無数の研究および実運用のIMU統合モジュールの背後にあるパターンとなった。マニフォルド上のプレインテグレーション（最適化側の対応物）と合わせて、これは現代のVIOコードベースが前提とする数学的ツールキットを形成している。

## SLAMにおける意義

回転はベクトル空間に存在しないため、四元数に対する素朴な加法的EKF更新は群の制約を破る；誤差状態のトリックは、あらゆる本格的なフィルタベースVIO（MSCKF、ROVIO、OpenVINS、市販のトラッカー）が姿勢を処理する方法である。Solàのノートは、IMU伝播やESKFモジュールを書く際に実装者が最も開いておく文書であり、最適化ベースのシステムで用いられるマニフォルド上のプレインテグレーション理論を補完するものである。

## 関連ノート

- [IMU noise model](imu-noise-model.md)
- [IMU Preintegration on Manifold](imu-preintegration-on-manifold.md)
- [Lie groups](../level-02-getting-familiar/lie-groups.md)
- [MSCKF](msckf.md)
- [Introduction to Inertial Navigation](introduction-to-inertial-navigation.md)
- [OpenVINS](openvins.md)
