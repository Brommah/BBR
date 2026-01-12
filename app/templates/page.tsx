"use client"
import { EmailTemplateEngine } from "@/components/templates/emails/email-template-engine"

export default function TemplatesPage() {
    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">Email Templates</h1>
                <p className="page-description">Beheer en verstuur gepersonaliseerde email templates.</p>
            </div>
            <EmailTemplateEngine />
        </div>
    )
}
