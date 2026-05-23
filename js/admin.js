// ===== Fashion Portfolio · 后台 JS =====
(function() {
  const cfg = window.SITE_CONFIG;
  const supabase = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);

  // ===== State =====
  let currentUser = null;
  let currentPanel = 'projects';

  // ===== DOM refs =====
  const $ = id => document.getElementById(id);

  // ===== Toast =====
  function toast(msg, type = '') {
    const t = $('toast');
    t.textContent = msg;
    t.className = 'toast show ' + type;
    setTimeout(() => t.classList.remove('show'), 2500);
  }

  // ===== Auth =====
  $('loginBtn').addEventListener('click', async () => {
    const email = $('loginEmail').value.trim();
    const password = $('loginPassword').value;
    if (!email || !password) {
      $('loginError').style.display = 'block';
      $('loginError').textContent = '请填写邮箱和密码';
      return;
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      $('loginError').style.display = 'block';
      $('loginError').textContent = error.message === 'Invalid login credentials' 
        ? '邮箱或密码错误' : error.message;
    } else {
      currentUser = data.user;
      showAdmin();
    }
  });

  $('loginPassword').addEventListener('keydown', e => {
    if (e.key === 'Enter') $('loginBtn').click();
  });

  async function checkSession() {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      currentUser = data.session.user;
      showAdmin();
    }
  }

  function showAdmin() {
    $('loginPage').style.display = 'none';
    $('adminLayout').classList.add('active');
    loadProjects();
    loadProfile();
    loadHero();
  }

  $('logoutBtn').addEventListener('click', async () => {
    await supabase.auth.signOut();
    currentUser = null;
    $('loginPage').style.display = '';
    $('adminLayout').classList.remove('active');
    $('loginEmail').value = '';
    $('loginPassword').value = '';
  });

  // ===== Navigation =====
  document.querySelectorAll('.sidebar nav a').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      currentPanel = a.dataset.panel;
      document.querySelectorAll('.sidebar nav a').forEach(x => x.classList.remove('active'));
      a.classList.add('active');
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      $(`panel-${currentPanel}`).classList.add('active');
    });
  });

  // ===== Load Projects =====
  async function loadProjects() {
    const { data } = await supabase.from('projects').select('*').order('sort_order');
    const list = $('projectList');
    const projects = data || [];
    if (projects.length === 0) {
      list.innerHTML = '<div class="empty-list"><div class="icon">📭</div><p>还没有作品，点击上方按钮添加</p></div>';
      return;
    }
    list.innerHTML = projects.map(p => `
      <div class="project-row" draggable="true" data-id="${p.id}">
        <span class="handle">⠿</span>
        ${p.image_url 
          ? `<img src="${p.image_url}" alt="">` 
          : '<div class="empty-img">无图</div>'}
        <div class="info">
          <div class="title">${p.title || '未命名'} <span class="type-badge ${p.type||'project'}">${p.type==='sketch'?'单稿':'系列'}</span></div>
          <div class="cat">${p.category||'未分类'}${p.tags?' · '+p.tags:''}</div>
        </div>
        <div class="actions">
          <button class="btn btn-outline btn-small edit-project" data-id="${p.id}">✏️</button>
          <button class="btn btn-danger btn-small del-project" data-id="${p.id}">🗑</button>
        </div>
      </div>
    `).join('');

    // Edit
    list.querySelectorAll('.edit-project').forEach(btn => {
      btn.addEventListener('click', () => openProjectModal(projects.find(p => p.id == btn.dataset.id)));
    });

    // Delete
    list.querySelectorAll('.del-project').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('确定删除这个作品？')) return;
        await supabase.from('projects').delete().eq('id', btn.dataset.id);
        loadProjects();
        toast('已删除', 'success');
      });
    });

    // Drag to reorder
    initDragSort();
  }

  // ===== Drag Sort =====
  function initDragSort() {
    const rows = $('projectList').querySelectorAll('.project-row');
    rows.forEach(row => {
      row.addEventListener('dragstart', e => {
        row.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      row.addEventListener('dragend', () => row.classList.remove('dragging'));
      row.addEventListener('dragover', e => {
        e.preventDefault();
        const dragging = $('projectList').querySelector('.dragging');
        if (!dragging || dragging === row) return;
        const list = $('projectList');
        const after = row.getBoundingClientRect().top + row.offsetHeight / 2 < e.clientY;
        list.insertBefore(dragging, after ? row.nextSibling : row);
      });
      row.addEventListener('drop', async () => {
        const ids = [...$('projectList').querySelectorAll('.project-row')].map(r => r.dataset.id);
        for (let i = 0; i < ids.length; i++) {
          await supabase.from('projects').update({ sort_order: i }).eq('id', ids[i]);
        }
        toast('排序已保存', 'success');
      });
    });
  }

  // ===== Project Modal =====
  function openProjectModal(project = null) {
    const modal = $('projectModal');
    if (project) {
      $('modalTitle').textContent = '编辑作品';
      $('projectId').value = project.id;
      $('projectTitle').value = project.title || '';
      $('projectCategory').value = project.category || '';
      $('projectType').value = project.type || 'project';
      setTypeUI(project.type || 'project');
      if ((project.type||'project') === 'project') {
        $('projectDesc').value = project.description || '';
      } else {
        $('projectTags').value = project.tags || '';
      }
      if (project.image_url) {
        $('projectImagePreview').src = project.image_url;
        $('projectImagePreview').style.display = '';
      } else {
        $('projectImagePreview').style.display = 'none';
      }
    } else {
      $('modalTitle').textContent = '新建作品';
      $('projectId').value = '';
      $('projectTitle').value = '';
      $('projectCategory').value = '';
      $('projectDesc').value = '';
      $('projectTags').value = '';
      $('projectType').value = 'project';
      setTypeUI('project');
      $('projectImagePreview').style.display = 'none';
    }
    $('projectImageInput').value = '';
    modal.classList.add('open');
  }

  function setTypeUI(type){
    document.querySelectorAll('.type-opt').forEach(b => b.classList.remove('active'));
    var activeBtn = document.querySelector('.type-opt[data-type="'+type+'"]');
    if(activeBtn) activeBtn.classList.add('active');
    $('projectType').value = type;
    if(type === 'sketch'){
      $('descGroup').style.display = 'none';
      $('tagsGroup').style.display = '';
      $('typeHint').textContent = '单张设计稿：会以紧凑画廊形式展示，支持按标签筛选';
    } else {
      $('descGroup').style.display = '';
      $('tagsGroup').style.display = 'none';
      $('typeHint').textContent = '系列/项目：会以大图+文字描述展示在网站上';
    }
  }

  document.querySelectorAll('.type-opt').forEach(btn => {
    btn.addEventListener('click', function(){
      setTypeUI(this.dataset.type);
    });
  });

  $('addProjectBtn').addEventListener('click', () => openProjectModal());
  $('cancelProjectBtn').addEventListener('click', () => $('projectModal').classList.remove('open'));
  $('projectModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) $('projectModal').classList.remove('open');
  });

  // Image upload
  $('projectImageUpload').addEventListener('click', () => $('projectImageInput').click());
  $('projectImageInput').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      $('projectImagePreview').src = ev.target.result;
      $('projectImagePreview').style.display = '';
    };
    reader.readAsDataURL(file);
  });

  // Save project
  $('projectForm').addEventListener('submit', async e => {
    e.preventDefault();
    try {
    const id = $('projectId').value;
    const title = $('projectTitle').value.trim();
    if (!title) { toast('请输入作品名称', 'error'); return; }

    let imageUrl = '';
    // Upload image if new file selected
    const file = $('projectImageInput').files[0];
    if (file) {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('portfolio')
        .upload(fileName, file);
      if (uploadError) { toast('图片上传失败: ' + uploadError.message, 'error'); return; }
      const { data: urlData } = supabase.storage.from('portfolio').getPublicUrl(fileName);
      imageUrl = urlData.publicUrl;
    } else {
      imageUrl = $('projectImagePreview').style.display !== 'none' ? $('projectImagePreview').src : '';
    }

    const payload = {
      title,
      type: $('projectType').value || 'project',
      category: $('projectCategory').value.trim(),
      description: $('projectDesc').value.trim(),
      tags: $('projectTags').value.trim(),
      image_url: imageUrl,
    };

    if (id) {
      const { error } = await supabase.from('projects').update(payload).eq('id', id);
      if (error) { toast('更新失败: ' + error.message, 'error'); return; }
      toast('作品已更新', 'success');
    } else {
      const { data: max, error: maxErr } = await supabase.from('projects').select('sort_order').order('sort_order', { ascending: false }).limit(1);
      if (maxErr) { toast('查询失败: ' + maxErr.message, 'error'); return; }
      payload.sort_order = (max?.[0]?.sort_order ?? -1) + 1;
      const { error } = await supabase.from('projects').insert(payload);
      if (error) { toast('添加失败: ' + error.message, 'error'); return; }
      toast('作品已添加', 'success');
    }

    $('projectModal').classList.remove('open');
    loadProjects();
    } catch(err) { toast('错误: ' + (err.message || err), 'error'); console.error(err); }
  });

  // ===== Load Profile =====
  async function loadProfile() {
    const { data } = await supabase.from('profile').select('*').single();
    if (!data) return;
    $('profileName').value = data.name || '';
    $('profileNameEn').value = data.name_en || '';
    $('profileBio').value = data.bio || '';
    $('profileEmail').value = data.contact_email || '';
    $('profileWechat').value = data.contact_wechat || '';
    $('profileXiaohongshu').value = data.contact_xiaohongshu || '';
    $('profileInstagram').value = data.contact_instagram || '';
    if (data.avatar_url) {
      $('avatarPreview').src = data.avatar_url;
      $('avatarPreview').style.display = '';
      $('avatarIcon').style.display = 'none';
    }
  }

  // Avatar upload
  $('avatarUpload').addEventListener('click', () => $('avatarInput').click());
  $('avatarInput').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      $('avatarPreview').src = ev.target.result;
      $('avatarPreview').style.display = '';
      $('avatarIcon').style.display = 'none';
    };
    reader.readAsDataURL(file);
  });

  // Save profile
  $('profileForm').addEventListener('submit', async e => {
    e.preventDefault();
    let avatarUrl = $('avatarPreview').src;

    const file = $('avatarInput').files[0];
    if (file) {
      const ext = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('portfolio').upload(fileName, file);
      if (uploadError) { toast('头像上传失败', 'error'); return; }
      const { data: urlData } = supabase.storage.from('portfolio').getPublicUrl(fileName);
      avatarUrl = urlData.publicUrl;
    }

    await supabase.from('profile').upsert({
      id: 1,
      name: $('profileName').value.trim(),
      name_en: $('profileNameEn').value.trim(),
      bio: $('profileBio').value.trim(),
      avatar_url: avatarUrl,
      contact_email: $('profileEmail').value.trim(),
      contact_wechat: $('profileWechat').value.trim(),
      contact_xiaohongshu: $('profileXiaohongshu').value.trim(),
      contact_instagram: $('profileInstagram').value.trim(),
    });
    toast('资料已保存', 'success');
  });

  // ===== Load Hero =====
  async function loadHero() {
    const { data } = await supabase.from('profile').select('*').single();
    if (!data) return;
    $('heroTitle').value = data.hero_title || 'FASHION';
    $('heroTitle2').value = 'PORTFOLIO';
    $('heroSubtitle').value = data.hero_subtitle || 'DESIGNER';
    $('siteLogoInput').value = data.name || 'PORTFOLIO';
  }

  $('heroForm').addEventListener('submit', async e => {
    e.preventDefault();
    const title = $('heroTitle').value.trim() + '\n' + $('heroTitle2').value.trim();
    await supabase.from('profile').upsert({
      id: 1,
      hero_title: title,
      hero_subtitle: $('heroSubtitle').value.trim(),
      name: $('siteLogoInput').value.trim().toUpperCase(),
    });
    toast('首页设置已保存', 'success');
  });

  // ===== Preview =====
  $('previewBtn').addEventListener('click', () => window.open('index.html', '_blank'));

  // ===== Change Password =====
  $('changePasswordBtn').addEventListener('click', async () => {
    const pw = $('newPassword').value;
    if (!pw) { toast('请输入新密码', 'error'); return; }
    if (pw.length < 6) { toast('密码至少6位', 'error'); return; }
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) { toast('修改失败: ' + error.message, 'error'); return; }
    $('newPassword').value = '';
    toast('密码已修改，下次登录生效', 'success');
  });

  // ===== Export =====
  $('exportBtn').addEventListener('click', async () => {
    const { data: projects } = await supabase.from('projects').select('*').order('sort_order');
    const { data: profile } = await supabase.from('profile').select('*').single();
    const json = JSON.stringify({ projects, profile }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'portfolio-backup-' + new Date().toISOString().slice(0,10) + '.json';
    a.click();
    toast('数据已导出', 'success');
  });

  // ===== Import =====
  $('importBtn').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    let data;
    try { data = JSON.parse(text); } catch { toast('JSON 格式错误', 'error'); return; }
    if (!confirm(`确认导入？包含 ${data.projects?.length || 0} 个作品和 1 份个人资料`)) return;
    if (data.projects) {
      await supabase.from('projects').delete().neq('id', 0); // 清空
      for (const p of data.projects) {
        const { id, created_at, ...rest } = p;
        await supabase.from('projects').insert(rest);
      }
    }
    if (data.profile) {
      const { id, ...rest } = data.profile;
      await supabase.from('profile').upsert({ id: 1, ...rest });
    }
    toast('数据已导入', 'success');
    loadProjects();
    loadProfile();
  });

  // ===== Start =====
  checkSession();
})();
