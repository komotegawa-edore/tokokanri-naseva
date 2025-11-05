# Google Spreadsheet セットアップガイド

このアプリは、Google Spreadsheetsを使用して教室設定と出席記録を管理します。

## 必要なシート

### 1. Attendance シート（出席記録）

**シート名**: `Attendance`

**列構成**:
| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| checkin_time | student_name | line_user_id | classroom | seat_number | checkout_time | duration_minutes |

**ヘッダー行の例**:
```
checkin_time | student_name | line_user_id | classroom | seat_number | checkout_time | duration_minutes
```

このシートは自動的にデータが追加されます。手動で編集する必要はありません。

---

### 2. Settings シート（教室設定）

**シート名**: `Settings`

**列構成**:
| A | B | C |
|---|---|---|
| 教室名 | 座席開始番号 | 座席終了番号 |

**設定例**:
```
教室名    | 座席開始番号 | 座席終了番号
A教室    | 1          | 20
B教室    | 21         | 40
C教室    | 41         | 60
自習室   | 61         | 80
```

**設定のポイント**:
- 1行目はヘッダー行として扱われます（データは2行目から）
- 教室名は日本語でも英語でも使用可能です
- 座席番号は重複しないように設定してください
- 教室を追加・削除すると、LINEのQuick Replyに自動反映されます

---

## セットアップ手順

### ステップ1: スプレッドシートを作成

1. [Google Sheets](https://sheets.google.com) にアクセス
2. 新しいスプレッドシートを作成
3. スプレッドシートIDをメモ（URLの `/d/` と `/edit` の間の文字列）
   ```
   https://docs.google.com/spreadsheets/d/【このID】/edit
   ```

### ステップ2: シートを作成

1. **Attendanceシート**を作成
   - シート名を「Attendance」に変更
   - 1行目にヘッダーを追加:
     ```
     checkin_time | student_name | line_user_id | classroom | seat_number | checkout_time | duration_minutes
     ```

2. **Settingsシート**を作成
   - 新しいシートを追加（シート名: Settings）
   - 以下のデータを入力:
     ```
     教室名 | 座席開始番号 | 座席終了番号
     A教室  | 1          | 20
     B教室  | 21         | 40
     C教室  | 41         | 60
     ```

### ステップ3: Google Service Accountの設定

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを作成または選択
3. Google Sheets APIを有効化
4. サービスアカウントを作成
5. サービスアカウントのJSONキーをダウンロード
6. スプレッドシートの共有設定で、サービスアカウントのメールアドレスに「編集者」権限を付与

### ステップ4: 環境変数の設定

Vercelの環境変数に以下を設定:

```bash
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_SHEETS_CREDENTIALS={"type":"service_account","project_id":"..."}
ATTENDANCE_SHEET_NAME=Attendance  # オプション（デフォルト: Attendance）
```

---

## 動作仕様

### 教室設定の動的読み込み

- ユーザーが「登校」を選択すると、Settingsシートから教室一覧を読み込みます
- 教室を追加・変更すると、次回の登校時から自動的に反映されます
- Settingsシートが見つからない場合は、デフォルト設定（A/B/C教室）を使用します

### 使用中座席の自動除外

- 教室を選択すると、その教室で現在使用中の座席を自動的に除外します
- 使用中の座席 = `checkout_time`が空白の座席
- 空席がない場合は「空席なし」と表示されます

### 座席の解放

- ユーザーが「下校」を選択すると、`checkout_time`が記録され座席が解放されます
- 解放された座席は、次の登校時に再び選択可能になります

---

## よくある質問

### Q: 教室を追加したい
A: Settingsシートに新しい行を追加してください。すぐに反映されます。

### Q: 座席範囲を変更したい
A: Settingsシートの該当行を編集してください。次回の登校時から反映されます。

### Q: 教室名を日本語から英語に変更したい
A: Settingsシートで教室名を変更してください。ただし、過去の出席記録との整合性に注意してください。

### Q: Settingsシートを削除してしまった
A: デフォルト設定（A/B/C教室）が自動的に使用されます。再度Settingsシートを作成すれば、カスタム設定に戻ります。

### Q: シート名を変更したい
A: 環境変数 `ATTENDANCE_SHEET_NAME` を設定することで、Attendanceシート名を変更できます。

---

## トラブルシューティング

### エラー: "Unable to parse range"

**原因**: シート名が間違っているか、シートが存在しません。

**解決方法**:
1. シート名が正確に「Attendance」「Settings」であることを確認
2. スプレッドシートにサービスアカウントの編集権限があることを確認

### 教室が表示されない

**原因**: Settingsシートのフォーマットが正しくありません。

**解決方法**:
1. 1行目がヘッダーになっているか確認
2. 座席番号が数値として入力されているか確認
3. ログを確認して警告メッセージをチェック

### 座席が選択できない

**原因**: すべての座席が使用中の可能性があります。

**解決方法**:
1. Attendanceシートを確認
2. `checkout_time`が空白の座席を確認
3. 必要に応じて手動で`checkout_time`を入力して座席を解放

---

## サンプルデータ

### Settings シート
```
教室名    | 座席開始番号 | 座席終了番号
A教室    | 1          | 20
B教室    | 21         | 40
C教室    | 41         | 60
自習室   | 61         | 80
VIP室    | 81         | 90
```

このように設定すると、5つの教室が選択肢として表示されます。
