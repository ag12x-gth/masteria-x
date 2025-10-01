import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose';

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/testes']
const JWT_SECRET = process.env.JWT_SECRET_KEY;

// Rotas restritas que apenas 'admin' e 'superadmin' podem aceder.
const ADMIN_ONLY_ROUTES = [
  '/campaigns',
  '/sms',
  '/templates',
  '/connections',
  '/gallery',
  '/settings',
  '/admin',
  '/super-admin',
  '/agentes-ia',
  '/roteamento',
  '/automations',
];

// Função para apagar os cookies de sessão
function clearSessionCookies(response: NextResponse) {
    // Limpar ambos os cookies com configurações explícitas
    response.cookies.set('__session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0, // Expira imediatamente
    });
    
    response.cookies.set('session_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0, // Expira imediatamente
    });
    
    return response;
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl
  
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('/favicon.ico')) {
    return NextResponse.next();
  }
  
  const sessionToken = req.cookies.get('__session')?.value || req.cookies.get('session_token')?.value
  let sessionPayload: { [key: string]: any; role?: string } | null = null;
  let sessionError: { code?: string } | null = null;

  if (sessionToken) {
    try {
        if (!JWT_SECRET) throw new Error("JWT_SECRET não configurado.");
        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(sessionToken, secret);
        sessionPayload = payload;
    } catch (error: any) {
        sessionPayload = null;
        sessionError = { code: error.code }; // Store error code like 'ERR_JWT_EXPIRED'
    }
  }

  const hasValidSession = !!sessionPayload;
  const userRole = sessionPayload?.role;
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));
  const isRestrictedRoute = ADMIN_ONLY_ROUTES.some(route => pathname.startsWith(route));

  // REGRA #1: Redirecionar utilizadores logados que tentam aceder a rotas públicas
  if (hasValidSession && isPublicRoute) {
    const url = req.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // REGRA #2: Redirecionar utilizadores não logados que tentam aceder a rotas protegidas
  if (!hasValidSession && !isPublicRoute) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    
    // Anexa o motivo do redirecionamento (ex: sessão expirada) à URL
    if (sessionError?.code === 'ERR_JWT_EXPIRED') {
        url.searchParams.set('error', 'token_expirado');
    } else if (sessionToken) { // Se havia um token mas era inválido
        url.searchParams.set('error', 'token_invalido');
    }

    const response = NextResponse.redirect(url);
    
    // Limpa qualquer cookie de sessão inválido ou expirado
    return clearSessionCookies(response);
  }
  
  // REGRA #3: Aplicar RBAC para utilizadores logados
  if (hasValidSession) {
      // Se um 'atendente' tenta aceder a uma rota restrita
      if (userRole === 'atendente' && isRestrictedRoute) {
          const url = req.nextUrl.clone();
          url.pathname = '/dashboard'; // Redireciona para uma página segura
          return NextResponse.redirect(url);
      }
  }
  
  // REGRA #4: Permitir o acesso a todas as outras rotas que passaram pelas verificações
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
