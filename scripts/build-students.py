#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
data/students.master.csv → data/students.master.json

CSV を本番データ JSON に変換する。アプリは JSON を fetch するため、
CSV を編集したら必ず本スクリプトを実行して JSON を再生成する。

Usage:
    python scripts/build-students.py

バリデーション:
- id: 必須・英小文字+数字+ハイフンのみ・重複禁止
- name / school: 必須・空文字禁止 (school は任意の文字列を許可。新学校追加可)
- role: ROLES のいずれか
- rarity: 1 / 2 / 3
- attackType: ATTACK_TYPES のいずれか
- armorType: ARMOR_TYPES のいずれか
- position: POSITIONS のいずれか
- imageUrl: 任意 (空可)

新学校を追加した場合の影響:
- フィルタ・グルーピングは自動対応 (動的検出)
- 表示順を制御したい場合は data/constants.js の SCHOOLS 配列に追加
- 専用カラーを当てたい場合は data/constants.js の SCHOOL_COLORS に追加
"""

import csv
import json
import re
import sys
from pathlib import Path

# Windows コンソール (cp932) でも UTF-8 で出力できるよう再設定
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# プロジェクトルートをこのスクリプトの親の親に固定
ROOT      = Path(__file__).resolve().parent.parent
CSV_PATH  = ROOT / 'data' / 'students.master.csv'
JSON_PATH = ROOT / 'data' / 'students.master.json'

# enum: db.js の定数と一致させること
ROLES        = {'Attacker', 'Defender', 'Healer', 'Supporter', 'T.S.', 'Tank'}
ATTACK_TYPES = {'explosive', 'piercing', 'mystic', 'sonic'}
ARMOR_TYPES  = {'light', 'heavy', 'special', 'elastic'}
POSITIONS    = {'striker', 'special'}
RARITIES     = {1, 2, 3}
ID_PATTERN   = re.compile(r'^[a-z0-9-]+$')

REQUIRED_COLS = ['id', 'name', 'school', 'role', 'rarity',
                 'attackType', 'armorType', 'position']
OPTIONAL_COLS = ['imageUrl']
ALL_COLS      = REQUIRED_COLS + OPTIONAL_COLS


def read_csv(path: Path):
    if not path.exists():
        raise FileNotFoundError(f'CSV が見つかりません: {path}')
    with path.open('r', encoding='utf-8-sig', newline='') as f:
        reader = csv.DictReader(f)
        if reader.fieldnames is None:
            raise ValueError('CSV ヘッダー行がありません')
        missing = [c for c in REQUIRED_COLS if c not in reader.fieldnames]
        if missing:
            raise ValueError(f'CSV に必須列がありません: {missing}')
        return list(reader)


def validate_and_convert(rows):
    """CSV 行をバリデーションしつつ dict のリストに変換。エラーは集約して報告。"""
    errors = []
    seen_ids = {}  # id -> 行番号
    out = []

    for i, row in enumerate(rows, start=2):  # ヘッダーが1行目なのでデータは2行目から
        rid    = (row.get('id')       or '').strip()
        name   = (row.get('name')     or '').strip()
        school = (row.get('school')   or '').strip()
        role   = (row.get('role')     or '').strip()
        rstr   = (row.get('rarity')   or '').strip()
        atk    = (row.get('attackType') or '').strip()
        arm    = (row.get('armorType')  or '').strip()
        pos    = (row.get('position')   or '').strip()
        img    = (row.get('imageUrl')   or '').strip()

        # id
        if not rid:
            errors.append(f'行{i}: id が空です')
        elif not ID_PATTERN.match(rid):
            errors.append(f"行{i}: id '{rid}' は不正(英小文字・数字・ハイフンのみ)")
        elif rid in seen_ids:
            errors.append(f"行{i}: id '{rid}' が重複(行{seen_ids[rid]}と)")
        else:
            seen_ids[rid] = i

        # name / school
        if not name:
            errors.append(f'行{i}: name が空です')
        if not school:
            errors.append(f'行{i}: school が空です')

        # role
        if role not in ROLES:
            errors.append(f"行{i}: role '{role}' は不正(候補: {sorted(ROLES)})")

        # rarity
        try:
            rarity = int(rstr)
            if rarity not in RARITIES:
                raise ValueError
        except ValueError:
            errors.append(f"行{i}: rarity '{rstr}' は不正(1/2/3 のいずれか)")
            rarity = None

        # attackType
        if atk not in ATTACK_TYPES:
            errors.append(f"行{i}: attackType '{atk}' は不正(候補: {sorted(ATTACK_TYPES)})")

        # armorType
        if arm not in ARMOR_TYPES:
            errors.append(f"行{i}: armorType '{arm}' は不正(候補: {sorted(ARMOR_TYPES)})")

        # position
        if pos not in POSITIONS:
            errors.append(f"行{i}: position '{pos}' は不正(候補: {sorted(POSITIONS)})")

        # 行に致命的エラーが無ければ出力候補に追加
        if rid and rid in seen_ids and seen_ids[rid] == i and rarity is not None \
                and role in ROLES and atk in ATTACK_TYPES \
                and arm in ARMOR_TYPES and pos in POSITIONS \
                and name and school:
            record = {
                'id':         rid,
                'name':       name,
                'school':     school,
                'role':       role,
                'rarity':     rarity,
                'attackType': atk,
                'armorType':  arm,
                'position':   pos,
            }
            if img:
                record['imageUrl'] = img
            out.append(record)

    return out, errors


def write_json(path: Path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')


def main():
    try:
        rows = read_csv(CSV_PATH)
    except Exception as e:
        print(f'✗ CSV 読込失敗: {e}', file=sys.stderr)
        return 1

    print(f'✓ 読込: {CSV_PATH.relative_to(ROOT)} ({len(rows)}行)')

    records, errors = validate_and_convert(rows)

    if errors:
        for err in errors:
            print(f'✗ {err}', file=sys.stderr)
        print(f'\nビルド失敗 ({len(errors)}件のエラー)', file=sys.stderr)
        return 2

    write_json(JSON_PATH, records)
    print(f'✓ 検査: OK')
    print(f'✓ 出力: {JSON_PATH.relative_to(ROOT)} ({len(records)}件)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
