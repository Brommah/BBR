import React from "react";
import Image from "next/image";
;
import { ArrowRight, CheckCircle2, Star, TrendingUp, ShieldCheck, Zap } from "lucide-react";

// Asset 1: The "Golden Standard" Hero Header
export function MarketingHeroAsset() {
  return (
    <div className="relative overflow-hidden bg-slate-950 py-32 sm:py-48 isolate">
      {/* Dynamic Background */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/40 via-slate-950 to-slate-950" />
      <div className="absolute top-0 right-0 -mr-24 -mt-24 h-[500px] w-[500px] rounded-full bg-amber-600/10 blur-[100px]" />
      <div className="absolute bottom-0 left-0 -ml-24 -mb-24 h-[500px] w-[500px] rounded-full bg-blue-900/10 blur-[100px]" />
      
      {/* Floating Elements (Visual Interest) */}
      <div className="absolute top-1/4 left-10 w-24 h-24 bg-gradient-to-br from-white/5 to-white/0 rounded-2xl border border-white/10 backdrop-blur-sm rotate-12 animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-1/4 right-10 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full border border-amber-500/20 blur-sm" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-12 flex justify-center">
            <div className="relative group">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 opacity-70 blur group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative h-28 w-28 rounded-full bg-slate-950 p-5 ring-1 ring-white/10 backdrop-blur flex items-center justify-center">
                <Image
                    src="/branding/logo-white-gold.png"
                    alt="Broersma Logo"
                    width={90}
                    height={90}
                    className="h-full w-full object-contain drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]"
                />
                </div>
            </div>
          </div>
          
          <h1 className="text-5xl font-black tracking-tight text-white sm:text-7xl mb-6">
            <span className="block bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                Precision Engineering
            </span>
            <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 drop-shadow-sm">
                Redefined.
            </span>
          </h1>
          
          <p className="mt-8 text-xl leading-8 text-slate-300 max-w-2xl mx-auto font-light">
            The ultimate operating system for modern construction consultancy. 
            <span className="text-amber-400 font-medium"> Nano Banana 2 Pro</span> meets 
            <span className="text-blue-400 font-medium"> Gemini 3 Pro</span> intelligence.
          </p>
          
          <div className="mt-12 flex items-center justify-center gap-x-8">
            <button className="relative group rounded-full bg-gradient-to-r from-amber-500 to-amber-700 px-8 py-4 text-base font-bold text-white shadow-lg shadow-amber-900/20 hover:shadow-amber-900/40 transition-all hover:scale-105">
              <span className="absolute inset-0 rounded-full bg-white/20 group-hover:bg-white/0 transition-colors" />
              Start Building Free
            </button>
            <button className="text-base font-semibold leading-6 text-white flex items-center gap-2 group hover:text-amber-400 transition-colors">
              View Documentation <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Tech Grid Overlay */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
    </div>
  );
}

// Asset 2: The "Gemini" Split Feature Card
export function MarketingFeatureCard() {
  return (
    <div className="relative group w-full max-w-[500px] perspective-1000">
        {/* Glow behind */}
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-600 to-purple-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200" />
        
        <div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-slate-900/90 border border-white/10 backdrop-blur-xl p-10 shadow-2xl">
            {/* Background noise texture */}
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.05] mix-blend-overlay pointer-events-none" />
            
            {/* Top Badge */}
            <div className="flex justify-between items-start mb-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400 ring-1 ring-inset ring-amber-500/20">
                    <Zap className="h-3 w-3" /> PRO SUITE
                </div>
                <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)] animate-pulse" />
            </div>

            <div className="relative z-10">
                <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 shadow-lg shadow-orange-900/20 transform group-hover:rotate-6 transition-transform duration-500">
                    <TrendingUp className="h-8 w-8 text-white" />
                </div>
                
                <h3 className="text-3xl font-bold text-white mb-3 tracking-tight">Financial Intelligence</h3>
                <p className="text-slate-400 mb-8 leading-relaxed">
                    Turn complex project data into actionable financial strategy. 
                    Real-time tracking powered by our advanced AI engine.
                </p>

                <div className="space-y-4 mb-8">
                    {[
                        { icon: ShieldCheck, text: "Enterprise-grade Security" },
                        { icon: Star, text: "Predictive Cost Modeling" },
                        { icon: CheckCircle2, text: "Automated Compliance" }
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-4 text-sm font-medium text-slate-200 bg-white/5 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                                <item.icon className="h-4 w-4" />
                            </div>
                            <span>{item.text}</span>
                        </div>
                    ))}
                </div>

                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Powered by</span>
                        <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">GEMINI 3 PRO</span>
                    </div>
                    <Image
                        src="/branding/logo-white-gold.png"
                        alt="Logo"
                        width={40}
                        height={40}
                        className="opacity-80"
                    />
                </div>
            </div>
      </div>
    </div>
  );
}

