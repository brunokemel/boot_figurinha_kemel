# boot_figurinha
Bot simples de WhatsApp que recebe uma imagem e responde com uma figurinha.
## Tecnologias
- Node.js
- TypeScript
- Baileys
- Sharp
## Como instalar
```bash
npm install
```
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
2. Envie uma imagem para o WhatsApp conectado.
3. O bot responde com a imagem convertida em figurinha.
## Observacoes
- A sessao fica salva na pasta definida em `AUTH_FOLDER`.
- Se enviar uma mensagem que nao seja imagem, o bot pede uma imagem.