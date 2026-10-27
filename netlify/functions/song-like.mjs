import { getStore } from '@netlify/blobs';
const songs=new Set(['wrong-side','borrowed-time','aint-done','get-a-dog','road-less-traveled','never-left']);
const headers={'Content-Type':'application/json','Cache-Control':'no-store'};
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
export default async function handler(request){
  if(!['POST','DELETE'].includes(request.method))return reply({error:'Method not allowed'},405);
  let body;try{body=await request.json()}catch{return reply({error:'Invalid JSON'},400)}
  const {song,visitorId}=body||{};
  if(!songs.has(song)||typeof visitorId!=='string'||!/^[0-9a-f-]{36}$/i.test(visitorId))return reply({error:'Invalid song or visitor'},400);
  try{
    const store=getStore('jason-song-likes');
    const key=`likes/${song}/${visitorId}`;
    if(request.method==='POST')await store.set(key,'1',{onlyIfNew:true});
    else await store.delete(key);
    return reply({ok:true,liked:request.method==='POST'});
  }catch(error){console.error('Song like storage failed',error);return reply({error:'Unable to save like'},503)}
}
