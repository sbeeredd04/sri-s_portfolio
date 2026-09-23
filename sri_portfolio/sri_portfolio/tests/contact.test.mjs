import test from 'node:test';
import assert from 'node:assert/strict';
import { validateMessage, sameOrigin, mailDraft } from '../app/lib/contact-validation.mjs';
const valid={name:'A visitor',email:'hello@example.com',message:'A new idea.'};
test('contact accepts a bounded message and removes extra fields',()=>{
 assert.deepEqual(validateMessage({...valid,secret:'ignored'}),valid);
 for(const change of [{name:''},{email:'a\nb@example.com'},{message:'x'.repeat(3001)},{website:'spam.example'},{name:'a'.repeat(81)}]) assert.equal(validateMessage({...valid,...change}),null);
});
test('contact requires the website origin, including scheme and port',()=>{
 assert.equal(sameOrigin(new Request('https://site.test/api/contact',{headers:{origin:'https://site.test'}})),true);
 for(const origin of ['https://evil.test','http://site.test','https://site.test:444','null'])assert.equal(sameOrigin(new Request('https://site.test/api/contact',{headers:{origin}})),false);
});
test('email fallback carries the complete draft without allowing header injection',()=>{
 const url=new URL(mailDraft({...valid,message:'Hello & ideas? #1\nThanks!'}));
 assert.equal(url.pathname,'srisubspace@gmail.com');
 assert.equal(url.searchParams.get('subject'),'Hello from A visitor');
 assert.ok(url.searchParams.get('body').includes('Hello & ideas? #1\nThanks!'));
});
