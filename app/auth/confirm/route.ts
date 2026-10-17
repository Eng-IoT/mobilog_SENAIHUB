import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { userClient } from "@/lib/supabase/server";
export async function GET(request:Request) {
  const url=new URL(request.url),hash=url.searchParams.get("token_hash"),type=url.searchParams.get("type");
  const client=await userClient();
  if(hash&&["signup","email","recovery","invite"].includes(type||"")) {
    const {error}=await client.auth.verifyOtp({token_hash:hash,type:type as EmailOtpType});
    if(!error)return NextResponse.redirect(new URL("/",request.url));
  }
  if(url.searchParams.get("code")) {
    const {error}=await client.auth.exchangeCodeForSession(url.searchParams.get("code")!);
    if(!error)return NextResponse.redirect(new URL("/",request.url));
  }
  return NextResponse.redirect(new URL("/?auth=confirmation-error",request.url));
}
