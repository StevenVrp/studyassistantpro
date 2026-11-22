(() => {
  const $=selector=>document.querySelector(selector);
  const read=key=>JSON.parse(localStorage.getItem(key)||'[]');
  const cardKey='studyAssistant.cards.v1', journalKey='studyAssistant.journal.v1';
  let revealed=null;
  function node(tag,text,className){
    const el=document.createElement(tag);
    if(text!==undefined) el.textContent=text;
    if(className)el.className=className;
    return el;
  }
  function action(label,handler,primary=false){
    const btn=node('button',label,primary?'suite-action':'suite-secondary');
    btn.type='button';btn.onclick=handler;return btn;
  }
  function save(key,items){localStorage.setItem(key,JSON.stringify(items));render();}
  function remove(key,id){save(key,read(key).filter(item=>item.id!==id));}
  function submit(form,key,make){
    form.onsubmit=e=>{
      e.preventDefault();
      const values=Object.fromEntries(Array.from(new FormData(form),([k,v])=>[k,v.trim()]));
      if(Object.values(values).some(v=>!v))return;
      const items=read(key);
      items.push({id:crypto.randomUUID(),...values,...make()});form.reset();save(key,items);
    };
  }
  submit($('#card-form'),cardKey,()=>({due:Date.now(),interval:0}));
  submit($('#journal-form'),journalKey,()=>({created:Date.now(),resolved:false}));
  function rate(id,remembered){
    const cards=read(cardKey),card=cards.find(c=>c.id===id);
    if(!card)return;
    card.interval=remembered?Math.min(30,Math.max(1,2*card.interval)):0;
    card.due=Date.now()+(remembered?card.interval*86400000:60000);
    revealed=null;save(cardKey,cards);
  }
  function render(){
    const cards=read(cardKey), sorted=[...cards].sort((a,b)=>a.due-b.due);
    const due=sorted.filter(c=>c.due<=Date.now());
    const review=$('#review'),list=$('#card-list'),journal=$('#journal-list');
    review.replaceChildren(node('h3','Review deck'));list.replaceChildren();journal.replaceChildren();
    if(due.length){
      const card=due[0];
      review.append(node('small',due.length+' due'),node('p',card.question));
      if(revealed===card.id){
        review.append(node('p',card.answer),action('Again in 1 minute',()=>rate(card.id,false)),action('Remembered',()=>rate(card.id,true),true));
      }else review.append(action('Reveal answer',()=>{revealed=card.id;render();},true));
    }else review.append(node('p',sorted.length?'Next review: '+new Date(sorted[0].due).toLocaleString():'Add a flashcard to start reviewing.'));
    for(const card of cards){
      const item=node('div',undefined,'practice-item');
      item.append(node('b',card.question),node('p',card.answer),action('Delete card',()=>remove(cardKey,card.id)));
      list.append(item);
    }
    const entries=read(journalKey);
    if(!entries.length)journal.append(node('p','Your saved corrections will appear here.'));
    for(const entry of entries.reverse()){
      const item=node('article',undefined,'practice-item');
      item.append(node('small',new Date(entry.created).toLocaleDateString()+' · '+(entry.resolved?'Reviewed':'To revisit')),node('h3',entry.topic),node('p','Original reasoning · '+entry.mistake),node('p','Correction · '+entry.reason));
      item.append(action(entry.resolved?'Reopen':'Mark reviewed',()=>{
        const items=read(journalKey),target=items.find(x=>x.id===entry.id);
        if(target)target.resolved=!target.resolved;save(journalKey,items);
      }),action('Delete entry',()=>remove(journalKey,entry.id)));
      journal.append(item);
    }
  }
  window.addEventListener('storage',e=>{if([cardKey,journalKey].includes(e.key))render();});
  window.addEventListener('hashchange',render);
  setInterval(()=>{if(location.hash==='#flashcards'&&!revealed&&!document.hidden)render();},30000);
  render();
})();
