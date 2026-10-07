import axios from 'axios';
import jwt from 'jsonwebtoken';
import { config } from '../config';

/**
 * Verifies Firebase Auth ID tokens against Google's public signing certificates.
 * See https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library
 */

const CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

let cachedCerts: Record<string, string> | null = null;
let certsExpireAt = 0;

const getSigningCerts = async (): Promise<Record<string, string>> => {
    if (cachedCerts && Date.now() < certsExpireAt) return cachedCerts;

    const res = await axios.get<Record<string, string>>(CERTS_URL, { timeout: 5000 });
    const maxAge = /max-age=(\d+)/.exec(String(res.headers['cache-control'] ?? ''));
    cachedCerts = res.data;
    certsExpireAt = Date.now() + (maxAge ? Number(maxAge[1]) * 1000 : 60 * 60 * 1000);
    return cachedCerts;
};

export interface FirebaseIdentity {
    uid: string;
    email: string;
    name?: string;
    picture?: string;
}

export const isFirebaseAuthConfigured = () => Boolean(config.FIREBASE_PROJECT_ID);

export const verifyFirebaseIdToken = async (idToken: string): Promise<FirebaseIdentity> => {
    const projectId = config.FIREBASE_PROJECT_ID;
    if (!projectId) throw new Error('FIREBASE_PROJECT_ID is not configured');

    const decodedHeader = jwt.decode(idToken, { complete: true });
    const kid = decodedHeader?.header?.kid;
    if (!kid) throw new Error('Malformed ID token');

    const certs = await getSigningCerts();
    const cert = certs[kid];
    if (!cert) throw new Error('ID token signed with unknown key');

    const payload = jwt.verify(idToken, cert, {
        algorithms: ['RS256'],
        audience: projectId,
        issuer: `https://securetoken.google.com/${projectId}`,
    }) as jwt.JwtPayload;

    if (!payload.sub) throw new Error('ID token has no subject');
    if (!payload.email || payload.email_verified !== true) {
        throw new Error('ID token has no verified email');
    }

    return {
        uid: payload.sub,
        email: String(payload.email).toLowerCase(),
        name: payload.name,
        picture: payload.picture,
    };
};
