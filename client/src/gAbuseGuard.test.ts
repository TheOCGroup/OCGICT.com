import { describe, it, expect } from "vitest";
import { GAbuseGuard } from "../../server/services/gAbuseGuard";
describe("G conservative abuse guard", () => {
  it("does not flag ordinary exploration or repeated short answers", () => {
    for(let i=0;i<10;i++) expect(GAbuseGuard.assess("normal-test", "Yes",1000+i)).toBe("allow");
  });
  it("limits repeated long identical payloads without saving raw messages", () => {
    const spam = "BUY NOW ".repeat(18);
    for(let i=0;i<4;i++) expect(GAbuseGuard.assess("repeat-test",spam,2000+i)).toBe("allow");
    expect(GAbuseGuard.assess("repeat-test",spam,2005)).toBe("slow_down");
    expect(GAbuseGuard.assess("repeat-test","I need a seller consultation",2006)).toBe("allow");
  });
  it("resets repeated payload count after expiry", () => {
    const input="Repeated example text ".repeat(8);
    for(let i=0;i<5;i++) GAbuseGuard.assess("expiry-test",input,3000+i);
    expect(GAbuseGuard.assess("expiry-test",input,124000)).toBe("allow");
  });
});
