import { configured } from "@/lib/supabase/server";
import { json } from "@/lib/http";
export const dynamic="force-dynamic";
export function GET(){return json({application:"MobiLog",version:"1.0.0",configured:configured()});}
