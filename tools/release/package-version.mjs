import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
export function packageVersion(root,tag,sha,confirmation,git=(args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim()){
 if(!/^v\d+\.\d+\.\d+-beta\.\d+$/.test(tag)||! /^[a-f0-9]{40}$/.test(sha))throw Error('Invalid tag or SHA');
 if(confirmation!==`${tag}@${sha}`)throw Error('Approval confirmation mismatch');
 if(git(['rev-parse','HEAD'])!==sha||git(['rev-parse',`${tag}^{commit}`])!==sha)throw Error('Source checkout/tag mismatch');
 const remote=git(['ls-remote','origin',`refs/tags/${tag}`,`refs/tags/${tag}^{}`]).split('\n').filter(Boolean).map(x=>x.split(/\s+/));
 const actual=remote.find(x=>x[1].endsWith('^{}'))??remote.find(x=>x[1]===`refs/tags/${tag}`);
 if(actual?.[0]!==sha)throw Error('Remote tag mismatch');
 const version=tag.slice(1),p=join(root,'desktop/package.json'),l=join(root,'desktop/package-lock.json');
 const pkg=JSON.parse(readFileSync(p)),lock=JSON.parse(readFileSync(l));
 pkg.version=version;lock.version=version;lock.packages[''].version=version;
 writeFileSync(p,JSON.stringify(pkg,null,2)+'\n');writeFileSync(l,JSON.stringify(lock,null,2)+'\n');
 return{tag,sha,version,kind:'version-only packaging overlay; game files from immutable source tag'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const [root,tag,sha,confirmation]=process.argv.slice(2);console.log(JSON.stringify(packageVersion(root,tag,sha,confirmation)));
}
