// Default supabase JWT verification
// Use this template to validate tokens issued by Supabase default auth
import * as jose from 'jsr:@panva/jose@6'
import { corsHeaders } from 'jsr:@supabase/supabase-js@2/cors'

const SUPABASE_JWT_ISSUER = Deno.env.get('SB_JWT_ISSUER') ?? Deno.env.get('SUPABASE_URL') + '/auth/v1'

const SUPABASE_JWT_KEYS = jose.createRemoteJWKSet(
  new URL(Deno.env.get('SUPABASE_URL')! + '/auth/v1/.well-known/jwks.json')
)

function getAuthToken(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    throw new Error('Missing authorization header')
  }
  const [bearer, token] = authHeader.split(' ')
  if (bearer !== 'Bearer') {
    throw new Error(`Auth header is not 'Bearer {token}'`)
  }

  return token
}

function verifySupabaseJWT(jwt: string) {
  return jose.jwtVerify(jwt, SUPABASE_JWT_KEYS, {
    issuer: SUPABASE_JWT_ISSUER,
  })
}

// Validates the authorization header. With `role`, the token's app_metadata.user_role must match it.
// app_metadata is set by the service role only, so a user cannot give it to themselves.
export async function AuthMiddleware(
  req: Request,
  next: (req: Request) => Promise<Response>,
  options: { role?: string } = {}
) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const token = getAuthToken(req)
    const { payload } = await verifySupabaseJWT(token)

    if (options.role) {
      const appMetadata = payload.app_metadata as { user_role?: unknown } | undefined
      if (appMetadata?.user_role !== options.role) {
        return Response.json(
          { msg: 'Forbidden' },
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    return await next(req)
  } catch (e) {
    return Response.json(
      { msg: e?.toString() },
      {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
}
