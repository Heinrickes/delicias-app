import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Inicializamos la respuesta por defecto (dejar pasar)
  let supabaseResponse = NextResponse.next({
    request,
  })

  // 2. Creamos el cliente de Supabase configurado para manejar Cookies en el Servidor
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 3. Le preguntamos a Supabase si la persona tiene una sesión activa válida
  const { data: { user } } = await supabase.auth.getUser()

  const isLoginPage = request.nextUrl.pathname.startsWith('/login')

  // REGLA A: Si NO hay usuario y NO está en el login -> Lo pateamos al login
  if (!user && !isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // REGLA B: Si SÍ hay usuario y quiere entrar al login -> Lo mandamos al inventario
  if (user && isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // 4. Si pasó las reglas correctamente, entregamos la página solicitada
  return supabaseResponse
}

// 5. Le decimos al Guardia qué rutas debe proteger.
// Ignoramos archivos estáticos (imágenes, fuentes, css) para no sobrecargar el servidor.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}