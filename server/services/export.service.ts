import mongoose from 'mongoose';
import { connectToDatabase } from '../db/connection';
import User from '../models/User';
import { getDateRangeBounds, formatToIstDate, formatToIstDateTime } from '../utils/timezone';
import { escapeRegex, sanitizeCsvValue } from '../utils/sanitize';
import { LeadsQueryFilters } from './leads.service';

const EXPORT_MAX_LIMIT = 1000;

interface ExportLeadAggregationResult {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  status: 'ACTIVE' | 'DELETED' | 'ONHOLD';
  createdAt: Date;
  consultations: Array<{ interest: string; createdAt: Date }>;
  touchpoints: Array<{
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
    route?: string;
    createdAt: Date;
  }>;
}

export async function generateLeadsCsv(filters: Omit<LeadsQueryFilters, 'page' | 'limit'>): Promise<string> {
  await connectToDatabase();

  const {
    period = 'today',
    customStartDate,
    customEndDate,
    search,
    status,
    interest,
    utm_source,
    utm_medium,
    utm_campaign,
    sort = 'newest',
  } = filters;

  const { startUTC, endUTC } = getDateRangeBounds(period, customStartDate, customEndDate);

  const userMatch: Record<string, unknown> = {
    createdAt: { $gte: startUTC, $lt: endUTC },
  };

  if (status) {
    userMatch.status = status;
  }

  if (search && search.trim()) {
    const escaped = escapeRegex(search.trim());
    userMatch.$or = [
      { name: { $regex: escaped, $options: 'i' } },
      { email: { $regex: escaped, $options: 'i' } },
      { phone: { $regex: escaped, $options: 'i' } },
    ];
  }

  const pipeline: mongoose.PipelineStage[] = [
    { $match: userMatch },
    {
      $lookup: {
        from: 'consultations',
        localField: '_id',
        foreignField: 'userId',
        as: 'consultations',
      },
    },
    {
      $lookup: {
        from: 'utm_campaigns',
        localField: '_id',
        foreignField: 'userId',
        as: 'touchpoints',
      },
    },
  ];

  if (interest && interest.trim()) {
    pipeline.push({
      $match: { 'consultations.interest': interest.trim() },
    });
  }

  if (utm_source && utm_source.trim()) {
    pipeline.push({
      $match: { 'touchpoints.utm_source': utm_source.trim() },
    });
  }

  if (utm_medium && utm_medium.trim()) {
    pipeline.push({
      $match: { 'touchpoints.utm_medium': utm_medium.trim() },
    });
  }

  if (utm_campaign && utm_campaign.trim()) {
    pipeline.push({
      $match: { 'touchpoints.utm_campaign': utm_campaign.trim() },
    });
  }

  const sortDirection = sort === 'oldest' ? 1 : -1;
  pipeline.push({ $sort: { createdAt: sortDirection } });
  pipeline.push({ $limit: EXPORT_MAX_LIMIT });

  const rawLeads = await User.aggregate<ExportLeadAggregationResult>(pipeline);

  const headers = [
    'Serial Number',
    'Name',
    'Country Code',
    'Phone',
    'Email',
    'Status',
    'Created Date (IST)',
    'Created Date & Time (IST)',
    'Latest Interest',
    'Total Enquiries',
    'Attributed (Yes/No)',
    'Latest UTM Source',
    'Latest UTM Medium',
    'Latest UTM Campaign',
    'Latest UTM Content',
    'Latest UTM Term',
    'Latest Landing Route',
  ];

  const rows: string[][] = [headers];

  rawLeads.forEach((u, index) => {
    const sortedConsultations = [...(u.consultations || [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const latestInterest = sortedConsultations[0]?.interest || 'N/A';

    const sortedTouchpoints = [...(u.touchpoints || [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const isAttributed = sortedTouchpoints.length > 0;
    const latestUtm = sortedTouchpoints[0] || {};

    const row = [
      String(index + 1),
      u.name || '',
      u.countryCode || '+91',
      u.phone || '',
      u.email || '',
      u.status || 'ACTIVE',
      formatToIstDate(u.createdAt),
      formatToIstDateTime(u.createdAt),
      latestInterest,
      String(u.consultations?.length || 0),
      isAttributed ? 'Yes' : 'No',
      latestUtm.utm_source || 'Direct',
      latestUtm.utm_medium || '',
      latestUtm.utm_campaign || '',
      latestUtm.utm_content || '',
      latestUtm.utm_term || '',
      latestUtm.route || '',
    ];

    rows.push(row);
  });

  // UTF-8 BOM + CSV string with formula sanitization and RFC 4180 quoting
  const csvContent =
    '\uFEFF' +
    rows
      .map((row) => row.map((cell) => sanitizeCsvValue(cell)).join(','))
      .join('\r\n');

  return csvContent;
}
