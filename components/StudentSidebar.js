// ============================================================
//  components/StudentSidebar.js  —  生徒ページのサイドパネル
//  検索・フィルター・ソート・新規追加
// ============================================================

const StudentSidebarComponent = {
  inject: ['store'],
  template: `
    <div class="sidebar-content">
      <button class="sidebar-add-btn" @click="store.openStudentDetail(null)">
        ＋ 新規追加
      </button>

      <div class="sidebar-section-id">// FILTER</div>

      <div class="sidebar-field">
        <label>名前検索</label>
        <input type="text" v-model="store.studentFilters.name" placeholder="名前で検索">
      </div>

      <div class="sidebar-field">
        <label>学校</label>
        <select v-model="store.studentFilters.school">
          <option value="">全学校</option>
          <option v-for="s in SCHOOLS" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>

      <div class="sidebar-field">
        <label>ロール</label>
        <select v-model="store.studentFilters.role">
          <option value="">全ロール</option>
          <option v-for="r in ROLES" :key="r" :value="r">{{ r }}</option>
        </select>
      </div>

      <div class="sidebar-field">
        <label>レアリティ</label>
        <select v-model="store.studentFilters.rarity">
          <option value="">全レア</option>
          <option value="3">★★★</option>
          <option value="2">★★</option>
          <option value="1">★</option>
        </select>
      </div>

      <div class="sidebar-field">
        <label>攻撃タイプ</label>
        <select v-model="store.studentFilters.attackType">
          <option value="">全攻撃</option>
          <option v-for="t in ATTACK_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select>
      </div>

      <div class="sidebar-field">
        <label>所持状況</label>
        <select v-model="store.studentFilters.owned">
          <option value="">全員</option>
          <option value="true">所持</option>
          <option value="false">未所持</option>
        </select>
      </div>

      <div class="sidebar-section-id">// SORT</div>

      <div class="sidebar-field">
        <label>並び替え</label>
        <select v-model="store.studentSortKey">
          <option value="name">名前順</option>
          <option value="school">学校順</option>
          <option value="rarity">レア順</option>
          <option value="bondLevel">絆Lv順</option>
          <option value="starRank">絆星順</option>
          <option value="owned">所持順</option>
        </select>
      </div>

      <button class="sidebar-reset-btn" @click="store.resetStudentFilters()">
        リセット
      </button>
    </div>
  `,
};
