import React from "react";
import { 
  MarketingHeroAsset, 
  MarketingFeatureCard, 
  MarketingSocialPost, 
  MarketingTestimonial 
} from "@/components/marketing/marketing-assets";

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ asset?: string }>;
}) {
  const { asset } = await searchParams;

  // Render Hero (Full Width)
  if (asset === "hero") {
    return (
      <div className="w-full">
        <MarketingHeroAsset />
      </div>
    );
  }

  // Render Social Post (Fixed High Res Square)
  if (asset === "social") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-transparent">
        <div id="capture-target" style={{ width: 1080, height: 1080 }} className="flex-none">
          {/* Override max-width for the studio capture to get full res */}
          <div className="[&>div]:max-w-none [&>div]:w-full [&>div]:h-full h-full w-full">
             <MarketingSocialPost />
          </div>
        </div>
      </div>
    );
  }

  // Render Feature Card
  if (asset === "feature") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-transparent p-12">
        <div id="capture-target" className="scale-[1.5] origin-center">
            <MarketingFeatureCard />
        </div>
      </div>
    );
  }

  // Render Testimonial
  if (asset === "testimonial") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-transparent p-12">
        <div id="capture-target" className="scale-[1.5] origin-center">
            <MarketingTestimonial />
        </div>
      </div>
    );
  }

  return <div>Please specify an asset query param</div>;
}
