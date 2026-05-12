import makeWASocket, {
    useMultiFileAuthState,
    downloadMediaMessage,
    DisconnectReason  
} from "@whiskeysockets/baileys";


// const logger = bool;

import qrcode from "qrcode-terminal";
import sharp from "sharp";

import P from "pino";

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth");

    const sock = makeWASocket({
        auth: state,
        logger: P({ level: "silent"}),
        printQRInTerminal: true
    });

    sock.ev.on("connection.update", (update) => {
        const { connection, qr, lastDisconnect} = update;

        if (qr) {
            qrcode.generate(qr, { small: true });
            console.log("Escaneie o QR Code no WhatsApp.");
        }

        if(connection === "close") {
            const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;

            if(shouldReconnect) startBot();
        }

        if (connection === "open") {
            console.log("conectado");
        }
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("messages.upsert", async ({ messages }) => {
       const msg = messages[0];
       if(!msg.message || msg.key.fromMe) return;

       const from = msg.key.remoteJid!;
       const imageMessage = msg.message.imageMessage;

       if (!imageMessage) {
            await sock.sendMessage(from, {
                text: "Me envie uma imagem que eu transformo em figurinha."
            });
            return;
        }

        
        const buffer = await downloadMediaMessage(msg, "buffer", {}, { logger: P({ level: "silent" }), reuploadRequest: sock.updateMediaMessage });

        const sticker = await sharp(buffer as Buffer).resize(512, 512, {fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0}}).webp().toBuffer();
        
        await sock.sendMessage(from, {sticker});
    });
}

startBot();