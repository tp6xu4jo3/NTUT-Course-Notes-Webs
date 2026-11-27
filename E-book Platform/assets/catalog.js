export async function getJSON(url){const r=await fetch(url);if(!r.ok)throw new Error("HTTP "+r.status);return r.json()}
export async function getBooks(){const base=new URL("../",import.meta.url);const list=await getJSON(new URL("catalog.json",base));return Promise.all(list.map(async path=>{const url=new URL(path,base);const book=await getJSON(url);return {...book,base:new URL("./",url)}}))}
