(() => {
  const paths = {
    atom:'<ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-40 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(40 12 12)"/><circle cx="12" cy="12" r="1"/>',
    grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    desk:'<path d="M3 5c3-1 6-1 9 1 3-2 6-2 9-1v14c-4-1-6-1-9 1-3-2-5-2-9-1zM12 6v14"/>',
    table:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M9 9v12m6-12v12M3 15h18"/>',
    wave:'<path d="M2 13c3 0 3-8 6-8s3 14 7 14 3-8 7-8"/>',
    cards:'<rect x="6" y="7" width="15" height="12" rx="2"/><path d="M3 15V6c0-2 1-2 3-2h11"/>',
    journal:'<rect x="5" y="3" width="15" height="18" rx="2"/><path d="M9 3v18m3-13h5m-5 4h4"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
    globe:'<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
    menu:'<path d="M3 6h18M3 12h18M3 18h18"/>',
    layers:'<path d="m2 8 10-5 10 5-10 5zM3 12l9 5 9-5m-18 4 9 5 9-5"/>',
    search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>'
  };
  function icon(key){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+paths[key]+'</svg>';}
  window.studyIcon=icon;
  const shell=document.querySelector('[data-shell]');
  if(!shell)return;
  const {root,page}=shell.dataset;
  const docks=[['grid','Overview',''],['desk','Study desk','desk/'],['table','Periodic table','elements/'],['wave','Physics Atlas','physics-atlas/']];
  const shortcuts=[['clock','Focus timer','desk/#timer'],['cards','Flashcards','desk/#flashcards'],['journal','Mistake journal','desk/#journal']];
  function nav(list){return list.map(([i,label,href])=>'<a '+(label===page?'aria-current="page"':'')+' href="'+root+href+'">'+icon(i)+label+'</a>').join('');}
  shell.innerHTML='<a class="suite-skip" href="#workspace">Skip to workspace</a><aside class="side" id="suite-menu"><a class="brandmark" href="'+root+'"><span class="logo-icon">'+icon('atom')+'</span><span>Singularity<span class="brand-light"> Lab</span></span></a><nav aria-label="Workspaces"><h2>Workspace</h2>'+nav(docks)+'<h2>Study tools</h2>'+nav(shortcuts)+'</nav><a class="external" href="https://www.singularitylabgroup.org/home/">'+icon('globe')+'Singularity Lab home</a></aside><header class="suite-bar"><button id="menu-toggle" type="button" aria-label="Open navigation" aria-expanded="false" aria-controls="suite-menu">'+icon('menu')+'</button><div>Study Assistant Pro <span>/</span> <strong>'+page+'</strong></div><time>'+icon('calendar')+new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',weekday:'short'}).format(new Date())+'</time></header>';
  const toggle=shell.querySelector('button'),close=()=>{document.body.classList.remove('menu-open');toggle.setAttribute('aria-expanded','false');};
  toggle.onclick=()=>{let open=document.body.classList.toggle('menu-open');toggle.setAttribute('aria-expanded',String(open));};
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
  document.addEventListener('click',e=>{if(!e.target.closest('.side,#menu-toggle')||e.target.closest('.side a'))close();});
  document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));
})();
