import 'dotenv/config'
import { PrismaClient } from '../lib/generated/prisma/client.js'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('Mereset riwayat penggantian karpet...')

    // 1. Hapus semua histori
    const deletedHistory = await prisma.replacementHistory.deleteMany({})
    console.log(`✅ Terhapus: ${deletedHistory.count} riwayat penggantian (Done history)`)

    // 2. Kosongkan perhitungan lastDone dan nextDue (kembalikan ke awal)
    const updatedItems = await prisma.carpetItem.updateMany({
        data: {
            lastDone: null,
            nextDue: null
        }
    })
    console.log(`✅ Dikosongkan: ${updatedItems.count} Carpet Items (lastDone & nextDue jadi null)`)

    console.log('\nReset selesai. Database sekarang bersih dari riwayat Done.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
