// ============================================================
//  components/GachaSimulator.js  —  ガチャシミュレーター
// ============================================================
//
//  通常募集 (恒常ガチャ) の排出率:
//    ★3 = 3.0%
//    ★2 = 18.5%
//    ★1 = 78.5%
//
//  生徒マスターからレアリティ別にランダム抽選。
//  ★1の生徒マスターが無い場合は "???" 表示。
// ============================================================

const GACHA_RATES = {
  three: 0.03,
  two:   0.185,
  // one  = 1 - (three + two) = 0.785
};

const PULL_COST = 120;       // 1連あたりの青輝石
const PITY_CEILING = 200;    // 天井 (参考表示用)

const GachaSimulatorComponent = {
  inject: ['store'],

  template: `
    <div class="sim-container">

      <!-- ── ヘッダー ── -->
      <div class="sim-header">
        <div>
          <h2 class="sim-title">通常募集シミュレーター</h2>
          <div class="sim-subtitle">恒常ガチャの排出率で抽選します</div>
        </div>
        <div class="sim-prob-display">
          <span class="sim-prob sim-prob-3">★★★ 3.0%</span>
          <span class="sim-prob sim-prob-2">★★ 18.5%</span>
          <span class="sim-prob sim-prob-1">★ 78.5%</span>
        </div>
      </div>

      <!-- ── 統計カード ── -->
      <div class="sim-stat-grid">
        <div class="sim-stat">
          <div class="sim-stat-label">総ガチャ数</div>
          <div class="sim-stat-value">{{ stats.total.toLocaleString() }} 回</div>
        </div>
        <div class="sim-stat">
          <div class="sim-stat-label">★3 排出</div>
          <div class="sim-stat-value">{{ stats.threeStars }} 体</div>
        </div>
        <div class="sim-stat">
          <div class="sim-stat-label">★3 排出率</div>
          <div class="sim-stat-value">{{ threeStarRate }}%</div>
        </div>
        <div class="sim-stat">
          <div class="sim-stat-label">★2 排出</div>
          <div class="sim-stat-value">{{ stats.twoStars }} 体</div>
        </div>
        <div class="sim-stat">
          <div class="sim-stat-label">★3 から</div>
          <div class="sim-stat-value">{{ stats.pity }} 回</div>
        </div>
        <div class="sim-stat">
          <div class="sim-stat-label">消費青輝石</div>
          <div class="sim-stat-value">{{ pyroxeneUsed.toLocaleString() }}</div>
        </div>
      </div>

      <!-- ── ピティバー (200連天井参考) ── -->
      <div class="sim-pity">
        <div class="sim-pity-label">
          <span>連続非★3カウント</span>
          <span>{{ stats.pity }} / {{ pityCeiling }}</span>
        </div>
        <div class="pity-bar">
          <div class="pity-fill"
            :class="{ warning: stats.pity >= 120, danger: stats.pity >= 170 }"
            :style="{ width: Math.min(100, stats.pity / pityCeiling * 100) + '%' }">
          </div>
        </div>
        <div class="sim-pity-ticks">
          <span>0</span><span>50</span><span>100</span><span>150</span><span>200</span>
        </div>
      </div>

      <!-- ── ボタン ── -->
      <div class="sim-actions">
        <button class="sim-pull-btn sim-pull-btn-single" :disabled="isRolling" @click="pull1">
          <div class="sim-pull-btn-main">1連</div>
          <div class="sim-pull-btn-sub">青輝石 {{ PULL_COST }}</div>
        </button>
        <button class="sim-pull-btn sim-pull-btn-ten" :disabled="isRolling" @click="pull10">
          <div class="sim-pull-btn-main">10連</div>
          <div class="sim-pull-btn-sub">青輝石 {{ (PULL_COST * 10).toLocaleString() }}</div>
        </button>
        <button class="sim-pull-btn sim-pull-btn-reset" :disabled="isRolling" @click="reset">
          <div class="sim-pull-btn-main">リセット</div>
          <div class="sim-pull-btn-sub">統計を初期化</div>
        </button>
      </div>

      <!-- ── 結果表示 ── -->
      <div v-if="latestPulls.length > 0" class="sim-results">
        <div class="sim-results-header">
          <h3 class="sim-results-title">最新の結果</h3>
          <div class="sim-results-summary">
            <span v-if="latestThreeStarCount > 0" class="sim-pop-3">★3 × {{ latestThreeStarCount }}</span>
            <span v-if="latestTwoStarCount > 0" class="sim-pop-2">★2 × {{ latestTwoStarCount }}</span>
          </div>
        </div>
        <div class="sim-result-grid">
          <div v-for="(p, i) in latestPulls" :key="i"
            class="sim-result-card"
            :class="'sim-result-card-' + p.rarity">
            <div class="sim-result-stars">{{ '★'.repeat(p.rarity) }}</div>
            <div class="sim-result-name">{{ p.name }}</div>
            <div v-if="p.school" class="sim-result-school">{{ p.school }}</div>
          </div>
        </div>
      </div>

      <!-- ── 排出履歴 (セッション内ログ) ── -->
      <div v-if="threeStarLog.length > 0" class="sim-log">
        <h3 class="sim-log-title">★3 排出履歴 (セッション)</h3>
        <div class="sim-log-list">
          <div v-for="(item, i) in threeStarLog" :key="i" class="sim-log-item">
            <span class="sim-log-pull">#{{ item.pullNo }}</span>
            <span class="sim-log-name">{{ item.name }}</span>
            <span v-if="item.school" class="sim-log-school">{{ item.school }}</span>
          </div>
        </div>
      </div>

    </div>
  `,

  data() {
    return {
      PULL_COST,
      pityCeiling: PITY_CEILING,
      latestPulls: [],
      threeStarLog: [],   // セッション中の★3 排出履歴
      stats: {
        total: 0,
        threeStars: 0,
        twoStars: 0,
        oneStars: 0,
        pity: 0,
      },
      isRolling: false,
    };
  },

  computed: {
    threeStarRate() {
      if (this.stats.total === 0) return '0.00';
      return (this.stats.threeStars / this.stats.total * 100).toFixed(2);
    },
    pyroxeneUsed() {
      return this.stats.total * PULL_COST;
    },
    latestThreeStarCount() {
      return this.latestPulls.filter(p => p.rarity === 3).length;
    },
    latestTwoStarCount() {
      return this.latestPulls.filter(p => p.rarity === 2).length;
    },
  },

  methods: {
    // 1回分の抽選 (内部関数)
    rollOne() {
      const r = Math.random();
      let rarity;
      if (r < GACHA_RATES.three) rarity = 3;
      else if (r < GACHA_RATES.three + GACHA_RATES.two) rarity = 2;
      else rarity = 1;

      // ピティ (連続非★3カウント) 更新
      if (rarity === 3) {
        this.stats.pity = 0;
      } else {
        this.stats.pity++;
      }

      // レアリティ別に生徒マスターから無作為抽出
      const candidates = this.store.students.filter(s => s.rarity === rarity);
      let name   = '???';
      let school = '';
      if (candidates.length > 0) {
        const picked = candidates[Math.floor(Math.random() * candidates.length)];
        name   = picked.name;
        school = picked.school;
      } else if (rarity === 1) {
        // ★1の生徒マスターが未登録の場合は汎用ラベル
        name = '★1 生徒';
      }

      // 統計加算
      this.stats.total++;
      if (rarity === 3) {
        this.stats.threeStars++;
        this.threeStarLog.unshift({ pullNo: this.stats.total, name, school });
      } else if (rarity === 2) {
        this.stats.twoStars++;
      } else {
        this.stats.oneStars++;
      }

      return { rarity, name, school };
    },

    pull1() {
      if (this.isRolling) return;
      this.isRolling = true;
      this.latestPulls = [this.rollOne()];
      this.$nextTick(() => { this.isRolling = false; });
    },

    pull10() {
      if (this.isRolling) return;
      this.isRolling = true;
      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(this.rollOne());
      }
      // ★3を後ろに寄せて演出感を出す (ソートはせず元順序維持)
      this.latestPulls = results;
      this.$nextTick(() => { this.isRolling = false; });
    },

    reset() {
      if (this.stats.total > 0 && !confirm('セッション統計をリセットしますか？')) return;
      this.stats = { total: 0, threeStars: 0, twoStars: 0, oneStars: 0, pity: 0 };
      this.latestPulls = [];
      this.threeStarLog = [];
      this.store.showToast('リセットしました', 'info');
    },
  },
};
