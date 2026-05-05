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

      <div class="sidebar-section-id">
        // MEMO_LIST ({{ store.memos.length }})
      </div>

      <div class="sidebar-field">
        <input type="text" v-model="store.memoSearch" placeholder="検索...">
      </div>

      <div class="memo-list">
        <div v-if="filteredMemos.length === 0" class="memo-sidebar-empty">
          {{ store.memoSearch ? '該当なし' : 'メモがありません' }}
        </div>

        <template v-for="row in groupedMemos" :key="row.key">
          <div v-if="row.type === 'header'" class="memo-category-header">
            {{ row.label }}
          </div>
          <div v-else
            class="memo-item"
            :class="{ active: store.memoSelectedId === row.memo.id }"
            @click="selectMemo(row.memo.id)">
            {{ row.memo.title || '(無題)' }}
          </div>
        </template>
      </div>
    </div>
  `,

  computed: {
    filteredMemos() {
      const q = (this.store.memoSearch || '').toLowerCase();
      const memos = this.store.memos;
      if (!q) return memos;
      return memos.filter(m =>
        (m.title || '').toLowerCase().includes(q) ||
        (m.content || '').toLowerCase().includes(q)
      );
    },

    /** カテゴリヘッダーとメモ項目を1次元配列にフラット化 */
    groupedMemos() {
      const rows = [];
      for (const cat of MEMO_CATEGORIES) {
        const items = this.filteredMemos.filter(m => m.category === cat.value);
        if (items.length === 0) continue;
        rows.push({ type: 'header', key: 'h-' + cat.value, label: cat.label });
        for (const m of items) {
          rows.push({ type: 'item', key: 'm-' + m.id, memo: m });
        }
      }
      return rows;
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
