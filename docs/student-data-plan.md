# 生徒データ実装方針

生徒ページのデータ管理を再設計する。実装前に方針を固めるためのドキュメント。

## 目的

- **全ユーザー共通の生徒マスタ**を JSON ファイル(リポジトリ同梱)で管理
- マスタは **CSV を編集ソース**として、ビルドスクリプトで JSON に変換する運用
- **ユーザー固有の育成データ**を localStorage(JSON)で管理
- マスタ更新がユーザーデータを破壊しない構造にする
- **カスタム生徒(マスタにない自前追加)はサポートしない** — 全生徒はマスタ経由で追加する

## 現状の問題点

| 問題 | 詳細 |
|---|---|
| マスタ + 育成データの混在 | IndexedDB の `students` テーブルに `name`/`school`(マスタ系)と `bondLevel`/`owned`(育成系)が同居 |
| マスタ更新の手段がない | `seedStudentsIfEmpty` は初回のみ。新生徒を追加しても既存ユーザーに反映されない |
| マスタ管理の手段がない | コード内のハードコーディング配列を直接編集する必要があり、表計算的な操作ができない |
| 画像データの肥大 | Base64 JPEG が students レコードに直書き。マスタ更新時に上書きするのが怖い |

---

## 提案アーキテクチャ

### 3層に分離

```
┌──────────────────────────────────┐
│ 編集ソース (人間)                │  data/students.master.csv
│  CSVで列ベース管理               │  (Excel/エディタで編集可)
└────────────┬─────────────────────┘
             │ python scripts/build-students.py
             ▼
┌──────────────────────────────────┐
│ 1. 生徒マスタ (共通・read-only)  │  data/students.master.json
│   name, school, rarity 等        │  (アプリが fetch する本番データ)
└────────────┬─────────────────────┘
             │ id でマージ
┌────────────▼─────────────────────┐
│ 2. 育成データ (ユーザー固有)     │  localStorage
│   owned, bondLevel, skill 等     │  キー: 'BlueArchive.userStudents'
└──────────────────────────────────┘

(画像データ — Base64 が嵩む & localStorage 5-10MB 制限のため別管理)
┌──────────────────────────────────┐
│ 3. 生徒画像 (任意)               │  IndexedDB.studentImages
│   ユーザーアップロード画像のみ   │  容量制限が緩い
└──────────────────────────────────┘
```

### 1. 生徒マスタ CSV(編集ソース)

**保存場所**: `data/students.master.csv`

**列**:
```
id,name,school,role,rarity,attackType,armorType,position,imageUrl
shiroko,シロコ,アビドス,Attacker,3,explosive,light,striker,assets/students/shiroko.webp
hoshino,ホシノ,アビドス,Tank,3,piercing,heavy,striker,assets/students/hoshino.webp
...
```

**運用ルール**:
- Excel / VS Code / メモ帳 何でも編集可
- 行追加 = 新生徒追加
- 列の値変更 = 既存生徒の修正
- **CSV 編集後は必ずビルドスクリプトを実行**して JSON を再生成

### 2. ビルドスクリプト

**場所**: `scripts/build-students.py`

**機能**:
1. `data/students.master.csv` を読み込み
2. 各行をオブジェクト化、列定義に従って型変換(`rarity` は数値、その他は文字列)
3. 必須フィールドの存在チェック
4. enum 値のバリデーション(`role`/`attackType`/`armorType`/`position`/`rarity` がそれぞれ既知集合に属するか)
5. id 重複チェック
6. id フォーマット検査(`^[a-z0-9-]+$`)
7. 検査 OK なら `data/students.master.json` を整形済みJSONで上書き出力
8. エラー時はエラー内容と行番号を表示して非ゼロ終了

**実行**:
```bash
python scripts/build-students.py
```

**メリット**:
- Python は既存(`http.server` で使用中)。追加依存なし
- CSV 編集でゲーム情報を表計算的に管理可能
- ビルドエラーで凡ミス検出
- リポジトリの diff も列単位でレビューしやすい

