// prisma/seed-users.js
const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

const PASSWORD_DEFAULT = "sales"

const USERS = [
    // ===== PROJECT =====
    ["KA Developer", "PROJECT", "ekagunawan", "Eka G", "ekagunawan@gmail.com", "878001"],
    ["KA Developer", "PROJECT", "satrio", "Satrio S", "satrio@gmail.com", "878002"],
    ["KA Developer", "PROJECT", "suhanda", "Suhanda", "suhanda@gmail.com", "878003"],
    ["KA Kontraktor", "PROJECT", "ivanw", "Ivan W", "ivanw@gmail.com", "878004"],
    ["KA Kontraktor", "PROJECT", "jejen", "H. Jejen", "jejen@gmail.com", "878005"],
    ["KA Kontraktor", "PROJECT", "paryanto", "H. Paryanto", "paryanto@gmail.com", "878006"],
    ["TSO Nasional", "PROJECT", "suandi", "Suandi", "suandi@gmail.com", "878007"],
    ["TSO Nasional", "PROJECT", "arpis", "Arpis / Handri S", "arpis@gmail.com", "878008"],
    ["TSO Nasional", "PROJECT", "andriyansyah", "Andriyansyah", "andriyansyah@gmail.com", "878009"],
    ["TSO Nasional", "PROJECT", "rendiy", "Rendi Y", "rendiy@gmail.com", "878010"],
    ["TSO Nasional", "PROJECT", "aditya", "Aditya", "aditya@gmail.com", "878011"],
    ["TSO Nasional", "PROJECT", "andya", "Andy A", "andya@gmail.com", "878012"],
    ["TSO Nasional", "PROJECT", "ridho", "Ridho", "ridho@gmail.com", "878013"],
    ["TSO Nasional", "PROJECT", "windi", "Windi", "windi@gmail.com", "878014"],
    ["TSO Nasional", "PROJECT", "raskim", "Raskim A", "raskim@gmail.com", "878015"],
    ["TSO Nasional", "PROJECT", "ivanbp", "Ivan B.P", "ivanbp@gmail.com", "878016"],
    ["TSO Nasional", "PROJECT", "aguss", "Agus S", "aguss@gmail.com", "878017"],
    ["TSO Nasional", "PROJECT", "wahyu", "Wahyu", "wahyu@gmail.com", "878018"],
    ["TSO Nasional", "PROJECT", "wasis", "Wasis", "wasis@gmail.com", "878019"],

    // ===== RETAIL =====
    ["TSO DKI", "RETAIL", "agusw", "Agus W", "agusw@gmail.com", "878020"],
    ["TSO DKI", "RETAIL", "daryanto", "Daryanto", "daryanto@gmail.com", "878021"],
    ["TSO DKI", "RETAIL", "trisno", "Trisno", "trisno@gmail.com", "878022"],
    ["TSO DKI", "RETAIL", "ekap", "Eka P", "ekap@gmail.com", "878023"],
    ["TSO DKI", "RETAIL", "irfand", "Irfan D", "irfand@gmail.com", "878024"],
    ["Other DIV", "RETAIL", "scpi", "SCPI", "scpi@gmail.com", "878025"],
    ["Other DIV", "RETAIL", "ekamos", "Eka MOS", "ekamos@gmail.com", "878026"],
    ["Other DIV", "RETAIL", "aryantomos", "Aryanto MOS", "aryantomos@gmail.com", "878027"],
    ["Other DIV", "RETAIL", "kadar", "Kadar R", "kadar@gmail.com", "878028"],
    ["Other DIV", "RETAIL", "saktyo", "Saktyo H", "saktyo@gmail.com", "878029"],
]

async function main() {
    const passwordHash = await bcrypt.hash(PASSWORD_DEFAULT, 10)

    for (const [bagian, kategori, akun, nama, email, noHp] of USERS) {
        await prisma.tbUser.upsert({
            where: { email },
            update: {
                akun,
                nama,
                noHp,
                bagian,
                kategori,
                aktif: true,
            },
            create: {
                email,
                akun,
                nama,
                noHp,
                bagian,
                kategori,
                role: "user",
                aktif: true,
                passwordHash,
            },
        })
    }

    console.log(`✅ Seed selesai (${USERS.length} user)`)
    console.log(`🔑 Default password semua user: "${PASSWORD_DEFAULT}"`)
}

main()
    .catch((e) => {
        console.error("❌ Seed error:", e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
