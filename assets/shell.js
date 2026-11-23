(() => {
  const shell = document.querySelector('[data-shell]');
  if (!shell) return;
  const {root,page} = shell.dataset;
  function icon(key) {
    return '<svg aria-hidden="true"><use href="'+root+'assets/fa.svg#'+key+'"/></svg>';
  }
  const pages = [['desk','Study desk','desk/'],['table','Periodic table','elements/'],['wave','Equationarium','equationarium/']];
  const links = pages.map(([key,label,path]) => '<a href="'+root+path+'"'+(page===label?' aria-current="page"':'')+'>'+icon(key)+label+'</a>').join('');
  shell.innerHTML = '<a class="suite-skip" href="#workspace">Skip to workspace</a><header class="portal-bar"><a class="portal-brand" href="'+root+'">'+icon('atom')+'Study Assistant Pro</a><nav aria-label="Workspaces">'+links+'</nav></header>';
})();
