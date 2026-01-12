import React from "react";
import { 
  MarketingHeroAsset, 
  MarketingFeatureCard, 
  MarketingSocialPost, 
  MarketingTestimonial 
} from "@/components/marketing/marketing-assets";

export default function MarketingPreviewPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-8 space-y-12">
      <header className="mb-12 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Marketing Assets Preview</h1>
        <p className="text-slate-500">Generated for Nano Banana 2 Pro / Gemini 3 Pro Preview</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-700 border-b pb-2">Asset 1: Hero Header</h2>
        <div className="rounded-xl overflow-hidden shadow-lg border border-slate-200">
          <MarketingHeroAsset />
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <section className="space-y-4 flex flex-col items-center">
          <h2 className="text-xl font-semibold text-slate-700 border-b pb-2 w-full text-center">Asset 2: Feature Card</h2>
          <MarketingFeatureCard />
        </section>

        <section className="space-y-4 flex flex-col items-center">
          <h2 className="text-xl font-semibold text-slate-700 border-b pb-2 w-full text-center">Asset 3: Social Post (Square)</h2>
          <MarketingSocialPost />
        </section>
      </div>

      <section className="space-y-4 flex flex-col items-center">
        <h2 className="text-xl font-semibold text-slate-700 border-b pb-2 w-full text-center">Asset 4: Testimonial</h2>
        <MarketingTestimonial />
      </section>
    </div>
  );
}
