const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),ts=require('typescript');
const source=fs.readFileSync(__dirname+'/../src/lib/homeAds.ts','utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function env({marketing=false,gpc=false,path='/'}={}){
 const scripts=[],ios=[],mos=[],intervals=[],timeouts=[],listeners={},callbacks=[];let reloads=0;
 const window={addEventListener:(n,f)=>(listeners[n]??=[]).push(f),removeEventListener:(n,f)=>listeners[n]=listeners[n]?.filter(x=>x!==f)};
 const context={exports:{},window,location:{pathname:path,hash:'',search:'',reload:()=>reloads++},navigator:{globalPrivacyControl:gpc},localStorage:{getItem:()=>JSON.stringify({marketing})},URLSearchParams,
 document:{createElement:()=>({}),head:{append:s=>scripts.push(s)}},
 IntersectionObserver:class{constructor(cb){ios.push(cb)}observe(){}disconnect(){}},MutationObserver:class{constructor(cb){mos.push(cb)}observe(){}disconnect(){}},
 setInterval:f=>(intervals.push(f),f),clearInterval(){},setTimeout:f=>(timeouts.push(f),f),clearTimeout(){}};
 vm.runInNewContext(code,context);
 const slot=()=>{const ins={status:null,getAttribute(){return this.status}};return {hidden:false,clientWidth:800,parentElement:{},querySelector:()=>ins,ins}};
 return {api:context.exports,context,window,scripts,ios,mos,intervals,timeouts,slot,callbacks,reloads:()=>reloads,
 cmp:()=>{window.__tcfapi=(cmd,v,cb)=>{if(cmd==='addEventListener')callbacks.push(cb)}},tick:()=>intervals.forEach(f=>f()),near:()=>ios.forEach(f=>f([{isIntersecting:true}]))};
}
const valid={cmpStatus:'loaded',eventStatus:'useractioncomplete',gdprApplies:true,tcString:'test',cmpId:300,tcfPolicyVersion:4,vendor:{consents:{755:true}},purpose:{consents:Object.fromEntries([1,2,3,4,7,9,10].map(i=>[i,true]))}};
(async()=>{
 for(const config of [{},{marketing:true,gpc:true},{marketing:true,path:'/account'}]){const e=env(config),s=e.slot();e.api.mountHomeAd(s);e.near();assert.equal(e.scripts.length,0);assert.equal(s.hidden,true)}
 const e=env({marketing:true}),a=e.slot(),b=e.slot();const clean=e.api.mountHomeAd(a);e.api.mountHomeAd(b);assert.equal(e.scripts.length,1);assert.equal(e.window.adsbygoogle.pauseAdRequests,1);assert.equal(e.window.adsbygoogle.length,0);
 e.scripts[0].onload();await Promise.resolve();e.cmp();e.tick();assert.equal(e.callbacks.length,2);
 e.callbacks.forEach(f=>f(valid,true));assert.equal(e.window.adsbygoogle.length,0);e.near();assert.equal(e.window.adsbygoogle.length,2);assert.equal(a.hidden,false);e.tick();e.near();assert.equal(e.window.adsbygoogle.length,2);
 b.ins.status='unfilled';e.mos[1]();assert.equal(b.hidden,true);
 e.callbacks[0]({...valid,vendor:{consents:{755:false}}},true);assert.equal(a.hidden,true);assert.equal(e.window.adsbygoogle.pauseAdRequests,1);assert.equal(e.reloads(),1);clean();
 const f=env({marketing:true}),s=f.slot();f.api.mountHomeAd(s);f.scripts[0].onerror();await Promise.resolve();await Promise.resolve();f.near();assert.equal(s.hidden,true);
 const p=env();assert.equal(p.api.validAdvertisingConsent(valid,true),true);for(const bad of [{...valid,tcString:''},{...valid,cmpStatus:'error'},{...valid,publisher:{restrictions:{1:{755:0}}}},{...valid,eventStatus:'cmpuishown'}])assert.equal(p.api.validAdvertisingConsent(bad,true),false);
 p.context.location.search='?access_token=private';assert.equal(p.api.safeHome(),false);p.context.location.search='?utm_source=fb&utm_content=120252895990710380';assert.equal(p.api.safeHome(),true);
 console.log('PASS: no-consent/GPC/private-route, paused single bootstrap, late CMP, two lazy slots/no duplicates, unfilled, revocation, loader error, invalid TCF/restrictions, safe URLs. No network or ad clicks.');
})().catch(e=>{console.error(e);process.exitCode=1});
