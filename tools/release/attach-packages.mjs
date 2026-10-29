// Operator-only, after reviewing the successful three-OS run and its smoke evidence.
import {execFileSync} from 'node:child_process';
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
export function validatePackageSet(dir,tag,sha){
 if(!/^v\d+\.\d+\.\d+-beta\.\d+$/.test(tag)||! /^[a-f0-9]{40}$/.test(sha))throw Error('Invalid source');
 const p=JSON.parse(readFileSync(join(dir,'packaging-source.json')));
 if(p.tag!==tag||p.sha!==sha||p.version!==tag.slice(1))throw Error('Source manifest mismatch');
 const files=readdirSync(dir).filter(f=>/\.(AppImage|deb|dmg|zip|exe)$/.test(f));
 for(const [ext,n]of[['AppImage',1],['deb',1],['dmg',1],['zip',1],['exe',2]])if(files.filter(f=>f.endsWith('.'+ext)).length!==n)throw Error('Incomplete package set');
 if(files.length!==6||files.some(f=>!f.includes(tag.slice(1))))throw Error('Wrong package version');
 const lines=readFileSync(join(dir,'SHA256SUMS.txt'),'utf8').trim().split('\n'),seen=new Set();
 for(const line of lines){const m=/^([a-f0-9]{64})  ([^/\\]+)$/.exec(line);if(!m||!files.includes(m[2])||seen.has(m[2]))throw Error('Invalid checksum manifest');seen.add(m[2]);if(createHash('sha256').update(readFileSync(join(dir,m[2]))).digest('hex')!==m[1])throw Error('Checksum mismatch');}
 if(seen.size!==6)throw Error('Missing checksum');
 return [...files,'SHA256SUMS.txt','packaging-source.json',...readdirSync(dir).filter(f=>f.endsWith('.asc')&&(files.includes(f.slice(0,-4))||f==='SHA256SUMS.txt.asc'))].map(f=>join(dir,f));
}
export function attachPackages({dir,tag,sha,confirmation,repo,runId},gh){
 if(confirmation!==`attach:${tag}@${sha}`||!/^\w[\w.-]*\/[\w.-]+$/.test(repo)||!/^\d+$/.test(runId))throw Error('Explicit attach approval required');
 const files=validatePackageSet(dir,tag,sha);
 const manifest=JSON.parse(readFileSync(join(dir,'packaging-source.json')));
 if(manifest.runId!==runId)throw Error('Artifact run mismatch');
 const api=p=>gh(['api',`repos/${repo}/${p}`]);
 const run=api(`actions/runs/${runId}`);
 if(run.path!=='.github/workflows/beta-packages.yml'||run.event!=='workflow_dispatch'||run.head_branch!=='main'||run.status!=='completed'||run.conclusion!=='success')throw Error('Successful approved package workflow required');
 if(manifest.toolingSha!==run.head_sha)throw Error('Tooling source mismatch');
 const ref=api(`git/ref/tags/${tag}`);if(ref.object.type!=='commit'||ref.object.sha!==sha)throw Error('Immutable tag mismatch');
 const rel=api(`releases/tags/${tag}`);if(rel.target_commitish!==sha||rel.assets?.length!==0)throw Error('Release target mismatch or assets already exist; inspect, never clobber');
 // One necessary write, no --clobber, no draft/tag/latest mutation. A partial upload is not retried blindly.
 gh(['release','upload',tag,...files,'--repo',repo]);return files;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const[dir,tag,sha,confirmation,repo,runId]=process.argv.slice(2);const gh=args=>{const s=execFileSync('gh',args,{encoding:'utf8'});return args[0]==='api'?JSON.parse(s):s;};attachPackages({dir,tag,sha,confirmation,repo,runId},gh);}
