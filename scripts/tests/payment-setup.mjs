import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import ts from 'typescript';
const source=fs.readFileSync('supabase/functions/setup-request-payment/index.ts','utf8').replace(/^import .*\n/gm,'');
const code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const seeker='00000000-0000-4000-8000-000000000001',helper='00000000-0000-4000-8000-000000000002',request='00000000-0000-4000-8000-000000000003';
async function run({action='prepare',prior=false,complete=false,forged=false,verified=true,owner=true,email=true,consent=true,origin='https://www.elpyo.com'}={}){
 let handler;const calls=[];
 const rows={requests:{id:request,seeker_id:owner?seeker:'other',status:'aperta'},request_applications:{id:'application'},profiles:[{id:seeker,verified:true},{id:helper,verified}],request_payment_setup:prior?{session_id:'cs_existing',customer_id:'cus_payer'}:null,payment_customers:{customer_id:'cus_payer'}};
 const admin={auth:{getUser:async()=>({data:{user:{id:seeker,email:'test@example.test',email_confirmed_at:email?'today':null}}})},from:table=>{
  let mutation=null;const query={select(){return query},eq(){return query},in(){return query},single:async()=>({data:rows[table]}),maybeSingle:async()=>({data:rows[table]}),update(data){mutation=data;return query},upsert:async data=>{calls.push([table,data]);return{}},then(resolve){if(mutation)calls.push([table,mutation]);resolve({data:rows[table]})}};return query;
 }};
 const stripe={paymentMethods:{retrieve:async()=>({customer:'cus_payer'}),update:async()=>({})},checkout:{sessions:{retrieve:async()=>({id:'cs_existing',mode:'setup',customer:'cus_payer',client_reference_id:forged?'other':seeker,metadata:{requestId:request,helperId:helper,saveMethodConsent:'true'},status:complete?'complete':'open',setup_intent:{id:'seti_test',status:complete?'succeeded':'requires_payment_method',payment_method:complete?'pm_test':null},url:'https://checkout.stripe.com/existing'}),create:async data=>{calls.push(['stripe-session',data]);return{id:'cs_new',url:'https://checkout.stripe.com/new'}}}},customers:{create:async()=>{throw Error('Unexpected customer creation')}}};
 vm.runInNewContext(code,{Deno:{env:{get:key=>({SITE_URL:'https://www.elpyo.com',STRIPE_SECRET_KEY:'test',SUPABASE_URL:'https://example.supabase.co',SERVICE_ROLE_KEY:'test'}[key])},serve:fn=>handler=fn},Stripe:class{constructor(){return stripe}},createClient:()=>admin,URL,Response});
 const response=await handler({method:'POST',headers:new Headers({origin,authorization:'Bearer test'}),json:async()=>({requestId:request,helperId:helper,action,saveMethodConsent:consent})});return{status:response.status,body:await response.json(),calls};
}
let r=await run();assert.equal(r.status,200);assert.equal(r.body.ready,false);assert.equal(r.calls.find(c=>c[0]==='stripe-session')[1].mode,'setup');assert.ok(!r.calls.find(c=>c[0]==='stripe-session')[1].line_items);
r=await run({prior:true,complete:true});assert.equal(r.body.ready,true);assert.ok(r.calls.some(c=>c[0]==='request_payment_setup'&&c[1]?.ready));assert.ok(!r.calls.some(c=>c[0]==='stripe-session'));
for(const options of [{consent:false},{owner:false},{verified:false},{email:false},{origin:'https://other.test'}]){r=await run(options);assert.ok(r.status>=400);assert.equal(r.calls.length,0)}
r=await run({prior:true,complete:true,forged:true,action:'status'});assert.equal(r.body.ready,false);assert.equal(r.calls.length,0);
r=await run({prior:true,action:'status'});assert.equal(r.body.ready,false);assert.equal(r.calls.length,0);
r=await run({prior:true});assert.equal(r.body.url,'https://checkout.stripe.com/existing');assert.equal(r.calls.length,0);
console.log('PASS payment setup: authenticated verified owner only, unpaid setup creates no charge, Stripe ownership/intent checks, pending/cancelled return cannot confirm, existing session reused');
