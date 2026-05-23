// ===== Fashion Portfolio v5 路 榛戦噾鏆楄壊 JS =====
import * as THREE from 'three';
(async function(){
  const cfg=window.SITE_CONFIG;
  const sb=cfg.supabaseUrl.includes('YOUR')?null:window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);

  // Cursor
  const cur=document.getElementById('cursor');
  let cx=0,cy=0,ax=0,ay=0;
  document.addEventListener('mousemove',e=>{cx=e.clientX;cy=e.clientY});
  document.querySelectorAll('a,button,.work-item,.filter-btn').forEach(el=>{
    el.addEventListener('mouseenter',()=>cur.classList.add('hover'));
    el.addEventListener('mouseleave',()=>cur.classList.remove('hover'));
  });

  // 3D 路 鏆楅噾寰厜绮掑瓙
  const cvs=document.getElementById('three-bg');
  const rdr=new THREE.WebGLRenderer({canvas:cvs,antialias:true,alpha:true});
  rdr.setPixelRatio(Math.min(devicePixelRatio,2));
  rdr.setSize(innerWidth,innerHeight);
  const scn=new THREE.Scene();
  const cam=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.1,100);
  cam.position.set(0,0,20);

  const GW=26,GH=18,XN=26,YN=16;
  const pn=XN*YN;
  const geo=new THREE.BufferGeometry();
  const pos=new Float32Array(pn*3),base=new Float32Array(pn*3);
  for(let x=0;x<XN;x++)for(let y=0;y<YN;y++){
    const i=x*YN+y;
    const px=(x/(XN-1)-.5)*GW,py=(y/(YN-1)-.5)*GH,pz=(Math.random()-.5)*2.5;
    pos[i*3]=base[i*3]=px;pos[i*3+1]=base[i*3+1]=py;pos[i*3+2]=base[i*3+2]=pz;
  }
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const mat=new THREE.PointsMaterial({
    color:0xc4a158,size:.06,transparent:true,opacity:.35,
    blending:THREE.AdditiveBlending,depthWrite:false
  });
  const pts=new THREE.Points(geo,mat);scn.add(pts);

  // 涓濆甫
  const ribbons=[];
  for(let r=0;r<4;r++){
    const arr=[];const by=(r-1.5)*3.5;const amp=.3+Math.random()*1.2;const fr=1+Math.random()*2;
    for(let i=0;i<28;i++){const t=i/27;arr.push(new THREE.Vector3((t-.5)*24,by,Math.sin(t*Math.PI)*1.2));}
    const crv=new THREE.CatmullRomCurve3(arr);
    const tg=new THREE.TubeGeometry(crv,60,.03,8,false);
    const tm=new THREE.MeshBasicMaterial({color:0xc4a158,transparent:true,opacity:.03+Math.random()*.05,blending:THREE.AdditiveBlending,depthWrite:false});
    const tb=new THREE.Mesh(tg,tm);
    tb.userData={by,amp,fr,off:Math.random()*Math.PI*2};
    scn.add(tb);ribbons.push(tb);
  }

  window.addEventListener('scroll',()=>{
    cam.position.y=scrollY*.015;
    document.getElementById('header').classList.toggle('scrolled',scrollY>80);
  },{passive:true});

  const clk=new THREE.Clock();let sk=0;
  function anim(){
    requestAnimationFrame(anim);
    if(++sk<=2)return;sk=0;
    const dt=Math.min(clk.getDelta(),.3),t=performance.now()*.001;
    ax+=(cx-ax)*.13;ay+=(cy-ay)*.13;
    cur.style.transform=`translate(${ax}px,${ay}px)`;

    const pa=geo.attributes.position.array;
    for(let x=0;x<XN;x++)for(let y=0;y<YN;y++){
      const i=x*YN+y;
      pa[i*3]=base[i*3]+Math.sin(t*1.3+y*.45)*.7+Math.cos(t*.65+x*.35)*.4;
      pa[i*3+1]=base[i*3+1]+Math.cos(t*.85+x*.35)*.5+Math.sin(t*1.0+y*.5)*.35;
      pa[i*3+2]=base[i*3+2]+Math.sin(t*1.4+x*.25+y*.3)*1;
    }
    geo.attributes.position.needsUpdate=true;
    ribbons.forEach(r=>{
      r.position.y=Math.sin(t*.35+r.userData.off)*r.userData.amp;
      r.rotation.z+=dt*.06;
    });
    const mx=(ax/innerWidth-.5)*.12,my=(ay/innerHeight-.5)*.08;
    pts.rotation.y+=(mx-pts.rotation.y)*.02;
    pts.rotation.x+=(my-pts.rotation.x)*.02;
    rdr.render(scn,cam);
  }

  async function load(){
    if(!sb){renderProjects([]);return}
    try{
      const{data:p}=await sb.from('profile').select('*').single();
      if(p)renderProfile(p);
      const{data:pr}=await sb.from('projects').select('*').order('sort_order');
      renderProjects(pr||[]);
    }catch(e){renderProjects([])}
  }

  function renderProfile(p){
    if(p.name){
      document.getElementById('aboutName').textContent=p.name;
      document.title=p.name;
      document.getElementById('siteLogo').textContent=p.name;
    }
    if(p.bio)document.getElementById('aboutBio').textContent=p.bio;
    if(p.hero_title){
      const pt=p.hero_title.split('\n');
      document.getElementById('heroTitle').innerHTML=pt[0]+'<br><em>'+(pt[1]||'Portfolio')+'</em>';
    }
    if(p.hero_subtitle)document.getElementById('heroSub').textContent=p.hero_subtitle;
    if(p.avatar_url){
      const a=document.getElementById('avatarArea');
      a.className='avatar';a.innerHTML=`<img src="${p.avatar_url}" alt="" class="avatar">`;
    }
    const lk=document.getElementById('contactLinks');lk.innerHTML='';
    if(p.contact_email)lk.innerHTML+=`<a class="contact-link" href="mailto:${p.contact_email}">Email</a>`;
    if(p.contact_instagram)lk.innerHTML+=`<a class="contact-link" href="https://instagram.com/${p.contact_instagram.replace('@','')}">Instagram</a>`;
    if(p.contact_xiaohongshu)lk.innerHTML+=`<a class="contact-link">Xiaohongshu</a>`;
    if(p.contact_wechat)lk.innerHTML+=`<a class="contact-link">WeChat</a>`;
  }

  function renderProjects(projects){
    const list=document.getElementById('workList');
    const flt=document.getElementById('filters');
    if(!projects.length){
      list.innerHTML='<div class="empty-state"><div class="icon">鉁?/div><p>Works coming soon</p></div>';
      return
    }
    const cats=new Set(projects.map(p=>p.category).filter(Boolean));
    flt.innerHTML='<button class="filter-btn active" data-cat="all">All</button>';
    cats.forEach(c=>flt.innerHTML+=`<button class="filter-btn" data-cat="${c}">${c}</button>`);

    list.innerHTML=projects.map((p,i)=>`
      <div class="work-item" data-cat="${p.category||''}" data-id="${p.id}">
        <div class="wi-img">
          ${p.image_url
            ?`<img src="${p.image_url}" alt="${p.title}" loading="lazy"><div class="wi-tag"><div class="wt-cat">${p.category||''}</div><div class="wt-title">${p.title}</div></div>`
            :`<div class="wi-ph"><span class="wi-ph-icon">鉁?/span><span class="wi-ph-name">${p.title||'Untitled'}</span></div>`}
        </div>
        <div class="wi-text">
          <div class="wt-cat2">${p.category||''}</div>
          <div class="wt-title2">${p.title}</div>
          <div class="wt-desc">${p.description||'鐐瑰嚮鏌ョ湅澶у浘'}</div>
          <div class="wt-link">View Project 鈫?/div>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.work-item').forEach(item=>{
      item.addEventListener('click',()=>{
        const p=projects.find(pr=>pr.id==item.dataset.id);
        if(!p)return;
        document.getElementById('lightboxImg').src=p.image_url||'';
        document.getElementById('lightboxCat').textContent=p.category||'';
        document.getElementById('lightboxTitle').textContent=p.title;
        document.getElementById('lightboxDesc').textContent=p.description||'';
        document.getElementById('lightbox').classList.add('open');
      });
    });

    document.querySelectorAll('.filter-btn').forEach(btn=>{
      btn.addEventListener('click',()=>{
        document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.work-item').forEach(item=>{
          item.style.display=(btn.dataset.cat==='all'||item.dataset.cat===btn.dataset.cat)?'':'none';
        });
      });
    });

    setTimeout(initAnim,50);
  }

  function initAnim(){
    const obs=new IntersectionObserver(entries=>{
      entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')});
    },{threshold:.04,rootMargin:'0px 0px -20px 0px'});
    document.querySelectorAll('.work-item,.fade-up').forEach(el=>obs.observe(el));
  }

  document.getElementById('lightboxClose').addEventListener('click',()=>document.getElementById('lightbox').classList.remove('open'));
  document.getElementById('lightbox').addEventListener('click',e=>{if(e.target===e.currentTarget)document.getElementById('lightbox').classList.remove('open')});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')document.getElementById('lightbox').classList.remove('open')});

  window.addEventListener('resize',()=>{
    cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();
    rdr.setSize(innerWidth,innerHeight);
  });

  document.getElementById('year').textContent=new Date().getFullYear();
  initAnim();anim();await load();
})();
