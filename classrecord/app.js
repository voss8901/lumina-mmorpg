const STORAGE_KEY = 'lumina-classrecord-v2';

const sampleSections = [
  { name: 'Grade 6 – Balintawak (Class E)', males: ['BANDE, ANGELO L.','BAYANA, FRENZ ROFFERT E.','BESINAN, MARK ANDREW D.','CAMPOMANES, JHUNMAR C.','CASADO, ENRIQUE SEAN D.'], females: ['ALIÑAR, REESE CZELEA MAXENE D.','ARCAYNA, REANELLE B.','BAON, JANELLE FAITH L.','BORDIOS, DANICA G.','CALUNZAG, AINELYN B.'] },
  { name: 'Grade 6 – Bataan (Class E) – English', males: ['ANUTA, JELORD C.','ARAKAMA, KOBE D.','BADAYOS, JHON KIRBY L.','BADAYOS, KLENT L.','CANAREZ, PRINCE RAMGEL R.'], females: ['ALAMBATIN, DELIGHT','ASMAJIN, NURFISA W.','AYENG, ALEXZA M.','BACASMOT, MIA L.','BALANSAG, RAMIELA MAE C.'] },
  { name: 'Grade 5 – Just (Class E)', males: ['ABELLA, XIAN JHON','BAUDTO, JHONEL','BELARMINO, ART ADRIAN','BLANZA, RICKY JR.','BULIG, CRISTIAN'], females: ['ACTUEL, NATALIA','ALBISO, EHRIANA','ALINGASA, SOPHIA','ARASAIN, RARDJIA','BANDE, ANGELICA'] },
  { name: 'Grade 5 – Patience', males: ['ALABA, ZEEKIE G.','ALMEREZ, MARK ANGELO R.','CERVANTES, JERICK JR M.','DELA TORRE, CLARK DAVE S.','FERNANDEZ, KYRIE JAMES T.'], females: ['ABDUL, SHIEKA T.','AGUIADAN, ASHLEY M.','ALPASIN, BLESSIE DIMPLE M.','BAQUIRAN, AGNES JANE G.','CANDOLE, ANGEL MAE C.'] },
  { name: 'Grade 5 – Kindness', males: ['CASTRO, FRANCIS JAY','COSTE, ZAIDEN CLARK, CEBALLOS','GOMEZ, ROBERT','LAMPARAS, RIO CYRO','VILLEGAS, MARK CRISTAN'], females: ['ABARQUEZ, AMARA','GENTUGAO, ETHANIA FAYE','GRACIA, LHIRA MAE','JIMLANI, DEEMA C.','TABIGUE, JANESSA, ARCAYNA'] }
];

function uid(){ return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)+Date.now(); }
function blankState(){
  const sections = sampleSections.map(def=>({id:uid(),name:def.name,pupils:[...def.males.map(name=>({id:uid(),name,g:'M'})),...def.females.map(name=>({id:uid(),name,g:'F'}))],assessments:[],scores:{}}));
  return {activeSectionId:sections[0]?.id || null,sections};
}
function load(){
  try { const raw=localStorage.getItem(STORAGE_KEY); if(raw){const x=JSON.parse(raw); if(x && Array.isArray(x.sections)) return x;} } catch(e){}
  return blankState();
}
let state=load();
function save(){ localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); }
function active(){ return state.sections.find(s=>s.id===state.activeSectionId) || null; }
function esc(v){ return String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c])); }

