# リッチメニュー画像の作成手順

## 画像仕様

- **ファイル名**: `richmenu.png`
- **サイズ**: 2500 x 843 px（横長、下段なし）
- **形式**: PNG または JPEG
- **ファイルサイズ**: 1MB以下

## デザイン

3つのエリアに分割:

```
┌─────────────┬─────────────┬─────────────┐
│             │             │             │
│    登校     │    下校     │  登校履歴   │
│             │             │             │
│   (Check In)│ (Check Out) │  (History)  │
│             │             │             │
└─────────────┴─────────────┴─────────────┘
   833px         833px         834px
```

各エリアの座標:
- 左（登校）: x=0, y=0, width=833, height=843
- 中（下校）: x=834, y=0, width=833, height=843
- 右（履歴）: x=1668, y=0, width=832, height=843

## 作成方法

### 方法1: Canvaで作成（推奨）

1. [Canva](https://www.canva.com/)にアクセス
2. 「カスタムサイズ」で 2500 x 843 px を指定
3. 3分割のレイアウトを作成
4. テキストとアイコンを配置:
   - 左: 「登校」+ チェックインアイコン
   - 中: 「下校」+ チェックアウトアイコン
   - 右: 「登校履歴」+ 履歴アイコン
5. PNG形式でダウンロード
6. このディレクトリに `richmenu.png` として保存

### 方法2: Figmaで作成

1. [Figma](https://www.figma.com/)で新規ファイル作成
2. フレームサイズを 2500 x 843 px に設定
3. 縦線を2本引いて3分割（x=833, x=1667）
4. テキストとアイコンを配置
5. Export → PNG → 1x でエクスポート
6. `richmenu.png` として保存

### 方法3: Photoshopで作成

1. 新規ドキュメント: 2500 x 843 px、72dpi
2. ガイド線を引いて3分割
3. テキストツールで文字を配置
4. アイコンを配置（無料アイコン: [Iconfinder](https://www.iconfinder.com/)など）
5. PNG形式で保存

## 色の推奨

- **背景色**: #FFFFFF（白）または #F5F5F5（グレー）
- **テキスト色**: #333333（濃いグレー）
- **アクセントカラー**:
  - 登校: #4CAF50（緑）
  - 下校: #FF9800（オレンジ）
  - 履歴: #2196F3（青）

## アイコン素材

無料で使えるアイコンサイト:
- [Material Icons](https://fonts.google.com/icons)
- [Font Awesome](https://fontawesome.com/)
- [Iconfinder](https://www.iconfinder.com/)
- [Flaticon](https://www.flaticon.com/)

推奨アイコン:
- 登校: `login`, `check-in`, `enter`
- 下校: `logout`, `check-out`, `exit`
- 履歴: `history`, `calendar`, `list`

## サンプルテンプレート

簡易的なテンプレートが必要な場合は、以下のコマンドで生成できます:

```bash
# ImageMagickがインストールされている場合
convert -size 2500x843 xc:white \
  -fill black -pointsize 60 -gravity center \
  -draw "text -555,0 '登校'" \
  -draw "text 0,0 '下校'" \
  -draw "text 555,0 '登校履歴'" \
  richmenu.png
```

## 画像作成後

1. `richmenu.png`をこのディレクトリに配置
2. 以下のコマンドでリッチメニューを登録:

```bash
node scripts/setup-richmenu.js
```

## トラブルシューティング

### 画像がアップロードできない

- ファイルサイズが1MB以下か確認
- 形式がPNGまたはJPEGか確認
- サイズが2500x843pxか確認

### ボタンの反応範囲がずれる

- 各エリアの座標を確認:
  - `src/constants/richMenu.js`の`areas`配置

### 画像が表示されない

- LINE Developersで「リッチメニュー」が有効になっているか確認
- デフォルトのリッチメニューとして設定されているか確認

## 参考リンク

- [LINE リッチメニュー 公式ドキュメント](https://developers.line.biz/ja/docs/messaging-api/using-rich-menus/)
- [リッチメニュー画像のデザインガイドライン](https://developers.line.biz/ja/docs/messaging-api/rich-menu-design-guidelines/)
