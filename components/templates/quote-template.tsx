import { Card } from "@/components/ui/card"
import { format } from "date-fns"
import { nl } from "date-fns/locale"

interface QuoteTemplateProps {
    clientName: string
    projectType: string
    date: Date
    items: { description: string, amount: number }[]
    total: number
}

export function QuoteTemplate({ clientName, projectType, date, items, total }: QuoteTemplateProps) {
    return (
        <Card className="w-full max-w-[210mm] min-h-[297mm] bg-white p-12 mx-auto shadow-2xl print:shadow-none print:w-full text-foreground">
            {/* Header */}
            <div className="flex justify-between items-start mb-16">
                <div className="w-48">
                    {/* eslint-disable-next-line @next/next/no-img-element -- Using <img> intentionally for PDF/print compatibility */}
                    <img 
                        src="/branding/logo-white-gold.png" 
                        alt="Bureau Broersma" 
                        className="w-full h-auto object-contain filter invert brightness-0" 
                        style={{ filter: "invert(0)" }} // Ensure original gold color is preserved if possible or use CSS mix-blend-mode if needed for print
                    />
                </div>
                <div className="text-right text-sm text-slate-500 font-sans">
                    <p>Bureau Broersma</p>
                    <p>Keizersgracht 123</p>
                    <p>1015 CJ Amsterdam</p>
                    <p>+31 20 123 4567</p>
                    <p>info@bureaubroersma.nl</p>
                </div>
            </div>

            {/* Client Info */}
            <div className="mb-12 font-sans">
                <p className="text-slate-500 text-sm uppercase tracking-wider mb-2">Offerte Voor</p>
                <h2 className="text-xl font-bold">{clientName}</h2>
                <p>Betreft: {projectType}</p>
                <p>Datum: {format(date, "d MMMM yyyy", { locale: nl })}</p>
                <p>Referentie: OFF-{format(date, "yyyyMMdd")}-001</p>
            </div>

            {/* Content */}
            <div className="mb-12 space-y-4 font-sans leading-relaxed text-slate-700">
                <p>Geachte heer/mevrouw,</p>
                <p>
                    Hartelijk dank voor uw aanvraag. Op basis van de door u aangeleverde gegevens hebben wij een zorgvuldige calculatie gemaakt voor uw project. 
                    Bij Bureau Broersma staan kwaliteit en constructieve veiligheid voorop.
                </p>
                <p>Hieronder vindt u een specificatie van de werkzaamheden en de bijbehorende investering.</p>
            </div>

            {/* Table */}
            <div className="mb-12">
                <table className="w-full font-sans text-sm">
                    <thead className="border-b-2 border-slate-900">
                        <tr>
                            <th className="text-left py-3 font-bold uppercase tracking-wider">Omschrijving</th>
                            <th className="text-right py-3 font-bold uppercase tracking-wider">Bedrag</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {items.map((item, index) => (
                            <tr key={index}>
                                <td className="py-4 text-slate-700">{item.description}</td>
                                <td className="py-4 text-right font-mono">€ {item.amount.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="border-t-2 border-slate-900 font-bold">
                        <tr>
                            <td className="py-4 text-right pr-8">Totaal (excl. BTW)</td>
                            <td className="py-4 text-right font-mono text-lg">€ {total.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</td>
                        </tr>
                        <tr className="text-slate-500 font-normal text-xs">
                            <td className="py-1 text-right pr-8">BTW (21%)</td>
                            <td className="py-1 text-right font-mono">€ {(total * 0.21).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</td>
                        </tr>
                        <tr className="text-xl">
                            <td className="py-4 text-right pr-8">Totaal (incl. BTW)</td>
                            <td className="py-4 text-right font-mono text-primary">€ {(total * 1.21).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-12 border-t border-slate-200 text-xs text-slate-400 font-sans text-center">
                <p>Op al onze diensten zijn de algemene voorwaarden van toepassing (DNR 2011).</p>
                <p>Geldigheid offerte: 30 dagen na dagtekening.</p>
            </div>
        </Card>
    )
}
