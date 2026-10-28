import { getStore } from '@netlify/blobs';
const songs={'wrong-side':'Wrong Side of the Tracks','borrowed-time':'Borrowed Time','aint-done':"I Ain't Done Yet",'get-a-dog':"If You're Feeling Lonely, Get a Dog",'road-less-traveled':'Somewhere Past Yesterday','never-left':'The Ones That Never Left','footprints':'Footprints','never-and-forever':'Somewhere Between Never and Forever'};
const headers={'Content-Type':'application/json','Cache-Control':'no-store'};
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
export default async function handler(request){
  if(request.method!=='GET')return reply({error:'Method not allowed'},405);
  const secret=process.env.SONG_LIKES_ADMIN_TOKEN;
  if(!secret||request.headers.get('Authorization')!==`Bearer ${secret}`)return reply({error:'Unauthorized'},401);
  try{
    const store=getStore('jason-song-likes');
    const totals=[];
    for(const [id,title] of Object.entries(songs)){
      let count=0,cursor;
      do{
        const page=await store.list({prefix:`likes/${id}/`,...(cursor?{cursor}:{})});
        count+=page.blobs.length;
        cursor=page.cursor;
      }while(cursor);
      totals.push({id,title,likes:count});
    }
    return reply({songs:totals});
  }catch(error){console.error('Song like statistics failed',error);return reply({error:'Unable to load statistics'},503)}
}
