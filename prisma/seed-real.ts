import 'dotenv/config'
import { PrismaClient } from '../lib/generated/prisma/client.js'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { getGroup } from '../lib/constants'

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter })

const INTERVALS: Record<string, Record<string, number>> = {
    B737: { Aisle: 8, Underseat: 12 },
    A320: { Aisle: 12 },
    A330: { Aisle: 6, Underseat: 12 },
    B777: { Aisle: 6, Underseat: 12 },
    ATR: {},
}

const GA_AIRCRAFT: [string, string][] = [
    ['B737-800', 'PK-GDC'],
    ['B737-800', 'PK-GFD'],
    ['B737-800', 'PK-GFF'],
    ['B737-800', 'PK-GFG'],
    ['B737-800', 'PK-GFH'],
    ['B737-800', 'PK-GFI'],
    ['B737-800', 'PK-GFJ'],
    ['B737-800', 'PK-GFM'],
    ['B737-800', 'PK-GFN'],
    ['B737-800', 'PK-GFO'],
    ['B737-800', 'PK-GFP'],
    ['B737-800', 'PK-GFQ'],
    ['B737-800', 'PK-GFR'],
    ['B737-800', 'PK-GFS'],
    ['B737-800', 'PK-GFT'],
    ['B737-800', 'PK-GFU'],
    ['B737-800', 'PK-GFV'],
    ['B737-800', 'PK-GFW'],
    ['B737-800', 'PK-GFX'],
    ['B737-800', 'PK-GFY'],
    ['B737-800', 'PK-GFZ'],
    ['B737-800', 'PK-GMC'],
    ['B737-800', 'PK-GMD'],
    ['B737-800', 'PK-GME'],
    ['B737-800', 'PK-GMF'],
    ['B737-800', 'PK-GMG'],
    ['B737-800', 'PK-GMH'],
    ['B737-800', 'PK-GMI'],
    ['B737-800', 'PK-GMJ'],
    ['B737-800', 'PK-GMK'],
    ['B737-800', 'PK-GML'],
    ['B737-800', 'PK-GMN'],
    ['B737-800', 'PK-GMO'],
    ['B737-800', 'PK-GMP'],
    ['B737-800', 'PK-GMQ'],
    ['B737-800', 'PK-GMR'],
    ['B737-800', 'PK-GMS'],
    ['B737-800', 'PK-GMT'],
    ['B737-800', 'PK-GMU'],
    ['B737-800', 'PK-GMV'],
    ['B737-800', 'PK-GMW'],
    ['B737-800', 'PK-GNA'],
    ['B737-800', 'PK-GNB'],
    ['B737-800', 'PK-GNC'],
    ['B737-800', 'PK-GND'],
    ['B737-800', 'PK-GNE'],
    ['B737-800', 'PK-GNF'],
    ['B737-800', 'PK-GNG'],
    ['B737-800', 'PK-GNH'],
    ['B737-800', 'PK-GNI'],
    ['B737-800', 'PK-GNJ'],
    ['B737-800', 'PK-GNK'],
    ['B737-800', 'PK-GNL'],
    ['B737-800', 'PK-GNM'],
    ['B737-800', 'PK-GNR'],
    ['B737-800', 'PK-GNS'],
    ['B737-800', 'PK-GNU'],
    ['B737-800', 'PK-GNV'],
    ['A330-200', 'PK-GPL'],
    ['A330-200', 'PK-GPM'],
    ['A330-200', 'PK-GPO'],
    ['A330-200', 'PK-GPP'],
    ['A330-300', 'PK-GHA'],
    ['A330-300', 'PK-GHB'],
    ['A330-300', 'PK-GHC'],
    ['A330-300', 'PK-GHD'],
    ['A330-300', 'PK-GHE'],
    ['A330-300', 'PK-GPF'],
    ['A330-300', 'PK-GPG'],
    ['A330-300', 'PK-GPH'],
    ['A330-300', 'PK-GPI'],
    ['A330-300', 'PK-GPQ'],
    ['A330-300', 'PK-GPR'],
    ['A330-300', 'PK-GPS'],
    ['A330-300', 'PK-GPT'],
    ['A330-300', 'PK-GPU'],
    ['A330-300', 'PK-GPV'],
    ['A330-300', 'PK-GPW'],
    ['A330-300', 'PK-GPZ'],
    ['A330-900', 'PK-GHE'],
    ['A330-900', 'PK-GHF'],
    ['A330-900', 'PK-GHG'],
    ['B777-300ER', 'PK-GIA'],
    ['B777-300ER', 'PK-GIC'],
    ['B777-300ER', 'PK-GIE'],
    ['B777-300ER', 'PK-GIF'],
    ['B777-300ER', 'PK-GIG'],
    ['B777-300ER', 'PK-GIH'],
    ['B777-300ER', 'PK-GIJ'],
    ['B777-300ER', 'PK-GIK'],
]

async function main() {
    console.log('Seeding Real Aircraft Data...')

    for (const [acType, reg] of GA_AIRCRAFT) {
        const group = getGroup(acType)
        const ac = await prisma.aircraft.upsert({
            where: { registration: reg },
            update: { acType, acTypeGroup: group },
            create: { acType, acTypeGroup: group, registration: reg, airline: 'GA' }
        })

        const config = INTERVALS[group]
        if (config) {
            for (const [carpetType, interval] of Object.entries(config)) {
                await prisma.carpetItem.upsert({
                    where: {
                        aircraftId_carpetType: {
                            aircraftId: ac.id,
                            carpetType
                        }
                    },
                    update: { intervalMonths: interval },
                    create: {
                        aircraftId: ac.id,
                        carpetType,
                        intervalMonths: interval
                    }
                })
            }
        }
    }

    console.log('Done seeding real aircraft!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
