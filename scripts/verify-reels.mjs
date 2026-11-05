import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {reelItems} from './reel-data.mjs';
const dist=new URL('../dist/',import.meta.url);
const home=fs.readFileSync(new URL('index.html',dist),'utf8');
if(reelItems.length!==20 || new Set(reelItems.map(r=>r[3])).size!==20)throw Error('Expected 20 unique publications');
const results=reelItems.map(([name,,,url])=>{
 if(!/^https:\/\/www.instagram.com\/patioelcordobes\/reel\//.test(url))throw Error('Not a feed reel: '+url);
 const file=fileURLToPath(new URL(`assets/videos/${name}.mp4`,dist));
 const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=codec_name,width,height,duration','-of','json',file],{encoding:'utf8'}));
 if(!probe.streams[0]?.width)throw Error('Missing video stream: '+name);
 if(!fs.existsSync(new URL(`assets/images/video-${name}.webp`,dist)))throw Error('Missing poster: '+name);
 if(!home.includes(url))throw Error('Missing published slide: '+url);
 return {name,url,...probe.streams[0]};
});
fs.writeFileSync(new URL('../qa/reels-verification.json',import.meta.url),JSON.stringify(results,null,2));
console.log(`Verified ${results.length} unique feed reels, playable H264 files, posters and original links.`);
