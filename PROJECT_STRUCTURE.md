# プロジェクト構造

```
tokokanri_naseva/
│
├── .env.example              # 環境変数のサンプル
├── .env                      # 環境変数（gitignoreに追加）
├── .gitignore               # Git除外設定
├── package.json             # Node.js依存関係
├── 要件定義書.md             # 要件定義ドキュメント
├── PROJECT_STRUCTURE.md     # このファイル
│
├── database/                # データベース関連
│   ├── supabase_schema.sql  # Supabaseテーブル定義
│   └── google_sheets_setup.md # Google Sheets設定手順
│
├── src/                     # ソースコード
│   ├── index.js             # エントリーポイント
│   │
│   ├── config/              # 設定ファイル
│   │   ├── line.js          # LINE Bot設定
│   │   ├── supabase.js      # Supabase接続設定
│   │   ├── googleSheets.js  # Google Sheets API設定
│   │   └── email.js         # メール設定
│   │
│   ├── controllers/         # コントローラー層
│   │   ├── webhookController.js    # Webhook受信処理
│   │   ├── checkinController.js    # 登校処理
│   │   ├── checkoutController.js   # 下校処理
│   │   ├── historyController.js    # 履歴表示処理
│   │   └── aiController.js         # AI先生処理（オプション）
│   │
│   ├── services/            # ビジネスロジック層
│   │   ├── attendanceService.js    # 出席記録サービス
│   │   ├── userService.js          # ユーザー管理サービス
│   │   ├── classroomService.js     # 教室管理サービス
│   │   ├── rankingService.js       # ランキング集計サービス
│   │   ├── notificationService.js  # 通知サービス
│   │   └── aiService.js            # AIサービス（オプション）
│   │
│   ├── repositories/        # データアクセス層
│   │   ├── userRepository.js       # ユーザーDB操作
│   │   ├── sessionRepository.js    # セッション管理
│   │   ├── sheetsRepository.js     # Google Sheets操作
│   │   └── webhookLogRepository.js # Webhookログ記録
│   │
│   ├── middleware/          # ミドルウェア
│   │   ├── lineSignature.js        # LINE署名検証
│   │   ├── errorHandler.js         # エラーハンドリング
│   │   └── logger.js               # ログ記録
│   │
│   ├── utils/               # ユーティリティ
│   │   ├── dateFormatter.js        # 日時フォーマット
│   │   ├── messageBuilder.js       # LINEメッセージ構築
│   │   └── validator.js            # バリデーション
│   │
│   └── constants/           # 定数定義
│       ├── messages.js             # メッセージテンプレート
│       ├── quickReplies.js         # クイックリプライ定義
│       └── richMenu.js             # リッチメニュー設定
│
├── scripts/                 # ユーティリティスクリプト
│   ├── setup-richmenu.js    # リッチメニュー登録スクリプト
│   ├── seed-data.js         # 初期データ投入
│   └── test-connection.js   # 接続テストスクリプト
│
├── assets/                  # 静的ファイル
│   ├── richmenu/            # リッチメニュー画像
│   └── images/              # その他画像
│
├── tests/                   # テストコード
│   ├── unit/                # 単体テスト
│   └── integration/         # 結合テスト
│
└── docs/                    # ドキュメント
    ├── API.md               # API仕様
    ├── DEPLOYMENT.md        # デプロイ手順
    └── MAINTENANCE.md       # 運用マニュアル
```

## 主要ファイルの役割

### エントリーポイント
- **src/index.js**: Expressサーバーの起動、ルーティング設定

### コントローラー
- **webhookController.js**: LINE Webhookイベントの振り分け
- **checkinController.js**: 登校フロー（教室選択→座席選択→記録）
- **checkoutController.js**: 下校フロー
- **historyController.js**: 履歴・ランキング表示

### サービス層
- **attendanceService.js**: 出席データのCRUD、集計ロジック
- **rankingService.js**: ランキング計算、キャッシュ管理
- **notificationService.js**: メール送信、LINE Push通知

### リポジトリ層
- **sheetsRepository.js**: Google Sheets APIラッパー
- **userRepository.js**: Supabase users テーブル操作
- **sessionRepository.js**: ユーザーセッション管理（教室選択中など）

## 開発の進め方

### Phase 1: セットアップ
1. `npm install` で依存パッケージをインストール
2. `.env` ファイルを作成（`.env.example`を参考）
3. Supabaseでテーブル作成（`database/supabase_schema.sql`を実行）
4. Google Sheets APIの有効化と認証情報取得
5. LINE Botチャネルの作成

### Phase 2: MVP開発
1. Webhook受信の実装（webhookController.js）
2. 登校フローの実装（checkinController.js）
3. Google Sheetsへの記録実装（sheetsRepository.js）
4. リッチメニューの作成と登録

### Phase 3: 機能拡張
1. 下校機能の実装
2. 履歴表示とランキング機能
3. メール通知機能

### Phase 4: オプション機能
1. AI先生機能
2. 管理画面（講師向け）
