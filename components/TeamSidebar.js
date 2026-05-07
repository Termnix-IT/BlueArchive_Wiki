// ============================================================
//  components/TeamSidebar.js  —  チーム編成のサイドパネル
//  モード切替 (通常 / 制約解除決戦) + フィルタ
// ============================================================

const TeamSidebarComponent = {
  inject: ['store'],
  template: `
    <div class="sidebar-content">
      <div class="sidebar-section-id">// MODE</div>
      <div class="mode-toggle">
        <button v-for="m in TEAM_MODES" :key="m.value"
          class="mode-toggle-btn"
          :class="{ active: store.teamMode === m.value }"
          @click="store.teamMode = m.value">
          {{ m.label }}
        </button>
      </div>
      <div class="mode-toggle-hint">
        ストライカー最大 {{ currentMode.striker }} / スペシャル最大 {{ currentMode.special }}
      </div>

      <div class="sidebar-section-id">// FILTER</div>

      <div class="sidebar-field">
        <label>用途</label>
        <select v-model="store.teamFilter.purpose">
          <option value="">すべての用途</option>
          <option v-for="p in TEAM_PURPOSES" :key="p.value" :value="p.value">{{ p.label }}</option>
        </select>
      </div>

      <div class="sidebar-field">
        <label>編成名</label>
        <input type="text" v-model="store.teamFilter.name" placeholder="編成名で検索">
      </div>

      <button class="sidebar-reset-btn" @click="store.resetTeamFilter()">
        フィルタをリセット
      </button>
    </div>
  `,

  computed: {
    currentMode() {
      return TEAM_MODES.find(m => m.value === this.store.teamMode) || TEAM_MODES[0];
    },
  },
};
