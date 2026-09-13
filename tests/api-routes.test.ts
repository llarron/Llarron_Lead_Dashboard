import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as statsHandler } from '../app/api/stats/route';
import { GET as leadsHandler } from '../app/api/leads/route';
import { GET as filterOptionsHandler } from '../app/api/filter-options/route';
import { GET as exportHandler } from '../app/api/export/route';
import { GET as leadDetailHandler } from '../app/api/leads/[id]/route';

describe('API Route Handlers, Security Headers & Error Sanitization', () => {
  describe('/api/stats', () => {
    it('returns 400 Bad Request on unknown parameters', async () => {
      const req = new NextRequest('http://localhost:3000/api/stats?period=today&badParam=123');
      const res = await statsHandler(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(res.headers.get('Cache-Control')).toBe('no-store, private');
      expect(res.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
    });

    it('returns 400 Bad Request on invalid date format', async () => {
      const req = new NextRequest('http://localhost:3000/api/stats?period=custom&customStartDate=bad-date&customEndDate=2026-09-13');
      const res = await statsHandler(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 Bad Request on reversed custom dates', async () => {
      const req = new NextRequest('http://localhost:3000/api/stats?period=custom&customStartDate=2026-09-20&customEndDate=2026-09-10');
      const res = await statsHandler(req);
      expect(res.status).toBe(400);
    });
  });

  describe('/api/leads', () => {
    it('returns 400 Bad Request on malformed page number (e.g. 1abc)', async () => {
      const req = new NextRequest('http://localhost:3000/api/leads?page=1abc');
      const res = await leadsHandler(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it('returns 400 Bad Request on unsupported limit (e.g. limit=35)', async () => {
      const req = new NextRequest('http://localhost:3000/api/leads?limit=35');
      const res = await leadsHandler(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 Bad Request on oversized search query (>100 chars)', async () => {
      const req = new NextRequest(`http://localhost:3000/api/leads?search=${'a'.repeat(105)}`);
      const res = await leadsHandler(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 Bad Request on unsupported status', async () => {
      const req = new NextRequest('http://localhost:3000/api/leads?status=SUSPENDED');
      const res = await leadsHandler(req);
      expect(res.status).toBe(400);
    });
  });

  describe('/api/leads/[id]', () => {
    it('returns 400 on malformed MongoDB ObjectId', async () => {
      const req = new NextRequest('http://localhost:3000/api/leads/invalid-id-123');
      const res = await leadDetailHandler(req, { params: Promise.resolve({ id: 'invalid-id-123' }) });
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain('Invalid lead ID format');
    });

    it('returns 404 or 503 on valid ObjectId that does not exist or DB offline', async () => {
      const req = new NextRequest('http://localhost:3000/api/leads/507f1f77bcf86cd799439011');
      const res = await leadDetailHandler(req, { params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }) });
      // Depending on DB availability in test runner, either 404 (if DB connected and not found) or 503 (if DB offline)
      expect([404, 503]).toContain(res.status);
    });
  });

  describe('/api/filter-options', () => {
    it('returns 400 Bad Request on unknown parameters', async () => {
      const req = new NextRequest('http://localhost:3000/api/filter-options?extra=junk');
      const res = await filterOptionsHandler(req);
      expect(res.status).toBe(400);
    });
  });

  describe('/api/export', () => {
    it('returns 400 Bad Request on unknown parameters', async () => {
      const req = new NextRequest('http://localhost:3000/api/export?unauthorized=true');
      const res = await exportHandler(req);
      expect(res.status).toBe(400);
    });
  });
});
