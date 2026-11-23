(() => {
  const get=id=>document.getElementById(id), topic=get('topic'), slider=get('parameter');
  const labs={
    taylor:{title:'Approximating sin x near zero',description:'Add odd powers to the Maclaurin polynomial. Compare the approximation with sin x as you move farther from the center.',control:'Number of terms',min:1,max:6,start:2,key:['sin x','Maclaurin polynomial'],bounds:[-4,4,-2,2]},
    polar:{title:'Sweeping a cardioid',description:'For r = 1 + cos θ, sweep from 0 to θ. Each small sector contributes approximately ½r² Δθ to the area.',control:'Sweep angle',min:0,max:360,start:90,key:['r = 1 + cos θ','Swept area'],bounds:[-.85,2.35,-1.55,1.55]},
    euler:{title:'Stepping along a differential equation',description:'Start at y(0) = 1 and use y′ = y. Each step follows the current tangent. Compare the computed endpoint with the exact value e.',control:'Steps from 0 to 1',min:1,max:24,start:4,key:['Exact solution y = eˣ','Euler approximation'],bounds:[-.08,1.1,0,3]}
  };
  const plot=(fn,a,b,n=160)=>Array.from({length:n+1},(_,i)=>fn(a+(b-a)*i/n));
  function update(){
    const mode=topic.value,l=labs[mode],v=Number(slider.value);
    get('control-label').textContent=l.control+' · '+v+(mode==='polar'?'°':'');
    get('model').textContent=l.title;get('description').textContent=l.description;
    [get('curve').textContent,get('approx').textContent]=l.key;
    let a,b,area=false,result;
    if(mode==='taylor'){
      const polynomial=x=>{let sum=x,term=x;for(let i=1;i<v;i++){term*=-x*x/(2*i*(2*i+1));sum+=term;}return sum;};
      a=plot(x=>[x,Math.sin(x)],-4,4);b=plot(x=>[x,polynomial(x)],-4,4);
      result='Degree '+(2*v-1)+' · At x = 2, P(2) = '+polynomial(2).toFixed(5)+' · Absolute error = '+Math.abs(polynomial(2)-Math.sin(2)).toFixed(5);
    }else if(mode==='polar'){
      const polar=t=>[(1+Math.cos(t))*Math.cos(t),(1+Math.cos(t))*Math.sin(t)];
      const t=v*Math.PI/180;a=plot(polar,0,2*Math.PI);b=[[0,0],...plot(polar,0,t),[0,0]];area=true;
      result='Swept area = ½ ∫₀ᶿ (1 + cos t)² dt = '+(.75*t+Math.sin(t)+Math.sin(2*t)/8).toFixed(4)+' square units.';
    }else{
      a=plot(x=>[x,Math.exp(x)],0,1);b=[[0,1]];let y=1;
      for(let i=1;i<=v;i++){y+=y/v;b.push([i/v,y]);}
      result='Step size = '+(1/v).toFixed(4)+' · Euler y(1) = '+y.toFixed(5)+' · Absolute error = '+(Math.E-y).toFixed(5);
    }
    const [xmin,xmax,ymin,ymax]=l.bounds;
    const scale=Math.min(595/(xmax-xmin),244/(ymax-ymin));
    const fx=x=>mode==='polar'?335+(x-(xmin+xmax)/2)*scale:45+(x-xmin)*595/(xmax-xmin);
    const fy=y=>272-(y-ymin)*244/(ymax-ymin);
    const path=points=>points.map(([x,y],i)=>(i?'L':'M')+fx(x).toFixed(2)+' '+fy(y).toFixed(2)).join(' ');
    const label=(x,y,t)=>'<text x="'+x+'" y="'+y+'" fill="#c8deeb" font-family="Helvetica,Arial,sans-serif" font-size="12">'+t+'</text>';
    let ticks='';
    const dx=mode==='euler'?.25:1,dy=1;
    for(let x=Math.ceil(xmin/dx)*dx;x<=xmax;x+=dx)ticks+=label(fx(x)-4,291,x);
    for(let y=Math.ceil(ymin);y<=ymax;y+=dy)ticks+=label(19,fy(y)+3,y);
    get('graph').innerHTML='<defs><clipPath id="plot"><rect x="44" y="20" width="598" height="253"/></clipPath></defs>'+ticks+'<g clip-path="url(#plot)"><path stroke="#7991a5" d="M45 '+fy(0)+'H640 M'+fx(0)+' 22V272"/><path d="'+path(a)+'" fill="none" stroke="#54dfce" stroke-width="3"/><path d="'+path(b)+'" stroke="#ffba61" stroke-width="2.5" stroke-dasharray="'+(area?'none':'7 3')+'" fill="'+(area?'#ffba6138':'none')+'"/></g>';
    get('reading').textContent=result;get('graph').setAttribute('aria-label',l.title+'. '+result);
  }
  function choose(){const l=labs[topic.value];slider.min=l.min;slider.max=l.max;slider.value=l.start;update();}
  topic.onchange=choose;slider.oninput=update;choose();
})();
