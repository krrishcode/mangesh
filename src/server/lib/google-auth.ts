import { OAuth2Client, type TokenPayload } from 'google-auth-library';
import { AppError } from './errors';
export const googleClientId = () => process.env.GOOGLE_CLIENT_ID?.trim() || '';
export async function verifyGoogleCredential(credential: string, nonce: string) {
  const clientId = googleClientId();
  if (!clientId) throw new AppError(503, 'Google sign-in is not configured yet. Please use email and password.');
  try {
    const ticket = await new OAuth2Client(clientId).verifyIdToken({ idToken: credential, audience: clientId });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || !payload.email_verified || (payload as TokenPayload & { nonce?: string }).nonce !== nonce) throw new Error('Invalid identity');
    return { subject: payload.sub, email: payload.email.toLowerCase(), name: payload.name?.trim().slice(0, 255) || payload.email.split('@')[0], authoritative: payload.email.toLowerCase().endsWith('@gmail.com') || Boolean(payload.hd) };
  } catch { throw new AppError(401, 'Google sign-in could not be verified. Please try again.'); }
}
