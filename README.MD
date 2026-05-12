# boot_figurinha
Bot simples de WhatsApp que recebe imagem, video ou GIF e responde com uma figurinha.
## Tecnologias
- Node.js
- TypeScript
- Baileys
- Sharp
- FFmpeg
## Como instalar
```bash
npm install
```
Para converter videos/GIFs em figurinhas animadas, o FFmpeg precisa estar instalado e disponivel no PATH.
## Configuracao
Crie um arquivo `.env` na raiz do projeto, se quiser personalizar:
```env
AUTH_FOLDER=auth
LOG_LEVEL=silent
```
- `AUTH_FOLDER`: pasta onde a sessao do WhatsApp sera salva.
- `LOG_LEVEL`: nivel de log do bot.
## Como rodar
```bash
npm run dev
```
Depois disso, escaneie o QR Code no terminal usando o WhatsApp.
## Como usar
1. Inicie o bot.
2. Envie uma imagem, video ou GIF para o WhatsApp conectado.
3. O bot responde com o arquivo convertido em figurinha.
## Observacoes
- A sessao fica salva na pasta definida em `AUTH_FOLDER`.
- Imagens sao redimensionadas para 512x512 mantendo transparencia.
- Videos e GIFs sao convertidos para WebP animado em 512x512, esticando para preencher a figurinha.
- Videos grandes sao reduzidos em duracao, FPS e qualidade para tentar caber no limite da figurinha animada.
- Mensagens duplicadas sao ignoradas para evitar enviar a mesma figurinha duas vezes.
- Se enviar uma mensagem que nao seja imagem, video ou GIF, o bot pede uma imagem.
