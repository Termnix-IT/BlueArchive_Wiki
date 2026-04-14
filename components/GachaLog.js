// ============================================================
//  components/GachaLog.js  —  ガチャ記録 & ピティトラッカー
// ============================================================

const GachaLogComponent = {
  inject: ['store'],
  template: `
    <div>
      <div class="gacha-layout">
        <!-- 左カラム: 追加フォーム + 統計 -->
        <div style="display:flex;flex-direction:column;gap:1rem">

          <!-- 追加フォーム -->
          <div class="gacha-panel">
            <h3>ガチャを記録</h3>
            <div style="display:flex;flex-direction:column;gap:0.5rem">
              <div class="form-group">
                <label>日付</label>
                <input type="date" v-model="form.date">
              </div>
              <div class="form-group">
                <label>バナー名</label>
                <input type="text" v-model="form.banner" placeholder="例: ホシノPickup" list="banner-history">
                <datalist id="banner-history">
                  <option v-for="b in bannerList" :key="b" :value="b">{{ b }}</option>
                </datalist>
              </div>
              <div class="form-group">
                <label>入手した生徒</label>
                <input type="text" v-model="form.studentName" placeholder="ハズレの場合は空欄" list="student-names">
                <datalist id="student-names">
                  <option v-for="s in store.students" :key="s.id" :value="s.name">{{ s.name }}</option>
                </datalist>
              </div>
              <div class="form-group">
                <label>レアリティ</label>
                <select v-model.number="form.rarity">
                  <option :value="3">★★★ (3星)</option>
                  <option :value="2">★★ (2星)</option>
                  <option :value="1">★ (1星)</option>
                </select>
              </div>
              <div class="form-group">
                <label>石種別</label>
                <select v-model="form.cost">
                  <option value="paid">有料石</option>
                  <option value="free">無料石</option>
                  <option value="event">イベント石</option>
                </select>
              </div>
              <div class="form-group">
                <label>
                  <input type="checkbox" v-model="form.isNew"> 新規入手（初めての1枚）
                </label>
              </div>
              <button class="btn-primary" @click="addPull" style="margin-top:0.25rem">記録する</button>
            </div>
          </div>

          <!-- ピティ統計 -->
          <div class="gacha-panel">
            <h3>ピティカウンター</h3>
            <div v-if="gachaStats.total === 0" style="color:#aaa;font-size:0.85rem">
              記録がありません
            </div>
            <template v-else>
              <div style="font-size:0.85rem;margin-bottom:0.5rem">
                <strong>現在のカウント: {{ gachaStats.pityCount }} / 80</strong>
              </div>
              <div class="pity-bar">
                <div class="pity-fill"
                  :class="{ warning: gachaStats.pityCount >= 60, danger: gachaStats.pityCount >= 70 }"
                  :style="{ width: (gachaStats.pityCount / 80 * 100) + '%' }">
                </div>
              </div>
              <div v-if="gachaStats.pityCount >= 60" style="font-size:0.8rem;color:#f39c12;margin-top:0.25rem">
                ⚠️ ピティが近づいています
              </div>

              <div style="margin-top:0.75rem">
                <div class="stat-row">
                  <span class="stat-label">総ガチャ数</span>
                  <span class="stat-value">{{ gachaStats.total }} 回</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">3★排出数</span>
                  <span class="stat-value">{{ gachaStats.threeStarCount }} 体</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">3★排出率</span>
                  <span class="stat-value">{{ gachaStats.threeStarRate }}%</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">新規入手</span>
                  <span class="stat-value">{{ gachaStats.newCount }} 体</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">最後の3★から</span>
                  <span class="stat-value">{{ gachaStats.pityCount }} 回前</span>
                </div>
              </div>

              <!-- バナー別統計 -->
              <div v-if="bannerStats.length > 0" style="margin-top:0.75rem">
                <div style="font-size:0.8rem;font-weight:bold;margin-bottom:0.4rem;color:#666">バナー別</div>
                <div v-for="b in bannerStats.slice(0, 5)" :key="b.banner" class="stat-row">
                  <span class="stat-label" style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                    {{ b.banner }}
                  </span>
                  <span class="stat-value">{{ b.total }}回 / ★3:{{ b.threeStars }}</span>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- 右カラム: 履歴テーブル -->
        <div>
          <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.75rem">
            <h3 style="margin:0;font-size:0.95rem">ガチャ履歴</h3>
            <select v-model="historyFilter.rarity" style="padding:0.3rem;font-size:0.8rem;border-radius:4px;border:1px solid #ccc">
              <option value="">全レア</option>
              <option value="3">★★★のみ</option>
              <option value="2">★★のみ</option>
            </select>
            <input type="text" v-model="historyFilter.banner" placeholder="バナーで絞り込み"
              style="padding:0.3rem 0.5rem;font-size:0.8rem;border-radius:4px;border:1px solid #ccc;max-width:180px">
          </div>

          <div style="overflow-x:auto">
            <table class="data-table">
              <thead>
                <tr>
                  <th>日付</th>
                  <th>バナー</th>
                  <th>生徒</th>
                  <th>レア</th>
                  <th>石種</th>
                  <th>新規</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in filteredPulls" :key="p.id">
                  <td style="white-space:nowrap;font-size:0.85rem">{{ p.date }}</td>
                  <td style="font-size:0.85rem">{{ p.banner }}</td>
                  <td style="font-weight:{{ p.rarity === 3 ? 'bold' : 'normal' }}">
                    <span :style="{ color: p.rarity === 3 ? '#f5c518' : p.rarity === 2 ? '#aaa' : '#ccc' }">
                      {{ p.studentName || '—' }}
                    </span>
                  </td>
                  <td>
                    <span class="stars" style="font-size:0.8rem">{{ '★'.repeat(p.rarity) }}</span>
                  </td>
                  <td style="font-size:0.8rem">{{ costLabel(p.cost) }}</td>
                  <td style="text-align:center">{{ p.isNew ? '✨' : '' }}</td>
                  <td>
                    <button class="btn-edit btn-danger" style="font-size:0.75rem;padding:0.2rem 0.4rem" @click="deletePull(p.id)">削除</button>
                  </td>
                </tr>
                <tr v-if="filteredPulls.length === 0">
                  <td colspan="7" style="text-align:center;color:#aaa;padding:2rem">記録がありません</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,

  data() {
    const today = new Date().toISOString().split('T')[0];
    return {
      form: { date: today, banner: '', studentName: '', rarity: 3, cost: 'free', isNew: false },
      historyFilter: { rarity: '', banner: '' },
    };
  },

  computed: {
    filteredPulls() {
      return this.store.gacha.filter(p => {
        if (this.historyFilter.rarity && String(p.rarity) !== this.historyFilter.rarity) return false;
        if (this.historyFilter.banner && !p.banner.includes(this.historyFilter.banner)) return false;
        return true;
      });
    },

    gachaStats() {
      const pulls = this.store.gacha;
      const total = pulls.length;
      if (total === 0) return { total: 0, threeStarCount: 0, threeStarRate: '0.0', pityCount: 0, newCount: 0 };

      const threeStarCount = pulls.filter(p => p.rarity === 3).length;
      const threeStarRate  = ((threeStarCount / total) * 100).toFixed(1);
      const newCount       = pulls.filter(p => p.isNew).length;

      // ピティ: 最後の3★以降の引いた数
      let pityCount = 0;
      for (const p of pulls) { // pulls は新→旧順
        if (p.rarity === 3) break;
        pityCount++;
      }

      return { total, threeStarCount, threeStarRate, pityCount, newCount };
    },

    bannerList() {
      const set = new Set(this.store.gacha.map(p => p.banner).filter(Boolean));
      return [...set];
    },

    bannerStats() {
      const map = {};
      for (const p of this.store.gacha) {
        if (!p.banner) continue;
        if (!map[p.banner]) map[p.banner] = { banner: p.banner, total: 0, threeStars: 0 };
        map[p.banner].total++;
        if (p.rarity === 3) map[p.banner].threeStars++;
      }
      return Object.values(map).sort((a, b) => b.total - a.total);
    },
  },

  methods: {
    async addPull() {
      if (!this.form.date) {
        this.store.showToast('日付を入力してください', 'error'); return;
      }
      if (!this.form.banner.trim()) {
        this.store.showToast('バナー名を入力してください', 'error'); return;
      }
      await addGachaPull({ ...this.form });
      await this.store.loadGacha();
      this.form.studentName = '';
      this.form.rarity = 1;
      this.form.isNew = false;
      this.store.showToast('記録しました', 'success');
    },

    async deletePull(id) {
      if (!confirm('この記録を削除しますか？')) return;
      await deleteGachaPull(id);
      await this.store.loadGacha();
      this.store.showToast('削除しました', 'info');
    },

    costLabel(cost) {
      return { paid: '有料', free: '無料', event: 'イベント' }[cost] || cost;
    },
  },
};
