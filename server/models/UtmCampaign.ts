import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUtmCampaign extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
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
  clientIp?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UtmCampaignSchema: Schema<IUtmCampaign> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    utm_source: { type: String, required: false, trim: true },
    utm_medium: { type: String, required: false, trim: true },
    utm_campaign: { type: String, required: false, trim: true },
    utm_content: { type: String, required: false, trim: true },
    utm_term: { type: String, required: false, trim: true },
    route: { type: String, required: false, trim: true },
    platform: { type: String, required: false, trim: true },
    gclid: { type: String, required: false, trim: true },
    fbclid: { type: String, required: false, trim: true },
    fbp: { type: String, required: false, trim: true },
    fbc: { type: String, required: false, trim: true },
    matchtype: { type: String, required: false, trim: true },
    network: { type: String, required: false, trim: true },
    device: { type: String, required: false, trim: true },
    keyword: { type: String, required: false, trim: true },
    placement: { type: String, required: false, trim: true },
    campaignid: { type: String, required: false, trim: true },
    adgroupid: { type: String, required: false, trim: true },
    clientIp: { type: String, required: false, trim: true },
    userAgent: { type: String, required: false, trim: true },
  },
  {
    timestamps: true,
    autoIndex: false,
  }
);

UtmCampaignSchema.index({ createdAt: -1 });
UtmCampaignSchema.index({ userId: 1, utm_source: 1, utm_campaign: 1 });

const UtmCampaign: Model<IUtmCampaign> =
  mongoose.models.UtmCampaign || mongoose.model<IUtmCampaign>('UtmCampaign', UtmCampaignSchema, 'utm_campaigns');

export default UtmCampaign;
