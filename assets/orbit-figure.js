// Orthographic planet and inclined Kepler ellipse, projected into a shared camera frame.
(() => {
  const canvas=document.querySelector('#orbit-figure'),ctx=canvas.getContext('2d');
  if(!ctx)return;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const tau=2*Math.PI, tilt=.48, roll=-.34, eccentricity=.23, radius=72;
  let frame,visible=true,phase=.65,previous=0;
  function project(x,y,z){
    const vertical=y*Math.sin(tilt)-z*Math.cos(tilt);
    return [317+x*Math.cos(roll)-vertical*Math.sin(roll),197+x*Math.sin(roll)+vertical*Math.cos(roll),y*Math.cos(tilt)+z*Math.sin(tilt)];
  }
  const orbit=t=>project(204*(Math.cos(t)-eccentricity),204*Math.sqrt(1-eccentricity**2)*Math.sin(t),0);
  function trace(fn,start,end,samples,color,width,visiblePoint=()=>true){
    ctx.beginPath();let drawing=false;
    for(let i=0;i<=samples;i++){const p=fn(start+(end-start)*i/samples);if(!visiblePoint(p)){drawing=false;continue;}if(drawing)ctx.lineTo(p[0],p[1]);else ctx.moveTo(p[0],p[1]);drawing=true;}
    ctx.lineWidth=width;ctx.strokeStyle=color;ctx.stroke();
  }
  function dot(x,y,r,color){ctx.beginPath();ctx.arc(x,y,r,0,tau);ctx.fillStyle=color;ctx.fill();}
  function paint(){
    ctx.clearRect(0,0,640,400);
    ctx.fillStyle='#80a6b9';for(let j=0;j<80;j++){const x=(j*173+17)%637,y=(j*137+29)%394;ctx.globalAlpha=.18+(j%4)*.1;ctx.fillRect(x,y,j%6===0?2:1,1);}
    ctx.globalAlpha=1;
    trace(t=>project(221*Math.cos(t),221*Math.sin(t),0),0,tau,150,'#537d88',.7);
    trace(orbit,0,tau,160,'#8cc9c5',1.35);
    const glow=ctx.createRadialGradient(287,163,3,317,197,radius);
    glow.addColorStop(0,'#4a9299');glow.addColorStop(.55,'#285966');glow.addColorStop(1,'#0c2c3d');dot(317,197,radius,glow);
    for(let lat=-75;lat<90;lat+=15){const a=lat*tau/360;trace(t=>project(radius*Math.cos(a)*Math.cos(t),radius*Math.cos(a)*Math.sin(t),radius*Math.sin(a)),0,tau,140,'#8bc9c8',.65,p=>p[2]>=0);}
    for(let j=0;j<24;j++){const a=j*tau/24;trace(t=>project(radius*Math.cos(t)*Math.cos(a),radius*Math.cos(t)*Math.sin(a),radius*Math.sin(t)),-Math.PI/2,Math.PI/2,65,'#88c1c2',.62,p=>p[2]>=0);}
    ctx.strokeStyle='#a5e0d6';ctx.lineWidth=1.1;ctx.beginPath();ctx.arc(317,197,radius,0,tau);ctx.stroke();
    trace(orbit,0,Math.PI,90,'#c7eaa7',1.8);
    let E=phase;for(let i=0;i<4;i++)E-=(E-eccentricity*Math.sin(E)-phase)/(1-eccentricity*Math.cos(E));
    const [x,y,depth]=orbit(E);
    if(depth>=0||Math.hypot(x-317,y-197)>radius){
      const halo=ctx.createRadialGradient(x,y,0,x,y,14);halo.addColorStop(0,'#e0ffbb');halo.addColorStop(1,'#c5fcac00');dot(x,y,14,halo);dot(x,y,4,'#efffd6');
    }
  }
  function tick(t){if(previous)phase=(phase+Math.min(t-previous,80)*.00025)%tau;previous=t;paint();frame=requestAnimationFrame(tick);}
  function sync(){cancelAnimationFrame(frame);previous=0;paint();if(visible&&!document.hidden&&!motion.matches)frame=requestAnimationFrame(tick);}
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();}).observe(canvas);
  motion.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);sync();
})();
