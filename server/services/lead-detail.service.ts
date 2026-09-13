import mongoose from 'mongoose';
import { connectToDatabase } from '../db/connection';
import User from '../models/User';
import Consultation from '../models/Consultation';
import UtmCampaign from '../models/UtmCampaign';

export interface LeadConsultationHistoryItem {
  id: string;
  interest: string;
  message?: string;
  createdAt: string;
}

export interface LeadUtmTouchpointHistoryItem {
  id: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  route?: string;
  platform?: string;
  gclid?: string;
  fbclid?: string;
  fbp?: string;
  fbc?: string;
  matchtype?: string;
  network?: string;
  device?: string;
  keyword?: string;
  placement?: string;
  campaignid?: string;
  adgroupid?: string;
  createdAt: string;
}

export interface LeadDetailResponse {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    countryCode: string;
    timezone: string;
    status: 'ACTIVE' | 'DELETED' | 'ONHOLD';
    createdAt: string;
    updatedAt: string;
  };
  consultations: LeadConsultationHistoryItem[];
  touchpoints: LeadUtmTouchpointHistoryItem[];
  isAttributed: boolean;
}

export async function getLeadDetailById(id: string): Promise<LeadDetailResponse | null> {
  await connectToDatabase();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  const userObjectId = new mongoose.Types.ObjectId(id);

  const [user, consultations, touchpoints] = await Promise.all([
    User.findById(userObjectId).lean<{
      _id: mongoose.Types.ObjectId;
      name: string;
      email: string;
      phone: string;
      countryCode: string;
      timezone: string;
      status: 'ACTIVE' | 'DELETED' | 'ONHOLD';
      createdAt: Date;
      updatedAt: Date;
    }>(),
    Consultation.find({ userId: userObjectId })
      .sort({ createdAt: -1 })
      .lean<Array<{
        _id: mongoose.Types.ObjectId;
        interest: string;
        message?: string;
        createdAt: Date;
      }>>(),
    UtmCampaign.find({ userId: userObjectId })
      .sort({ createdAt: -1 })
      .lean<Array<{
        _id: mongoose.Types.ObjectId;
        utm_source?: string;
        utm_medium?: string;
        utm_campaign?: string;
        utm_content?: string;
        utm_term?: string;
        route?: string;
        platform?: string;
        gclid?: string;
        fbclid?: string;
        fbp?: string;
        fbc?: string;
        matchtype?: string;
        network?: string;
        device?: string;
        keyword?: string;
        placement?: string;
        campaignid?: string;
        adgroupid?: string;
        createdAt: Date;
      }>>(),
  ]);

  if (!user) {
    return null;
  }

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      countryCode: user.countryCode || '+91',
      timezone: user.timezone || 'Asia/Kolkata',
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    },
    consultations: consultations.map((c) => ({
      id: c._id.toString(),
      interest: c.interest,
      message: c.message || undefined,
      createdAt: c.createdAt.toISOString(),
    })),
    touchpoints: touchpoints.map((t) => ({
      id: t._id.toString(),
      utm_source: t.utm_source || undefined,
      utm_medium: t.utm_medium || undefined,
      utm_campaign: t.utm_campaign || undefined,
      utm_content: t.utm_content || undefined,
      utm_term: t.utm_term || undefined,
      route: t.route || undefined,
      platform: t.platform || undefined,
      gclid: t.gclid || undefined,
      fbclid: t.fbclid || undefined,
      fbp: t.fbp || undefined,
      fbc: t.fbc || undefined,
      matchtype: t.matchtype || undefined,
      network: t.network || undefined,
      device: t.device || undefined,
      keyword: t.keyword || undefined,
      placement: t.placement || undefined,
      campaignid: t.campaignid || undefined,
      adgroupid: t.adgroupid || undefined,
      createdAt: t.createdAt.toISOString(),
    })),
    isAttributed: touchpoints.length > 0,
  };
}
