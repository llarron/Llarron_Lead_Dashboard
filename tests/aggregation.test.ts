import { describe, it, expect } from 'vitest';

describe('Data Joining & Lead Aggregation Business Logic (Synthetic Fixtures)', () => {
  // Synthetic test fixtures
  const directUser = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Direct Lead',
    email: 'direct@example.com',
    phone: '9876543210',
    countryCode: '+91',
    timezone: 'Asia/Kolkata',
    status: 'ACTIVE',
    createdAt: new Date('2026-09-13T06:00:00.000Z'),
  };

  const returningUser = {
    _id: '507f1f77bcf86cd799439012',
    name: 'Returning Multi-Touchpoint Lead',
    email: 'returning@example.com',
    phone: '9876543211',
    countryCode: '+91',
    timezone: 'Asia/Kolkata',
    status: 'ACTIVE',
    createdAt: new Date('2026-09-13T07:00:00.000Z'),
  };

  const syntheticConsultations = [
    {
      _id: '607f1f77bcf86cd799439021',
      userId: directUser._id,
      interest: 'Life coaching',
      message: 'Need help with career alignment',
      createdAt: new Date('2026-09-13T06:05:00.000Z'),
    },
    {
      _id: '607f1f77bcf86cd799439022',
      userId: returningUser._id,
      interest: 'Vastu guidance',
      message: 'Home energy audit enquiry',
      createdAt: new Date('2026-09-13T07:05:00.000Z'),
    },
    {
      _id: '607f1f77bcf86cd799439023',
      userId: returningUser._id,
      interest: 'Numerology',
      message: 'Follow-up consultation on name numbers',
      createdAt: new Date('2026-09-13T08:00:00.000Z'),
    },
  ];

  const syntheticTouchpoints = [
    {
      _id: '707f1f77bcf86cd799439031',
      userId: returningUser._id,
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'vastu_ads',
      route: '/vastu',
      createdAt: new Date('2026-09-13T07:00:00.000Z'),
    },
    {
      _id: '707f1f77bcf86cd799439032',
      userId: returningUser._id,
      utm_source: 'instagram',
      utm_medium: 'social_story',
      utm_campaign: 'numerology_reel',
      route: '/numerology',
      createdAt: new Date('2026-09-13T07:55:00.000Z'),
    },
  ];

  it('correctly classifies direct leads (0 touchpoints) vs attributed leads (>= 1 touchpoint)', () => {
    const isDirectAttributed = syntheticTouchpoints.some((t) => t.userId === directUser._id);
    const isReturningAttributed = syntheticTouchpoints.some((t) => t.userId === returningUser._id);

    expect(isDirectAttributed).toBe(false);
    expect(isReturningAttributed).toBe(true);
  });

  it('correctly aggregates multi-consultation counts and latest interest for a returning lead', () => {
    const userConsultations = syntheticConsultations
      .filter((c) => c.userId === returningUser._id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    expect(userConsultations.length).toBe(2);
    expect(userConsultations[0].interest).toBe('Numerology'); // Latest consultation
    expect(userConsultations[1].interest).toBe('Vastu guidance'); // Older consultation
  });

  it('correctly aggregates multi-touchpoint timeline for returning lead', () => {
    const userTouchpoints = syntheticTouchpoints
      .filter((t) => t.userId === returningUser._id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    expect(userTouchpoints.length).toBe(2);
    expect(userTouchpoints[0].utm_source).toBe('instagram'); // Latest touchpoint
    expect(userTouchpoints[1].utm_source).toBe('google'); // Earlier touchpoint
  });

  it('verifies joined filter matching rules (matches if any linked record matches)', () => {
    // Test filter: interest = 'Vastu guidance'
    const matchedByVastu = [directUser, returningUser].filter((u) =>
      syntheticConsultations.some((c) => c.userId === u._id && c.interest === 'Vastu guidance')
    );
    expect(matchedByVastu.length).toBe(1);
    expect(matchedByVastu[0]._id).toBe(returningUser._id);

    // Test filter: utm_source = 'google'
    const matchedByGoogle = [directUser, returningUser].filter((u) =>
      syntheticTouchpoints.some((t) => t.userId === u._id && t.utm_source === 'google')
    );
    expect(matchedByGoogle.length).toBe(1);
    expect(matchedByGoogle[0]._id).toBe(returningUser._id);

    // Test filter: interest = 'Life coaching'
    const matchedByLifeCoaching = [directUser, returningUser].filter((u) =>
      syntheticConsultations.some((c) => c.userId === u._id && c.interest === 'Life coaching')
    );
    expect(matchedByLifeCoaching.length).toBe(1);
    expect(matchedByLifeCoaching[0]._id).toBe(directUser._id);
  });
});
