# RETRO BREAKER X

レトロアーケード風ブロック崩しゲーム。HTML5 Canvas と Web Audio API で構築された、CRTモニター風エフェクト付きの本格ブロック崩しです。

▶ **[プレイする](https://tatata256.github.io/RETRO-BREAKER-X/)**

---

## 特徴

- 🕹️ 全16ステージ＋ボスステージ
- 🎨 CRTスキャンライン・ビネット効果によるレトロ演出
- 🎵 8ビット風チップチューンBGM & 効果音（Web Audio API）
- 📱 キーボード・マウス・タッチ操作対応（モバイル対応）
- 🏆 ローカルランキングシステム（Top 5）

---

## ブロックタイプ

| タイプ | 説明 |
|--------|------|
| **Normal** | 1回で破壊 |
| **Hard** | 2回で破壊 |
| **Metal** | 3回で破壊 |
| **Explosive** | 破壊時に周囲を巻き込んで爆発 |
| **Moving** | 左右に移動する |
| **Invisible** | 一度当てるまで見えない |
| **Regen** | 時間経過で再生する |
| **Unbreakable** | 破壊不可（ファイアボール除く） |

## アイテム

| アイテム | 効果 |
|----------|------|
| **Multi Ball** | ボールを3つに分裂 |
| **Expand** | パドルを拡大 |
| **Score x2** | スコア2倍（10秒） |
| **Slow** | ボール速度ダウン（8秒） |
| **Fireball** | すべてのブロックを貫通（6秒） |
| **Shield** | 画面下にシールドを展開（1回） |
| **Life** | ❤ ライフを1回復（上限10） |

## ボス

| ステージ | ボス名 | 特徴 |
|----------|--------|------|
| Stage 5 | **GATEKEEPER** | 左右移動しながら弾を発射 |
| Stage 10 | **PHANTOM** | テレポートして弾幕を展開 |
| Stage 15 | **CHAOSCORE** | 高速移動・多方向弾・シールド持ち |

---

## 操作方法

### キーボード
| キー | アクション |
|------|-----------|
| ← → | パドル移動 |
| Space | ボール発射 / ゲーム開始 |
| P | ポーズ |

### マウス / タッチ
- 左右移動でパドル操作
- クリック / タップでボール発射

---

## プロジェクト構成

```
├── index.html          # エントリーポイント
├── css/
│   └── style.css       # スタイルシート
├── js/
│   ├── config.js       # 定数・状態変数
│   ├── audio.js        # オーディオエンジン
│   ├── particle.js     # パーティクル演出
│   ├── paddle.js       # パドル
│   ├── ball.js         # ボール
│   ├── block.js        # ブロック定義
│   ├── item.js         # アイテム
│   ├── boss.js         # ボス
│   ├── stage.js        # ステージ生成
│   ├── collision.js    # 衝突判定
│   ├── ranking.js      # ランキング
│   ├── input.js        # 入力制御
│   ├── game.js         # ゲーム進行
│   ├── renderer.js     # 描画処理
│   └── main.js         # メインループ
└── README.md
```

---

## 技術スタック

- **HTML5 Canvas** — ゲーム描画
- **Web Audio API** — BGM・効果音生成（外部ファイル不要）
- **CSS3** — CRT風エフェクト・レスポンシブ対応
- **Google Fonts** — Press Start 2P（レトロフォント）
- **Vanilla JavaScript** — フレームワーク不使用

---

## ローカルで実行

```bash
# リポジトリをクローン
git clone https://github.com/tatata256/RETRO-BREAKER-X.git
cd RETRO-BREAKER-X

# 任意のHTTPサーバーで起動（例）
npx serve .
# または Python
python -m http.server 8000
```

ブラウザで `http://localhost:8000` を開いてプレイできます。  
※ `file://` プロトコルでも動作します。`index.html` を直接ブラウザで開いてもOKです。

---

## ライセンス

MIT
