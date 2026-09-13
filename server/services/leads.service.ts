import mongoose from 'mongoose';
import { connectToDatabase } from '../db/connection';
import User from '../models/User';
import { getDateRangeBounds } from '../utils/timezone';
import { escapeRegex } from '../utils/sanitize';

export interface LeadListItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  timezone: string;
  status: 'ACTIVE' | 'DELETED' | 'ONHOLD';
  createdAt: string;
  consultationCount: number;
  latestInterest: string | null;
  isAttributed: boolean;
  latestUtmSource: string | null;
  latestUtmCampaign: string | null;
}

export interface LeadsListResponse {
  leads: LeadListItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface LeadsQueryFilters {
  period: 'today' | '7days' | 'custom';
  customStartDate?: string;
  customEndDate?: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: 'ACTIVE' | 'DELETED' | 'ONHOLD';
  interest?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  sort?: 'newest' | 'oldest';
}

export async function getLeadsList(filters: LeadsQueryFilters): Promise<LeadsListResponse> {
  await connectToDatabase();

  const {
    period = 'today',
    customStartDate,
    customEndDate,
    page = 1,
    limit = 25,
    search,
    status,
    interest,
    utm_source,
    utm_medium,
    utm_campaign,
    sort = 'newest',
  } = filters;

  const { startUTC, endUTC } = getDateRangeBounds(period, customStartDate, customEndDate);

  // 1. Base date range match on User document
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

  // Build aggregation pipeline
  const pipeline: mongoose.PipelineStage[] = [
    { $match: userMatch },
    // Lookup all-time consultations for this user
    {
      $lookup: {
        from: 'consultations',
        localField: '_id',
        foreignField: 'userId',
        as: 'consultations',
      },
    },
    // Lookup all-time UTM campaign touchpoints for this user
    {
      $lookup: {
        from: 'utm_campaigns',
        localField: '_id',
        foreignField: 'userId',
        as: 'touchpoints',
      },
    },
  ];

  // 2. Joined filters matching all-time linked records
  if (interest && interest.trim()) {
    pipeline.push({
      $match: {
        'consultations.interest': interest.trim(),
      },
    });
  }

  if (utm_source && utm_source.trim()) {
    pipeline.push({
      $match: {
        'touchpoints.utm_source': utm_source.trim(),
      },
    });
  }

  if (utm_medium && utm_medium.trim()) {
    pipeline.push({
      $match: {
        'touchpoints.utm_medium': utm_medium.trim(),
      },
    });
  }

  if (utm_campaign && utm_campaign.trim()) {
    pipeline.push({
      $match: {
        'touchpoints.utm_campaign': utm_campaign.trim(),
      },
    });
  }

  // Sort direction
  const sortDirection = sort === 'oldest' ? 1 : -1;

  // Facet for count and paginated items
  const skip = (page - 1) * limit;

  pipeline.push({
    $facet: {
      totalCount: [{ $count: 'count' }],
      paginatedResults: [
        { $sort: { createdAt: sortDirection } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            name: 1,
            email: 1,
            phone: 1,
            countryCode: 1,
            timezone: 1,
            status: 1,
            createdAt: 1,
            consultations: 1,
            touchpoints: 1,
          },
        },
      ],
    },
  });

  const [facetResult] = await User.aggregate<{
    totalCount: Array<{ count: number }>;
    paginatedResults: Array<{
      _id: mongoose.Types.ObjectId;
      name: string;
      email: string;
      phone: string;
      countryCode: string;
      timezone: string;
      status: 'ACTIVE' | 'DELETED' | 'ONHOLD';
      createdAt: Date;
      consultations: Array<{ interest: string; createdAt: Date }>;
      touchpoints: Array<{ utm_source?: string; utm_campaign?: string; createdAt: Date }>;
    }>;
  }>(pipeline);

  const total = facetResult?.totalCount?.[0]?.count || 0;
  const rawLeads = facetResult?.paginatedResults || [];

  const leads: LeadListItem[] = rawLeads.map((u) => {
    // Sort consultations chronologically to get latest
    const sortedConsultations = [...(u.consultations || [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const latestInterest = sortedConsultations[0]?.interest || null;

    // Sort touchpoints chronologically
    const sortedTouchpoints = [...(u.touchpoints || [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const isAttributed = sortedTouchpoints.length > 0;
    const latestUtmSource = sortedTouchpoints[0]?.utm_source || null;
    const latestUtmCampaign = sortedTouchpoints[0]?.utm_campaign || null;

    return {
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      phone: u.phone,
      countryCode: u.countryCode || '+91',
      timezone: u.timezone || 'Asia/Kolkata',
      status: u.status,
      createdAt: u.createdAt.toISOString(),
      consultationCount: u.consultations?.length || 0,
      latestInterest,
      isAttributed,
      latestUtmSource,
      latestUtmCampaign,
    };
  });

  return {
    leads,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}
