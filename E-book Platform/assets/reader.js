import {getBooks,loadPosition,savePosition} from "./catalog.js";
import {pageState,groupToc,targetForPosition} from "./reader-state.js";
import {makeSnapshot,playPageTurn} from "./page-turn.js";
import {createWheelGate} from "./reader-input.js";
const $=id=>document.getElementById(id),left=$("left"),right=$("right"),spread=$("spread"),mq=matchMedia("(min-width:1100px)"),status=$("reader-status"),stage=$("stage");
let book,page=0,revision=0,scale=1,bindWidgets=()=>{},cache=new Map(),start=null,displayedPage=null,activeChapter=null,turn=null;
const wide=()=>mq.matches;
const state=n=>pageState(book.pages.length,n,wide());
function toggleToc(show){$("toc").hidden=!show;$("toc-toggle").setAttribute("aria-expanded",String(show));if(show){$("toc-close").focus();revealActive()}}
function text(url){if(!cache.has(url)){const p=fetch(url).then(r=>{if(!r.ok)throw Error("HTTP "+r.status);return r.text()}).catch(e=>{cache.delete(url);throw e});cache.set(url,p)}return cache.get(url)}
function script(url){return new Promise((resolve,reject)=>{const el=document.createElement("script");el.src=url;el.onload=resolve;el.onerror=reject;document.head.append(el)})}
function css(url){return new Promise((resolve,reject)=>{const el=document.createElement("link");el.rel="stylesheet";el.href=url;el.onload=resolve;el.onerror=reject;document.head.append(el)})}
function currentChapter(){return [...book.toc].reverse().find(c=>c.page<=page)}
function revealActive(){
  const panel=$("toc"),active=$("toc-list").querySelector('[aria-current="page"]');
  if(panel.hidden||!active)return;
  const bounds=panel.getBoundingClientRect(),r=active.getBoundingClientRect();
  if(r.top<bounds.top||r.bottom>bounds.bottom)active.scrollIntoView({block:"nearest",inline:"nearest"});
}
function sync(){
  const c=currentChapter(),s=state(page),count=book.pages.length,progress=$("progress");
  $("chapter").textContent=c?.title||"";
  $("counter").textContent=(s.first===s.last?String(s.first+1):(s.first+1)+"–"+(s.last+1))+" / "+count;
  $("percent").textContent=s.percent+"%";
  progress.max=Math.max(1,s.max);progress.disabled=s.max===0;progress.value=s.position;
  progress.style.setProperty('--progress',s.percent+'%');
  progress.setAttribute("aria-valuetext",$("counter").textContent+"，"+s.percent+"%");
  $("prev").disabled=s.first===0;$("next").disabled=s.last===count-1;
  const changed=activeChapter!==c?.page;activeChapter=c?.page;
  for(const b of $("toc-list").querySelectorAll("button[data-page]")){
    if(Number(b.dataset.page)===c?.page){
      b.setAttribute("aria-current","page");
      const group=b.closest("details");if(group&&changed)group.open=true;
    }else b.removeAttribute("aria-current");
  }
  for(const group of $("toc-list").querySelectorAll(".toc-group")){
    group.classList.toggle("is-current",!!group.querySelector('[aria-current="page"]'));
  }
  if(changed)revealActive();
}
function stopTurn(){if(turn){turn.cancel();turn=null}}
function installPage(el,html,index){
  el.innerHTML=html;el.dataset.page=String(index);
  el.classList.toggle("physica-cover-page",book.id==="physica-ai"&&index===0);
  el.scrollTop=0;el.scrollLeft=0;
}
async function render(n,{animate=true}={}){
  if(!book)return;
  const here=state(n).first,request=++revision,hasRight=wide()&&here+1<book.pages.length;
  const old=displayedPage;page=here;status.textContent="";spread.setAttribute("aria-busy","true");
  try{
    const [a,b]=await Promise.all([text(new URL(book.pages[here],book.base).href),hasRight?text(new URL(book.pages[here+1],book.base).href):Promise.resolve("")]);
    if(request!==revision)return;
    stopTurn();
    const shouldTurn=animate&&old!==null&&here!==old&&!matchMedia("(prefers-reduced-motion: reduce)").matches;
    const oldLeft=shouldTurn?makeSnapshot(left):null,oldRight=shouldTurn&&!right.hidden?makeSnapshot(right):null;
    installPage(left,a,here);installPage(right,b,here+1);right.hidden=!hasRight;
    if(shouldTurn){
      try{turn=playPageTurn(spread,oldLeft,oldRight,makeSnapshot(left),hasRight?makeSnapshot(right):null,here>old)}
      catch(e){spread.querySelectorAll(".turn-overlay").forEach(el=>el.remove());spread.classList.remove("is-turning");console.warn("Page animation fallback",e)}
    }
    displayedPage=here;sync();bindWidgets();savePosition(book.id,here);
    const upcoming=here+(wide()?2:1);
    if(upcoming<book.pages.length)text(new URL(book.pages[upcoming],book.base).href).catch(()=>{});
    if(upcoming+1<book.pages.length&&wide())text(new URL(book.pages[upcoming+1],book.base).href).catch(()=>{});
  }catch(e){if(request===revision){page=displayedPage??0;sync();status.textContent="頁面載入失敗，請重新整理。";console.error(e)}}
  finally{if(request===revision)spread.removeAttribute("aria-busy")}
}
function step(dir){if(!book)return;const n=page+dir*(wide()?2:1);if(n>=0&&n<book.pages.length)render(n)}
function buildToc(){
  const nav=$("toc-list");nav.replaceChildren();
  for(const group of groupToc(book.toc)){
    const section=document.createElement("details");section.className="toc-group";section.open=true;
    const heading=document.createElement("summary");heading.className="toc-group-title";heading.textContent=group.unit||"章節";
    const list=document.createElement("ol");list.className="toc-children";
    for(const c of group.entries){
      const item=document.createElement("li"),b=document.createElement("button"),t=document.createElement("span"),num=document.createElement("span");
      b.type="button";b.className="toc-entry";b.dataset.page=c.page;t.textContent=c.title;num.className="toc-page";num.textContent=String(c.page+1).padStart(2,"0");
      b.append(t,num);b.onclick=()=>{render(c.page);if(!wide()){toggleToc(false);$("toc-toggle").focus()}};
      item.append(b);list.append(item);
    }
    section.append(heading,list);nav.append(section);
  }
}
function font(delta){scale=Math.max(.88,Math.min(1.30,scale+delta));document.documentElement.style.setProperty("--font-scale",scale)}
const interactive="button,a,input,select,textarea,label,summary,details,[role=button],[role=slider],[role=checkbox],[contenteditable],.quiz-card,[onclick]";
$("prev").onclick=()=>step(-1);$("next").onclick=()=>step(1);$("progress").oninput=e=>{
  const value=Number(e.target.value),max=Number(e.target.max);
  e.target.style.setProperty("--progress",(max?value/max*100:0)+"%");
  render(targetForPosition(value,wide()),{animate:false});
};$("toc-toggle").onclick=()=>{const show=$("toc").hidden;toggleToc(show);if(!show)$("toc-toggle").focus()};$("toc-close").onclick=()=>{toggleToc(false);$("toc-toggle").focus()};$("smaller").onclick=()=>font(-.06);$("larger").onclick=()=>font(.06);
// All four arrows navigate; focused controls keep their native keyboard behavior.
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"&&!$("toc").hidden){toggleToc(false);$("toc-toggle").focus();return}
  if(e.defaultPrevented||e.isComposing||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey)return;
  const control=e.target.closest?.(interactive);
  if(e.target.closest?.("#toc")||(control&&!control.matches("#prev,#next")))return;
  const direction={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1}[e.key];
  if(!direction)return;
  e.preventDefault();
  if(!e.repeat)step(direction);
});
// Let a long page (or a nested scrollable region) scroll normally first.
// Wheel turns only at the appropriate edge, outside interactive inputs.
const wheelGate=createWheelGate();
function canScrollVertical(target,dir){
  for(let el=target;el&&el!==stage;el=el.parentElement){
    if(!(el instanceof HTMLElement))continue;
    const style=getComputedStyle(el);
    if(!/^(auto|scroll|overlay)$/.test(style.overflowY))continue;
    const max=el.scrollHeight-el.clientHeight;
    if(max>2&&(dir>0?el.scrollTop<max-2:el.scrollTop>2))return true;
  }
  return false;
}
stage.addEventListener("wheel",e=>{
  if(!book||e.defaultPrevented||e.ctrlKey||e.metaKey||e.altKey||e.shiftKey||Math.abs(e.deltaY)<=Math.abs(e.deltaX)||e.deltaY===0)return;
  const target=e.target;
  if(target.closest?.("input,textarea,select,[contenteditable],[role=slider]"))return;
  const dir=Math.sign(e.deltaY);
  const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?stage.clientHeight:1);
  const action=wheelGate({now:performance.now(),dir,delta,canScroll:canScrollVertical(target,dir),busy:spread.getAttribute("aria-busy")==="true"||spread.classList.contains("is-turning")});
  if(action==="scroll")return;
  if(e.cancelable)e.preventDefault();
  if(action==="turn")step(dir);
},{passive:false});
let pointerOrigin=null,ignoreClickUntil=0;
spread.addEventListener("pointerdown",e=>{pointerOrigin=[e.clientX,e.clientY]});
spread.addEventListener("pointercancel",()=>{pointerOrigin=null});
spread.addEventListener("click",e=>{
  if(Date.now()<ignoreClickUntil||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||e.target.closest(interactive)||window.getSelection()?.toString())return;
  if(pointerOrigin&&Math.hypot(e.clientX-pointerOrigin[0],e.clientY-pointerOrigin[1])>10)return;
  const r=spread.getBoundingClientRect();if(r.width<=0)return;
  const pageEl=e.target.closest(".reader-page");
  if(pageEl&&pageEl.offsetWidth>pageEl.clientWidth){const pr=pageEl.getBoundingClientRect();if(e.clientX>=pr.left+pageEl.clientWidth)return}
  step(e.clientX<r.left+r.width/2?-1:1);
});
spread.addEventListener("touchstart",e=>{start=e.target.closest(interactive)?null:[e.changedTouches[0].clientX,e.changedTouches[0].clientY]},{passive:true});spread.addEventListener("touchend",e=>{if(!start)return;const [x,y]=start;start=null;const dx=e.changedTouches[0].clientX-x,dy=e.changedTouches[0].clientY-y;if(Math.abs(dx)>55&&Math.abs(dx)>1.5*Math.abs(dy)){ignoreClickUntil=Date.now()+500;step(dx<0?1:-1)}},{passive:true});
spread.addEventListener("touchcancel",()=>{start=null},{passive:true});
mq.addEventListener("change",()=>{stopTurn();render(page,{animate:false})});window.jumpToSpread=i=>render(i*2);
try{const id=new URLSearchParams(location.search).get("book");book=(await getBooks()).find(b=>b.id===id);if(!book?.pages.length){location.replace("./");throw Error("Book unavailable")}document.title=book.title+" · E-book Platform";$("book-title").textContent=book.title;await Promise.all((book.styles||[]).map(p=>css(new URL(p,book.base))));for(const p of book.scripts||[])await script(new URL(p,book.base));if(book.widgets){const mod=await import(new URL(book.widgets,book.base));bindWidgets=mod.bindInteractiveWidgets}if(!book.toc.length)book.toc=[{title:book.title,page:0}];$("progress").min=0;buildToc();await render(loadPosition(book.id))}catch(e){status.textContent="書籍無法載入。";console.error(e)}
