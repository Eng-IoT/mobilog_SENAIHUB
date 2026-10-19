import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({request});
  if (request.nextUrl.pathname.startsWith("/api/products/")) return response;
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;
  const client = createServerClient(url,key,{
    cookies:{
      getAll:()=>request.cookies.getAll(),
      setAll(items,headers) {
        items.forEach(({name,value})=>request.cookies.set(name,value));
        response=NextResponse.next({request});
        items.forEach(({name,value,options})=>response.cookies.set(name,value,options));
        Object.entries(headers||{}).forEach(([name,value])=>response.headers.set(name,String(value)));
      },
    },
  });
  await client.auth.getClaims();
  response.headers.set("Cache-Control","private, no-store");
  return response;
}
export const config={matcher:["/api/:path*","/auth/:path*"]};
