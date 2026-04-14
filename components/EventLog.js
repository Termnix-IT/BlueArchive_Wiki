// ============================================================
//  components/EventLog.js  —  イベント / ストーリー記録
// ============================================================

const EventLogComponent = {
  inject: ['store'],
  template: `
    <div>
      <!-- 追加フォーム -->
      <div class="gacha-panel" style="margin-bottom:1rem">
        <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem;cursor:pointer"
          @click="showForm = !showForm">
          <h3 style="margin:0;font-size:0.95rem">{{ showForm ? '▼' : '▶' }} イベントを追加</h3>
        </div>
        <div v-if="showForm">
          <div class="form-grid">
            <div class="form-group">
              <label>イベント名 *</label>
              <input type="text" v-model="form.eventName" placeholder="例: ハナコとフユウの学生たち">
            </div>
            <div class="form-group">
              <label>種類</label>
              <select v-model="form.type">
                <option v-for="t in EVENT_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>開始日</label>
              <input type="date" v-model="form.startDate">
            </div>
            <div class="form-group">
              <label>終了日</label>
              <input type="date" v-model="form.endDate">
            </div>
            <div class="form-group full-width">
              <label>メモ</label>
              <input type="text" v-model="form.notes" placeholder="復刻・感想など">
            </div>
          </div>
          <div style="display:flex;gap:0.5rem;margin-top:0.75rem;justify-content:flex-end">
            <button class="btn-secondary-modal" @click="resetForm">キャンセル</button>
            <button class="btn-primary" @click="addEvent">追加</button>
          </div>
        </div>
      </div>

      <!-- フィルター -->
      <div class="filter-bar" style="margin-bottom:1rem">
        <select v-model="filter.type">
          <option value="">全種類</option>
          <option v-for="t in EVENT_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select>
        <select v-model="filter.status">
          <option value="">全ステータス</option>
          <option value="cleared">クリア済み</option>
          <option value="partial">一部完了</option>
          <option value="none">未完了</option>
        </select>
        <input type="text" v-model="filter.name" placeholder="名前で検索">
        <span style="font-size:0.8rem;color:#888">{{ filteredEvents.length }} 件</span>
      </div>

      <!-- カードグリッド -->
      <div class="event-grid">
        <div v-for="ev in filteredEvents" :key="ev.id"
          class="event-card" :class="'status-' + eventStatus(ev)">
          <div class="event-card-header">
            <div class="event-name">{{ ev.eventName }}</div>
            <span class="badge" :class="'badge-' + ev.type">{{ typeLabel(ev.type) }}</span>
          </div>
          <div class="event-dates">
            {{ ev.startDate || '?' }} 〜 {{ ev.endDate || '?' }}
            <span v-if="daysRemaining(ev) !== null"
              :style="{ color: daysRemaining(ev) >= 0 ? '#e67e22' : '#aaa' }">
              （{{ daysRemaining(ev) >= 0 ? daysRemaining(ev) + '日残' : Math.abs(daysRemaining(ev)) + '日前終了' }}）
            </span>
          </div>
          <div class="event-checks">
            <label class="event-check">
              <input type="checkbox" :checked="ev.cleared" @change="toggle(ev, 'cleared')">
              クリア
            </label>
            <label class="event-check">
              <input type="checkbox" :checked="ev.storyRead" @change="toggle(ev, 'storyRead')">
              ストーリー読了
            </label>
            <label class="event-check">
              <input type="checkbox" :checked="ev.rewardsClaimed" @change="toggle(ev, 'rewardsClaimed')">
              報酬回収
            </label>
          </div>
          <div v-if="ev.notes" style="margin-top:0.4rem;font-size:0.8rem;color:#777;font-style:italic">
            {{ ev.notes }}
          </div>
          <div class="event-actions">
            <button class="btn-edit btn-danger" style="font-size:0.75rem;padding:0.2rem 0.4rem"
              @click="deleteEv(ev.id)">削除</button>
          </div>
        </div>

        <div v-if="filteredEvents.length === 0" style="grid-column:1/-1;text-align:center;color:#aaa;padding:3rem">
          イベントの記録がありません
        </div>
      </div>
    </div>
  `,

  data() {
    const today = new Date().toISOString().split('T')[0];
    return {
      showForm: false,
      form: {
        eventName: '', type: 'story', startDate: today, endDate: '', notes: '',
        cleared: false, storyRead: false, rewardsClaimed: false,
      },
      filter: { type: '', status: '', name: '' },
    };
  },

  computed: {
    filteredEvents() {
      return this.store.events.filter(ev => {
        if (this.filter.type && ev.type !== this.filter.type) return false;
        if (this.filter.name && !ev.eventName.includes(this.filter.name)) return false;
        if (this.filter.status) {
          const s = this.eventStatus(ev);
          if (s !== this.filter.status) return false;
        }
        return true;
      });
    },
  },

  methods: {
    async addEvent() {
      if (!this.form.eventName.trim()) {
        this.store.showToast('イベント名を入力してください', 'error'); return;
      }
      await saveEvent({ ...this.form });
      await this.store.loadEvents();
      this.resetForm();
      this.showForm = false;
      this.store.showToast('追加しました', 'success');
    },

    async toggle(ev, field) {
      const updated = { ...ev, [field]: !ev[field] };
      await saveEvent(updated);
      await this.store.loadEvents();
    },

    async deleteEv(id) {
      if (!confirm('このイベント記録を削除しますか？')) return;
      await deleteEvent(id);
      await this.store.loadEvents();
      this.store.showToast('削除しました', 'info');
    },

    resetForm() {
      const today = new Date().toISOString().split('T')[0];
      this.form = { eventName: '', type: 'story', startDate: today, endDate: '', notes: '',
                    cleared: false, storyRead: false, rewardsClaimed: false };
    },

    eventStatus(ev) {
      const done = [ev.cleared, ev.storyRead, ev.rewardsClaimed].filter(Boolean).length;
      if (done === 3) return 'cleared';
      if (done > 0)  return 'partial';
      return 'none';
    },

    typeLabel(type) {
      const t = EVENT_TYPES.find(t => t.value === type);
      return t ? t.label : type;
    },

    daysRemaining(ev) {
      if (!ev.endDate) return null;
      const end  = new Date(ev.endDate);
      const now  = new Date();
      const diff = Math.floor((end - now) / (1000 * 60 * 60 * 24));
      return diff;
    },
  },
};
