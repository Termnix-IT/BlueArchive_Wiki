// ============================================================
//  components/StudentDetail.js  —  生徒詳細編集モーダル
// ============================================================

const StudentDetailComponent = {
  inject: ['store'],
  template: `
    <div class="modal-overlay" @click.self="store.closeStudentDetail()">
      <div class="modal-box">
        <div class="scan-line"></div>
        <div class="modal-header">
          <h2>{{ isNew ? '生徒を新規登録' : '生徒情報 #' + (store.selectedStudentId || '?') }}</h2>
          <button class="modal-close" @click="store.closeStudentDetail()">×</button>
        </div>

        <div class="form-grid">

          <!-- 画像アップロード -->
          <div class="form-group full-width">
            <label>生徒画像</label>
            <div class="img-upload-area" @click="$refs.imgInput.click()">
              <img v-if="form.imageData" :src="form.imageData" class="img-preview">
              <div v-else class="img-upload-placeholder">
                <span class="img-upload-icon">＋</span>
                <span class="img-upload-text">クリックして画像を選択</span>
                <span class="img-upload-hint">JPG / PNG / WebP</span>
              </div>
            </div>
            <input type="file" ref="imgInput" accept="image/*" style="display:none" @change="handleImageUpload">
            <button v-if="form.imageData" class="btn-secondary-modal img-remove-btn"
              @click="form.imageData = ''">画像を削除</button>
          </div>

          <!-- 基本情報 -->
          <div class="form-group">
            <label>名前 *</label>
            <input type="text" v-model="form.name" placeholder="例: ホシノ">
          </div>
          <div class="form-group">
            <label>学校 *</label>
            <select v-model="form.school">
              <option value="">選択してください</option>
              <option v-for="s in SCHOOLS" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>ロール</label>
            <select v-model="form.role">
              <option v-for="r in ROLES" :key="r" :value="r">{{ r }}</option>
            </select>
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
            <label>攻撃タイプ</label>
            <select v-model="form.attackType">
              <option v-for="t in ATTACK_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>装甲タイプ</label>
            <select v-model="form.armorType">
              <option v-for="t in ARMOR_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>位置</label>
            <select v-model="form.position">
              <option value="striker">ストライカー</option>
              <option value="special">スペシャル</option>
            </select>
          </div>
          <div class="form-group">
            <label>所持</label>
            <select v-model="form.owned">
              <option :value="true">所持</option>
              <option :value="false">未所持</option>
            </select>
          </div>

          <!-- 育成情報 -->
          <div class="form-group">
            <label>星ランク (絆星)</label>
            <input type="number" v-model.number="form.starRank" min="1" max="8">
          </div>
          <div class="form-group">
            <label>絆レベル</label>
            <input type="number" v-model.number="form.bondLevel" min="1" max="100">
          </div>
          <div class="form-group">
            <label>固有武器レベル</label>
            <select v-model.number="form.uniqueWeaponLevel">
              <option :value="0">未解放</option>
              <option :value="1">Lv.1</option>
              <option :value="2">Lv.2</option>
              <option :value="3">Lv.3 (MAX)</option>
            </select>
          </div>

          <!-- スキルレベル -->
          <div class="form-group full-width">
            <label>スキルレベル</label>
            <div class="skill-grid">
              <div class="form-group">
                <label>EX</label>
                <input type="number" v-model.number="form.skillLevels.ex" min="1" max="5">
              </div>
              <div class="form-group">
                <label>通常</label>
                <input type="number" v-model.number="form.skillLevels.normal" min="1" max="10">
              </div>
              <div class="form-group">
                <label>パッシブ</label>
                <input type="number" v-model.number="form.skillLevels.passive" min="1" max="10">
              </div>
              <div class="form-group">
                <label>サブ</label>
                <input type="number" v-model.number="form.skillLevels.sub" min="1" max="10">
              </div>
            </div>
          </div>

          <!-- 装備レベル -->
          <div class="form-group full-width">
            <label>装備レベル</label>
            <div class="equip-grid">
              <div class="form-group">
                <label>装備①</label>
                <input type="number" v-model.number="form.equipmentLevels[0]" min="1" max="65">
              </div>
              <div class="form-group">
                <label>装備②</label>
                <input type="number" v-model.number="form.equipmentLevels[1]" min="1" max="65">
              </div>
              <div class="form-group">
                <label>装備③</label>
                <input type="number" v-model.number="form.equipmentLevels[2]" min="1" max="65">
              </div>
            </div>
          </div>

          <!-- メモ -->
          <div class="form-group full-width">
            <label>個人メモ</label>
            <textarea v-model="form.notes" rows="3" placeholder="育成優先度・感想など..."></textarea>
          </div>

          <!-- 必要素材 -->
          <div class="form-group full-width">
            <label>必要素材</label>
            <div v-if="store.materials.length === 0" class="need-empty">
              素材管理タブで素材を先に登録してください
            </div>
            <div v-else class="need-add-row">
              <select v-model="newNeedMaterialId" style="flex:1;min-width:140px">
                <option value="">素材を選択</option>
                <option v-for="m in store.materials" :key="m.id" :value="m.id">{{ m.name }}</option>
              </select>
              <input type="number" v-model.number="newNeedQuantity" min="1" style="width:80px" placeholder="数量">
              <button class="btn-edit" @click="addNeededMaterial">＋ 追加</button>
            </div>
            <div v-if="form.neededMaterials && form.neededMaterials.length > 0" class="need-list">
              <div v-for="(need, idx) in form.neededMaterials" :key="idx" class="need-list-row">
                <span class="need-list-name">{{ need.materialName }}</span>
                <span class="need-list-qty">× {{ need.quantity }}</span>
                <button class="need-list-remove" @click="removeNeededMaterial(idx)">×</button>
              </div>
            </div>
            <div v-else class="need-empty">必要素材なし</div>
          </div>
        </div>

        <div class="modal-footer">
          <button v-if="!isNew" class="btn-edit btn-danger" @click="confirmDelete">削除</button>
          <span style="flex:1"></span>
          <button class="btn-secondary-modal" @click="store.closeStudentDetail()">キャンセル</button>
          <button class="btn-primary" @click="save">保存</button>
        </div>
      </div>
    </div>
  `,

  data() {
    return {
      form: this.initForm(),
      newNeedMaterialId: '',
      newNeedQuantity: 1,
    };
  },

  computed: {
    isNew() {
      return !this.store.selectedStudentId;
    },
  },

  watch: {
    'store.selectedStudentId': {
      immediate: true,
      handler(id) {
        if (id) {
          const s = this.store.students.find(s => s.id === id);
          if (s) {
            this.form = {
              ...s,
              skillLevels: { ...{ ex:1, normal:1, passive:1, sub:1 }, ...(s.skillLevels || {}) },
              equipmentLevels: [...(s.equipmentLevels || [1,1,1])],
              neededMaterials: s.neededMaterials ? s.neededMaterials.map(n => ({ ...n })) : [],
              imageData: s.imageData || '',
            };
          }
        } else {
          this.form = this.initForm();
        }
      },
    },
  },

  methods: {
    initForm() {
      return {
        name: '',
        school: '',
        role: 'Attacker',
        rarity: 3,
        attackType: 'explosive',
        armorType: 'light',
        position: 'striker',
        owned: false,
        starRank: 1,
        bondLevel: 1,
        uniqueWeaponLevel: 0,
        skillLevels: { ex: 1, normal: 1, passive: 1, sub: 1 },
        equipmentLevels: [1, 1, 1],
        notes: '',
        neededMaterials: [],
        imageData: '',
        addedAt: new Date().toISOString().split('T')[0],
      };
    },

    handleImageUpload(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        this.resizeImage(ev.target.result, 300, 400, (resized) => {
          this.form.imageData = resized;
        });
      };
      reader.readAsDataURL(file);
      // 同じファイルを再選択できるようリセット
      e.target.value = '';
    },

    resizeImage(dataUrl, maxW, maxH, callback) {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        // アスペクト比を保ったまま maxW × maxH に収める
        const scale = Math.min(maxW / w, maxH / h, 1);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
        const canvas = document.createElement('canvas');
        canvas.width  = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        callback(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = dataUrl;
    },

    addNeededMaterial() {
      if (!this.newNeedMaterialId) {
        this.store.showToast('素材を選択してください', 'error');
        return;
      }
      const mat = this.store.materials.find(m => m.id === this.newNeedMaterialId);
      if (!mat) return;
      const already = (this.form.neededMaterials || []).findIndex(n => n.materialId === mat.id);
      if (already >= 0) {
        this.store.showToast('すでに追加済みです', 'error');
        return;
      }
      if (!this.form.neededMaterials) this.form.neededMaterials = [];
      this.form.neededMaterials.push({
        materialId:   mat.id,
        materialName: mat.name,
        quantity:     this.newNeedQuantity || 1,
      });
      this.newNeedMaterialId = '';
      this.newNeedQuantity = 1;
    },

    removeNeededMaterial(idx) {
      this.form.neededMaterials.splice(idx, 1);
    },

    async save() {
      if (!this.form.name.trim()) {
        this.store.showToast('名前を入力してください', 'error');
        return;
      }
      if (!this.form.school) {
        this.store.showToast('学校を選択してください', 'error');
        return;
      }
      const data = {
        ...this.form,
        skillLevels:     { ...this.form.skillLevels },
        equipmentLevels: [...this.form.equipmentLevels],
        neededMaterials: (this.form.neededMaterials || []).map(n => ({ ...n })),
      };
      if (this.store.selectedStudentId) {
        data.id = this.store.selectedStudentId;
      }
      await saveStudent(data);
      await this.store.loadStudents();
      this.store.closeStudentDetail();
      this.store.showToast('保存しました', 'success');
    },

    async confirmDelete() {
      if (!confirm(`「${this.form.name}」を削除しますか？`)) return;
      await deleteStudent(this.store.selectedStudentId);
      await this.store.loadStudents();
      this.store.closeStudentDetail();
      this.store.showToast('削除しました', 'info');
    },
  },
};
