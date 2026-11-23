(() => {
  const $=q=>document.querySelector(q), lab=window.OrbitalLab;
  const families={alkali:['Alkali metal','#ff9881'],alkaline:['Alkaline earth','#ffc354'],transition:['Transition metal','#7fbbff'],posttransition:['Post-transition','#a99cf3'],metalloid:['Metalloid','#63d6c6'],nonmetal:['Nonmetal','#90dd89'],halogen:['Halogen','#f993c2'],noble:['Noble gas','#d4e867'],lanthanide:['Lanthanide','#ba97ef'],actinide:['Actinide','#efa284']};
  const blocks={s:['s block','#ff9881'],p:['p block','#63d6c6'],d:['d block','#7fbbff'],f:['f block','#ba97ef']};
  const block=e=>e.z===2?'s':(e.z>=57&&e.z<=70||e.z>=89&&e.z<=102)?'f':(e.z===71||e.z===103)?'d':e.group<=2?'s':e.group>=13?'p':'d';
  const metrics={radius:'Atomic radius (pm)',en:'Electronegativity (Pauling)',ion:'First ionization (kJ/mol)'};
  const cells=new Map(),table=$('#ptable');let current;
  function label(text,col,row,cls){let el=document.createElement('span');el.className=cls;el.textContent=text;el.style.gridArea=row+' / '+col;table.append(el);}
  for(let i=1;i<=18;i++)label(i,i,1,'group');
  label('57–71',3,7,'range');label('89–103',3,8,'range');
  for(const e of elements){
    const btn=document.createElement('button');btn.className='cell';btn.type='button';btn.style.gridArea=(e.y+1)+' / '+e.x;
    const star=lab.isException(e.z)?lab.isPredicted(e.z)?'☆':'★':'';
    btn.innerHTML='<small>'+e.z+'</small><strong>'+e.sym+'</strong><span class="measure"></span><span class="star">'+star+'</span>';
    const title=e.name+' ('+e.sym+'), '+e.z+(star?(star==='☆'?', predicted exception':', ground-state exception'):'');
    btn.title=title;btn.setAttribute('aria-label',title);btn.onclick=()=>{select(e);history.replaceState(null,'','#'+e.sym);$('#details').scrollIntoView({block:'start'});};
    table.append(btn);cells.set(e.z,btn);
  }
  function shellDiagram(shells){
    const dots=shells.map((count,i)=>{
      const r=(i+1)*74/shells.length;
      let svg='<circle r="'+r+'" fill="none" stroke="#b4abbf"/>';
      for(let j=0;j<count;j++){let angle=j/count*2*Math.PI;svg+='<circle cx="'+(r*Math.cos(angle))+'" cy="'+(r*Math.sin(angle))+'" r="2" fill="#5b429a"/>';}
      return svg;
    });
    return '<svg viewBox="-80 -80 160 160" class="shell-map" aria-hidden="true"><circle r="3" fill="#191026"/>'+dots.join('')+'</svg>';
  }
  function select(e){
    if(current)cells.get(current.z).setAttribute('aria-pressed','false');
    current=e;cells.get(e.z).setAttribute('aria-pressed','true');
    $('#name').textContent=e.name;$('#symbol').textContent=e.sym;$('#symbol').style.background=families[e.cat][1];$('#category').textContent='Element '+e.z+' · '+families[e.cat][0];
    const shells=[];
    for(const [key,count] of Object.entries(lab.configuration(e.z))){let i=Number(key[0])-1;shells[i]=(shells[i]||0)+count;}
    const fields=[['Atomic mass / mass number',e.mass],['Period',e.period],['Group',e.group],['Outermost-shell electrons',shells.at(-1)],['Listed common charge',e.charge],...Object.entries(metrics).map(([k,v])=>[v,e[k]??'—'])];
    $('#properties').innerHTML='<h3>Element data</h3><dl>'+fields.map(([k,v])=>'<dt>'+k+'</dt><dd>'+v+'</dd>').join('')+'</dl><details><summary>Electron shells</summary><p>'+shells.join(' · ')+' electrons, from the innermost shell outward.</p>'+shellDiagram(shells)+'</details><details><summary>Full configuration</summary><p>'+lab.format(e.z,false)+'</p></details>';
    lab.render($('#viewer'),e.z);
  }
  function apply(){
    const mode=$('#mode').value,q=$('#search').value.trim().toLowerCase();
    const vals=elements.map(e=>e[mode]).filter(v=>typeof v==='number');
    const min=Math.min(...vals),max=Math.max(...vals);let count=0,first;
    for(const e of elements){
      const btn=cells.get(e.z);
      btn.disabled=!(e.name.toLowerCase().includes(q)||e.sym.toLowerCase()===q||String(e.z)===q)||($('#exceptions').checked&&!lab.isException(e.z));
      if(!btn.disabled){count++;first??=e;}
      const value=e[mode];
      btn.style.background=mode==='cat'?families[e.cat][1]:mode==='block'?blocks[block(e)][1]:value==null?'#eeeef0':'hsl(181 77% '+(95-47*(value-min)/(max-min))+'%)';
      btn.querySelector('.measure').textContent=mode==='cat'?'':mode==='block'?block(e):value??'—';
    }
    $('#matches').textContent=count+' of 118 elements';
    $('#legend').innerHTML=metrics[mode]?metrics[mode]+' · low <span class="legend-rate"></span> high · gray = unavailable':Object.values(mode==='cat'?families:blocks).map(([v,c])=>'<span><i style="background:'+c+'"></i>'+v+'</span>').join('');
    return {count,first};
  }
  $('#search').oninput=apply;$('#mode').onchange=apply;$('#exceptions').onchange=apply;
  $('#search').onkeydown=e=>{if(e.key==='Enter'){const {first}=apply();if(first)cells.get(first.z).click();}};
  apply();select(elements.find(e=>e.sym.toLowerCase()===location.hash.slice(1).toLowerCase())||elements[28]);
})();
