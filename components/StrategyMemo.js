// ============================================================
//  components/StrategyMemo.js  —  攻略メモ (Markdownエディタ)
// ============================================================

const StrategyMemoComponent = {
  inject: ['store'],
  template: `
    <div class="memo-layout">
      <!-- サイドバー -->
      <div class="memo-sidebar">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem">
          <span style="font-size:0.85rem;font-weight:bold;color:#555">攻略メモ</span>
          <button class="btn-edit" @click="createNew">＋</button>
        </div>

        <!-- 検索 -->
        <input type="text" v-model="search" placeholder="検索..."
          style="width:100%;padding:0.3rem 0.5rem;font-size:0.8rem;border-radius:5px;border:1px solid #ccc;margin-bottom:0.5rem;box-sizing:border-box">

        <!-- カテゴリ別メモ一覧 -->
        <template v-for="cat in MEMO_CATEGORIES" :key="cat.value">
          <div v-if="memosByCategory[cat.value] && memosByCategory[cat.value].length > 0">
            <div class="memo-category-header">{{ cat.label }}</div>
            <div v-for="m in memosByCategory[cat.value]" :key="m.id"
              class="memo-item" :class="{ active: selectedMemoId === m.id }"
              @click="selectMemo(m)">
              {{ m.title || '(無題)' }}
            </div>
          </div>
        </template>

        <div v-if="filteredMemos.length === 0" style="color:#aaa;font-size:0.8rem;padding:0.5rem">
          メモがありません
        </div>
      </div>

      <!-- エディタ/プレビューエリア -->
      <div class="memo-editor-area">
        <!-- メモ未選択時 -->
        <div v-if="!selectedMemoId && !isCreating" class="memo-empty">
          左のリストからメモを選択するか、「＋」で新規作成してください
        </div>

        <template v-else>
          <!-- ツールバー -->
          <div class="memo-toolbar">
            <select v-model="editCategory" style="font-size:0.8rem;padding:0.25rem;border-radius:4px;border:1px solid #ccc">
              <option v-for="c in MEMO_CATEGORIES" :key="c.value" :value="c.value">{{ c.label }}</option>
            </select>
            <button :class="{ 'active-mode': viewMode === 'edit' }"   @click="viewMode = 'edit'">編集</button>
            <button :class="{ 'active-mode': viewMode === 'split' }"  @click="viewMode = 'split'">分割</button>
            <button :class="{ 'active-mode': viewMode === 'preview' }" @click="viewMode = 'preview'">プレビュー</button>
            <span style="flex:1"></span>
            <span style="font-size:0.75rem;color:#aaa" v-if="lastSaved">保存: {{ lastSaved }}</span>
            <button @click="save" style="background:#3ea8ff;color:#fff;border-color:#3ea8ff">保存 (Ctrl+S)</button>
            <button v-if="selectedMemoId" @click="confirmDelete" style="background:#f43f5e;color:#fff;border-color:#f43f5e">削除</button>
          </div>

          <!-- タイトル入力 -->
          <input type="text" class="memo-title-input" v-model="editTitle" placeholder="タイトルを入力...">

          <!-- コンテンツエリア -->
          <div class="memo-content-area" :class="{ 'split-view': viewMode === 'split' }">
            <textarea v-if="viewMode !== 'preview'"
              class="memo-textarea"
              v-model="editContent"
              placeholder="Markdownで記述できます&#10;&#10;## 見出し&#10;**太字** _斜体_&#10;- リスト&#10;\`コード\`"
              @keydown.ctrl.s.prevent="save">
            </textarea>
            <div v-if="viewMode !== 'edit'"
              class="memo-preview"
              v-html="renderedContent">
            </div>
          </div>
        </template>
      </div>
    </div>
  `,

  data() {
    return {
      selectedMemoId: null,
      isCreating: false,
      editTitle: '',
      editContent: '',
      editCategory: 'misc',
      viewMode: 'split',
      search: '',
      lastSaved: '',
    };
  },

  computed: {
    filteredMemos() {
      if (!this.search) return this.store.memos;
      const q = this.search.toLowerCase();
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

    renderedContent() {
      if (!this.editContent) return '<p style="color:#aaa">プレビューがここに表示されます</p>';
      // marked.parse は同期的
      return marked.parse(this.editContent);
    },
  },

  methods: {
    selectMemo(m) {
      this.selectedMemoId = m.id;
      this.isCreating = false;
      this.editTitle   = m.title   || '';
      this.editContent = m.content || '';
      this.editCategory = m.category || 'misc';
      this.lastSaved = '';
    },

    createNew() {
      this.selectedMemoId = null;
      this.isCreating = true;
      this.editTitle = '';
      this.editContent = '';
      this.editCategory = 'misc';
      this.lastSaved = '';
    },

    async save() {
      if (!this.editTitle.trim()) {
        this.store.showToast('タイトルを入力してください', 'error'); return;
      }
      const memo = {
        title: this.editTitle,
        content: this.editContent,
        category: this.editCategory,
        tags: [],
      };
      if (this.selectedMemoId) memo.id = this.selectedMemoId;

      await saveMemo(memo);
      await this.store.loadMemos();

      // 新規の場合は作成されたメモを選択
      if (!this.selectedMemoId) {
        const saved = this.store.memos.find(m => m.title === memo.title && m.category === memo.category);
        if (saved) this.selectedMemoId = saved.id;
        this.isCreating = false;
      }

      const now = new Date();
      this.lastSaved = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
      this.store.showToast('保存しました', 'success');
    },

    async confirmDelete() {
      if (!confirm(`「${this.editTitle}」を削除しますか？`)) return;
      await deleteMemo(this.selectedMemoId);
      await this.store.loadMemos();
      this.selectedMemoId = null;
      this.isCreating = false;
      this.editTitle = '';
      this.editContent = '';
      this.store.showToast('削除しました', 'info');
    },
  },
};
