"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Star, MessageSquare } from "lucide-react"

export function NPSDashboard() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="col-span-1 border-t-4 border-t-emerald-500">
                <CardHeader>
                    <CardTitle className="text-4xl font-semibold text-value text-center">72</CardTitle>
                    <CardDescription className="text-center">Net Promoter Score (NPS)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                            <span className="text-green-600 font-bold">Promoters (9-10)</span>
                            <span>78%</span>
                        </div>
                        <Progress value={78} className="h-2 bg-green-100 dark:bg-green-950" />
                    </div>
                     <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                            <span className="text-yellow-600 font-bold">Passives (7-8)</span>
                            <span>16%</span>
                        </div>
                        <Progress value={16} className="h-2 bg-yellow-100 dark:bg-yellow-950" />
                    </div>
                     <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                            <span className="text-red-600 font-bold">Detractors (0-6)</span>
                            <span>6%</span>
                        </div>
                        <Progress value={6} className="h-2 bg-red-100 dark:bg-red-950" />
                    </div>
                </CardContent>
                <CardFooter className="text-xs text-muted-foreground justify-center">
                    Gebaseerd op 50 reviews (Laatste 30 dagen)
                </CardFooter>
            </Card>

            <Card className="col-span-2">
                <CardHeader>
                    <CardTitle>Recente Feedback</CardTitle>
                    <CardDescription>Wat klanten zeggen na afronding.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        {[
                            { name: "Fam. Bakker", score: 10, comment: "Geweldige service! Angelo dacht heel goed mee met de constructie.", project: "Uitbouw Haarlem" },
                            { name: "Stichting 't Hof", score: 8, comment: "Goed advies, maar duurde iets langer dan verwacht.", project: "Renovatie Amsterdam" },
                            { name: "P. Jansen", score: 9, comment: "Snel en duidelijk. Offerte was binnen 1 dag binnen.", project: "Draagmuur Utrecht" }
                        ].map((review, i) => (
                            <div key={i} className="flex gap-4 items-start pb-4 border-b last:border-0">
                                <div className={`p-2 rounded-full ${review.score >= 9 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    <MessageSquare className="w-4 h-4" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-semibold text-sm">{review.name}</h4>
                                        <div className="flex items-center gap-1">
                                            <span className="font-bold text-sm">{review.score}</span>
                                            <Star className="w-3 h-3 fill-current text-yellow-400" />
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground italic">&quot;{review.comment}&quot;</p>
                                    <Badge variant="outline" className="text-[10px] mt-1">{review.project}</Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
