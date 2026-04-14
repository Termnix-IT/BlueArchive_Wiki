// ============================================================
//  app.js  —  Vueアプリ ルート & グローバルストア
// ============================================================

// リアクティブストア（グローバル状態管理）
const store = Vue.reactive({
  // データ
  students:  [],
  gacha:     [],
  memos:     [],
  events:    [],
  teams:     [],
  materials: [],

  // UI状態
  activeTab:         'students',
  selectedStudentId: null,
  showStudentDetail: false,
  toast: null,
  _toastTimer: null,

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
  async loadEvents() {
    this.events = await getAllEvents();
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
      this.loadEvents(),
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
    <div>
      <!-- ヘッダー & ナビ -->
      <header id="app-header">
        <!-- 上段: タイトル + アクション -->
        <div class="header-top">
          <h1>🎮 Blue Archive DB</h1>
          <div style="flex:1"></div>
          <div class="header-actions">
            <button @click="handleExport" title="データをJSONファイルに書き出す">⬇ Export</button>
            <button @click="triggerImport" title="JSONファイルからデータを読み込む">⬆ Import</button>
            <input type="file" ref="importFile" accept=".json" style="display:none" @change="handleImport">
          </div>
        </div>
        <!-- 下段: タブナビゲーション -->
        <nav class="tab-nav">
          <button class="tab-btn" :class="{ active: store.activeTab === 'students' }"
            @click="store.activeTab = 'students'">👩‍🎓 生徒</button>
          <button class="tab-btn" :class="{ active: store.activeTab === 'gacha' }"
            @click="store.activeTab = 'gacha'">🎲 ガチャ</button>
          <button class="tab-btn" :class="{ active: store.activeTab === 'memos' }"
            @click="store.activeTab = 'memos'">📝 攻略メモ</button>
          <button class="tab-btn" :class="{ active: store.activeTab === 'events' }"
            @click="store.activeTab = 'events'">📅 イベント</button>
          <button class="tab-btn" :class="{ active: store.activeTab === 'teams' }"
            @click="store.activeTab = 'teams'">👥 チーム編成</button>
          <button class="tab-btn" :class="{ active: store.activeTab === 'materials' }"
            @click="store.activeTab = 'materials'">🎒 素材管理</button>
        </nav>
      </header>

      <!-- メインコンテンツ -->
      <main id="main-content">
        <div v-if="store.activeTab === 'students'">
          <student-list></student-list>
        </div>
        <div v-if="store.activeTab === 'gacha'">
          <gacha-log></gacha-log>
        </div>
        <div v-if="store.activeTab === 'memos'">
          <strategy-memo></strategy-memo>
        </div>
        <div v-if="store.activeTab === 'events'">
          <event-log></event-log>
        </div>
        <div v-if="store.activeTab === 'teams'">
          <team-composition></team-composition>
        </div>
        <div v-if="store.activeTab === 'materials'">
          <material-management></material-management>
        </div>
      </main>

      <!-- 生徒詳細モーダル -->
      <student-detail v-if="store.showStudentDetail"></student-detail>

      <!-- トースト通知 -->
      <div v-if="store.toast" class="toast" :class="store.toast.type">
        {{ store.toast.message }}
      </div>
    </div>
  `,

  data() {
    return { store };
  },

  async mounted() {
    await seedStudentsIfEmpty();
    await store.loadAll();
  },

  methods: {
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
app.component('student-detail',      StudentDetailComponent);
app.component('gacha-log',           GachaLogComponent);
app.component('strategy-memo',       StrategyMemoComponent);
app.component('event-log',           EventLogComponent);
app.component('team-composition',    TeamCompositionComponent);
app.component('material-management', MaterialManagementComponent);

app.mount('#app');
