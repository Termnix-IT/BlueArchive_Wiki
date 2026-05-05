// ============================================================
//  components/MaterialManagement.js  —  素材管理
// ============================================================

const MaterialManagementComponent = {
  inject: ['store'],
  template: `
    <div>
      <!-- 追加/編集フォーム -->
      <div class="collapsible-form">
        <div class="event-form-toggle" @click="toggleForm">
          <span class="form-toggle-title">{{ editingMaterial ? '素材を編集' : '素材を追加' }}</span>
          <span class="form-toggle-mark">{{ showForm ? '閉じる ▲' : '開く ▼' }}</span>
        </div>
        <div v-if="showForm" style="margin-top:12px">
          <div class="form-grid">
            <div class="form-group">
              <label>素材名 *</label>
              <input type="text" v-model="form.name" placeholder="例: 活動報告・スーパードラゴン">
            </div>
            <div class="form-group">
              <label>カテゴリ</label>
              <select v-model="form.type">
                <option v-for="t in MATERIAL_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>在庫数</label>
              <input type="number" v-model.number="form.quantity" min="0">
            </div>
            <div class="form-group">
              <label>メモ</label>
              <input type="text" v-model="form.notes" placeholder="任意のメモ">
            </div>
          </div>
          <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
            <button class="btn-secondary-modal" @click="cancelForm">キャンセル</button>
            <button class="btn-primary" @click="saveMaterialForm">保存</button>
          </div>
        </div>
      </div>

      <!-- 素材一覧テーブル -->
      <div style="overflow-x:auto;margin-bottom:24px;margin-top:14px">
        <table class="data-table" style="width:100%">
          <thead>
            <tr>
              <th style="text-align:left">素材名</th>
              <th style="text-align:left">カテゴリ</th>
              <th style="text-align:center">在庫</th>
              <th style="text-align:right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="mat in filteredMaterials" :key="mat.id">
              <td style="font-weight:700">
                {{ mat.name }}
                <span v-if="mat.notes" class="mat-note">{{ mat.notes }}</span>
              </td>
              <td>
                <span class="badge badge-mat-type">{{ typeLabel(mat.type) }}</span>
              </td>
              <td style="text-align:center">
                <div class="qty-control">
                  <button class="qty-btn" @click="adjustQuantity(mat, -1)" :disabled="mat.quantity <= 0">−</button>
                  <span class="qty-value">{{ mat.quantity }}</span>
                  <button class="qty-btn" @click="adjustQuantity(mat, 1)">+</button>
                </div>
              </td>
              <td style="text-align:right;white-space:nowrap">
                <button class="btn-edit" @click="editMaterial(mat)">編集</button>
                <button class="btn-edit btn-danger" style="margin-left:4px" @click="removeMaterial(mat)">削除</button>
              </td>
            </tr>
            <tr v-if="filteredMaterials.length === 0">
              <td colspan="4">
                <div class="empty-state" style="padding:30px 20px">
                  <div class="empty-state-mark">該当なし</div>
                  <div class="empty-state-msg">素材が登録されていません</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 生徒別必要素材 -->
      <div class="collapsible-form">
        <div class="event-form-toggle" @click="showStudentNeeds = !showStudentNeeds">
          <span class="form-toggle-title">生徒別必要素材</span>
          <span class="form-toggle-mark">
            <span v-if="shortageList.length > 0" class="shortage-warn">⚠ {{ shortageList.length }} 件不足</span>
            {{ showStudentNeeds ? '閉じる ▲' : '開く ▼' }}
          </span>
        </div>
        <div v-if="showStudentNeeds" style="margin-top:12px">
          <div v-if="studentNeedsList.length === 0" class="need-empty">
            生徒の詳細編集から必要素材を設定してください
          </div>
          <table v-else class="data-table" style="width:100%">
            <thead>
              <tr>
                <th style="text-align:left">生徒</th>
                <th style="text-align:left">素材</th>
                <th style="text-align:center">必要</th>
                <th style="text-align:center">在庫</th>
                <th style="text-align:center">過不足</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in studentNeedsList" :key="row.studentId + '-' + row.materialId"
                :class="{ 'shortage-row': row.diff < 0 }">
                <td style="font-weight:700">{{ row.studentName }}</td>
                <td>{{ row.materialName }}</td>
                <td style="text-align:center">{{ row.needed }}</td>
                <td style="text-align:center">{{ row.stock }}</td>
                <td style="text-align:center" :class="row.diff < 0 ? 'diff-neg' : 'diff-pos'">
                  {{ row.diff >= 0 ? '+' + row.diff : row.diff }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,

  data() {
    return {
      showForm: false,
      editingMaterial: null,
      form: this.initForm(),
      showStudentNeeds: false,
    };
  },

  computed: {
    filteredMaterials() {
      const f = this.store.materialFilter;
      return this.store.materials.filter(m => {
        if (f.type && m.type !== f.type) return false;
        if (f.name && !m.name.toLowerCase().includes(f.name.toLowerCase())) return false;
        return true;
      });
    },

    studentNeedsList() {
      const rows = [];
      for (const student of this.store.students) {
        const needs = student.neededMaterials || [];
        for (const need of needs) {
          const mat = this.store.materials.find(m => m.id === need.materialId);
          const stock = mat ? (mat.quantity || 0) : 0;
          rows.push({
            studentId:    student.id,
            studentName:  student.name,
            materialId:   need.materialId,
            materialName: need.materialName || (mat ? mat.name : '不明'),
            needed:       need.quantity || 0,
            stock,
            diff:         stock - (need.quantity || 0),
          });
        }
      }
      return rows.sort((a, b) => a.diff - b.diff);
    },

    shortageList() {
      return this.studentNeedsList.filter(r => r.diff < 0);
    },
  },

  methods: {
    initForm() {
      return { name: '', type: 'skill', quantity: 0, notes: '' };
    },

    toggleForm() {
      if (this.showForm && !this.editingMaterial) {
        this.showForm = false;
      } else if (!this.showForm) {
        this.showForm = true;
      }
    },

    editMaterial(mat) {
      this.editingMaterial = mat;
      this.form = { name: mat.name, type: mat.type, quantity: mat.quantity || 0, notes: mat.notes || '' };
      this.showForm = true;
    },

    cancelForm() {
      this.showForm = false;
      this.editingMaterial = null;
      this.form = this.initForm();
    },

    async saveMaterialForm() {
      if (!this.form.name.trim()) {
        this.store.showToast('素材名を入力してください', 'error');
        return;
      }
      const data = { ...this.form };
      if (this.editingMaterial) data.id = this.editingMaterial.id;
      await saveMaterial(data);
      await this.store.loadMaterials();
      this.store.showToast('保存しました', 'success');
      this.cancelForm();
    },

    async removeMaterial(mat) {
      if (!confirm(`「${mat.name}」を削除しますか？`)) return;
      await deleteMaterial(mat.id);
      await this.store.loadMaterials();
      this.store.showToast('削除しました', 'info');
    },

    async adjustQuantity(mat, delta) {
      const newQty = Math.max(0, (mat.quantity || 0) + delta);
      await saveMaterial({ ...mat, quantity: newQty });
      await this.store.loadMaterials();
    },

    typeLabel(value) {
      const t = MATERIAL_TYPES.find(t => t.value === value);
      return t ? t.label : value;
    },
  },
};
