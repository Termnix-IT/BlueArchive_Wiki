// ============================================================
//  components/MemoSidebar.js  —  攻略メモのサイドパネル
//  検索・新規作成・カテゴリ別メモ一覧
// ============================================================

const MemoSidebarComponent = {
  inject: ['store'],
  template: `
    <div class="sidebar-content memo-sidebar-panel">
      <button class="sidebar-add-btn" @click="newMemo">
        ＋ 新規メモ
      </button>

      <div class="sidebar-section-id">// MEMO_LIST</div>

      <div class="sidebar-field">
        <input type="text" v-model="store.memoSearch" placeholder="検索...">
      </div>

      <div class="memo-list">
        <template v-for="cat in MEMO_CATEGORIES" :key="cat.value">
          <template v-if="memosByCategory[cat.value] && memosByCategory[cat.value].length > 0">
            <div class="memo-category-header">{{ cat.label }}</div>
            <div v-for="m in memosByCategory[cat.value]" :key="m.id"
              class="memo-item"
              :class="{ active: store.memoSelectedId === m.id }"
              @click="selectMemo(m.id)">
              {{ m.title || '(無題)' }}
            </div>
          </template>
        </template>

        <div v-if="filteredMemos.length === 0" class="memo-sidebar-empty">
          メモがありません
        </div>
      </div>
    </div>
  `,

  computed: {
    filteredMemos() {
      const q = (this.store.memoSearch || '').toLowerCase();
      if (!q) return this.store.memos;
      return this.store.memos.filter(m =>
        (m.title || '').toLowerCase().includes(q) ||
        (m.content || '').toLowerCase().includes(q)
      );
    },

    memosByCategory() {
      const result = {};
      for (const cat of MEMO_CATEGORIES) {
        result[cat.value] = this.filteredMemos.filter(m => m.category === cat.value);
      }
      return result;
    },
  },

  methods: {
    newMemo() {
      this.store.memoSelectedId = null;
      this.store.memoIsCreating = true;
    },
    selectMemo(id) {
      this.store.memoSelectedId = id;
      this.store.memoIsCreating = false;
    },
  },
};
