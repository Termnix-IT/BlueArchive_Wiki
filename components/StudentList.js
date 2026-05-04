// ============================================================
//  components/StudentList.js  —  生徒一覧（カードグリッド）
// ============================================================

// Schale OS パレットに合わせ彩度を抑えた学校カラー
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
      <!-- フィルターバー -->
      <div class="filter-bar">
        <input type="text" v-model="filters.name" placeholder="名前で検索" style="min-width:120px">
        <select v-model="filters.school">
          <option value="">全学校</option>
          <option v-for="s in SCHOOLS" :key="s" :value="s">{{ s }}</option>
        </select>
        <select v-model="filters.role">
          <option value="">全ロール</option>
          <option v-for="r in ROLES" :key="r" :value="r">{{ r }}</option>
        </select>
        <select v-model="filters.rarity">
          <option value="">全レア</option>
          <option value="3">★★★</option>
          <option value="2">★★</option>
          <option value="1">★</option>
        </select>
        <select v-model="filters.attackType">
          <option value="">全攻撃</option>
          <option v-for="t in ATTACK_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select>
        <select v-model="filters.owned">
          <option value="">全員</option>
          <option value="true">所持</option>
          <option value="false">未所持</option>
        </select>
        <select v-model="sortKey" style="min-width:100px">
          <option value="name">名前順</option>
          <option value="school">学校順</option>
          <option value="rarity">レア順</option>
          <option value="bondLevel">絆Lv順</option>
          <option value="starRank">絆星順</option>
          <option value="owned">所持順</option>
        </select>
        <button class="btn-secondary" @click="resetFilters">リセット</button>
        <button style="margin-left:auto" @click="store.openStudentDetail(null)">＋ 新規追加</button>
      </div>

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

  data() {
    return {
      filters: { name: '', school: '', role: '', rarity: '', attackType: '', owned: '' },
      sortKey: 'school',
    };
  },

  computed: {
    filteredStudents() {
      return this.store.students.filter(s => {
        if (this.filters.name && !s.name.includes(this.filters.name)) return false;
        if (this.filters.school && s.school !== this.filters.school) return false;
        if (this.filters.role   && s.role   !== this.filters.role)   return false;
        if (this.filters.rarity && String(s.rarity) !== this.filters.rarity) return false;
        if (this.filters.attackType && s.attackType !== this.filters.attackType) return false;
        if (this.filters.owned !== '') {
          const owned = this.filters.owned === 'true';
          if (s.owned !== owned) return false;
        }
        return true;
      });
    },

    sortedStudents() {
      return [...this.filteredStudents].sort((a, b) => {
        // 所持を先に
        if (this.sortKey === 'owned') {
          return (b.owned ? 1 : 0) - (a.owned ? 1 : 0);
        }
        let va = a[this.sortKey];
        let vb = b[this.sortKey];
        if (va == null) va = '';
        if (vb == null) vb = '';
        if (typeof va === 'boolean') { va = va ? 1 : 0; vb = vb ? 1 : 0; }
        // rarity は降順（高い方が先）
        if (this.sortKey === 'rarity' || this.sortKey === 'bondLevel' || this.sortKey === 'starRank') {
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

    resetFilters() {
      this.filters = { name: '', school: '', role: '', rarity: '', attackType: '', owned: '' };
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
