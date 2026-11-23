(() => {
  const mount = document.querySelector('[data-shell]');
  if (!mount) return;
  const { root, page } = mount.dataset;
  const pages = [['Study desk','desk/'],['Periodic table','elements/'],['Equationarium','equationarium/']];
  const links = pages.map(([label,path]) =>
    '<a href="'+root+path+'"'+(label===page?' aria-current="page"':'')+'>'+label+'</a>').join('');
  mount.innerHTML = '<a class="suite-skip" href="#workspace">Skip to workspace</a><header class="mast"><div class="mast-inner"><a class="mast-brand" href="'+root+'" aria-label="Study Assistant Pro home"><img class="official-mark" src="'+root+'Images/singularity-lab-white.png" alt=""><span>Singularity <b>Lab</b></span></a><nav aria-label="Workspaces">'+links+'</nav></div></header>';
  const footer = document.createElement('footer');
  footer.className = 'suite-end';
  footer.innerHTML = '<nav aria-label="Footer"><a href="https://www.singularitylabgroup.org/home/">Home</a><a href="'+root+'about/">About</a></nav>';
  document.querySelector('main').after(footer);
})();