// Asset 3: Social Media "Pro Preview"
export function MarketingSocialPost() {
  return (
    <div className="relative flex aspect-square w-full max-w-[1080px] flex-col items-center justify-center overflow-hidden bg-slate-950 text-center border-8 border-slate-950">
      {/* Complex Gradient Background */}
      <div className="absolute inset-0 bg-[conic-gradient(at_center,_var(--tw-gradient-stops))] from-slate-950 via-slate-900 to-slate-950" />
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-amber-500/10 to-transparent opacity-50" />
      <div className="absolute bottom-0 left-0 right-0 h-[500px] bg-gradient-to-t from-blue-900/10 to-transparent opacity-50" />
      
      {/* Central Burst */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-[600px] w-[600px] bg-amber-500/5 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-[80%] h-[80%] border border-white/10 rounded-3xl backdrop-blur-sm bg-white/[0.02] flex flex-col items-center justify-center p-12 shadow-2xl">
        {/* Corner Accents */}
        <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-amber-500/50 rounded-tl-xl" />
        <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-amber-500/50 rounded-br-xl" />

        <div className="mb-12 relative group">
            <div className="absolute -inset-8 bg-amber-500/20 blur-xl rounded-full group-hover:bg-amber-500/30 transition-all duration-500" />
            <div className="relative bg-slate-900 p-8 rounded-full border border-white/10 shadow-xl">
                <Image
                src="/branding/logo-white-gold.png"
                alt="Broersma Logo"
                width={160}
                height={160}
                className="relative drop-shadow-[0_0_25px_rgba(245,158,11,0.6)]"
                />
            </div>
        </div>
        
        <h2 className="text-7xl font-black text-white uppercase tracking-wider mb-6 leading-tight">
          Next<br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-600">Generation</span>
        </h2>
        
        <div className="flex items-center gap-4 mt-8">
            <div className="h-[1px] w-12 bg-slate-500" />
            <p className="text-amber-100/60 font-medium tracking-[0.2em] text-lg uppercase">
            Construction Intelligence
            </p>
            <div className="h-[1px] w-12 bg-slate-500" />
        </div>

        <div className="absolute bottom-8 text-xs text-slate-600 font-mono">
            NANO BANANA 2 PRO // GEMINI 3 PRO PREVIEW
        </div>
      </div>
      
      {/* Noise Overlay */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.04] mix-blend-overlay pointer-events-none" />
    </div>
  );
}

// Asset 4: "Build Future" Testimonial
export function MarketingTestimonial() {
  return (
    <div className="relative w-full max-w-3xl">
        <div className="absolute -inset-1 bg-gradient-to-r from-slate-200 to-slate-300 rounded-3xl blur opacity-30" />
        <div className="relative w-full rounded-2xl bg-[#0B0F19] p-12 shadow-2xl border border-white/5 overflow-hidden">
            {/* Subtle background patterns */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px]" />
            
            <div className="absolute top-10 right-10 opacity-10">
                <Image
                    src="/branding/logo-white-gold.png"
                    alt="Watermark"
                    width={180}
                    height={180}
                    className="grayscale invert"
                />
            </div>

            <div className="relative z-10">
                <div className="flex gap-1.5 mb-8">
                    {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="h-6 w-6 fill-amber-500 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                    ))}
                </div>
                
                <blockquote className="text-3xl font-light text-slate-100 leading-relaxed mb-10 tracking-wide">
                &ldquo;The insights we get from the Broersma platform are unmatched. 
                It&apos;s like having a <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 font-bold">crystal ball</span> for our construction projects. 
                Absolute game changer.&rdquo;
                </blockquote>

                <div className="flex items-center gap-6">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 ring-2 ring-white/10 flex items-center justify-center text-slate-300 font-bold text-xl shadow-lg">
                        JD
                    </div>
                    <div>
                        <div className="font-bold text-white text-lg">John Doe</div>
                        <div className="text-sm text-amber-500/80 font-medium">Project Director, BuildCorp</div>
                    </div>
                    <div className="ml-auto flex flex-col items-end border-l pl-6 border-white/10">
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Verified Client</div>
                        <div className="flex items-center gap-2">
                             <div className="h-2 w-2 rounded-full bg-green-500" />
                             <span className="text-xs font-mono text-slate-400">active now</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}
