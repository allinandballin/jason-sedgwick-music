import {getStore} from '@netlify/blobs';
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export default async function handler(request){
 const secret=process.env.SONG_LIKES_ADMIN_TOKEN;
 if(!secret||request.headers.get('Authorization')!==`Bearer ${secret}`)return json({error:'Unauthorized'},401);
 if(request.method!=='GET')return json({error:'Method not allowed'},405);
 try{
 const db=getStore('jason-backstage-subscribers');let cursor,confirmed=[],pending=0,unsubscribed=0;
 do{const p=await db.list({prefix:'people/',...(cursor?{cursor}:{})});for(const b of p.blobs){const person=await db.get(b.key,{type:'json'});if(!person)continue;if(person.status==='confirmed')confirmed.push({email:person.email,confirmedAt:person.confirmedAt});else if(person.status==='pending')pending++;else if(person.status==='unsubscribed')unsubscribed++}cursor=p.cursor||null;}while(cursor);
 return json({subscribers:confirmed,counts:{confirmed:confirmed.length,pending,unsubscribed},sendingEnabled:false});
 }catch(e){console.error('Subscribers admin error',e);return json({error:'Unable to load subscribers'},503)}
}
