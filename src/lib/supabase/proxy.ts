import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const AUTH_PATHS = ["/sign-in", "/sign-up", "/forgot-password"];

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const forceDemo = process.env.NEXT_PUBLIC_FORCE_DEMO === "true";

  if (forceDemo || !url || !key || key.length < 20) {
    return NextResponse.next({ request });
  }

  if (request.cookies.get("la_demo")?.value === "1") {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuth = AUTH_PATHS.some((item) => path === item || path.startsWith(`${item}/`));

  if (!user && !isAuth) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/sign-in";
    return NextResponse.redirect(redirect);
  }

  if (user && isAuth) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/";
    return NextResponse.redirect(redirect);
  }

  return supabaseResponse;
}
