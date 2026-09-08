import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

/**
 * NextAuth/Auth.js owns every route under /api/auth/* — signin, signout,
 * session, csrf, providers, callback. Do not add a second, custom login
 * endpoint alongside this.
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
