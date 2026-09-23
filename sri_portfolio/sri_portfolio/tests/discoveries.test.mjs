import test from 'node:test';
import assert from 'node:assert/strict';
import {terminalReply,discoveries} from '../app/lib/discoveries.mjs';
import {discoveryIds} from '../app/lib/contact-validation.mjs';
test('discovery events are restricted to the actual collection',()=>assert.deepEqual(discoveries.map(d=>d.id).sort(),[...discoveryIds].sort()));
test('the local terminal treats shell and markup as inert input',()=>{
 for(const command of ['<script>alert(1)</script>','rm -rf /','$(whoami)','curl https://example.com'])assert.deepEqual(terminalReply(command),{text:'That one isn’t in this little console yet. Try help.'});
 assert.equal(terminalReply('  NINE-NINE ').discovery,'nine-nine');
 assert.equal(terminalReply('resume').link,'/resume');
 assert.equal(terminalReply('clear').clear,true);
});
