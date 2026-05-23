// ===== Fashion Portfolio 路 鍚庡彴 JS =====
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
      $('loginError').textContent = '璇峰～鍐欓偖绠卞拰瀵嗙爜';
      return;
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      $('loginError').style.display = 'block';
      $('loginError').textContent = error.message === 'Invalid login credentials' 
        ? '閭鎴栧瘑鐮侀敊璇? : error.message;
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
      list.innerHTML = '<div class="empty-list"><div class="icon">馃摥</div><p>杩樻病鏈変綔鍝侊紝鐐瑰嚮涓婃柟鎸夐挳娣诲姞</p></div>';
      return;
    }
    list.innerHTML = projects.map(p => `
      <div class="project-row" draggable="true" data-id="${p.id}">
        <span class="handle">鉅?/span>
        ${p.image_url 
          ? `<img src="${p.image_url}" alt="">` 
          : '<div class="empty-img">鏃犲浘</div>'}
        <div class="info">
          <div class="title">${p.title || '鏈懡鍚?} <span class="type-badge ${p.type||'project'}">${p.type==='sketch'?'鍗曠':'绯诲垪'}</span></div>
          <div class="cat">${p.category||'鏈垎绫?}${p.tags?' 路 '+p.tags:''}</div>
        </div>
        <div class="actions">
          <button class="btn btn-outline btn-small edit-project" data-id="${p.id}">鉁忥笍</button>
          <button class="btn btn-danger btn-small del-project" data-id="${p.id}">馃棏</button>
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
        if (!confirm('纭畾鍒犻櫎杩欎釜浣滃搧锛?)) return;
        await supabase.from('projects').delete().eq('id', btn.dataset.id);
        loadProjects();
        toast('宸插垹闄?, 'success');
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
        toast('鎺掑簭宸蹭繚瀛?, 'success');
      });
    });
  }

  // ===== Project Modal =====
  function openProjectModal(project = null) {
    const modal = $('projectModal');
    if (project) {
      $('modalTitle').textContent = '缂栬緫浣滃搧';
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
      $('modalTitle').textContent = '鏂板缓浣滃搧';
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
      $('typeHint').textContent = '鍗曞紶璁捐绋匡細浼氫互绱у噾鐢诲粖褰㈠紡灞曠ず锛屾敮鎸佹寜鏍囩绛涢€?;
    } else {
      $('descGroup').style.display = '';
      $('tagsGroup').style.display = 'none';
      $('typeHint').textContent = '绯诲垪/椤圭洰锛氫細浠ュぇ鍥?鏂囧瓧鎻忚堪灞曠ず鍦ㄧ綉绔欎笂';
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
    const id = $('projectId').value;
    const title = $('projectTitle').value.trim();
    if (!title) { toast('璇疯緭鍏ヤ綔鍝佸悕绉?, 'error'); return; }

    let imageUrl = '';
    // Upload image if new file selected
    const file = $('projectImageInput').files[0];
    if (file) {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('portfolio')
        .upload(fileName, file);
      if (uploadError) { toast('鍥剧墖涓婁紶澶辫触: ' + uploadError.message, 'error'); return; }
      const { data: urlData } = supabase.storage.from('portfolio').getPublicUrl(fileName);
      imageUrl = urlData.publicUrl;
    } else {
      // Keep existing image
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
      await supabase.from('projects').update(payload).eq('id', id);
      toast('浣滃搧宸叉洿鏂?, 'success');
    } else {
      const { data: max } = await supabase.from('projects').select('sort_order').order('sort_order', { ascending: false }).limit(1);
      payload.sort_order = (max?.[0]?.sort_order ?? -1) + 1;
      await supabase.from('projects').insert(payload);
      toast('浣滃搧宸叉坊鍔?, 'success');
    }

    $('projectModal').classList.remove('open');
    loadProjects();
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
      if (uploadError) { toast('澶村儚涓婁紶澶辫触', 'error'); return; }
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
    toast('璧勬枡宸蹭繚瀛?, 'success');
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
    toast('棣栭〉璁剧疆宸蹭繚瀛?, 'success');
  });

  // ===== Preview =====
  $('previewBtn').addEventListener('click', () => window.open('index.html', '_blank'));

  // ===== Change Password =====
  $('changePasswordBtn').addEventListener('click', async () => {
    const pw = $('newPassword').value;
    if (!pw) { toast('璇疯緭鍏ユ柊瀵嗙爜', 'error'); return; }
    if (pw.length < 6) { toast('瀵嗙爜鑷冲皯6浣?, 'error'); return; }
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) { toast('淇敼澶辫触: ' + error.message, 'error'); return; }
    $('newPassword').value = '';
    toast('瀵嗙爜宸蹭慨鏀癸紝涓嬫鐧诲綍鐢熸晥', 'success');
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
    toast('鏁版嵁宸插鍑?, 'success');
  });

  // ===== Import =====
  $('importBtn').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    let data;
    try { data = JSON.parse(text); } catch { toast('JSON 鏍煎紡閿欒', 'error'); return; }
    if (!confirm(`纭瀵煎叆锛熷寘鍚?${data.projects?.length || 0} 涓綔鍝佸拰 1 浠戒釜浜鸿祫鏂檂)) return;
    if (data.projects) {
      await supabase.from('projects').delete().neq('id', 0); // 娓呯┖
      for (const p of data.projects) {
        const { id, created_at, ...rest } = p;
        await supabase.from('projects').insert(rest);
      }
    }
    if (data.profile) {
      const { id, ...rest } = data.profile;
      await supabase.from('profile').upsert({ id: 1, ...rest });
    }
    toast('鏁版嵁宸插鍏?, 'success');
    loadProjects();
    loadProfile();
  });

  // ===== Start =====
  checkSession();
})();