### 3. 生徒マスタ JSON(本番データ)

**保存場所**: `data/students.master.json`(自動生成、リポジトリ管理)

**スキーマ例**:
```json
[
  {
    "id": "shiroko",
    "name": "シロコ",
    "school": "アビドス",
    "role": "Attacker",
    "rarity": 3,
    "attackType": "explosive",
    "armorType": "light",
    "position": "striker",
    "imageUrl": "assets/students/shiroko.webp"
  }
]
```

- アプリ起動時に `fetch('data/students.master.json')` で1回読む
- store にキャッシュし、各コンポーネントは `store.students` 経由で参照
- 直接編集しない(CSV編集 + ビルド経由のみ)

### 4. ユーザー育成データ

**保存場所**: `localStorage['BlueArchive.userStudents']`

**スキーマ**(マスタIDをキーとする辞書):
```json
{
  "shiroko": {
    "owned": true,
    "starRank": 5,
    "bondLevel": 30,
    "uniqueWeaponLevel": 1,
    "skillLevels": { "ex": 5, "normal": 8, "passive": 8, "sub": 8 },
    "equipmentLevels": [40, 40, 40],
    "notes": "メインアタッカー",
    "neededMaterials": [
      { "materialId": "skill-elementary", "materialName": "活動報告(初級)", "quantity": 30 }
    ]
  }
}
```

- データが存在しない id = 未育成扱い(全項目デフォルト値で表示)
- `name`/`school` 等のマスタ項目は **ここに保存しない**(変更不可、マスタ参照)
- 画像は別管理(後述)

### 5. 生徒画像(別管理)

**保存場所**: `IndexedDB` の新テーブル `studentImages`

**理由**:
- localStorage は ~5-10MB 制限。画像 Base64 数十KB × 数十名 で逼迫
- IndexedDB は数百MB可。画像保管に向く

**スキーマ**:
| キー | 値 |
|---|---|
| `studentId` | マスタ id 文字列 |
| `imageData` | Base64 dataURL |
| `updatedAt` | ISO 文字列 |

ユーザーが画像をアップロードした時のみレコードを作成。未アップロードはマスタの `imageUrl` or 学校カラーグラデーション(現行どおり)。

---

## 結合ビュー(コンポーネントが見るデータ)

```js
async function getAllStudentsMerged() {
  const master  = await loadStudentMaster();          // 配列 (JSON取得)
  const userMap = loadUserStudents();                 // 辞書 (localStorage)
  const images  = await loadAllStudentImages();       // 辞書 (IndexedDB)

  return master.map(m => ({
    ...m,
    ...defaultUserState(),
    ...(userMap[m.id] || {}),
    imageData: images[m.id] || null,
  }));
}

function defaultUserState() {
  return {
    owned: false,
    starRank: 1,
    bondLevel: 1,
    uniqueWeaponLevel: 0,
    skillLevels: { ex: 1, normal: 1, passive: 1, sub: 1 },
    equipmentLevels: [1, 1, 1],
    notes: '',
    neededMaterials: [],
  };
}
```

UI 側は今までどおり `store.students` を参照すれば済む。書き換え時は `saveUserStudent(id, partial)` を呼ぶだけ。

---

## 既存データのマイグレーション

現行 IndexedDB の students テーブルから新構造へ自動変換。

### マッチング戦略

- 第一候補: 名前完全一致(漢字・カナ違いに注意)
- 第二候補: 名前 + 学校
- マッチ失敗 → **警告ログを出して破棄**(カスタム生徒は今回サポート外のため)
  - `localStorage['BlueArchive.unmatchedStudents']` に一時保存し、ユーザーが手動でCSVに追記できるよう JSON ダウンロードを提案

### マイグレーション関数

