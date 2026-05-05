// ============================================================
//  components/MaterialSidebar.js  —  素材ページのサイドパネル
//  カテゴリ・名前フィルタ
// ============================================================

const MaterialSidebarComponent = {
  inject: ['store'],
  template: `
    <div class="sidebar-content">
      <div class="sidebar-section-id">// FILTER</div>

      <div class="sidebar-field">
        <label>カテゴリ</label>
        <select v-model="store.materialFilter.type">
          <option value="">すべてのカテゴリ</option>
          <option v-for="t in MATERIAL_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select>
      </div>

      <div class="sidebar-field">
        <label>素材名</label>
        <input type="text" v-model="store.materialFilter.name" placeholder="名前で検索">
      </div>

      <button class="sidebar-reset-btn" @click="store.resetMaterialFilter()">
        リセット
      </button>
    </div>
  `,
};
