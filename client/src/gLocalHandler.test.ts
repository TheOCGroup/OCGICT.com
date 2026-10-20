import { describe, it, expect } from 'vitest';
import handler from '../../netlify/functions/g-chat';
describe('G local-only handler smoke', () => {
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
