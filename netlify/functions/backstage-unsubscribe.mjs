import {getStore} from '@netlify/blobs';
const hash=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('');
const page=(title,msg)=>new Response('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+title+'</title><body style="font:18px Arial;background:#172126;color:#f3e7d4;max-width:600px;margin:15vh auto;padding:30px"><h1>'+title+'</h1><p>'+msg+'</p><a style="color:#e6b779" href="/">Return to music website</a></body></html>',{headers:{'Content-Type':'text/html','Cache-Control':'no-store'}});
export default async function handler(request){
 const token=new URL(request.url).searchParams.get('token');
 if(!token||!/^[0-9a-f-]{73}$/i.test(token))return page('Invalid link','This unsubscribe link is invalid.');
 const db=getStore('jason-backstage-subscribers');
 try{
 const digest=await hash(token),entry=await db.get('unsubscribe/'+digest,{type:'json'});
 if(!entry)return page('Link unavailable','This link is no longer active.');
 const person=await db.get(entry.key,{type:'json'});
 if(!person)return page('Already removed','Your address is not subscribed.');
 if(person.status==='unsubscribed')return page('Unsubscribed','You are already unsubscribed.');
 if(request.method==='GET')return new Response('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribe</title><body style="font:18px Arial;max-width:560px;margin:15vh auto;padding:30px"><h1>Leave The Backstage List?</h1><p>Click below to stop receiving music updates.</p><form method="POST"><button style="padding:14px" type="submit">Confirm unsubscribe</button></form></body></html>',{headers:{'Content-Type':'text/html','Cache-Control':'no-store'}});
 if(request.method!=='POST')return page('Invalid request','Please use the unsubscribe form.');
 const listId=Number(process.env.BREVO_LIST_ID);
 const r=await fetch('https://api.brevo.com/v3/contacts/'+encodeURIComponent(person.email)+'/lists/'+listId,{method:'DELETE',headers:{'api-key':process.env.BREVO_API_KEY}});
 if(!r.ok&&r.status!==404){console.error('Brevo unsubscribe',r.status,await r.text());throw Error('Provider unavailable')}
 await db.setJSON(entry.key,{...person,status:'unsubscribed',unsubscribedAt:new Date().toISOString()});
 return page('Unsubscribed','You will no longer receive Backstage List updates.');
 }catch(e){console.error('Unsubscribe error',e);return page('Please try again','We could not process your request. Please try again shortly.')}
}
