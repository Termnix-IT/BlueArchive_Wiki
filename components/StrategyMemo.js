// ============================================================
//  components/StrategyMemo.js  —  攻略メモ (Markdownエディタ)
// ============================================================

const StrategyMemoComponent = {
  inject: ['store'],
  template: `
    <div class="memo-layout">
      <!-- エディタ/プレビューエリア -->
      <div class="memo-editor-area">
        <!-- メモ未選択時 -->
        <div v-if="!store.memoSelectedId && !store.memoIsCreating" class="memo-empty">
          サイドパネルからメモを選択するか、「＋ 新規メモ」で作成してください
        </div>

        <template v-else>
          <!-- ツールバー -->
          <div class="memo-toolbar">
            <select v-model="editCategory" class="memo-category-select">
              <option v-for="c in MEMO_CATEGORIES" :key="c.value" :value="c.value">{{ c.label }}</option>
            </select>
            <button :class="{ 'active-mode': viewMode === 'edit' }"   @click="viewMode = 'edit'">編集</button>
            <button :class="{ 'active-mode': viewMode === 'split' }"  @click="viewMode = 'split'">分割</button>
            <button :class="{ 'active-mode': viewMode === 'preview' }" @click="viewMode = 'preview'">プレビュー</button>
            <span style="flex:1"></span>
            <span class="memo-saved-time" v-if="lastSaved">保存: {{ lastSaved }}</span>
            <button class="memo-save-btn" @click="save">保存 (Ctrl+S)</button>
            <button class="memo-delete-btn" v-if="store.memoSelectedId" @click="confirmDelete">削除</button>
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
      editTitle: '',
      editContent: '',
      editCategory: 'misc',
      viewMode: 'split',
      lastSaved: '',
    };
  },

  computed: {
    renderedContent() {
      if (!this.editContent) return '<p style="color:#8aa0b8">プレビューがここに表示されます</p>';
      return marked.parse(this.editContent);
    },
  },

  watch: {
    'store.memoSelectedId': {
      immediate: true,
      handler(id) {
        if (id) {
          const m = this.store.memos.find(x => x.id === id);
          if (m) {
            this.editTitle    = m.title    || '';
            this.editContent  = m.content  || '';
            this.editCategory = m.category || 'misc';
            this.lastSaved = '';
          }
        }
      },
    },
    'store.memoIsCreating': {
      immediate: true,
      handler(creating) {
        if (creating) {
          this.editTitle = '';
          this.editContent = '';
          this.editCategory = 'misc';
          this.lastSaved = '';
        }
      },
    },
  },

  methods: {
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
      if (this.store.memoSelectedId) memo.id = this.store.memoSelectedId;

      await saveMemo(memo);
      await this.store.loadMemos();

      // 新規の場合は作成されたメモを選択
      if (!this.store.memoSelectedId) {
        const saved = this.store.memos.find(m => m.title === memo.title && m.category === memo.category);
        if (saved) {
          this.store.memoSelectedId = saved.id;
          this.store.memoIsCreating = false;
        }
      }

      const now = new Date();
      this.lastSaved = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
      this.store.showToast('保存しました', 'success');
    },

    async confirmDelete() {
      if (!confirm(`「${this.editTitle}」を削除しますか？`)) return;
      await deleteMemo(this.store.memoSelectedId);
      await this.store.loadMemos();
      this.store.memoSelectedId = null;
      this.store.memoIsCreating = false;
      this.editTitle = '';
      this.editContent = '';
      this.store.showToast('削除しました', 'info');
    },
  },
};
