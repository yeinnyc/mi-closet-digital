export function imageUrl(value){
  const url=String(value||'').trim();
  if(!url)return '';

  const query=url.match(/[?&]id=([^&]+)/);
  if(query){
    return `/api/image?id=${encodeURIComponent(decodeURIComponent(query[1]))}`;
  }

  const filePath=url.match(/\/file\/d\/([^/]+)/);
  if(filePath){
    return `/api/image?id=${encodeURIComponent(filePath[1])}`;
  }

  return url;
}

async function request(url, options={}) {
  const response=await fetch(url,options); const text=await response.text(); let data;
  try{data=JSON.parse(text);}catch{throw new Error('El servidor devolvió una respuesta no válida.');}
  if(!response.ok||data.ok===false) throw new Error(data.error||'La operación no pudo completarse.');
  return data;
}
export const api={
  health:()=>request('/api/health'),
  meta:()=>request('/api/meta'),
  getProfile:()=>request('/api/profile'),
  updateProfile:(profile)=>request('/api/profile',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(profile)}),
  items:()=>request('/api/items'),
  looks:()=>request('/api/looks'),
  analyze:(form)=>request('/api/analyze',{method:'POST',body:form}),
  createItem:(form)=>request('/api/items',{method:'POST',body:form}),
  updateItem:(form)=>request('/api/items/update',{method:'POST',body:form}),
  deleteItem:(id)=>request(`/api/items/${encodeURIComponent(id)}`,{method:'DELETE'}),
  advice:(consulta,generateLooks=false)=>request('/api/asesoria',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({consulta,generateLooks})}),
  visual:(look)=>request('/api/asesoria/visual',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({look,modelImage:'/modelo-referencia.png'})}),
  createLook:(look)=>request('/api/looks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(look)}),
  updateLook:(look)=>request('/api/looks/update',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(look)}),
  deleteLook:(id)=>request(`/api/looks/${encodeURIComponent(id)}`,{method:'DELETE'})
};
