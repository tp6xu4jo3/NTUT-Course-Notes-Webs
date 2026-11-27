import {getBooks} from "./catalog.js";
const shelf=document.querySelector("#shelf");
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
function group(parent,label,depth){
  let node=Array.from(parent.children).find(x=>x.dataset.group===label);
  if(!node){
    node=el("section","shelf-group shelf-level-"+depth);node.dataset.group=label;
    const header=el("div","shelf-group-header"),heading=el(depth===0?"h2":"h3","shelf-heading",label);
    header.append(heading);node.append(header);parent.append(node);
  }
  return node;
}
function booksGrid(parent){
  let grid=Array.from(parent.children).find(x=>x.classList.contains("shelf-grid"));
  if(!grid){grid=el("div","shelf-grid");parent.append(grid)}
  return grid;
}
function courseDetails(book){
  const details=el("details","book-course-details");
  const summary=el("summary","book-course-summary");
  const count=book.courses.length;
  summary.append(el("span","","包含課程（"+count+"堂）"));
  const ids=book.courses.map(c=>String(c.number).padStart(2,"0")).join(" / ");
  summary.append(el("small","book-course-ids",ids));
  const list=el("div","book-courses");
  for(const c of book.courses){
    const line=el("div","book-course"+(c.status==="pending"?" pending":""));
    line.append(el("span","course-num","Course "+String(c.number).padStart(2,"0")),el("span","course-name",c.title),el("small","course-status",c.status==="included"?"已收錄":"待收錄"));
    list.append(line);
  }
  details.append(summary,list);return details;
}
function addCourseControls(group,details){
  const header=group.querySelector(":scope > .shelf-group-header");
  const controls=el("div","shelf-course-controls");
  const expand=el("button","shelf-course-button","全部展開");
  const collapse=el("button","shelf-course-button","全部收起");
  expand.type=collapse.type="button";
  controls.setAttribute("role","group");controls.setAttribute("aria-label","Google AI課程清單");
  const update=()=>{expand.disabled=details.every(d=>d.open);collapse.disabled=details.every(d=>!d.open)};
  expand.addEventListener("click",()=>{details.forEach(d=>d.open=true);update()});
  collapse.addEventListener("click",()=>{details.forEach(d=>d.open=false);update()});
  details.forEach(d=>d.addEventListener("toggle",update));
  controls.append(expand,collapse);header.append(controls);update();
}
try{
  const books=await getBooks(),courseGroups=new Map();
  document.querySelector("#count").textContent=books.length+" 本";
  for(const b of books){
    let parent=shelf;
    const categories=Array.isArray(b.categories)&&b.categories.length?b.categories:["其他"];
    categories.forEach((name,i)=>{parent=group(parent,name,i)});
    const available=b.pages.length>0,card=el("article","book-card");
    const link=el(available?"a":"div","book-link");
    if(available)link.href="reader.html?book="+encodeURIComponent(b.id);
    else{card.setAttribute("aria-disabled","true");link.setAttribute("aria-disabled","true")}
    const img=el("img");img.src=new URL(b.cover,b.base);img.alt=b.title+" 封面";
    link.append(img,el("strong","",b.title));
    if(b.subtitle)link.append(el("small","",b.subtitle));
    link.append(el("small","book-page-count",available?b.pages.length+" 頁":"尚未收錄"));
    card.append(link);
    if(Array.isArray(b.courses)&&b.courses.length){
      const details=courseDetails(b);card.append(details);
      if(categories.includes("Google AI")){
        if(!courseGroups.has(parent))courseGroups.set(parent,[]);
        courseGroups.get(parent).push(details);
      }
    }
    booksGrid(parent).append(card);
  }
  for(const [parent,details] of courseGroups)addCourseControls(parent,details);
}catch(e){document.querySelector("#status").textContent="書櫃載入失敗，請重新整理。";console.error(e)}
