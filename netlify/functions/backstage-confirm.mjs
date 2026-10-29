import {getStore} from '@netlify/blobs';
const page=(title,message)=>new Response('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+title+'</title><body style="font:18px Arial;background:#172126;color:#f3e7d4;max-width:600px;margin:15vh auto;padding:30px"><h1>'+title+'</h1><p>'+message+'</p><a style="color:#e6b779" href="/">Return to Jason Sedgwick Music</a></body></html>',{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
const hash=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('');
export default async function handler(request){
 const token=new URL(request.url).searchParams.get('token');
 if(!token||!/^[0-9a-f-]{73}$/i.test(token))return page('Invalid link','This confirmation link is invalid.');
 try{
 if(request.method==='GET')return new Response('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Confirm Backstage List</title><body style="font:18px Arial;background:#172126;color:#f3e7d4;max-width:600px;margin:15vh auto;padding:30px"><h1>Confirm your subscription</h1><p>Click below to join the Jason Sedgwick Music Backstage List.</p><form method="POST"><button style="padding:14px;font-size:18px" type="submit">Yes, subscribe me</button></form></body></html>',{headers:{'Content-Type':'text/html','Cache-Control':'no-store'}});
 if(request.method!=='POST')return page('Invalid request','Please use the confirmation form.');
 const db=getStore('jason-backstage-subscribers'),digest=await hash(token),entry=await db.get('tokens/'+digest,{type:'json'});
 if(!entry||entry.expires<Date.now())return page('Link expired','Please subscribe again to receive a new confirmation link.');
 const person=await db.get(entry.key,{type:'json'});
 if(!person||person.tokenHash!==digest||person.status!=='pending')return page('Link unavailable','This confirmation link is no longer active.');
 const listId=Number(process.env.BREVO_LIST_ID);
 if(!process.env.BREVO_API_KEY||!Number.isSafeInteger(listId)||listId<=0)throw Error('Not configured');
 const response=await fetch('https://api.brevo.com/v3/contacts',{method:'POST',headers:{'api-key':process.env.BREVO_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({email:person.email,listIds:[listId],updateEnabled:true})});
 if(!response.ok){console.error('Brevo contact error',response.status,await response.text());throw Error('Provider error')}
 const unsubscribeToken=crypto.randomUUID()+'-'+crypto.randomUUID();
 const unsubHash=await hash(unsubscribeToken);
 await db.setJSON(entry.key,{...person,status:'confirmed',confirmedAt:new Date().toISOString(),unsubscribeToken,tokenHash:null});
 await db.setJSON('unsubscribe/'+unsubHash,{key:entry.key});
 await db.delete('tokens/'+digest);
 return page('You’re on the list!','Thanks for confirming. You’ll receive updates when Jason has new music or announcements to share.');
 }catch(e){console.error('Backstage confirm error',e);return page('Unable to confirm','We couldn’t complete your subscription right now. Please try the link again later.')}
}
