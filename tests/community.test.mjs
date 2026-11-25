import assert from 'node:assert/strict';
import {randomBytes, randomUUID} from 'node:crypto';
import test from 'node:test';
import {createCommunityServer,openCommunityDatabase} from '../server/community.mjs';
import {parseSubmission} from '../server/submissions.mjs';

const origin = 'https://subtlesayak.github.io';
const moderatorToken = randomBytes(32).toString('base64url');

test('submission formats validate consent, scores, dates and public evidence', () => {
  const review = {kind:'review',consent:true,fields:{
    place_id:'mpdb-7b2be6dd7ad3',visited_on:'2026-01-01',
    pastry:'8',filling:'7',egg:'8',freshness:'8',value:'9',review_note:'Private review fixture',
  }};
  assert.equal(parseSubmission(review).license,'CC BY 4.0');
  assert.throws(()=>parseSubmission({...review,consent:false}),/permission/);
  assert.throws(()=>parseSubmission({...review,fields:{...review.fields,pastry:'11'}}),/pastry/);
  assert.throws(()=>parseSubmission({...review,fields:{...review.fields,visited_on:'2026-02-30'}}),/visited on/);
  assert.throws(()=>parseSubmission({kind:'correction',consent:true,fields:{
    place_id:'mpdb-7b2be6dd7ad3',correction:'Example',evidence:'https://username:password@example.org/',
  }}),/evidence/);
});

test('anonymous submissions, retries, receipts and authenticated moderation', async () => {
  const db = openCommunityDatabase(':memory:');
  const server = createCommunityServer({db,origins:[origin],moderatorToken});
  await new Promise((resolve,reject)=>server.listen(0,'127.0.0.1',resolve).once('error',reject));
  const base = 'http://127.0.0.1:' + server.address().port;
  const request = (route, {method='GET',body,token,requestOrigin=origin}={}) => fetch(base + route, {
    method,
    headers:{Origin:requestOrigin,...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer ' + token}:{})},
    body:body?JSON.stringify(body):undefined,
  });
  try {
    const id = randomUUID();
    const token = randomBytes(32).toString('base64url');
    const submission = {id,token,consent:true,kind:'heritage',fields:{story_title:'Test fixture',story:'A contributor story for this test only.'}};
    const result = await request('/v1/submissions',{method:'POST',body:submission});
    assert.equal(result.status,201);
    assert.equal(result.headers.get('access-control-allow-origin'),origin);
    const statusRoute = '/v1/submissions/' + id;
    assert.equal((await request(statusRoute)).status,404);
    assert.equal((await (await request(statusRoute,{token})).json()).status,'pending');
    assert.equal((await request('/v1/submissions',{method:'POST',body:submission})).status,200);
    assert.equal((await request('/v1/submissions',{method:'POST',body:{...submission,fields:{...submission.fields,story:'Different'} }})).status,409);
    assert.equal((await request('/v1/submissions',{method:'POST',body:submission,requestOrigin:'https://other.invalid'})).status,403);
    const queue = '/v1/moderation/submissions';
    assert.equal((await request(queue)).status,401);
    assert.equal((await (await request(queue,{token:moderatorToken})).json()).submissions.length,1);
    const approve = await request(queue + '/' + id,{method:'PATCH',token:moderatorToken,body:{status:'approved'}});
    assert.equal(approve.status,200);
    const withoutEvidence = await request(queue + '/' + id,{method:'PATCH',token:moderatorToken,body:{status:'published'}});
    assert.equal(withoutEvidence.status,422);
    const reference = 'https://github.com/subtlesayak/Mutta-Puffs-Database/pull/1';
    const published = await request(queue + '/' + id,{method:'PATCH',token:moderatorToken,body:{status:'published',reference}});
    assert.equal(published.status,200);
    assert.equal((await (await request(statusRoute,{token})).json()).reference,reference);
    assert.equal((await (await request(statusRoute,{token})).json()).submission,undefined);
  } finally {
    await new Promise(resolve=>server.close(resolve));
    db.close();
  }
});
