import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(__dirname, '..', '..');
const read = (p: string) => readFileSync(resolve(root, p), 'utf8');

const PUBLIC_ROUTES = [
  '/', '/about', '/services', '/invest', '/how-it-works', '/marketplace',
  '/lender-network', '/case-studies', '/contact', '/submit-deal', '/sell',
  '/privacy', '/terms', '/g',
];

describe('site completion: discovery + metadata', () => {
  it('ships robots.txt that allows the public site, excludes admin, and points at the sitemap', () => {
    const robots = read('client/public/robots.txt');
    expect(robots).toContain('Allow: /');
    expect(robots).toContain('Disallow: /admin/');
    expect(robots).toContain('Sitemap: https://www.ocgict.com/sitemap.xml');
  });

  it('sitemap lists every public route and nothing under /admin', () => {
    const sitemap = read('client/public/sitemap.xml');
    for (const route of PUBLIC_ROUTES) {
      expect(sitemap).toContain(`<loc>https://www.ocgict.com${route}</loc>`);
    }
    expect(sitemap).not.toContain('/admin');
  });

  it('llms.txt describes the company for AI answer engines', () => {
    const llms = read('client/public/llms.txt');
    expect(llms).toContain('The OC Group');
    expect(llms).toContain('Wichita');
    expect(existsSync(resolve(root, 'client/public/llms.txt'))).toBe(true);
  });

  it('index.html carries structured data, canonical, and social metadata', () => {
    const html = read('client/index.html');
    expect(html).toContain('application/ld+json');
    expect(html).toContain('"RealEstateAgent"');
    expect(html).toContain('rel="canonical"');
    expect(html).toContain('property="og:title"');
    expect(html).toContain('name="twitter:card"');
  });

  it('every public route is wired in the router and /invest renders the Invest page', () => {
    const app = read('client/src/App.tsx');
    for (const route of PUBLIC_ROUTES) {
      if (route === '/') continue;
      expect(app).toContain(`path="${route}"`);
    }
    expect(app).toContain('<Route path="/invest" component={Invest} />');
    expect(app).toContain('PAGE_TITLES');
  });
});
