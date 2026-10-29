import { getStore } from '@netlify/blobs';
const headers={'Content-Type':'application/json','Cache-Control':'no-store'};
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
export default async function handler(request){
  const secret=process.env.SONG_LIKES_ADMIN_TOKEN;
  if(!secret||request.headers.get('Authorization')!==`Bearer ${secret}`)return reply({error:'Unauthorized'},401);
  if(!['GET','POST','DELETE'].includes(request.method))return reply({error:'Method not allowed'},405);
  try{
    const store=getStore('jason-artist-dashboard');
    if(request.method==='GET'){
      const page=await store.list({prefix:'drafts/'});
      const drafts=[];
      for(const blob of page.blobs){const draft=await store.get(blob.key,{type:'json'});if(draft)drafts.push(draft)}
      drafts.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
      return reply({drafts,subscribersEnabled:false,deliveryEnabled:false});
    }
    let body;try{body=await request.json()}catch{return reply({error:'Invalid JSON'},400)}
    if(request.method==='POST'){
      const title=String(body?.title||'').trim(),message=String(body?.message||'').trim();
      if(!title||title.length>160||!message||message.length>10000)return reply({error:'Title (1–160) and message (1–10000) required'},400);
      const id=typeof body.id==='string'&&/^[a-f0-9-]{36}$/i.test(body.id)?body.id:crypto.randomUUID();
      const draft={id,title,message,updatedAt:new Date().toISOString()};
      await store.setJSON('drafts/'+id,draft);
      return reply({draft},201);
    }
    if(typeof body?.id!=='string'||!/^[a-f0-9-]{36}$/i.test(body.id))return reply({error:'Invalid draft ID'},400);
    await store.delete('drafts/'+body.id);
    return reply({ok:true});
  }catch(error){console.error('Artist dashboard error',error);return reply({error:'Unable to access dashboard storage'},503)}
}
