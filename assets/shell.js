(() => {
  const shell=document.querySelector('[data-shell]');
  if(!shell)return;
  const {root,page}=shell.dataset;
  function icon(key){return '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="'+root+'assets/fa.svg#'+key+'"></use></svg>';}
  window.studyIcon=icon;
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
