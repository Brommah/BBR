import 'dotenv/config'
import { PrismaClient, LeadStatus, QuoteApprovalStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data (in development only)
  console.log('🧹 Clearing existing data...')
  await prisma.activity.deleteMany()
  await prisma.note.deleteMany()
  await prisma.projectSpec.deleteMany()
  await prisma.lead.deleteMany()
  await prisma.costRate.deleteMany()
  await prisma.user.deleteMany()

  // Create Users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Mart Broersma',
        email: 'mart@broersma-bouwadvies.nl',
        role: 'admin'
      }
    }),
    prisma.user.create({
      data: {
        name: 'Angelo',
        email: 'angelo@broersma-bouwadvies.nl',
        role: 'engineer'
      }
    }),
    prisma.user.create({
      data: {
        name: 'Venka',
        email: 'venka@broersma-bouwadvies.nl',
        role: 'engineer'
      }
    }),
    prisma.user.create({
      data: {
        name: 'Roina',
        email: 'roina@broersma-bouwadvies.nl',
        role: 'engineer'
      }
    })
  ])
  console.log(`✅ Created ${users.length} users`)

  // Create Cost Rates
  const costRates = await Promise.all([
    prisma.costRate.create({
      data: {
        name: 'Standaard Dakkapel Berekening',
        basePrice: 585,
        category: 'base'
      }
    }),
    prisma.costRate.create({
      data: {
        name: 'Maatwerk Uitbouw Berekening',
        basePrice: 850,
        category: 'base'
      }
    }),
    prisma.costRate.create({
      data: {
        name: 'Constructief Complex Berekening',
        basePrice: 1250,
        category: 'base'
      }
    }),
    prisma.costRate.create({
      data: {
        name: 'Draagmuur Berekening',
        basePrice: 450,
        category: 'base'
      }
    }),
    prisma.costRate.create({
      data: {
        name: 'Fundering Berekening',
        basePrice: 750,
        category: 'base'
      }
    }),
    prisma.costRate.create({
      data: {
        name: 'Spoedlevering',
        basePrice: 20,
        category: 'surcharge',
        isPercentage: true
      }
    }),
    prisma.costRate.create({
      data: {
        name: 'Extra constructietekening',
        basePrice: 250,
        category: 'surcharge',
        isPercentage: false
      }
    }),
    prisma.costRate.create({
      data: {
        name: 'Bezoek op locatie',
        basePrice: 150,
        category: 'surcharge',
        isPercentage: false
      }
    })
  ])
  console.log(`✅ Created ${costRates.length} cost rates`)

  // Create Sample Leads - matching the mock data structure
  const leadsData = [
    // NIEUW - New incoming leads
    {
        clientName: 'J. de Vries',
        clientEmail: 'j.devries@email.nl',
        clientPhone: '+31 6 12345678',
        projectType: 'Dakkapel',
        city: 'Amsterdam',
        address: 'Keizersgracht 100',
      status: 'Nieuw' as LeadStatus,
        value: 6500,
        isUrgent: true,
        addressValid: true,
      specifications: [
            { key: 'Breedte', value: '4.5', unit: 'm' },
            { key: 'Diepte', value: '2.0', unit: 'm' },
            { key: 'Hoogte', value: '2.4', unit: 'm' },
            { key: 'Bouwjaar pand', value: '1920' },
            { key: 'Type dak', value: 'Schuin' }
          ]
    },
    {
      clientName: 'M. van den Berg',
      clientEmail: 'm.vandenberg@hotmail.com',
      clientPhone: '+31 6 23456789',
      projectType: 'Dakkapel',
      city: 'Rotterdam',
      address: 'Witte de Withstraat 45',
      status: 'Nieuw' as LeadStatus,
      value: 5800,
      isUrgent: false,
      addressValid: true,
      specifications: [
        { key: 'Breedte', value: '3.0', unit: 'm' },
        { key: 'Diepte', value: '1.8', unit: 'm' },
        { key: 'Hoogte', value: '2.2', unit: 'm' },
        { key: 'Bouwjaar pand', value: '1935' },
        { key: 'Type dak', value: 'Plat' }
      ]
    },
    {
      clientName: 'L. Vermeer',
      clientEmail: 'lisa.vermeer@gmail.com',
      projectType: 'Uitbouw',
      city: 'Leiden',
      address: 'Rapenburg 12',
      status: 'Nieuw' as LeadStatus,
      value: 18500,
      isUrgent: true,
      addressValid: true,
      specifications: [
        { key: 'Oppervlakte', value: '15', unit: 'm²' },
        { key: 'Breedte', value: '4.0', unit: 'm' },
        { key: 'Diepte', value: '3.75', unit: 'm' },
        { key: 'Fundering', value: 'Op palen' },
        { key: 'Constructie', value: 'Hout' }
      ]
    },
    {
      clientName: 'A. Peters',
      clientEmail: 'anne.peters@live.nl',
      projectType: 'Dakkapel',
      city: 'Almere',
      address: 'Waterwijk 203',
      status: 'Nieuw' as LeadStatus,
      value: 5500,
      isUrgent: false,
      addressValid: true,
      specifications: [
        { key: 'Breedte', value: '2.8', unit: 'm' },
        { key: 'Diepte', value: '1.5', unit: 'm' },
        { key: 'Hoogte', value: '2.0', unit: 'm' },
        { key: 'Bouwjaar pand', value: '2005' },
        { key: 'Type dak', value: 'Schuin' }
      ]
    },
    {
      clientName: 'S. Mulder',
      clientEmail: 'stefan.mulder@xs4all.nl',
      projectType: 'Draagmuur',
      city: 'Zaandam',
      address: 'Gedempte Gracht 34',
      status: 'Nieuw' as LeadStatus,
      value: 4800,
      isUrgent: false,
      addressValid: true,
      specifications: [
        { key: 'Lengte opening', value: '2.8', unit: 'm' },
        { key: 'Wanddikte', value: '180', unit: 'mm' },
        { key: 'Draagvermogen', value: 'Woonfunctie' },
        { key: 'Verdieping', value: 'Begane grond' },
        { key: 'Bouwjaar pand', value: '1975' }
      ]
    },
    {
      clientName: 'T. Smit',
      clientEmail: 'thomas.smit@kpnmail.nl',
      projectType: 'Uitbouw',
      city: 'Delft',
      address: 'Oude Delft 120',
      status: 'Nieuw' as LeadStatus,
      value: 22000,
      isUrgent: false,
      addressValid: true,
      specifications: [
        { key: 'Oppervlakte', value: '18', unit: 'm²' },
        { key: 'Breedte', value: '6.0', unit: 'm' },
        { key: 'Diepte', value: '3.0', unit: 'm' },
        { key: 'Fundering', value: 'Op staal' },
        { key: 'Constructie', value: 'Staal' }
      ]
    },
    {
      clientName: 'Fam. Schouten',
      clientEmail: 'contact@schouten-family.nl',
      projectType: 'Dakkapel',
      city: 'Amstelveen',
      address: 'Beethovenlaan 12',
      status: 'Nieuw' as LeadStatus,
      value: 6800,
      isUrgent: false,
      addressValid: true,
      specifications: [
        { key: 'Breedte', value: '4.0', unit: 'm' },
        { key: 'Diepte', value: '2.0', unit: 'm' },
        { key: 'Hoogte', value: '2.3', unit: 'm' },
        { key: 'Bouwjaar pand', value: '1968' },
        { key: 'Type dak', value: 'Schuin' },
        { key: 'Dakbedekking', value: 'Pannen' }
      ]
    },
    {
      clientName: 'G. Pietersen',
      clientEmail: 'g.pietersen@gmail.com',
      projectType: 'Draagmuur',
      city: 'Purmerend',
      address: 'Wheermolen 12',
      status: 'Nieuw' as LeadStatus,
      value: 3200,
      isUrgent: false,
      addressValid: true,
      specifications: [
        { key: 'Lengte opening', value: '2.5', unit: 'm' },
        { key: 'Bouwjaar pand', value: '1995' }
      ]
    },
    {
      clientName: 'J. van Dorp',
      clientEmail: 'j.vandorp@outlook.com',
      projectType: 'Dakkapel',
      city: 'Hoorn',
      address: 'Grote Noord 88',
      status: 'Nieuw' as LeadStatus,
      value: 4800,
      isUrgent: false,
      addressValid: true,
      specifications: [
        { key: 'Breedte', value: '3.0', unit: 'm' },
        { key: 'Type', value: 'Prefab' }
      ]
    },

    // CALCULATIE - In calculation phase
    {
        clientName: 'Fam. Bakker',
        clientEmail: 'bakker@gmail.com',
        projectType: 'Uitbouw',
        city: 'Haarlem',
        address: 'Grote Markt 25',
      status: 'Calculatie' as LeadStatus,
        value: 25000,
        assignee: 'Venka',
        addressValid: true,
      specifications: [
            { key: 'Oppervlakte', value: '20', unit: 'm²' },
            { key: 'Fundering', value: 'Op staal' },
            { key: 'Constructie', value: 'Staal' }
          ]
    },
    {
        clientName: 'P. Jansen',
        clientEmail: 'p.jansen@outlook.com',
        projectType: 'Draagmuur',
        city: 'Utrecht',
        address: 'Oudegracht 150',
      status: 'Calculatie' as LeadStatus,
        value: 4500,
        assignee: 'Angelo',
        addressValid: true,
      specifications: [
            { key: 'Lengte opening', value: '3.5', unit: 'm' },
            { key: 'Draagvermogen', value: 'Woonfunctie' },
            { key: 'Bouwjaar pand', value: '1960' }
          ]
    },
    {
      clientName: 'Fam. Willems',
      clientEmail: 'j.willems@planet.nl',
      clientPhone: '+31 6 45678901',
      projectType: 'Uitbouw',
      city: 'Amersfoort',
      address: 'Arnhemseweg 67',
      status: 'Calculatie' as LeadStatus,
      value: 32000,
      assignee: 'Venka',
      addressValid: true,
      specifications: [
        { key: 'Oppervlakte', value: '28', unit: 'm²' },
        { key: 'Breedte', value: '7.0', unit: 'm' },
        { key: 'Diepte', value: '4.0', unit: 'm' },
        { key: 'Fundering', value: 'Op staal' },
        { key: 'Constructie', value: 'Staal' },
        { key: 'Verdiepingen', value: '1' }
      ]
    },
    {
      clientName: 'N. Hendriks',
      clientEmail: 'nienke.h@live.nl',
      clientPhone: '+31 6 67890123',
      projectType: 'Draagmuur',
      city: 'Hilversum',
      address: 'Larenseweg 55',
      status: 'Calculatie' as LeadStatus,
      value: 6200,
      assignee: 'Venka',
      addressValid: true,
      specifications: [
        { key: 'Lengte opening', value: '5.0', unit: 'm' },
        { key: 'Wanddikte', value: '240', unit: 'mm' },
        { key: 'Draagvermogen', value: 'Woonfunctie' },
        { key: 'Extra doorbrekingen', value: '1' },
        { key: 'Bouwjaar pand', value: '1955' }
      ]
    },
    // Pending approval quotes
    {
      clientName: 'W. Visser',
      clientEmail: 'w.visser@werk.nl',
      projectType: 'Fundering',
      city: 'Gouda',
      address: 'Markt 22',
      status: 'Calculatie' as LeadStatus,
      value: 48000,
      assignee: 'Angelo',
      isUrgent: true,
      addressValid: true,
      quoteApproval: 'pending' as QuoteApprovalStatus,
      quoteValue: 4200,
      quoteDescription: 'Complexe funderingsherstel met vijzeltechniek. Prijs gebaseerd op vergelijkbaar project in Amsterdam-Noord.',
      quoteLineItems: [
        { description: 'Constructieberekening funderingsherstel', amount: 3500 },
        { description: 'Detailtekeningen vijzelwerk', amount: 700 }
      ],
      quoteEstimatedHours: 16,
      specifications: [
        { key: 'Type', value: 'Funderingsherstel' },
        { key: 'Methode', value: 'Vijzelen' },
        { key: 'Bouwjaar pand', value: '1890' }
      ]
    },
    {
      clientName: 'Gemeente Utrecht',
      clientEmail: 'bouwen@utrecht.nl',
      clientPhone: '+31 30 286 0000',
      projectType: 'Constructieadvies',
      city: 'Utrecht',
      address: 'Stadhuisbrug 1',
      status: 'Calculatie' as LeadStatus,
      value: 125000,
      assignee: 'Roina',
      addressValid: true,
      quoteApproval: 'pending' as QuoteApprovalStatus,
      quoteValue: 11500,
      quoteDescription: 'Uitgebreid constructieadvies voor renovatie rijksmonument. Inclusief rapportage en overleg met monumentenzorg.',
      quoteLineItems: [
        { description: 'Constructief onderzoek bestaande situatie', amount: 4500 },
        { description: 'Constructieberekeningen renovatie', amount: 5000 },
        { description: 'Rapportage monumentenzorg', amount: 2000 }
      ],
      quoteEstimatedHours: 40,
      specifications: [
        { key: 'Project', value: 'Renovatie stadhuis' },
        { key: 'Verdiepingen', value: '5' },
        { key: 'Monument', value: 'Rijksmonument' }
      ]
    },

    // OFFERTE VERZONDEN - Quote sent
    {
        clientName: "Stichting 't Hof",
        clientEmail: 'info@hethof.nl',
        clientPhone: '+31 20 987 6543',
        projectType: 'Renovatie',
        city: 'Amsterdam',
        address: 'Herengracht 500',
      status: 'OfferteVerzonden' as LeadStatus,
        value: 120000,
        assignee: 'Roina',
        addressValid: true,
      quoteApproval: 'approved' as QuoteApprovalStatus,
        quoteValue: 12500,
      specifications: [
            { key: 'Oppervlakte', value: '450', unit: 'm²' },
            { key: 'Verdiepingen', value: '4' },
            { key: 'Monument', value: 'Ja' },
            { key: 'Bouwjaar pand', value: '1780' }
          ]
    },
    {
      clientName: 'R. van Dijk',
      clientEmail: 'r.vandijk@ziggo.nl',
      clientPhone: '+31 6 34567890',
      projectType: 'Draagmuur',
      city: 'Den Haag',
      address: 'Noordeinde 88',
      status: 'OfferteVerzonden' as LeadStatus,
      value: 7200,
      assignee: 'Angelo',
      addressValid: true,
      quoteApproval: 'approved' as QuoteApprovalStatus,
      quoteValue: 750,
      specifications: [
        { key: 'Lengte opening', value: '4.2', unit: 'm' },
        { key: 'Wanddikte', value: '220', unit: 'mm' },
        { key: 'Draagvermogen', value: 'Woonfunctie' },
        { key: 'Bouwjaar pand', value: '1985' }
      ]
    },
    {
      clientName: 'Bouwbedrijf Janssen B.V.',
      clientEmail: 'projecten@janssenbouw.nl',
      clientPhone: '+31 30 234 5678',
      projectType: 'Constructieadvies',
      city: 'Amersfoort',
      address: 'Nieuwbouwproject De Hoef',
      status: 'OfferteVerzonden' as LeadStatus,
      value: 62000,
      assignee: 'Roina',
      addressValid: true,
      quoteApproval: 'approved' as QuoteApprovalStatus,
      quoteValue: 5800,
      specifications: [
        { key: 'Woningen', value: '12' },
        { key: 'Type', value: 'Twee-onder-een-kap' }
      ]
    },
    {
      clientName: 'E. Kok',
      clientEmail: 'e.kok@live.nl',
      projectType: 'Uitbouw',
      city: 'Weesp',
      address: 'Nieuwstad 45',
      status: 'OfferteVerzonden' as LeadStatus,
      value: 24000,
      assignee: 'Angelo',
      addressValid: true,
      quoteApproval: 'approved' as QuoteApprovalStatus,
      quoteValue: 1750,
      specifications: [
        { key: 'Oppervlakte', value: '20', unit: 'm²' }
      ]
    },

    // OPDRACHT - Won projects
    {
      clientName: 'K. de Jong',
      clientEmail: 'karen.dejong@gmail.com',
      clientPhone: '+31 6 56789012',
      projectType: 'Dakkapel',
      city: 'Haarlem',
      address: 'Spaarne 78',
      status: 'Opdracht' as LeadStatus,
      value: 8900,
      assignee: 'Angelo',
      addressValid: true,
      quoteApproval: 'approved' as QuoteApprovalStatus,
      quoteValue: 850,
      specifications: [
        { key: 'Breedte', value: '5.5', unit: 'm' },
        { key: 'Diepte', value: '2.2', unit: 'm' },
        { key: 'Hoogte', value: '2.6', unit: 'm' },
        { key: 'Bouwjaar pand', value: '1910' },
        { key: 'Type dak', value: 'Schuin' },
        { key: 'Constructietype', value: 'Staal' }
      ]
    },
    {
      clientName: 'B. van Leeuwen',
      clientEmail: 'b.vanleeuwen@outlook.com',
      projectType: 'Draagmuur',
      city: 'Bussum',
      address: 'Brinklaan 45',
      status: 'Opdracht' as LeadStatus,
      value: 5200,
      assignee: 'Angelo',
      addressValid: true,
      quoteApproval: 'approved' as QuoteApprovalStatus,
      quoteValue: 620,
      specifications: [
        { key: 'Lengte opening', value: '3.8', unit: 'm' },
        { key: 'Status', value: 'Tekening in productie' }
      ]
    },
    {
      clientName: 'Fam. Koster',
      clientEmail: 'koster@xs4all.nl',
      projectType: 'Uitbouw',
      city: 'Naarden',
      address: 'Cattenhage 12',
      status: 'Opdracht' as LeadStatus,
      value: 38000,
      assignee: 'Venka',
      addressValid: true,
      quoteApproval: 'approved' as QuoteApprovalStatus,
      quoteValue: 2850,
      specifications: [
        { key: 'Oppervlakte', value: '30', unit: 'm²' },
        { key: 'Status', value: 'Wacht op vergunning' }
      ]
    },
    {
      clientName: 'Architectenbureau VORM',
      clientEmail: 'projecten@vorm.nl',
      clientPhone: '+31 10 456 7890',
      projectType: 'Constructieadvies',
      city: 'Rotterdam',
      address: 'Lloydstraat 5',
      status: 'Opdracht' as LeadStatus,
      value: 78000,
      assignee: 'Roina',
      addressValid: true,
      quoteApproval: 'approved' as QuoteApprovalStatus,
      quoteValue: 7200,
      specifications: [
        { key: 'Project', value: 'Nieuwbouw kantoor' },
        { key: 'Verdiepingen', value: '8' },
        { key: 'Status', value: 'In uitvoering' }
      ]
    },

    // ARCHIEF - Completed
    {
      clientName: 'A. de Groot',
      clientEmail: 'a.degroot@gmail.com',
      projectType: 'Dakkapel',
      city: 'Hoofddorp',
      address: 'Graan voor Visch 88',
      status: 'Archief' as LeadStatus,
      value: 5900,
      assignee: 'Angelo',
      addressValid: true,
      quoteApproval: 'approved' as QuoteApprovalStatus,
      quoteValue: 585,
      specifications: [
        { key: 'Afgerond op', value: '2025-12-01' }
      ]
    },
    {
      clientName: 'C. Meijer',
      clientEmail: 'c.meijer@work.nl',
      projectType: 'Draagmuur',
      city: 'Baarn',
      address: 'Laanstraat 20',
      status: 'Archief' as LeadStatus,
      value: 4100,
      assignee: 'Angelo',
      addressValid: true,
      quoteApproval: 'approved' as QuoteApprovalStatus,
      quoteValue: 450,
      specifications: [
        { key: 'Afgerond op', value: '2025-12-10' }
      ]
    },
    {
      clientName: 'Woningcorporatie Eigen Haard',
      clientEmail: 'techniek@eigenhaard.nl',
      clientPhone: '+31 20 555 1234',
      projectType: 'Renovatie',
      city: 'Amsterdam',
      address: 'Diverse locaties Noord',
      status: 'Archief' as LeadStatus,
      value: 185000,
      assignee: 'Roina',
      addressValid: true,
      quoteApproval: 'approved' as QuoteApprovalStatus,
      quoteValue: 16500,
      specifications: [
        { key: 'Woningen', value: '24' },
        { key: 'Type', value: 'Balkonrenovatie' },
        { key: 'Afgerond op', value: '2025-11-15' }
      ]
    },
    {
      clientName: 'H. Janssen',
      clientEmail: 'h.janssen@hotmail.com',
      projectType: 'Uitbouw',
      city: 'Zeist',
      address: 'Slotlaan 100',
      status: 'Archief' as LeadStatus,
      value: 28500,
      assignee: 'Venka',
      addressValid: true,
      quoteApproval: 'approved' as QuoteApprovalStatus,
      quoteValue: 1950,
      specifications: [
        { key: 'Afgerond op', value: '2025-11-28' }
      ]
    },
    {
      clientName: 'R. Dekker',
      clientEmail: 'r.dekker@ziggo.nl',
      projectType: 'Fundering',
      city: 'Amsterdam',
      address: 'Jordaan - Bloemgracht 80',
      status: 'Archief' as LeadStatus,
      value: 52000,
      assignee: 'Angelo',
      addressValid: true,
      quoteApproval: 'approved' as QuoteApprovalStatus,
      quoteValue: 4800,
      specifications: [
        { key: 'Type', value: 'Funderingsherstel' },
        { key: 'Afgerond op', value: '2025-10-20' }
      ]
    },
    {
      clientName: 'Fam. van der Pol',
      clientEmail: 'vanderpol@kpn.nl',
      projectType: 'Dakkapel',
      city: 'Diemen',
      address: 'Hartveldseweg 15',
      status: 'Archief' as LeadStatus,
      value: 7200,
      assignee: 'Venka',
      addressValid: true,
      quoteApproval: 'approved' as QuoteApprovalStatus,
      quoteValue: 720,
      specifications: [
        { key: 'Afgerond op', value: '2025-12-05' }
      ]
    }
  ]

  // Create leads with specifications
  for (const leadData of leadsData) {
    const { specifications, quoteLineItems, ...leadFields } = leadData
    
    await prisma.lead.create({
      data: {
        ...leadFields,
        quoteLineItems: quoteLineItems ? quoteLineItems : undefined,
        specifications: {
          create: specifications
        }
      }
    })
  }
  console.log(`✅ Created ${leadsData.length} leads with specifications`)

  console.log('🎉 Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
