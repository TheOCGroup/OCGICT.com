import { describe, it, expect } from 'vitest';
import handler from '../../netlify/functions/g-chat';
describe('G local-only handler smoke', () => {
  it('allows local greeting only for a preview and never production with chat off', async () => {
    const previous = process.env.OCG_G_CHAT_ENABLED;
    const previousMode = process.env.GEMINI_AUTH_MODE;
    const previousKey = process.env.GEMINI_API_KEY;
    const previousGoogle = process.env.GOOGLE_API_KEY;
    try {
      delete process.env.OCG_G_CHAT_ENABLED;
      delete process.env.GEMINI_AUTH_MODE;
      delete process.env.GEMINI_API_KEY;
      delete process.env.GOOGLE_API_KEY;
      const req = () => new Request('https://example.invalid/api/g/chat', {method:'POST',headers:{'Content-Type':'application/json'},body: JSON.stringify({sessionId:'preview-qa',message:'Hello G'})});
      expect((await handler(req(), {deploy:{context:'production'}})).status).toBe(503);
      const response = await handler(req(), {deploy:{context:'deploy-preview'}});
      expect(response.status).toBe(200);
      expect((await response.json()).provider).toBe('OCG_LOCAL_GREETING');
    } finally {
      for(const [k,v] of Object.entries({OCG_G_CHAT_ENABLED:previous,GEMINI_AUTH_MODE:previousMode,GEMINI_API_KEY:previousKey,GOOGLE_API_KEY:previousGoogle})) if(v===undefined) delete process.env[k]; else process.env[k]=v;
    }
  });
  it('forces deterministic preview mode even if paid-model credentials are configured', async () => {
    const original={ key:process.env.GEMINI_API_KEY, enabled:process.env.OCG_G_CHAT_ENABLED, approval:process.env.OCG_G_PAID_MODEL_APPROVED };
    try {
      process.env.GEMINI_API_KEY='test-placeholder-not-a-real-key';
      delete process.env.OCG_G_CHAT_ENABLED;
      delete process.env.OCG_G_PAID_MODEL_APPROVED;
      const req=()=>new Request('https://example.invalid/api/g/chat', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'preview-local-provider-qa',message:'I would like to sell my house'})});
      const response=await handler(req(), {deploy:{context:'deploy-preview'}});
      expect(response.status).toBe(200);
      const payload=await response.json();
      expect(payload.provider).not.toBe('Gemini');
      expect((await handler(req(), {deploy:{context:'production'}})).status).toBe(503);
    } finally {
      for (const [key,value] of Object.entries({GEMINI_API_KEY:original.key,OCG_G_CHAT_ENABLED:original.enabled,OCG_G_PAID_MODEL_APPROVED:original.approval})) if(value===undefined) delete process.env[key]; else process.env[key]=value;
    }
  });
  it('returns the greeting without model billing', async () => {
    const prior = {enabled:process.env.OCG_G_CHAT_ENABLED, mode:process.env.GEMINI_AUTH_MODE,key:process.env.GEMINI_API_KEY,google:process.env.GOOGLE_API_KEY};
    try {
      process.env.OCG_G_CHAT_ENABLED='true';
      delete process.env.GEMINI_AUTH_MODE;
      delete process.env.GEMINI_API_KEY;
      delete process.env.GOOGLE_API_KEY;
      const request = new Request('https://example.invalid/api/g/chat', { method: 'POST',headers:{'Content-Type':'application/json'}, body: JSON.stringify({sessionId:'local-qa',message:'Hello G'}) });
      const result = await handler(request);
      expect(result.status).toBe(200);
      const payload=await result.json();
      expect(payload.provider).toBe('OCG_LOCAL_GREETING');
    } finally {
      for(const [k,v] of Object.entries({OCG_G_CHAT_ENABLED:prior.enabled,GEMINI_AUTH_MODE:prior.mode,GEMINI_API_KEY:prior.key,GOOGLE_API_KEY:prior.google})) if(v===undefined) delete process.env[k]; else process.env[k]=v;
    }
  });
});


