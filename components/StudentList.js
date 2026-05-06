// ============================================================
//  components/StudentList.js  —  生徒一覧（カードグリッド）
// ============================================================

// Schale OS パレットに合わせ彩度を抑えた学校カラー。
// 未登録学校はフォールバックのグレーグラデーションで表示される (壊れない)。
// 新学校追加時はここにエントリを足すと専用カラーが当たる。
const SCHOOL_COLORS = {
  'アビドス':        'linear-gradient(160deg, #e8d49a 0%, #c4a868 100%)',
  'トリニティ':      'linear-gradient(160deg, #f8d4e4 0%, #d8a8c0 100%)',
  'ゲヘナ':          'linear-gradient(160deg, #e8624a 0%, #b03828 100%)',
  'ミレニアム':      'linear-gradient(160deg, #6ea4e6 0%, #3870b8 100%)',
  'アリウス':        'linear-gradient(160deg, #9070c0 0%, #604098 100%)',
  'レッドウィンター':'linear-gradient(160deg, #c84050 0%, #902028 100%)',
  '百鬼夜行':        'linear-gradient(160deg, #6e50a0 0%, #443070 100%)',
  'ヴァルキューレ':  'linear-gradient(160deg, #5868a8 0%, #2c3878 100%)',
  'SRT特務班':       'linear-gradient(160deg, #5a7a98 0%, #3c5468 100%)',
  'シャーレ':        'linear-gradient(160deg, #98c8ec 0%, #5a90c8 100%)',
};

const StudentListComponent = {
  inject: ['store'],
  template: `
    <div>
      <!-- 件数表示 -->
      <div class="student-count">
        <span class="count-num">{{ sortedStudents.length }}</span>
        <span class="count-divider">/</span>
        <span class="count-total">{{ store.students.length }} 件</span>
        <span class="count-divider">・</span>
        <span class="count-owned">所持 {{ ownedCount }} 名</span>
      </div>

      <!-- カードグリッド -->
      <div class="student-grid" v-if="sortedStudents.length > 0">
        <div
          v-for="s in sortedStudents"
          :key="s.id"
          class="student-card"
          :class="{ 'student-card--owned': s.owned }"
          @click="store.openStudentDetail(s.id)"
        >
          <!-- 画像エリア -->
          <div class="student-card-img" :style="cardImgStyle(s)">
            <img v-if="s.imageData" :src="s.imageData" class="student-card-photo">

            <!-- 所持ピン (左上) -->
            <button
              class="student-card-pin"
              :class="s.owned ? 'student-card-pin--owned' : 'student-card-pin--unowned'"
              :title="s.owned ? 'クリックで未所持に' : 'クリックで所持に'"
              @click.stop="toggleOwned(s)"
            >{{ s.owned ? '●' : '○' }}</button>

            <!-- 攻撃タイプバッジ (右下) -->
            <span
              class="student-card-atk badge"
              :class="'badge-' + s.attackType"
            >{{ attackLabel(s.attackType) }}</span>

            <!-- 絆Lvオーバーレイ (下部) -->
            <div class="student-card-level">Lv.{{ s.bondLevel || 1 }}</div>
          </div>

          <!-- カード下部: 名前・星 -->
          <div class="student-card-footer">
            <div class="student-card-name">{{ s.name }}</div>
            <div class="student-card-stars">{{ '★'.repeat(s.rarity) }}</div>
          </div>
        </div>
      </div>

      <!-- 0件 -->
      <div v-else class="empty-state">
        <div class="empty-state-mark">該当なし</div>
        <div class="empty-state-msg">条件に一致する生徒が見つかりません</div>
      </div>
    </div>
  `,

  computed: {
    filteredStudents() {
      const f = this.store.studentFilters;
      return this.store.students.filter(s => {
        if (f.name && !s.name.includes(f.name)) return false;
        if (f.school && s.school !== f.school) return false;
        if (f.role   && s.role   !== f.role)   return false;
        if (f.rarity && String(s.rarity) !== f.rarity) return false;
        if (f.attackType && s.attackType !== f.attackType) return false;
        if (f.owned !== '') {
          const owned = f.owned === 'true';
          if (s.owned !== owned) return false;
        }
        return true;
      });
    },

    sortedStudents() {
      const sortKey = this.store.studentSortKey;
      return [...this.filteredStudents].sort((a, b) => {
        // 所持を先に
        if (sortKey === 'owned') {
          return (b.owned ? 1 : 0) - (a.owned ? 1 : 0);
        }
        let va = a[sortKey];
        let vb = b[sortKey];
        if (va == null) va = '';
        if (vb == null) vb = '';
        if (typeof va === 'boolean') { va = va ? 1 : 0; vb = vb ? 1 : 0; }
        // rarity は降順（高い方が先）
        if (sortKey === 'rarity' || sortKey === 'bondLevel' || sortKey === 'starRank') {
          if (va < vb) return 1;
          if (va > vb) return -1;
          return 0;
        }
        if (va < vb) return -1;
        if (va > vb) return 1;
        return 0;
      });
    },

    ownedCount() {
      return this.store.students.filter(s => s.owned).length;
    },
  },

  methods: {
    async toggleOwned(s) {
      await toggleOwned(s.id, s.owned);
      await this.store.loadStudents();
    },

    attackLabel(val) {
      const t = ATTACK_TYPES.find(t => t.value === val);
      return t ? t.label : val;
    },

    cardImgStyle(s) {
      const color = SCHOOL_COLORS[s.school] || 'linear-gradient(160deg, #c8d0e0 0%, #a0aab8 100%)';
      return { background: color };
    },
  },
};
