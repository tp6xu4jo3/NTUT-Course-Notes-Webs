// Flip only the outgoing physical leaf. Keep snapshots inert and separate from live pages.
let serial=0;
export function makeSnapshot(source) {
  const clone=source.cloneNode(true), prefix="turn-"+(++serial)+"-";
  const ids=new Map();
  for(const el of [clone,...clone.querySelectorAll("[id]")]){
    if(el.id){ids.set(el.id,prefix+el.id);el.id=prefix+el.id}
  }
  for(const el of [clone,...clone.querySelectorAll("*")]){
    for(const attr of [...el.attributes]){
      if(attr.name.startsWith("on")){el.removeAttribute(attr.name);continue}
      if(attr.name==="id")continue;
      let value=attr.value.replace(/url\(#([^)]*)\)/g,(all,id)=>ids.has(id)?"url(#"+ids.get(id)+")":all);
      if((attr.name==="href"||attr.name==="xlink:href")&&value.startsWith("#")&&ids.has(value.slice(1)))value="#"+ids.get(value.slice(1));
      if(["for","aria-labelledby","aria-describedby","aria-controls"].includes(attr.name))value=value.split(/\s+/).map(id=>ids.get(id)||id).join(" ");
      if(value!==attr.value)el.setAttribute(attr.name,value);
    }
  }
  const originalInputs=source.querySelectorAll("input,textarea,select");
  clone.querySelectorAll("input,textarea,select").forEach((el,i)=>{el.value=originalInputs[i].value;if("checked" in el)el.checked=originalInputs[i].checked});
  clone.removeAttribute("hidden");clone.setAttribute("aria-hidden","true");clone.inert=true;
  return {node:clone,scrollTop:source.scrollTop,scrollLeft:source.scrollLeft};
}
function attach(parent,snapshot){parent.append(snapshot.node);snapshot.node.scrollTop=snapshot.scrollTop;snapshot.node.scrollLeft=snapshot.scrollLeft}
function layer(kind){const node=document.createElement("div");node.className=kind;node.setAttribute("aria-hidden","true");node.inert=true;return node}
function face(leaf,kind,snapshot){const el=layer("turn-face "+kind);leaf.append(el);attach(el,snapshot)}
export function playPageTurn(spread,oldLeft,oldRight,newLeft,newRight,forward){
  if(matchMedia("(prefers-reduced-motion: reduce)").matches||!spread.animate)return null;
  const overlay=layer("turn-overlay"),double=!!oldRight&&!!newRight;
  spread.classList.add("is-turning");
  spread.append(overlay);
  let animation;
  if(double){
    const stationary=layer("turn-stationary "+(forward?"turn-left":"turn-right"));
    overlay.append(stationary);attach(stationary,forward?oldLeft:oldRight);
    const leaf=layer("turn-leaf "+(forward?"turn-right":"turn-left"));overlay.append(leaf);
    face(leaf,"turn-front",forward?oldRight:oldLeft);
    face(leaf,"turn-back",forward?newLeft:newRight);
    const angle=forward?-180:180;
    animation=leaf.animate([{transform:"rotateY(0deg)"},{transform:"rotateY("+angle+"deg)"}],{duration:380,easing:"cubic-bezier(.35,0,.3,1)",fill:"both"});
  }else{
    const leaf=layer("turn-single");overlay.append(leaf);
    // Forward: lift the old page off the new page. Backward: lay the new page over the old one.
    if(!forward){const old=layer("turn-single-base");overlay.prepend(old);attach(old,oldLeft)}
    attach(leaf,forward?oldLeft:newLeft);
    const frames=forward?[{transform:"rotateY(0deg)",opacity:1},{transform:"rotateY(-92deg)",opacity:1}]:[{transform:"rotateY(-92deg)",opacity:1},{transform:"rotateY(0deg)",opacity:1}];
    animation=leaf.animate(frames,{duration:260,easing:"cubic-bezier(.35,0,.3,1)",fill:"both"});
  }
  const finish=()=>{
    overlay.remove();
    if(!spread.querySelector(".turn-overlay"))spread.classList.remove("is-turning");
  };
  animation.finished.then(finish,finish);
  return {cancel(){animation.cancel();finish()}};
}
