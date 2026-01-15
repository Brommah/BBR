import { PipelineView } from "@/components/pipeline/pipeline-view"
import { IsoBlueprint } from "@/components/ui/illustrations"
import { PageErrorBoundary } from "@/components/error-boundary"

export default function PipelinePage() {
  return (
    <PageErrorBoundary>
    <div className="flex flex-col h-screen overflow-hidden bg-background relative">
        {/* Background Watermark */}
        <div className="absolute right-0 top-0 w-96 h-96 opacity-[0.03] pointer-events-none z-0">
            <IsoBlueprint />
        </div>
        
        <div className="h-14 px-6 flex items-center border-b border-border bg-card/80 backdrop-blur-sm z-10 relative shrink-0">
             <h2 className="text-lg font-semibold tracking-tight text-foreground">Pipeline</h2>
        </div>
        <div className="relative z-10 flex-1 overflow-hidden">
            <PipelineView />
        </div>
    </div>
    </PageErrorBoundary>
  )
}
