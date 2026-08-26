import 'dotenv/config'
import { PrismaClient } from '../lib/generated/prisma/client.js'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter })

const QG_A320: string[] = [
    'PK-GLE', 'PK-GLG', 'PK-GLL', 'PK-GLR', 'PK-GLS', 'PK-GLT', 'PK-GLU', 'PK-GLV', 'PK-GLX', 'PK-GLY',
    'PK-GQA', 'PK-GQE', 'PK-GQF', 'PK-GQG', 'PK-GQH', 'PK-GQI', 'PK-GQK', 'PK-GQL', 'PK-GQM', 'PK-GQN',
    'PK-GQO', 'PK-GQP', 'PK-GQQ', 'PK-GQR', 'PK-GQS', 'PK-GQU',
    'PK-GTA', 'PK-GTD', 'PK-GTE', 'PK-GTK',
]

async function main() {
    console.log(`Memasukkan ${QG_A320.length} pesawat QG (A320)...`)
    for (const reg of QG_A320) {
        const ac = await prisma.aircraft.upsert({
            where: { registration: reg },
            update: { acType: 'A320', acTypeGroup: 'A320', airline: 'QG' },
            create: { acType: 'A320', acTypeGroup: 'A320', registration: reg, airline: 'QG' },
        })
        await prisma.carpetItem.upsert({
            where: {
                aircraftId_carpetType: {
                    aircraftId: ac.id,
                    carpetType: 'Aisle'
                }
            },
            update: { intervalMonths: 12 },
            create: { aircraftId: ac.id, carpetType: 'Aisle', intervalMonths: 12 },
        })
        console.log(`  ${reg} (A320) - 1 carpet item`)
    }
    console.log('Selesai!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
