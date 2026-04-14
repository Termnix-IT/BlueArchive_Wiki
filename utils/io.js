// ============================================================
//  utils/io.js  —  JSON エクスポート / インポート
// ============================================================

async function exportAllData() {
  try {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      students: await db.students.toArray(),
      gacha:    await db.gacha.toArray(),
      memos:    await db.memos.toArray(),
      events:   await db.events.toArray(),
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `blueArchive_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { ok: true, message: 'エクスポートが完了しました。' };
  } catch (e) {
    return { ok: false, message: `エクスポートエラー: ${e.message}` };
  }
}

async function importAllData(jsonStr, mode = 'merge') {
  try {
    const data = JSON.parse(jsonStr);

    if (!data.version || !data.students) {
      throw new Error('不正なバックアップファイルです。');
    }

    if (mode === 'replace') {
      await db.students.clear();
      await db.gacha.clear();
      await db.memos.clear();
      await db.events.clear();
    }

    // id を除去して重複を避ける（bulkAdd は既存 id と衝突しない新 id を付与）
    const strip = arr => arr.map(({ id, ...rest }) => rest);

    if (mode === 'replace') {
      await db.students.bulkAdd(data.students || []);
      await db.gacha.bulkAdd(data.gacha       || []);
      await db.memos.bulkAdd(data.memos        || []);
      await db.events.bulkAdd(data.events      || []);
    } else {
      // merge: 既存データを残して追記（名前重複チェックなし、単純追記）
      await db.students.bulkAdd(strip(data.students || []));
      await db.gacha.bulkAdd(strip(data.gacha       || []));
      await db.memos.bulkAdd(strip(data.memos        || []));
      await db.events.bulkAdd(strip(data.events      || []));
    }

    return { ok: true, message: 'インポートが完了しました。' };
  } catch (e) {
    return { ok: false, message: `インポートエラー: ${e.message}` };
  }
}
