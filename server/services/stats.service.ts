import { connectToDatabase } from '../db/connection';
import User from '../models/User';
import Consultation from '../models/Consultation';
import UtmCampaign from '../models/UtmCampaign';
import { getDateRangeBounds } from '../utils/timezone';

export interface DashboardStats {
  period: 'today' | '7days' | 'custom';
  startDateStr: string;
  endDateStr: string;
  totalUniqueLeads: number;
  totalConsultations: number;
  attributedLeads: number;
  directLeads: number;
  topInterest: { name: string; count: number } | null;
  topSourceCampaign: { source: string; campaign?: string; count: number } | null;
}

export async function getDashboardStats(
  period: 'today' | '7days' | 'custom',
  customStartDate?: string,
  customEndDate?: string
): Promise<DashboardStats> {
  await connectToDatabase();

  const { startUTC, endUTC, startDateStr, endDateStr } = getDateRangeBounds(
    period,
    customStartDate,
    customEndDate
  );

  const dateFilter = { createdAt: { $gte: startUTC, $lt: endUTC } };

  // 1. Parallel execution of baseline metrics
  const [
    totalUniqueLeads,
    totalConsultations,
    topInterestAgg,
    topSourceAgg,
    attributedUsersAgg,
  ] = await Promise.all([
    // Total Unique Leads
    User.countDocuments(dateFilter),

    // Total Consultations
    Consultation.countDocuments(dateFilter),

    // Top Interest in period
    Consultation.aggregate<{ _id: string; count: number }>([
      { $match: dateFilter },
      { $match: { interest: { $exists: true, $nin: ['', null] } } },
      { $group: { _id: '$interest', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]),

    // Top Source / Campaign in period
    UtmCampaign.aggregate<{ _id: { source: string; campaign?: string }; count: number }>([
      { $match: dateFilter },
      { $match: { utm_source: { $exists: true, $nin: ['', null] } } },
      {
        $group: {
          _id: {
            source: '$utm_source',
            campaign: '$utm_campaign',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]),

    // Attributed vs Direct Leads created in the selected period
    User.aggregate<{ _id: boolean; count: number }>([
      { $match: dateFilter },
      {
        $lookup: {
          from: 'utm_campaigns',
          localField: '_id',
          foreignField: 'userId',
          as: 'touchpoints',
        },
      },
      {
        $project: {
          _id: 1,
          isAttributed: { $gt: [{ $size: '$touchpoints' }, 0] },
        },
      },
      {
        $group: {
          _id: '$isAttributed',
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  // Compute attributed vs direct counts
  let attributedLeads = 0;
  let directLeads = 0;

  for (const group of attributedUsersAgg) {
    if (group._id === true) {
      attributedLeads = group.count;
    } else {
      directLeads = group.count;
    }
  }

  // Safety fallback if total leads exists but no group matched
  if (totalUniqueLeads > 0 && attributedLeads === 0 && directLeads === 0) {
    directLeads = totalUniqueLeads;
  }

  const topInterest =
    topInterestAgg.length > 0
      ? { name: topInterestAgg[0]._id, count: topInterestAgg[0].count }
      : null;

  const topSourceCampaign =
    topSourceAgg.length > 0
      ? {
          source: topSourceAgg[0]._id.source,
          campaign: topSourceAgg[0]._id.campaign || undefined,
          count: topSourceAgg[0].count,
        }
      : null;

  return {
    period,
    startDateStr,
    endDateStr,
    totalUniqueLeads,
    totalConsultations,
    attributedLeads,
    directLeads,
    topInterest,
    topSourceCampaign,
  };
}
