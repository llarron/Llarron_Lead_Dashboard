import { connectToDatabase } from '../db/connection';
import Consultation from '../models/Consultation';
import UtmCampaign from '../models/UtmCampaign';

export interface FilterOptionsResponse {
  interests: string[];
  statuses: string[];
  utmSources: string[];
  utmMediums: string[];
  utmCampaigns: string[];
}

const DEFAULT_INTERESTS = [
  'Life coaching',
  'Vastu guidance',
  'Numerology',
  'Holistic wellness',
  'Not sure yet',
];

const DEFAULT_STATUSES = ['ACTIVE', 'DELETED', 'ONHOLD'];

const MAX_OPTIONS = 100;

export async function getFilterOptions(): Promise<FilterOptionsResponse> {
  await connectToDatabase();

  const [dbInterests, dbSources, dbMediums, dbCampaigns] = await Promise.all([
    Consultation.distinct('interest', { interest: { $exists: true, $nin: ['', null] } }),
    UtmCampaign.distinct('utm_source', { utm_source: { $exists: true, $nin: ['', null] } }),
    UtmCampaign.distinct('utm_medium', { utm_medium: { $exists: true, $nin: ['', null] } }),
    UtmCampaign.distinct('utm_campaign', { utm_campaign: { $exists: true, $nin: ['', null] } }),
  ]);

  // Deduplicate and merge defaults with DB values
  const interestSet = new Set<string>([...DEFAULT_INTERESTS, ...dbInterests.filter(Boolean)]);
  const sortedInterests = Array.from(interestSet)
    .filter((s) => typeof s === 'string' && s.trim().length > 0)
    .sort((a, b) => a.localeCompare(b))
    .slice(0, MAX_OPTIONS);

  const sortedSources = Array.from(new Set(dbSources.filter(Boolean)))
    .filter((s) => typeof s === 'string' && s.trim().length > 0)
    .sort((a, b) => a.localeCompare(b))
    .slice(0, MAX_OPTIONS);

  const sortedMediums = Array.from(new Set(dbMediums.filter(Boolean)))
    .filter((s) => typeof s === 'string' && s.trim().length > 0)
    .sort((a, b) => a.localeCompare(b))
    .slice(0, MAX_OPTIONS);

  const sortedCampaigns = Array.from(new Set(dbCampaigns.filter(Boolean)))
    .filter((s) => typeof s === 'string' && s.trim().length > 0)
    .sort((a, b) => a.localeCompare(b))
    .slice(0, MAX_OPTIONS);

  return {
    interests: sortedInterests,
    statuses: DEFAULT_STATUSES,
    utmSources: sortedSources,
    utmMediums: sortedMediums,
    utmCampaigns: sortedCampaigns,
  };
}