```js
async function migrateStudentsV1ToV2() {
  if (localStorage.getItem('BlueArchive.studentMigratedV2')) return;

  const old = await db.students.toArray();
  const master = await loadStudentMaster();

  const userMap = {};
  const unmatched = [];

  for (const s of old) {
    const matched = matchToMaster(s, master); // 名前 → 名前+学校 の順
    if (matched) {
      userMap[matched.id] = pickUserFields(s);
      if (s.imageData) await saveStudentImage(matched.id, s.imageData);
    } else {
      unmatched.push(s);
    }
  }

  localStorage.setItem('BlueArchive.userStudents', JSON.stringify(userMap));
  if (unmatched.length > 0) {
    localStorage.setItem('BlueArchive.unmatchedStudents', JSON.stringify(unmatched));
    console.warn(`${unmatched.length} 件の生徒がマスタにマッチしませんでした`);
    // UI でトースト通知 + 詳細確認動線を提示
  }
  localStorage.setItem('BlueArchive.studentMigratedV2', '1');
}
```

### 未マッチ生徒の扱い

ユーザーが手動で対処できる動線を用意:
1. トーストで「N 件の生徒がマスタにありません」表示
2. 詳細モーダル / 設定ページで unmatched 一覧表示
3. 「JSON でダウンロード」ボタン → CSV に追記する元データとして使える
4. 確認後、unmatched データはユーザーが破棄/エクスポートを選択

---

## エクスポート/インポート

### 新仕様
```json
{
  "schemaVersion": 2,
  "userStudents":  { ... },     // localStorage
  "studentImages": { ... },     // IndexedDB
  "memos":     [ ... ],
  "teams":     [ ... ],
  "materials": [ ... ]
}
```

- マスタはエクスポート対象外(共通リソース)
- インポート時 `schemaVersion` で v1/v2 を分岐(後方互換)
- v1 取り込みは migrate 同様にマスタ照合 → 未マッチは警告

---

## API 構造案(`db.js` 新関数)

```js
// マスタ
const STUDENT_MASTER_URL = 'data/students.master.json';
async function loadStudentMaster();          // fetch、起動時1回

// 育成データ (localStorage)
function getUserStudents();                  // → 辞書
function getUserStudent(id);                 // → 1レコード or null
function saveUserStudent(id, partial);       // 部分更新でマージ
function deleteUserStudent(id);              // 育成データクリア (生徒は残る)

// 画像 (IndexedDB)
async function getStudentImage(id);          // → dataURL or null
async function saveStudentImage(id, data);
async function deleteStudentImage(id);
async function loadAllStudentImages();       // → { id: dataURL } 辞書

// 結合ビュー
async function getAllStudentsMerged();       // 上記をマージ
```

---

## 設計判断(確定済み)

| 論点 | 決定 |
|---|---|
| マスタ id 形式 | 英小文字スラッグ(`shiroko`)。`^[a-z0-9-]+$` をビルド時に検査 |
| マスタ編集ソース | CSV(`data/students.master.csv`) |
| マスタ生成パイプライン | Python スクリプト(`scripts/build-students.py`) |
| マスタ画像の配置 | リポジトリ同梱(`assets/students/*.webp`) |
| 画像の保存先 | IndexedDB 別テーブル(localStorage 容量回避) |
| マスタ更新頻度 | リポジトリ更新の都度。CSV → JSON ビルド必須 |
| マイグレーション方式 | 自動・1回(フラグ防止)。未マッチは警告 + 一時保存 |
| カスタム生徒 | **非対応**。生徒追加はマスタ CSV 経由のみ |
| 旧 IndexedDB students | 当面残し、次メジャーバージョンで削除 |

---

## 実装段階(推奨順序)

### Phase 1: データ生成パイプライン
1. `data/students.master.csv` を現 `STUDENT_MASTER` 配列から生成(初回 seed)
2. `scripts/build-students.py` を実装(CSV → JSON 変換 + バリデーション)
3. 実行して `data/students.master.json` を生成、検証

