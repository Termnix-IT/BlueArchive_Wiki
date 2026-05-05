// ============================================================
//  components/GachaSidebar.js  —  ガチャページのサイドパネル
//  募集モード切替 (通常 / ピックアップ / 期間限定)
// ============================================================

const GachaSidebarComponent = {
  inject: ['store'],
  template: `
    <div class="sidebar-content">
      <div class="sidebar-section-id">// MODE</div>
      <div class="mode-toggle">
        <button v-for="m in GACHA_MODES" :key="m.value"
          class="mode-toggle-btn"
          :class="{ active: store.gachaMode === m.value }"
          @click="store.gachaMode = m.value">
          {{ m.label }}
        </button>
      </div>

      <div class="sidebar-section-id">// RATES</div>
      <div class="gacha-rates-table">
        <div v-for="(r, i) in currentMode.rates" :key="i" class="gacha-rate-row"
          :class="'gacha-rate-stars-' + r.stars">
          <span class="gacha-rate-label">{{ r.label }}</span>
          <span class="gacha-rate-pct">{{ (r.pct * 100).toFixed(1) }}%</span>
        </div>
      </div>

      <div class="sidebar-section-id">// INFO</div>
      <div class="gacha-mode-info">
        {{ currentMode.description }}
      </div>
    </div>
  `,

  computed: {
    currentMode() {
      return GACHA_MODES.find(m => m.value === this.store.gachaMode) || GACHA_MODES[0];
    },
  },
};
