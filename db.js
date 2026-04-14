// ============================================================
//  db.js  —  Dexie (IndexedDB) スキーマ定義 & CRUD 操作
// ============================================================

const db = new Dexie('BlueArchiveDB');

db.version(1).stores({
  students: '++id, name, school, role, rarity, attackType, armorType, position, owned',
  gacha:    '++id, date, banner, studentName, rarity, cost',
  memos:    '++id, category, title, updatedAt',
  events:   '++id, eventName, type, startDate, cleared',
});

db.version(2).stores({
  students: '++id, name, school, role, rarity, attackType, armorType, position, owned',
  gacha:    '++id, date, banner, studentName, rarity, cost',
  memos:    '++id, category, title, updatedAt',
  events:   '++id, eventName, type, startDate, cleared',
  teams:    '++id, name, purpose, updatedAt',
  materials:'++id, name, type, updatedAt',
});

// ============================================================
//  生徒マスターデータ（ゲーム固定値）
// ============================================================
const STUDENT_MASTER = [
  // ── アビドス ──
  { name: "ホシノ",   school: "アビドス",       role: "Defender",   rarity: 3, attackType: "explosive", armorType: "heavy",   position: "striker" },
  { name: "シロコ",   school: "アビドス",       role: "Attacker",   rarity: 3, attackType: "piercing",  armorType: "light",   position: "striker" },
  { name: "セリカ",   school: "アビドス",       role: "Attacker",   rarity: 2, attackType: "explosive", armorType: "light",   position: "striker" },
  { name: "ノノミ",   school: "アビドス",       role: "Supporter",  rarity: 2, attackType: "piercing",  armorType: "light",   position: "special" },
  { name: "アヤネ",   school: "アビドス",       role: "Healer",     rarity: 2, attackType: "mystic",    armorType: "light",   position: "special" },
  // ── トリニティ ──
  { name: "ハスミ",   school: "トリニティ",     role: "Attacker",   rarity: 3, attackType: "explosive", armorType: "light",   position: "striker" },
  { name: "ヒフミ",   school: "トリニティ",     role: "Supporter",  rarity: 3, attackType: "piercing",  armorType: "light",   position: "special" },
  { name: "コハル",   school: "トリニティ",     role: "Healer",     rarity: 3, attackType: "mystic",    armorType: "heavy",   position: "special" },
  { name: "ハナコ",   school: "トリニティ",     role: "Supporter",  rarity: 3, attackType: "explosive", armorType: "light",   position: "special" },
  { name: "アコ",     school: "トリニティ",     role: "Supporter",  rarity: 3, attackType: "mystic",    armorType: "light",   position: "special" },
  { name: "ユウカ",   school: "トリニティ",     role: "Defender",   rarity: 3, attackType: "explosive", armorType: "heavy",   position: "striker" },
  { name: "ツルギ",   school: "トリニティ",     role: "Attacker",   rarity: 3, attackType: "explosive", armorType: "heavy",   position: "striker" },
  { name: "ノドカ",   school: "トリニティ",     role: "Supporter",  rarity: 3, attackType: "explosive", armorType: "light",   position: "special" },
  { name: "アズサ",   school: "トリニティ",     role: "Attacker",   rarity: 3, attackType: "piercing",  armorType: "light",   position: "striker" },
  { name: "セイア",   school: "トリニティ",     role: "Supporter",  rarity: 3, attackType: "mystic",    armorType: "light",   position: "special" },
  // ── ゲヘナ ──
  { name: "ムツキ",   school: "ゲヘナ",         role: "T.S.",       rarity: 3, attackType: "explosive", armorType: "light",   position: "special" },
  { name: "ハルナ",   school: "ゲヘナ",         role: "Attacker",   rarity: 3, attackType: "explosive", armorType: "special", position: "striker" },
  { name: "カヨコ",   school: "ゲヘナ",         role: "T.S.",       rarity: 3, attackType: "explosive", armorType: "light",   position: "special" },
  { name: "マコト",   school: "ゲヘナ",         role: "Defender",   rarity: 3, attackType: "explosive", armorType: "heavy",   position: "striker" },
  { name: "カリン",   school: "ゲヘナ",         role: "Attacker",   rarity: 3, attackType: "explosive", armorType: "light",   position: "striker" },
  { name: "ヒナ",     school: "ゲヘナ",         role: "Attacker",   rarity: 3, attackType: "explosive", armorType: "light",   position: "striker" },
  { name: "イロハ",   school: "ゲヘナ",         role: "Attacker",   rarity: 3, attackType: "piercing",  armorType: "light",   position: "striker" },
  { name: "ジュンコ", school: "ゲヘナ",         role: "Supporter",  rarity: 3, attackType: "explosive", armorType: "light",   position: "special" },
  // ── ミレニアム ──
  { name: "アリス",   school: "ミレニアム",     role: "Attacker",   rarity: 3, attackType: "mystic",    armorType: "light",   position: "striker" },
  { name: "ネル",     school: "ミレニアム",     role: "Attacker",   rarity: 3, attackType: "explosive", armorType: "heavy",   position: "striker" },
  { name: "ヒビキ",   school: "ミレニアム",     role: "Supporter",  rarity: 3, attackType: "explosive", armorType: "light",   position: "special" },
  { name: "チェリノ", school: "ミレニアム",     role: "Defender",   rarity: 2, attackType: "explosive", armorType: "heavy",   position: "striker" },
  { name: "イズナ",   school: "ミレニアム",     role: "Attacker",   rarity: 3, attackType: "piercing",  armorType: "light",   position: "striker" },
  { name: "カガリ",   school: "ミレニアム",     role: "Attacker",   rarity: 3, attackType: "explosive", armorType: "heavy",   position: "striker" },
  // ── アリウス ──
  { name: "スズミ",   school: "アリウス",       role: "Healer",     rarity: 3, attackType: "mystic",    armorType: "light",   position: "special" },
  { name: "アスナ",   school: "アリウス",       role: "Attacker",   rarity: 3, attackType: "explosive", armorType: "light",   position: "striker" },
  { name: "シュン",   school: "アリウス",       role: "Attacker",   rarity: 3, attackType: "mystic",    armorType: "light",   position: "striker" },
  // ── レッドウィンター ──
  { name: "マキ",     school: "レッドウィンター", role: "Healer",   rarity: 3, attackType: "mystic",    armorType: "light",   position: "special" },
  { name: "ミチル",   school: "レッドウィンター", role: "Supporter", rarity: 3, attackType: "explosive", armorType: "light",   position: "special" },
  { name: "ウタハ",   school: "レッドウィンター", role: "Attacker",  rarity: 3, attackType: "mystic",    armorType: "light",   position: "striker" },
  // ── 百鬼夜行 ──
  { name: "ヒヨリ",   school: "百鬼夜行",       role: "Attacker",   rarity: 3, attackType: "explosive", armorType: "light",   position: "striker" },
  { name: "アカネ",   school: "百鬼夜行",       role: "T.S.",       rarity: 3, attackType: "mystic",    armorType: "light",   position: "special" },
  // ── ヴァルキューレ ──
  { name: "レイサ",   school: "ヴァルキューレ",  role: "Defender",  rarity: 3, attackType: "explosive", armorType: "heavy",   position: "striker" },
  { name: "ナギサ",   school: "ヴァルキューレ",  role: "Supporter", rarity: 3, attackType: "explosive", armorType: "light",   position: "special" },
  // ── SRT ──
  { name: "サオリ",   school: "SRT特務班",      role: "Attacker",   rarity: 3, attackType: "explosive", armorType: "light",   position: "striker" },
  // ── その他 ──
  { name: "アロナ",   school: "シャーレ",        role: "Supporter", rarity: 3, attackType: "mystic",    armorType: "light",   position: "special" },
];

