import 'dotenv/config'
import { PrismaClient } from '../lib/generated/prisma/client.js'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter })

const INTERVALS: Record<string, Record<string, number>> = {
    B737: { Aisle: 8, Underseat: 12 },
    A320: { Aisle: 12 },
    A330: { Aisle: 6, Underseat: 12 },
    B777: { Aisle: 6, Underseat: 12 },
    ATR: {},
}

async function main() {
    console.log('Seeding Carriage Interval Master...')

    for (const [acTypeGroup, types] of Object.entries(INTERVALS)) {
        for (const [carpetType, intervalMonths] of Object.entries(types)) {
            await prisma.carpetIntervalMaster.upsert({
                where: {
                    acTypeGroup_carpetType: {
                        acTypeGroup: acTypeGroup,
                        carpetType: carpetType,
                    }
                },
                update: {
                    interval: intervalMonths,
                },
                create: {
                    acTypeGroup: acTypeGroup,
                    carpetType: carpetType,
                    interval: intervalMonths,
                }
            })
            console.log(`Seeded ${acTypeGroup} ${carpetType} -> ${intervalMonths} months`)
        }
    }

    console.log('Done seeding intervals!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
