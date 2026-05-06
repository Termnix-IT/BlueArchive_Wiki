// ============================================================
//  components/GachaSidebar.js  —  ガチャページのサイドパネル
//  募集モード切替 + 排出枠表 + ピックアップ生徒選択
// ============================================================

const GachaSidebarComponent = {
  inject: ['store'],

  data() {
    return {
      showPickupModal: false,
      pickupModalSearch: '',
    };
  },

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

      <!-- ピックアップ生徒選択 -->
      <template v-if="store.gachaMode === 'pickup'">
        <div class="sidebar-section-id">// PICKUP</div>
        <div class="gacha-pickup-list">
          <span v-if="pickupStudents.length === 0" class="gacha-pickup-empty">
            未指定 (★3 全体から抽選)
          </span>
          <span v-else v-for="s in pickupStudents" :key="s.id" class="gacha-pickup-chip">
            {{ s.name }}
            <span class="gacha-pickup-chip-x" @click="removePickup(s.id)">×</span>
          </span>
        </div>
        <button class="sidebar-add-btn" style="margin-top:6px" @click="showPickupModal = true">
          ＋ PU生徒を選択
        </button>
      </template>

      <!-- 期間限定: 拡張余地のプレースホルダ -->
      <template v-if="store.gachaMode === 'limited'">
        <div class="sidebar-section-id">// LIMITED</div>
        <div class="gacha-mode-info">
          周年限定生徒の指定UIは今後実装予定。<br>
          現状は ★3 全体から抽選されます。
        </div>
      </template>

      <!-- ピックアップ生徒選択モーダル (body直下にテレポートしてスタッキングコンテキスト問題を回避) -->
      <teleport to="body">
      <div v-if="showPickupModal" class="modal-overlay" @click.self="showPickupModal = false">
        <div class="modal-box" style="max-width:500px">
          <div class="scan-line"></div>
          <div class="modal-header">
            <h2>ピックアップ生徒を選択</h2>
            <button class="modal-close" @click="showPickupModal = false">×</button>
          </div>
          <div style="margin-bottom:8px">
            <input type="text" v-model="pickupModalSearch" placeholder="名前で検索"
              class="member-modal-search">
          </div>
          <div style="max-height:400px;overflow-y:auto;border:1px solid #c9dcef;border-radius:2px">
            <div v-for="s in filteredModalStudents" :key="s.id"
              class="member-select-row"
              :class="{ selected: store.gachaPickupIds.includes(s.id) }"
              @click="togglePickup(s.id)">
              <span style="flex:1;font-weight:700">{{ s.name }}</span>
              <span class="member-row-school">{{ s.school }}</span>
              <span class="badge" :class="'badge-' + s.rarity + 'star'" style="margin-left:6px">
                {{ '★'.repeat(s.rarity) }}
              </span>
              <span v-if="store.gachaPickupIds.includes(s.id)" class="member-row-check">✓</span>
            </div>
            <div v-if="filteredModalStudents.length === 0" class="empty-state" style="padding:30px 20px">
              <div class="empty-state-mark">該当なし</div>
            </div>
          </div>
          <div class="modal-footer">
            <span class="member-modal-count">
              {{ store.gachaPickupIds.length }} 名選択中
            </span>
            <span style="flex:1"></span>
            <button class="btn-secondary-modal" @click="store.gachaPickupIds = []">クリア</button>
            <button class="btn-primary" @click="showPickupModal = false">完了</button>
          </div>
        </div>
      </div>
      </teleport>
    </div>
  `,

  computed: {
    currentMode() {
      return GACHA_MODES.find(m => m.value === this.store.gachaMode) || GACHA_MODES[0];
    },
    pickupStudents() {
      return this.store.gachaPickupIds
        .map(id => this.store.students.find(s => s.id === id))
        .filter(Boolean);
    },
    filteredModalStudents() {
      // ★3優先で並べる (PUは★3が主だが任意に選択可能)
      const q = this.pickupModalSearch.toLowerCase();
      const all = [...this.store.students].sort((a, b) => {
        if (a.rarity !== b.rarity) return b.rarity - a.rarity;
        return (a.name || '').localeCompare(b.name || '');
      });
      return q ? all.filter(s => (s.name || '').toLowerCase().includes(q)) : all;
    },
  },

  methods: {
    togglePickup(id) {
      const idx = this.store.gachaPickupIds.indexOf(id);
      if (idx >= 0) this.store.gachaPickupIds.splice(idx, 1);
      else this.store.gachaPickupIds.push(id);
    },
    removePickup(id) {
      const idx = this.store.gachaPickupIds.indexOf(id);
      if (idx >= 0) this.store.gachaPickupIds.splice(idx, 1);
    },
  },
};
