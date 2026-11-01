import { adminDb, verifyMemberToken } from '../../../lib/firebaseAdmin';
import { assessmentIdentity } from '../../../lib/assessmentIdentity';
import { readUsage } from '../../../lib/monthlyUsage';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({message: 'Method Not Allowed'});
  }
  try {
    const identity = await assessmentIdentity(req, res, verifyMemberToken);
    return res.status(200).json({ ...await readUsage(adminDb, identity), userId: identity.userId });
  } catch (error) {
    console.error('Membership status unavailable:', error.message);
    return res.status(error.status || 503).json({message: error.status ? error.message : 'Unable to check your allowance. Please try again later.'});
  }
}
