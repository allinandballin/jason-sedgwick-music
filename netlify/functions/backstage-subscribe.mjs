import {getStore} from '@netlify/blobs';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
const store=()=>getStore('jason-backstage-subscribers');
const emailOk=e=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)&&e.length<=254;
const hash=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('');
const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const brevo=async(path,body,method='POST')=>{const r=await fetch('https://api.brevo.com/v3/'+path,{method,headers:{'api-key':process.env.BREVO_API_KEY,'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(body)});if(!r.ok){console.error('Brevo API error',r.status,await r.text());throw Error('Email provider unavailable')}return r};
export default async function handler(request){
 if(request.method!=='POST')return json({error:'Method not allowed'},405);
 if(!process.env.BREVO_API_KEY||!Number.isSafeInteger(Number(process.env.BREVO_LIST_ID))||!process.env.BREVO_LIST_ID)return json({error:'Subscription service not configured'},503);
 let data;try{data=await request.json()}catch{return json({error:'Invalid request'},400)}
 if(data.website)return json({message:'If your email is eligible, a confirmation link will arrive shortly.'});
 const email=String(data.email||'').trim().toLowerCase();
 if(!emailOk(email)||data.consent!==true)return json({error:'Enter a valid email and agree to receive music updates.'},400);
 try{
  const db=store(),key='people/'+await hash(email),existing=await db.get(key,{type:'json'});
  const generic={message:'If your email is eligible, a confirmation link will arrive shortly. Please check your inbox and spam folder.'};
  if(existing?.status==='confirmed'||existing?.status==='unsubscribed')return json(generic);
  if(existing?.lastSent&&Date.now()-Date.parse(existing.lastSent)<15*60*1000)return json(generic);
  const token=crypto.randomUUID()+'-'+crypto.randomUUID(),tokenHash=await hash(token);
  const origin=new URL(request.url).origin;
  const link=origin+'/.netlify/functions/backstage-confirm?token='+encodeURIComponent(token);
  const record={email,status:'pending',tokenHash,lastSent:new Date().toISOString(),createdAt:existing?.createdAt||new Date().toISOString()};
  await db.setJSON(key,record);
  await db.setJSON('tokens/'+tokenHash,{key,expires:Date.now()+48*60*60*1000});
  await brevo('smtp/email',{sender:{name:'Jason Sedgwick Music',email:process.env.BREVO_SENDER_EMAIL||'jasonsedgwick264@gmail.com'},to:[{email}],subject:'Confirm your Backstage List subscription',htmlContent:`<div style="font-family:Arial,sans-serif;max-width:580px;margin:auto"><h2>Jason Sedgwick Music</h2><p>Thanks for joining The Backstage List! Confirm that you want to receive music and album updates by clicking below.</p><p><a href="${esc(link)}">Confirm my subscription</a></p><p>This link expires in 48 hours. If you didn't request this, ignore this email.</p><p>Jason Sedgwick Music · If you did not request this email, simply ignore it.</p></div>`,textContent:'Confirm your subscription: '+link+'\nIf you did not request this, ignore this email.'});
  return json(generic);
 }catch(e){console.error('Backstage subscribe failed',e);return json({error:'Unable to send confirmation right now. Please try again later.'},503)}
}
