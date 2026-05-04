// ============================================================
//  app.js  —  Vueアプリ ルート & グローバルストア
// ============================================================

// リアクティブストア（グローバル状態管理）
const store = Vue.reactive({
  // データ
  students:  [],
  gacha:     [],
  memos:     [],
  teams:     [],
  materials: [],

  // UI状態
  activeTab:         'students',
  selectedStudentId: null,
  showStudentDetail: false,
  toast: null,
  _toastTimer: null,

  // ── ページ別サイドパネル状態 ─────────────────────────
  studentFilters: { name: '', school: '', role: '', rarity: '', attackType: '', owned: '' },
  studentSortKey: 'school',
  resetStudentFilters() {
    this.studentFilters = { name: '', school: '', role: '', rarity: '', attackType: '', owned: '' };
  },

  memoSelectedId: null,
  memoIsCreating: false,
  memoSearch: '',

  // ── データロード ─────────────────────────────────────────
  async loadStudents() {
    this.students = await getAllStudents();
  },
  async loadGacha() {
    this.gacha = await getAllGacha();
  },
  async loadMemos() {
    this.memos = await getAllMemos();
  },
  async loadTeams() {
    this.teams = await getAllTeams();
  },
  async loadMaterials() {
    this.materials = await getAllMaterials();
  },
  async loadAll() {
    await Promise.all([
      this.loadStudents(),
      this.loadGacha(),
      this.loadMemos(),
      this.loadTeams(),
      this.loadMaterials(),
    ]);
  },

  // ── 生徒詳細パネル ───────────────────────────────────────
  openStudentDetail(id) {
    this.selectedStudentId = id;
    this.showStudentDetail = true;
  },
  closeStudentDetail() {
    this.showStudentDetail = false;
    this.selectedStudentId = null;
  },

  // ── トースト通知 ─────────────────────────────────────────
  showToast(message, type = 'info') {
    if (this._toastTimer) clearTimeout(this._toastTimer);
    this.toast = { message, type };
    this._toastTimer = setTimeout(() => { this.toast = null; }, 3000);
  },
});