// 初回起動時に生徒マスターデータをDBに投入
async function seedStudentsIfEmpty() {
  const count = await db.students.count();
  if (count === 0) {
    const now = new Date().toISOString().split('T')[0];
    const records = STUDENT_MASTER.map(s => ({
      ...s,
      owned: false,
      starRank: 1,
      bondLevel: 1,
      uniqueWeaponLevel: 0,
      skillLevels: { ex: 1, normal: 1, passive: 1, sub: 1 },
      equipmentLevels: [1, 1, 1],
      notes: '',
      addedAt: now,
    }));
    await db.students.bulkAdd(records);
  }
}

// ============================================================
//  生徒 CRUD
// ============================================================
async function getAllStudents() {
  return db.students.toArray();
}

async function saveStudent(student) {
  if (student.id) {
    await db.students.put(student);
  } else {
    await db.students.add(student);
  }
}

async function deleteStudent(id) {
  await db.students.delete(id);
}

async function toggleOwned(id, current) {
  await db.students.update(id, { owned: !current });
}

// ============================================================
//  ガチャ CRUD
// ============================================================
async function getAllGacha() {
  const pulls = await db.gacha.toArray();
  return pulls.sort((a, b) => b.id - a.id);
}

async function addGachaPull(pull) {
  await db.gacha.add(pull);
}

