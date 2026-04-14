// ============================================================
//  components/TeamComposition.js  —  チーム編成管理
// ============================================================

const TeamCompositionComponent = {
  inject: ['store'],
  template: `
    <div>
      <!-- 追加/編集フォーム -->
      <div class="gacha-panel" style="margin-bottom:1rem">
        <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem;cursor:pointer"
          @click="toggleForm">
          <h3 style="margin:0;font-size:0.95rem">{{ showForm ? '▼' : '▶' }} {{ editingTeam ? 'チームを編集' : 'チームを追加' }}</h3>
        </div>
        <div v-if="showForm">
          <div class="form-grid">
            <div class="form-group">
              <label>編成名 *</label>
              <input type="text" v-model="form.name" placeholder="例: ゴズ Insane 用">
            </div>
            <div class="form-group">
              <label>用途</label>
              <select v-model="form.purpose">
                <option v-for="p in TEAM_PURPOSES" :key="p.value" :value="p.value">{{ p.label }}</option>
              </select>
            </div>

            <!-- ストライカー選択 -->
            <div class="form-group full-width">
              <label>ストライカー（最大4名）</label>
              <div style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.4rem">
                <span v-for="sid in form.strikers" :key="'st-'+sid"
                  class="member-tag member-tag-striker">
                  {{ studentName(sid) }}
                  <span class="member-tag-remove" @click="removeMember('strikers', sid)">✕</span>
                </span>
                <button v-if="form.strikers.length < 4" class="btn-edit"
                  style="font-size:0.8rem;padding:0.2rem 0.5rem"
                  @click="openMemberModal('strikers')">+ 追加</button>
                <span v-if="form.strikers.length === 0" style="color:#aaa;font-size:0.85rem">未選択</span>
              </div>
            </div>

            <!-- スペシャル選択 -->
            <div class="form-group full-width">
              <label>スペシャル（最大2名）</label>
              <div style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.4rem">
                <span v-for="sid in form.specials" :key="'sp-'+sid"
                  class="member-tag member-tag-special">
                  {{ studentName(sid) }}
                  <span class="member-tag-remove" @click="removeMember('specials', sid)">✕</span>
                </span>
                <button v-if="form.specials.length < 2" class="btn-edit"
                  style="font-size:0.8rem;padding:0.2rem 0.5rem"
                  @click="openMemberModal('specials')">+ 追加</button>
                <span v-if="form.specials.length === 0" style="color:#aaa;font-size:0.85rem">未選択</span>
              </div>
            </div>

            <!-- メモ -->
            <div class="form-group full-width">
              <label>メモ・攻略ポイント</label>
              <textarea v-model="form.notes" rows="3" placeholder="立ち回りや注意点など..."></textarea>
            </div>
          </div>
          <div style="display:flex;gap:0.5rem;justify-content:flex-end;margin-top:0.5rem">
            <button class="btn-secondary-modal" @click="cancelForm">キャンセル</button>
            <button class="btn-primary" @click="saveTeamForm">保存</button>
          </div>
        </div>
      </div>

      <!-- フィルターバー -->
      <div class="filter-bar" style="margin-bottom:1rem">
        <select v-model="filter.purpose" style="min-width:130px">
          <option value="">すべての用途</option>
          <option v-for="p in TEAM_PURPOSES" :key="p.value" :value="p.value">{{ p.label }}</option>
        </select>
        <input type="text" v-model="filter.name" placeholder="編成名で検索" style="min-width:160px">
        <span style="font-size:0.8rem;color:#888">{{ filteredTeams.length }} 件</span>
      </div>

      <!-- チームカードグリッド -->
      <div class="event-grid">
        <div v-for="team in filteredTeams" :key="team.id"
          class="event-card team-card">
          <!-- ヘッダー -->
          <div class="event-card-header" style="margin-bottom:0.5rem">
            <span class="event-name">{{ team.name }}</span>
            <span class="badge" :class="'badge-purpose-' + team.purpose">
              {{ purposeLabel(team.purpose) }}
            </span>
          </div>

          <!-- ストライカー -->
          <div style="margin-bottom:0.3rem">
            <span style="font-size:0.75rem;color:#888;font-weight:600">ST: </span>
            <span v-if="teamStudents(team.strikers).length === 0" style="font-size:0.8rem;color:#aaa">未設定</span>
            <span v-for="s in teamStudents(team.strikers)" :key="s.id"
              class="member-chip member-chip-striker" :title="s.school + ' / ' + s.role">
              {{ s.name }}
            </span>
          </div>

          <!-- スペシャル -->
          <div style="margin-bottom:0.5rem">
            <span style="font-size:0.75rem;color:#888;font-weight:600">SP: </span>
            <span v-if="teamStudents(team.specials).length === 0" style="font-size:0.8rem;color:#aaa">未設定</span>
            <span v-for="s in teamStudents(team.specials)" :key="s.id"
              class="member-chip member-chip-special" :title="s.school + ' / ' + s.role">
              {{ s.name }}
            </span>
          </div>

          <!-- メモ -->
          <div v-if="team.notes" style="font-size:0.8rem;color:#666;border-top:1px solid #eee;padding-top:0.4rem;margin-bottom:0.5rem;white-space:pre-wrap">
            {{ team.notes }}
          </div>

          <!-- 操作ボタン -->
          <div style="display:flex;gap:0.4rem;justify-content:flex-end">
            <button class="btn-edit" @click="editTeam(team)">編集</button>
            <button class="btn-edit btn-danger" @click="removeTeam(team)">削除</button>
          </div>
        </div>

        <div v-if="filteredTeams.length === 0"
          style="text-align:center;color:#aaa;padding:3rem;grid-column:1/-1">
          編成が登録されていません
        </div>
      </div>

      <!-- メンバー選択モーダル -->
      <div v-if="showMemberModal" class="modal-overlay" @click.self="showMemberModal = false">
        <div class="modal-box" style="max-width:500px">
          <div class="modal-header">
            <h2>{{ selectingFor === 'strikers' ? 'ストライカーを選択' : 'スペシャルを選択' }}</h2>
            <button class="modal-close" @click="showMemberModal = false">✕</button>
          </div>
          <div style="margin-bottom:0.5rem">
            <input type="text" v-model="memberSearch" placeholder="名前で検索" style="width:100%">
          </div>
          <div style="max-height:400px;overflow-y:auto">
            <!-- 所持生徒を上部に表示 -->
            <div v-for="s in filteredModalStudents" :key="s.id"
              class="member-select-row"
              :class="{ selected: isSelected(s.id), disabled: isDisabled(s.id) }"
              @click="toggleMember(s.id)">
              <span style="flex:1;font-weight:600">{{ s.name }}</span>
              <span style="font-size:0.75rem;color:#888">{{ s.school }}</span>
              <span class="badge" :class="'badge-' + s.position === 'striker' ? 'badge-striker' : 'badge-special-pos'"
                style="margin-left:0.3rem;font-size:0.7rem">
                {{ s.position === 'striker' ? 'ST' : 'SP' }}
              </span>
              <span v-if="!s.owned" style="font-size:0.75rem;color:#aaa;margin-left:0.3rem">未所持</span>
              <span v-if="isSelected(s.id)" style="color:#10b981;margin-left:0.3rem">✓</span>
            </div>
            <div v-if="filteredModalStudents.length === 0" style="text-align:center;color:#aaa;padding:2rem">
              該当する生徒がいません
            </div>
          </div>
          <div class="modal-footer">
            <span style="flex:1;font-size:0.85rem;color:#888">
              {{ selectingFor === 'strikers' ? form.strikers.length + '/4' : form.specials.length + '/2' }} 名選択中
            </span>
            <button class="btn-primary" @click="showMemberModal = false">完了</button>
          </div>
        </div>
      </div>
    </div>
  `,

  data() {
    return {
      showForm: false,
      editingTeam: null,
      form: this.initForm(),
      filter: { purpose: '', name: '' },
      showMemberModal: false,
      selectingFor: 'strikers',
      memberSearch: '',
    };
  },

  computed: {
    filteredTeams() {
      return this.store.teams.filter(t => {
        if (this.filter.purpose && t.purpose !== this.filter.purpose) return false;
        if (this.filter.name && !t.name.includes(this.filter.name)) return false;
        return true;
      });
    },

    filteredModalStudents() {
      const keyword = this.memberSearch.toLowerCase();
      const all = [...this.store.students].sort((a, b) => {
        if (a.owned !== b.owned) return a.owned ? -1 : 1;
        return (a.name || '').localeCompare(b.name || '');
      });
      return keyword ? all.filter(s => s.name.toLowerCase().includes(keyword)) : all;
    },
  },

  methods: {
    initForm() {
      return { name: '', purpose: 'total_assault', strikers: [], specials: [], notes: '' };
    },

    toggleForm() {
      if (this.showForm && !this.editingTeam) {
        this.showForm = false;
      } else if (!this.showForm) {
        this.showForm = true;
      }
    },

    editTeam(team) {
      this.editingTeam = team;
      this.form = {
        name: team.name,
        purpose: team.purpose,
        strikers: [...(team.strikers || [])],
        specials: [...(team.specials || [])],
        notes: team.notes || '',
      };
      this.showForm = true;
    },

    cancelForm() {
      this.showForm = false;
      this.editingTeam = null;
      this.form = this.initForm();
    },

    async saveTeamForm() {
      if (!this.form.name.trim()) {
        this.store.showToast('編成名を入力してください', 'error');
        return;
      }
      const data = { ...this.form };
      if (this.editingTeam) data.id = this.editingTeam.id;
      await saveTeam(data);
      await this.store.loadTeams();
      this.store.showToast('保存しました', 'success');
      this.cancelForm();
    },

    async removeTeam(team) {
      if (!confirm(`「${team.name}」を削除しますか？`)) return;
      await deleteTeam(team.id);
      await this.store.loadTeams();
      this.store.showToast('削除しました', 'info');
    },

    openMemberModal(type) {
      this.selectingFor = type;
      this.memberSearch = '';
      this.showMemberModal = true;
    },

    toggleMember(studentId) {
      const list = this.form[this.selectingFor];
      const idx = list.indexOf(studentId);
      if (idx >= 0) {
        list.splice(idx, 1);
      } else {
        const limit = this.selectingFor === 'strikers' ? 4 : 2;
        if (list.length >= limit) {
          this.store.showToast(`${this.selectingFor === 'strikers' ? 'ストライカー' : 'スペシャル'}は最大${limit}名です`, 'error');
          return;
        }
        list.push(studentId);
      }
    },

    removeMember(type, studentId) {
      const list = this.form[type];
      const idx = list.indexOf(studentId);
      if (idx >= 0) list.splice(idx, 1);
    },

    isSelected(studentId) {
      return this.form[this.selectingFor].includes(studentId);
    },

    isDisabled(studentId) {
      const other = this.selectingFor === 'strikers' ? this.form.specials : this.form.strikers;
      return other.includes(studentId);
    },

    studentName(id) {
      const s = this.store.students.find(s => s.id === id);
      return s ? s.name : '不明';
    },

    teamStudents(ids) {
      if (!ids) return [];
      return ids.map(id => this.store.students.find(s => s.id === id)).filter(Boolean);
    },

    purposeLabel(value) {
      const p = TEAM_PURPOSES.find(p => p.value === value);
      return p ? p.label : value;
    },
  },
};