// ============================================================
//  ルートコンポーネント
// ============================================================
const App = {
  provide() {
    return { store };
  },

  template: `
    <div class="app-shell" :class="{ 'sidebar-collapsed': sidebarCollapsed, 'sidebar-mobile-open': sidebarMobileOpen }">
      <!-- ヘッダー & ナビ -->
      <header id="app-header">
        <!-- 上段: タイトル + アクション -->
        <div class="header-top">
          <button class="sidebar-toggle-btn" @click="toggleSidebar" title="サイドパネル">
            <span>≡</span>
          </button>
          <h1>
            <span class="os-bracket">SCHALE</span>Blue Archive DB<span class="os-version">v0.2</span>
          </h1>
          <div style="flex:1"></div>
          <div class="header-status">
            <span class="os-status-dot"></span>
            <span>接続中 · {{ clockText }}</span>
          </div>
          <div class="header-actions">
            <button @click="handleExport" title="データをJSONファイルに書き出す">エクスポート</button>
            <button @click="triggerImport" title="JSONファイルからデータを読み込む">インポート</button>
            <input type="file" ref="importFile" accept=".json" style="display:none" @change="handleImport">
          </div>
        </div>
        <!-- 下段: タブナビゲーション -->
        <nav class="tab-nav">
          <button class="tab-btn" :class="{ active: store.activeTab === 'students' }"
            @click="store.activeTab = 'students'"><span class="tab-glyph">◆</span>生徒</button>
          <button class="tab-btn" :class="{ active: store.activeTab === 'gacha' }"
            @click="store.activeTab = 'gacha'"><span class="tab-glyph">◇</span>ガチャ</button>
          <button class="tab-btn" :class="{ active: store.activeTab === 'memos' }"
            @click="store.activeTab = 'memos'"><span class="tab-glyph">◈</span>攻略メモ</button>
          <button class="tab-btn" :class="{ active: store.activeTab === 'teams' }"
            @click="store.activeTab = 'teams'"><span class="tab-glyph">▤</span>編成</button>
          <button class="tab-btn" :class="{ active: store.activeTab === 'materials' }"
            @click="store.activeTab = 'materials'"><span class="tab-glyph">▦</span>素材</button>
        </nav>
      </header>

      <div class="app-body">
        <!-- ── サイドパネル ── -->
        <aside id="app-sidebar" :aria-expanded="!sidebarCollapsed">
          <div v-if="!sidebarCollapsed" class="sidebar-body">
            <student-sidebar v-if="store.activeTab === 'students'"></student-sidebar>
            <memo-sidebar v-if="store.activeTab === 'memos'"></memo-sidebar>
          </div>
        </aside>

        <!-- モバイルドラワー背景 -->
        <div v-if="sidebarMobileOpen" class="sidebar-backdrop" @click="sidebarMobileOpen = false"></div>

        <!-- ── メインエリア ── -->
        <main id="main-content">
          <div v-if="store.activeTab === 'students'">
            <student-list></student-list>
          </div>
          <div v-if="store.activeTab === 'gacha'">
            <gacha-simulator></gacha-simulator>
          </div>
          <div v-if="store.activeTab === 'memos'">
            <strategy-memo></strategy-memo>
          </div>
          <div v-if="store.activeTab === 'teams'">
            <team-composition></team-composition>
          </div>
          <div v-if="store.activeTab === 'materials'">
            <material-management></material-management>
          </div>
        </main>
      </div>

      <!-- 生徒詳細モーダル -->
      <student-detail v-if="store.showStudentDetail"></student-detail>

      <!-- トースト通知 -->
      <div v-if="store.toast" class="toast" :class="store.toast.type">
        {{ store.toast.message }}
      </div>
    </div>
  `,

  data() {
    return {
      store,
      clockText: '',
      sidebarCollapsed: JSON.parse(localStorage.getItem('schaleSidebarCollapsed') || 'false'),
      sidebarMobileOpen: false,
    };
  },

  watch: {
    sidebarCollapsed(v) {
      localStorage.setItem('schaleSidebarCollapsed', JSON.stringify(v));
    },
  },

  async mounted() {
    await seedStudentsIfEmpty();
    await store.loadAll();
    this.updateClock();
    this._clockTimer = setInterval(() => this.updateClock(), 1000);
  },

  beforeUnmount() {
    if (this._clockTimer) clearInterval(this._clockTimer);
  },

  methods: {
    toggleSidebar() {
      if (window.innerWidth <= 768) {
        this.sidebarMobileOpen = !this.sidebarMobileOpen;
      } else {
        this.sidebarCollapsed = !this.sidebarCollapsed;
      }
    },

    updateClock() {
      const d = new Date();
      const pad = n => String(n).padStart(2, '0');
      this.clockText = `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    },

    async handleExport() {
      const result = await exportAllData();
      store.showToast(result.message, result.ok ? 'success' : 'error');
    },

    triggerImport() {
      this.$refs.importFile.value = '';
      this.$refs.importFile.click();
    },

    async handleImport(e) {
      const file = e.target.files[0];
      if (!file) return;

      const mode = confirm(
        'インポート方法を選択してください\n\n' +
        '【OK】 置き換え: 現在のデータをすべて削除してインポート\n' +
        '【キャンセル】 マージ: 既存データに追記'
      ) ? 'replace' : 'merge';

      const text = await file.text();
      const result = await importAllData(text, mode);
      store.showToast(result.message, result.ok ? 'success' : 'error');
      if (result.ok) await store.loadAll();
    },
  },
};

// ============================================================
//  Vue アプリ起動
// ============================================================
const app = Vue.createApp(App);

// コンポーネント登録
app.component('student-list',        StudentListComponent);
app.component('student-sidebar',     StudentSidebarComponent);
app.component('student-detail',      StudentDetailComponent);
app.component('gacha-simulator',     GachaSimulatorComponent);
app.component('strategy-memo',       StrategyMemoComponent);
app.component('memo-sidebar',        MemoSidebarComponent);
app.component('team-composition',    TeamCompositionComponent);
app.component('material-management', MaterialManagementComponent);

app.mount('#app');
