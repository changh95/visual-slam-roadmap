# OpenCV

**OpenCV**は事実上の標準となっているオープンソースのコンピュータビジョンライブラリであり、SLAMの作業においては日常的に手を伸ばすツールボックスである。C++で書かれており、ほぼ完全なPythonバインディング(`pip install opencv-python`)を持つため、同じAPIが高速なプロトタイピングと本番向けフロントエンドの両方に使える。

SLAMにとって最も重要なOpenCVの部分は次のとおりである。

- **画像I/Oと処理** — 画像・動画の読み書き、色変換、歪み補正(`cv::undistort`、`cv::remap`)、ブラー、ピラミッド、デバッグ可視化のための描画。
- **特徴検出と記述** — `cv::ORB`、`cv::SIFT`、`cv::AKAZE`、`cv::FastFeatureDetector`、そしてKLT系パイプライン向けの`cv::goodFeaturesToTrack`(Shi-Tomasiコーナー)。
- **特徴マッチング** — `cv::BFMatcher`(ブルートフォース、L2またはHamming)と`cv::FlannBasedMatcher`(近似最近傍探索)。その上にLoweの比率テストが実装されている。
- **特徴トラッキング** — `cv::calcOpticalFlowPyrLK`、多くのVO/VIOフロントエンド(例:VINS-Mono)で使われるピラミッド型Lucas-Kanadeトラッカー。
- **多視点幾何** — `cv::findEssentialMat`/`cv::recoverPose`(5点法+RANSAC)、`cv::findFundamentalMat`、`cv::findHomography`、`cv::triangulatePoints`、2D-3D姿勢推定のための`cv::solvePnP`/`cv::solvePnPRansac`。
- **キャリブレーション** — `cv::calibrateCamera`、`cv::stereoCalibrate`、`cv::stereoRectify`、`cv::fisheye`とcontribモジュールにおける魚眼・全方位モデル。

Pythonにおける最小の特徴マッチングパイプライン:

```python
import cv2

orb = cv2.ORB_create(2000)
kp1, des1 = orb.detectAndCompute(img1, None)
kp2, des2 = orb.detectAndCompute(img2, None)

matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
matches = sorted(matcher.match(des1, des2), key=lambda m: m.distance)

pts1 = cv2.KeyPoint_convert(kp1, [m.queryIdx for m in matches])
pts2 = cv2.KeyPoint_convert(kp2, [m.trainIdx for m in matches])
E, inliers = cv2.findEssentialMat(pts1, pts2, K, method=cv2.RANSAC)
_, R, t, _ = cv2.recoverPose(E, pts1, pts2, K, mask=inliers)
```

パイプラインを続けると、3D点の地図を手に入れた後は、新しいフレームをトラッキングすることはPnP問題になる——このパターン(投影、マッチング、`solvePnPRansac`、リファインメント)は、基本的に特徴ベースSLAMのトラッキングスレッドが行っていることそのものである。

```python
# pts3d: Nx3 map points, pts2d: Nx2 matched pixel observations
ok, rvec, tvec, inliers = cv2.solvePnPRansac(
    pts3d, pts2d, K, distCoeffs,
    reprojectionError=2.0, iterationsCount=100)
R, _ = cv2.Rodrigues(rvec)          # world-to-camera rotation
# triangulate new points from two calibrated views
P1 = K @ np.hstack([np.eye(3), np.zeros((3, 1))])
P2 = K @ np.hstack([R, tvec])
X_h = cv2.triangulatePoints(P1, P2, pts1.T, pts2.T)
X = (X_h[:3] / X_h[3]).T            # homogeneous -> Euclidean
```

その限界も認識しておくべきである。OpenCVはフロントエンドの構成要素を提供するが、SLAMバックエンドは提供しない。バンドル調整、ポーズグラフ、ファクターグラフはCeres、g2o、GTSAMに存在する。OpenCVの役割は、画像を入力として、対応関係と初期姿勢を出力することである。

## よくある落とし穴

- **1つのライブラリの中に2つの座標系の慣習が存在する**:幾何関数は点を$(x, y)$ピクセルとして受け取るが、`Mat`/NumPyのインデックスは`[row, col]` = `[y, x]`である。これらを混同すると、見た目はもっともらしいがでたらめな結果を生む。
- **歪みの取り扱い**:`findEssentialMat`/`recoverPose`は、渡された点が渡した内部パラメータに一致していることを前提とする。点を先に歪み補正するか(`cv2.undistortPoints`)、`K`と歪みモデルが一貫して適用されていることを確認すること——歪んだままの点を黙って渡してしまうのは典型的な精度低下の原因である。
- **`recoverPose`の並進はユニットノルムである**:本質行列は並進をスケールを除いて定義するだけなので(単眼のスケール曖昧性)、`t`は方向であり、メートルではない。
- **ノルムと記述子を一致させる**:バイナリ記述子(ORB、BRIEF、AKAZE)にはHamming、浮動小数点記述子(SIFT)にはL2。FLANNはバイナリ記述子に対してLSHパラメータが必要になる。
- **RANSACのしきい値はピクセル単位である**:適切な`reprojectionError`/`threshold`は画像解像度とキャリブレーション品質に応じてスケールする。VGA画像でチューニングされたデフォルト値は4Kには厳しすぎ、320pには緩すぎる。
- **`Rodrigues`と姿勢の方向**:`solvePnP`はワールド座標系からカメラ座標系への変換($X_{cam} = R X_{world} + t$を満たす$R, t$)を返す。ワールド座標系でのカメラ姿勢が欲しければ反転させる必要がある。ここでの符号/方向の混乱は、自作VOにおいて最もよくあるバグだろう。
- **戻り値のフラグを確認する**:多くのソルバー(`solvePnP`、`findEssentialMat`)は、平面に近い入力や視差が小さい入力に対して失敗したり、複数/退化した解を返したりする。常にインライア数でゲートすること。

## SLAMにおける意義

ほぼすべてのオープンソースSLAMシステム——ORB-SLAM、VINS-Mono、その他数多くの研究プロトタイプ——が画像処理、特徴抽出、幾何ソルバーにOpenCVを使っている。これに習熟しているということは、それらのコードベースを読むことができ、完全な視覚オドメトリパイプライン(検出、マッチング、RANSAC、PnP)を一晩で構築できるということであり、これはレベル2で推奨される演習である。

## 関連ノート

- [C++](cpp.md)
- [Python](python.md)
- [特徴点](keypoints.md)
- [2D-3D対応](2d-3d-correspondence.md)
- [カメラキャリブレーション](../level-01-beginner/camera-calibration.md)
