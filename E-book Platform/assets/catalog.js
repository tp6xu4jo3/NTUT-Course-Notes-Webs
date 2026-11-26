export async function getJSON(url){const r=await fetch(url);if(!r.ok)throw new Error("HTTP "+r.status);return r.json()}
export async function getBooks(){const base=new URL("../",import.meta.url);const list=await getJSON(new URL("catalog.json",base));return Promise.all(list.map(async path=>{const url=new URL(path,base);const book=await getJSON(url);return {...book,base:new URL("./",url)}}))}
export function loadPosition(id){try{return Math.max(0,Number(localStorage.getItem("ebook:page:"+id))||0)}catch{return 0}}
export function savePosition(id,page){try{localStorage.setItem("ebook:page:"+id,String(page))}catch{}}
