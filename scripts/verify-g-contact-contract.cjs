const fs = require('node:fs');
const assert = require('node:assert/strict');
const built = fs.readFileSync('dist/public/index.html', 'utf8');
const contact = fs.readFileSync('client/src/pages/Contact.tsx', 'utf8');
const gateway = fs.readFileSync('server/services/gIntelligenceGateway.ts', 'utf8');
const registry = fs.readFileSync('client/src/intelligence/actionRegistry.ts', 'utf8');
assert.match(built, /<form name="ocg-contact" data-netlify="true"/, 'Netlify must discover the form in built HTML');
for (const field of ['form-name','bot-field','role','name','email','phone','message','details']) {
  assert.match(built, new RegExp('name="' + field + '"'), 'missing registered form field: ' + field);
}
assert.match(contact, /"form-name": "ocg-contact"/, 'submit name must match deployed form');
assert.match(contact, /if \(!response\.ok\) throw/, 'must reject failed submissions');
assert.match(contact, /Your request was accepted for delivery/, 'success must be gated on response');
assert.match(contact, /sessionStorage\.removeItem\("ocg:g-contact-handoff"\)/, 'handoff must not persist after consumption');
assert.match(gateway, /\["\/sell", "\/invest", "\/contact", "\/"\]\.includes\(args\.path\)/, 'page tool paths must be allowlisted');
assert.match(registry, /Unapproved navigation/, 'navigation must fail closed');
console.log('PASS: 8 contact handoff and deployed HTML contract checks');

