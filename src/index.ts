import makeWASocket, {
    useMultiFileAuthState,
    downloadMediaMessage,
    DisconnectReason  
} from "@whiskeysockets/baileys";

// imports do MP4 e gif
import { execFile } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

import dotenv from "dotenv";



dotenv.config();

type AnimatedStickerOptions = {
  duration: number;
  fps: number;
  quality: number;
};

const processedMessages = new Set<string>();
const MAX_ANIMATED_STICKER_SIZE = 1024 * 1024;

function convertToWebpAnimated(inputPath: string, outputPath: string, options: AnimatedStickerOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const filter = `fps=${options.fps},scale=512:512:flags=lanczos`;
    const args = [
      "-i", inputPath,
      "-t", String(options.duration),
      "-vcodec", "libwebp",
      "-filter:v", filter,
      "-lossless", "0",
      "-compression_level", "6",
      "-quality", String(options.quality),
      "-preset", "default",
      "-loop", "0",
      "-an",
      "-vsync", "0",
      outputPath
    ];

    execFile("ffmpeg", args, (error) => {
      if (error) return reject(error);
      resolve();
    });
  });
}

async function convertToSmallWebpAnimated(inputPath: string, outputPath: string): Promise<void> {
    await convertToWebpAnimated(inputPath, outputPath, {
        duration: 6,
        fps: 12,
        quality: 65
    });

    if (fs.statSync(outputPath).size <= MAX_ANIMATED_STICKER_SIZE) return;

    fs.unlinkSync(outputPath);
    await convertToWebpAnimated(inputPath, outputPath, {
        duration: 4,
        fps: 10,
        quality: 50
    });
}


// const logger = bool;

import qrcode from "qrcode-terminal";
import sharp from "sharp";

import P from "pino";

async function startBot() {
    // const { state, saveCreds } = await useMultiFileAuthState("auth");
    const { state, saveCreds } = await useMultiFileAuthState(process.env.AUTH_FOLDER || "auth");

    const sock = makeWASocket({auth: state,logger: P({level: process.env.LOG_LEVEL || "silent"}),printQRInTerminal: true});

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
       const messageId = msg.key.id ? `${from}:${msg.key.id}` : "";
       if (messageId) {
            if (processedMessages.has(messageId)) return;
            processedMessages.add(messageId);
            if (processedMessages.size > 1000) {
                const oldestMessageId = processedMessages.values().next().value;
                if (oldestMessageId) processedMessages.delete(oldestMessageId);
            }
       }
       const videoMessage = msg.message.videoMessage;

        if (videoMessage) {
            const tempId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
            const inputPath = path.join(os.tmpdir(), `boot-figurinha-${tempId}.mp4`);
            const outputPath = path.join(os.tmpdir(), `boot-figurinha-${tempId}.webp`);

            try {
                // Baixa o GIF ou vídeo
                const buffer = await downloadMediaMessage(msg, "buffer", {}, {
                logger: P({ level: process.env.LOG_LEVEL || "silent" }),
                reuploadRequest: sock.updateMediaMessage
                });

                fs.writeFileSync(inputPath, buffer);

                // Converte para WebP animado redimensionado e mais leve
                await convertToSmallWebpAnimated(inputPath, outputPath);

                // Envia como figurinha animada
                await sock.sendMessage(from, { sticker: { url: outputPath } });
            } catch (error) {
                console.error("Erro ao converter vídeo em figurinha animada:", error);
                await sock.sendMessage(from, {
                    text: "Não consegui transformar esse vídeo em figurinha animada. Verifique se o FFmpeg está instalado e tente um vídeo menor."
                });
            } finally {
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            }
            return;
        }


        const imageMessage = msg.message.imageMessage;
        if (!imageMessage) {
                await sock.sendMessage(from, {
                    text: "Me envie uma imagem que eu transformo em figurinha."
                });
                return;
            }

        
        const buffer = await downloadMediaMessage(msg, "buffer", {}, { logger: P({ level: process.env.LOG_LEVEL || "silent" }), reuploadRequest: sock.updateMediaMessage });

        const sticker = await sharp(buffer as Buffer).resize(512, 512, {fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0}}).webp().toBuffer();
        
        await sock.sendMessage(from, {sticker});
    });
}

startBot();
