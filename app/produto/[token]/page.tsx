import type { Metadata } from "next";
import ProductPassportPage from "@/components/product-passport";

export const metadata: Metadata = {
  title: "Identidade do móvel · MobiLog · SENAI Hub",
  description: "Consulte a identidade, os materiais e a história de fabricação deste móvel.",
  robots: { index: false, follow: false },
};
export default async function ProductPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <ProductPassportPage key={token} token={token}/>;
}