async function deleteGachaPull(id) {
  await db.gacha.delete(id);
}

// ============================================================
//  攻略メモ CRUD
// ============================================================
async function getAllMemos() {
  return db.memos.orderBy('updatedAt').reverse().toArray();
}

async function saveMemo(memo) {
  const now = new Date().toISOString();
  if (memo.id) {
    await db.memos.put({ ...memo, updatedAt: now });
  } else {
    await db.memos.add({ ...memo, updatedAt: now, createdAt: now });
  }
}

async function deleteMemo(id) {
  await db.memos.delete(id);
}

// ============================================================
//  イベント CRUD
// ============================================================
async function getAllEvents() {
  const events = await db.events.toArray();
  return events.sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));
}

async function saveEvent(event) {
  if (event.id) {
    await db.events.put(event);
  } else {
    await db.events.add(event);
  }
}

async function deleteEvent(id) {
  await db.events.delete(id);
}

// ============================================================
//  チーム編成 CRUD
// ============================================================
async function getAllTeams() {
  const teams = await db.teams.toArray();
  return teams.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
}

async function saveTeam(team) {
  const now = new Date().toISOString();
  if (team.id) {
    await db.teams.put({ ...team, updatedAt: now });
  } else {
    await db.teams.add({ ...team, updatedAt: now, createdAt: now });
  }
}

async function deleteTeam(id) {
  await db.teams.delete(id);
}

// ============================================================
//  素材管理 CRUD
// ============================================================
async function getAllMaterials() {
  const mats = await db.materials.toArray();
  return mats.sort((a, b) => (a.type || '').localeCompare(b.type || '') || (a.name || '').localeCompare(b.name || ''));
}

async function saveMaterial(material) {
  const now = new Date().toISOString();
  if (material.id) {
    await db.materials.put({ ...material, updatedAt: now });
  } else {
    await db.materials.add({ ...material, updatedAt: now });
  }
}

async function deleteMaterial(id) {
  await db.materials.delete(id);
}

// ============================================================
//  定数 (ドロップダウン等で使用)
// ============================================================
const SCHOOLS = [
  "アビドス", "トリニティ", "ゲヘナ", "ミレニアム",
  "アリウス", "ヴァルキューレ", "レッドウィンター",
  "百鬼夜行", "SRT特務班", "シャーレ", "その他"
];

const ROLES = ["Attacker", "Defender", "Healer", "Supporter", "T.S."];

const ATTACK_TYPES = [
  { value: "explosive", label: "爆発" },
  { value: "piercing",  label: "貫通" },
  { value: "mystic",    label: "神秘" },
  { value: "sonic",     label: "振動" },
];

const ARMOR_TYPES = [
  { value: "light",   label: "軽装備" },
  { value: "heavy",   label: "重装備" },
  { value: "special", label: "特殊装備" },
  { value: "elastic", label: "弾力装備" },
];

const MEMO_CATEGORIES = [
  { value: "total_assault",  label: "総力戦" },
  { value: "joint_firing",   label: "大決戦" },
  { value: "raid",           label: "ホードレイド" },
  { value: "event",          label: "イベント" },
  { value: "misc",           label: "その他" },
];

const EVENT_TYPES = [
  { value: "story",   label: "ストーリー" },
  { value: "raid",    label: "レイド" },
  { value: "collab",  label: "コラボ" },
  { value: "rerun",   label: "復刻" },
  { value: "limited", label: "期間限定" },
];

const TEAM_PURPOSES = [
  { value: "total_assault", label: "総力戦" },
  { value: "joint_assault", label: "大決戦" },
  { value: "joint_firing",  label: "合同火力演習" },
  { value: "pvp",           label: "カフェテリア" },
  { value: "other",         label: "その他" },
];

const MATERIAL_TYPES = [
  { value: "equip_t1", label: "装備素材T1" },
  { value: "equip_t2", label: "装備素材T2" },
  { value: "equip_t3", label: "装備素材T3" },
  { value: "equip_t4", label: "装備素材T4" },
  { value: "skill",    label: "スキル素材" },
  { value: "credit",   label: "クレジット" },
  { value: "pyroxene", label: "ピロキセン（石）" },
  { value: "other",    label: "その他" },
];