### Phase 2: データ層 API
4. `db.js` にマスタ取得・育成 CRUD・画像 CRUD を追加
5. `getAllStudentsMerged` を実装
6. マイグレーション関数 + 起動時フック(`store.loadAll` 前で実行)
7. 未マッチ生徒の通知 UI

### Phase 3: View 層書き換え
8. `StudentList`/`StudentDetail`/`StudentSidebar` を新 API ベースに
9. `StudentDetail` の編集対象を「育成データのみ」に絞る(マスタ項目は read-only表示)
10. 画像アップロードを `saveStudentImage` 経由に

### Phase 4: 関連機能の追従
11. `GachaSimulator`(★3 抽選候補は merged を参照)
12. `TeamComposition`(strikers/specials の id 参照を merged 経由に)
13. `MaterialManagement`(生徒別必要素材の参照)
14. `utils/io.js` を新スキーマ対応(schemaVersion 2)

### Phase 5: 旧構造クリーンアップ
15. ドキュメント更新(`CLAUDE.md`、`README.md`、本ファイル)
16. 次メジャーバージョンで旧 `db.students` テーブル削除

---

## CSV → JSON ビルドスクリプトの詳細仕様

### スクリプト実装方針(`scripts/build-students.py`)

```python
#!/usr/bin/env python3
"""
data/students.master.csv → data/students.master.json
- バリデーション: 必須フィールド / enum値 / id重複 / idフォーマット
- 出力: 整形済みJSON配列
"""

import csv
import json
import re
import sys
from pathlib import Path

CSV_PATH  = Path('data/students.master.csv')
JSON_PATH = Path('data/students.master.json')

ROLES        = {'Attacker', 'Defender', 'Healer', 'Supporter', 'T.S.', 'Tank'}
ATTACK_TYPES = {'explosive', 'piercing', 'mystic', 'sonic'}
ARMOR_TYPES  = {'light', 'heavy', 'special', 'elastic'}
POSITIONS    = {'striker', 'special'}
RARITIES     = {1, 2, 3}
ID_PATTERN   = re.compile(r'^[a-z0-9-]+$')

# 検査・変換ロジック ...
```

### バリデーション項目

| チェック | エラーメッセージ例 |
|---|---|
| id が空 | `行3: id が空です` |
| id が `^[a-z0-9-]+$` 違反 | `行3: id 'Shiroko' は不正(英小文字・数字・ハイフンのみ)` |
| id 重複 | `行5: id 'shiroko' が重複(行3と)` |
| name が空 | `行3: name が空です` |
| rarity が 1/2/3 以外 | `行3: rarity '4' は不正` |
| role/attackType/armorType/position が enum 外 | `行3: role 'Hero' は不正(候補: Attacker, ...)` |

### 実行フロー

```
$ python scripts/build-students.py
✓ 読込: data/students.master.csv (42行)
✓ 検査: OK
✓ 出力: data/students.master.json (42件)
```

エラー時:
```
$ python scripts/build-students.py
✗ 行5: id 'shiroko' が重複(行3と)
✗ 行8: rarity '4' は不正
ビルド失敗 (2件のエラー)
```

### CI / Pre-commit (任意)

将来的に CSV 編集をプルリクエスト経由にする場合は、CI で `python scripts/build-students.py` を実行して JSON との差分が無いことを検証(コミット前にビルド忘れを検出)。

---

## まとめ

- **CSV 編集 → ビルド → JSON 配信** のパイプラインで運用負荷を下げる
- **マスタ JSON + 育成データ localStorage + 画像 IndexedDB** の3層分離
- **カスタム生徒は廃止**。生徒追加はすべて CSV 経由(マスタ更新)
- View 層は不変(`store.students` を見るだけ)
- マイグレーションは自動・1回・未マッチは警告通知

実装を開始する場合は **Phase 1: CSV 生成 + ビルドスクリプト** から着手するのが安全。
