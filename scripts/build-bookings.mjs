import fs from 'node:fs';
const root=new URL('../',import.meta.url);
function copyTree(source,destination){if(fs.statSync(source).isDirectory()){fs.mkdirSync(destination,{recursive:true});for(const entry of fs.readdirSync(source))copyTree(new URL(entry+(fs.statSync(new URL(entry,source)).isDirectory()?'/':''),source),new URL(entry+(fs.statSync(new URL(entry,source)).isDirectory()?'/':''),destination));}else fs.copyFileSync(source,destination);}
for(const dir of ['dist/server/','dist/client/','dist/.openai/','drizzle/meta/'])fs.mkdirSync(new URL(dir,root),{recursive:true});
// Keep the existing buildless pages as source and package their public copies.
for(const entry of fs.readdirSync(new URL('dist/',root),{withFileTypes:true})) {
  if(['client','server','.openai'].includes(entry.name))continue;
  const suffix=entry.isDirectory()?'/':'';
  copyTree(new URL('dist/'+entry.name+suffix,root),new URL('dist/client/'+entry.name+suffix,root));
}
const handler=fs.readFileSync(new URL('server/bookings.mjs',root),'utf8');
fs.writeFileSync(new URL('dist/server/index.js',root),handler+`\nexport default {async fetch(request,env){return await handleBookings(request,{...env,BOOKING_BASE_URL:env.BOOKING_BASE_URL || new URL(request.url).origin}) || env.ASSETS.fetch(request);}};\n`);
fs.copyFileSync(new URL('.openai/hosting.json',root),new URL('dist/.openai/hosting.json',root));
fs.writeFileSync(new URL('dist/server/wrangler.json',root),JSON.stringify({name:'patio-reservas',main:'index.js',compatibility_date:'2026-11-01',assets:{directory:'../client',binding:'ASSETS',run_worker_first:['/api/*','/reservas/*']},d1_databases:[{binding:'DB',database_name:'patio-bookings',database_id:'00000000-0000-4000-8000-000000000000'}]},null,2));
console.log('Worker and public assets built.');
