/**
 * Script to create a completely filled-in dummy submission ticket
 * Run with: npx tsx scripts/create-dummy-lead.ts
 */

import 'dotenv/config'
import prisma from '../lib/db'

async function createDummyLead() {
  console.log('🚀 Creating dummy submission ticket...\n')

  try {
    // Create the lead with all fields filled in
    // Note: Project type includes "funderingsherstel" to trigger Ground Investigation panel
    // Coordinates for Keizersgracht 123, Amsterdam: 52.3702°N, 4.8873°E
    const lead = await prisma.lead.create({
      data: {
        clientName: 'Jan de Vries',
        clientEmail: 'jan.devries@voorbeeld.nl',
        clientPhone: '06 12345678',
        projectType: 'Uitbouw met funderingsherstel',
        city: 'Amsterdam',
        address: 'Keizersgracht 123',
        status: 'Nieuw',
        value: 0, // Will be calculated based on quote
        werknummer: '2026-DEMO-001',
        addressValid: true,
        quoteApproval: 'none',
        quoteValue: null,
        quoteDescription: null,
        quoteLineItems: [],
        quoteEstimatedHours: null,
        quoteFeedback: [],
        
        // Create related specifications
        // Includes coordinates for BRO/DINO API integration
        specifications: {
          create: [
            { key: 'Afmeting breedte', value: '4.5', unit: 'm' },
            { key: 'Afmeting diepte', value: '3.2', unit: 'm' },
            { key: 'Hoogte plafond', value: '2.8', unit: 'm' },
            { key: 'Bouwjaar woning', value: '1935', unit: null },
            { key: 'Type fundering', value: 'Houten palen (herstel nodig)', unit: null },
            { key: 'Gewenste materiaal', value: 'Staal', unit: null },
            { key: 'Latitude', value: '52.3702', unit: '°N' },
            { key: 'Longitude', value: '4.8873', unit: '°E' },
          ]
        },
        
        // Create initial notes
        notes: {
          create: [
            {
              content: '**Projectomschrijving:**\nKlant wil een uitbouw aan de achterzijde van een grachtenpand met funderingsherstel. De bestaande houten paalfundering moet worden versterkt. De uitbouw moet volledig in glas worden uitgevoerd met stalen kozijnen. Er is een monumentenvergunning nodig.',
              author: 'Website Intake'
            },
            {
              content: 'Klant heeft aangegeven dat de buren akkoord zijn met de plannen. Er is al een schets gemaakt door een architect. Funderingsinspectie door aannemer wijst op verzakking aan achterzijde.',
              author: 'Receptie'
            },
            {
              content: 'Let op: Monument, extra aandacht voor fundering en constructieve eisen.\n\n**Grondonderzoek:** Gebruik coördinaten 52.3702°N, 4.8873°E voor BRO/DINO loket raadpleging.',
              author: 'Admin'
            }
          ]
        },
        
        // Create activity log
        activities: {
          create: [
            {
              type: 'lead_created',
              content: 'Lead aangemaakt via website intake: Uitbouw aan grachtenpand (1 bestand geüpload)',
              author: 'Website'
            }
          ]
        },
        
        // Create sample documents
        documents: {
          create: [
            {
              name: 'schets-uitbouw-v1.pdf',
              type: 'pdf',
              category: 'tekening',
              size: 2457600, // ~2.4 MB
              url: '/demo/schets-uitbouw-v1.pdf',
              status: 'pending',
              uploadedBy: 'Jan de Vries'
            },
            {
              name: 'foto-achtergevel.jpg',
              type: 'image',
              category: 'foto',
              size: 1843200, // ~1.8 MB
              url: '/demo/foto-achtergevel.jpg',
              status: 'pending',
              uploadedBy: 'Jan de Vries'
            },
            {
              name: 'bestaande-plattegrond.dwg',
              type: 'dwg',
              category: 'tekening',
              size: 5242880, // ~5 MB
              url: '/demo/bestaande-plattegrond.dwg',
              status: 'pending',
              uploadedBy: 'Jan de Vries'
            }
          ]
        },
        
        // Create communication log
        communications: {
          create: [
            {
              type: 'email',
              direction: 'outbound',
              subject: 'Bevestiging van uw aanvraag - Uitbouw',
              content: 'Beste Jan de Vries,\n\nBedankt voor uw aanvraag voor een constructieberekening voor uw uitbouw project.\n\nWij hebben uw aanvraag in goede orde ontvangen en nemen binnen 1 werkdag contact met u op.\n\nMet vriendelijke groet,\nBroersma Bouwadvies',
              author: 'Systeem'
            }
          ]
        }
      },
      include: {
        specifications: true,
        notes: true,
        activities: true,
        documents: true,
        communications: true
      }
    })

    console.log('✅ Dummy lead created successfully!\n')
    console.log('📋 Lead Details:')
    console.log('─────────────────────────────────────────')
    console.log(`   ID:           ${lead.id}`)
    console.log(`   Klant:        ${lead.clientName}`)
    console.log(`   Email:        ${lead.clientEmail}`)
    console.log(`   Telefoon:     ${lead.clientPhone}`)
    console.log(`   Project:      ${lead.projectType}`)
    console.log(`   Locatie:      ${lead.address}, ${lead.city}`)
    console.log(`   Werknummer:   ${lead.werknummer}`)
    console.log(`   Waarde:       €${lead.value.toFixed(2)}`)
    console.log(`   Status:       ${lead.status}`)
    console.log('─────────────────────────────────────────')
    console.log(`   Specs:        ${lead.specifications.length} specificaties`)
    console.log(`   Notities:     ${lead.notes.length} notities`)
    console.log(`   Activiteiten: ${lead.activities.length} activiteit(en)`)
    console.log(`   Documenten:   ${lead.documents.length} documenten`)
    console.log(`   Communicatie: ${lead.communications.length} bericht(en)`)
    console.log('─────────────────────────────────────────\n')
    
    console.log(`🔗 View at: /leads/${lead.id}\n`)

    return lead
  } catch (error) {
    console.error('❌ Error creating dummy lead:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
createDummyLead()
  .then(() => {
    console.log('✨ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed:', error)
    process.exit(1)
  })