function render(){
  const root=document.getElementById('app'); if(!root) return;
  const sec=active();
  root.innerHTML=`<div class="app-shell">
    <header class="topbar"><div><h1>Lumina ClassRecord</h1><p>Simple, offline class score management</p></div><div class="actions"><button id="addSection">+ Section</button><button id="addAssessment">+ Assessment</button><button id="resetData" class="danger">Reset</button></div></header>
    <main class="layout">
      <aside class="sidebar"><h2>Classes</h2><div id="sections">${state.sections.map(s=>`<button class="section-btn ${s.id===state.activeSectionId?'active':''}" data-id="${s.id}"><span>${esc(s.name)}</span><small>${s.pupils.length} pupils</small></button>`).join('')}</div></aside>
      <section class="content">${sec?tableView(sec):`<div class="empty"><h2>No class selected</h2><button id="addSection2">Create a section</button></div>`}</section>
    </main><div id="toast" class="toast" hidden></div>
  </div>`;
  bind();
}
function tableView(s){
  const assessments=s.assessments||[];
  return `<div class="class-head"><div><h2>${esc(s.name)}</h2><p>${s.pupils.length} pupils · ${assessments.length} assessments</p></div></div>
  <div class="table-wrap"><table><thead><tr><th class="name">Pupil</th>${assessments.map(a=>`<th>${esc(a.name)}<small>/${a.max}</small><button class="x" data-assessment="${a.id}">×</button></th>`).join('')}<th>Average</th></tr></thead><tbody>${s.pupils.map(p=>{let vals=assessments.map(a=>s.scores?.[p.id+'|'+a.id]);let graded=vals.filter(v=>typeof v==='number');let avg=graded.length?Math.round(graded.reduce((x,y)=>x+y,0)/graded.length*100)/100:null;return `<tr><td class="name"><b>${esc(p.name)}</b><small>${p.g==='M'?'Male':'Female'}</small></td>${assessments.map(a=>`<td><input class="score" data-pupil="${p.id}" data-assessment="${a.id}" type="number" min="0" max="${a.max}" value="${s.scores?.[p.id+'|'+a.id]??''}" /></td>`).join('')}<td class="avg">${avg??'—'}</td></tr>`}).join('')}</tbody></table></div>`;
}
function toast(msg){const e=document.getElementById('toast');if(e){e.textContent=msg;e.hidden=false;setTimeout(()=>e.hidden=true,1800)}}
function bind(){
  document.querySelectorAll('.section-btn').forEach(b=>b.onclick=()=>{state.activeSectionId=b.dataset.id;save();render();});
  document.querySelectorAll('.score').forEach(i=>i.onchange=()=>{const s=active(),k=i.dataset.pupil+'|'+i.dataset.assessment;const n=i.value===''?undefined:Number(i.value);if(n===undefined)delete s.scores[k];else s.scores[k]=n;save();toast('Score saved');render();});
  document.getElementById('addSection')?.addEventListener('click',addSection);
  document.getElementById('addSection2')?.addEventListener('click',addSection);
  document.getElementById('addAssessment')?.addEventListener('click',addAssessment);
  document.getElementById('resetData')?.addEventListener('click',()=>{if(confirm('Reset all local class data?')){localStorage.removeItem(STORAGE_KEY);state=blankState();save();render();}});
  document.querySelectorAll('[data-assessment]').forEach(b=>b.onclick=()=>{const s=active();const id=b.dataset.assessment;if(confirm('Delete this assessment?')){s.assessments=s.assessments.filter(a=>a.id!==id);Object.keys(s.scores||{}).forEach(k=>{if(k.endsWith('|'+id))delete s.scores[k]});save();render();}});
}
function addSection(){const name=prompt('Section name:');if(!name?.trim())return;const s={id:uid(),name:name.trim(),pupils:[],assessments:[],scores:{}};state.sections.push(s);state.activeSectionId=s.id;save();render();}
function addAssessment(){const s=active();if(!s)return;const name=prompt('Assessment name:');if(!name?.trim())return;let max=Number(prompt('Maximum score:', '10'));if(!Number.isFinite(max)||max<=0)max=10;s.assessments.push({id:uid(),name:name.trim(),max});save();render();}
window.addEventListener('error',e=>{const root=document.getElementById('app');if(root)root.innerHTML=`<div class="fatal"><h1>Lumina failed to load</h1><p>${esc(e.message)}</p><button onclick="localStorage.removeItem('${STORAGE_KEY}');location.reload()">Repair local data</button></div>`;});
document.addEventListener('DOMContentLoaded',render);
