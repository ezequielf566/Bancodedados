const fs = require('fs');
const path = require('path');

// 1. Lê a raiz e filtra imagens, vídeos e áudios
const arquivos = fs.readdirSync(__dirname);
const imagensExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
const videosExt = ['.mp4', '.webm', '.ogg'];
const audiosExt = ['.mp3', '.wav', '.m4a'];
const todasExt = [...imagensExt, ...videosExt, ...audiosExt];

const midias = arquivos.filter(arq => todasExt.includes(path.extname(arq).toLowerCase()));

// 2. Inicia o HTML com CSS embutido e Modo Escuro
let html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meu Banco de Mídia</title>
    <style>
        :root { --bg: #0f172a; --card: #1e293b; --text: #f8fafc; --primary: #3b82f6; --primary-hover: #2563eb; }
        * { box-sizing: border-box; }
        body { font-family: 'Segoe UI', system-ui, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 2rem; }
        h1 { text-align: center; margin-bottom: 2rem; font-size: 2.2rem; }
        
        /* Grid de Cards */
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; max-width: 1200px; margin: 0 auto; }
        .card { background: var(--card); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 4px 6px rgba(0,0,0,0.3); transition: transform 0.2s; border: 1px solid #334155; }
        .card:hover { transform: translateY(-5px); border-color: var(--primary); }
        
        /* Previews de Imagem/Vídeo/Áudio */
        .preview-container { width: 100%; height: 200px; background: #000; overflow: hidden; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #334155; position: relative; }
        .preview { width: 100%; height: 100%; object-fit: cover; transition: opacity 0.3s; }
        .preview:hover { opacity: 0.8; }
        
        /* Informações e Botão */
        .info { padding: 1.2rem; flex-grow: 1; display: flex; flex-direction: column; justify-content: space-between; gap: 1rem; }
        .filename { font-size: 0.95rem; word-break: break-all; color: #cbd5e1; margin: 0; font-weight: 500; text-align: center; }
        .btn { background: var(--primary); color: white; border: none; padding: 0.8rem; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: background 0.2s; width: 100%; }
        .btn:hover { background: var(--primary-hover); }
        
        /* Player de Áudio nativo */
        audio { width: 90%; height: 40px; outline: none; z-index: 10; }
        
        /* Notificação Flutuante (Toast) */
        #toast { visibility: hidden; min-width: 250px; background-color: #10b981; color: #fff; text-align: center; border-radius: 8px; padding: 16px; position: fixed; z-index: 100; left: 50%; bottom: 30px; font-size: 16px; font-weight: bold; transform: translateX(-50%) translateY(20px); opacity: 0; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
        #toast.show { visibility: visible; opacity: 1; transform: translateX(-50%) translateY(0); }
    </style>
</head>
<body>
    <h1>📸 Banco de Mídias Vercel</h1>
    <div class="grid">
`;

// 3. Lógica para gerar os Cards de cada arquivo
midias.forEach(arquivo => {
    const ext = path.extname(arquivo).toLowerCase();
    let preview = '';
    
    // Imagem
    if (imagensExt.includes(ext)) {
        preview = `<img src="/${arquivo}" class="preview" alt="${arquivo}" loading="lazy">`;
    } 
    // Vídeo
    else if (videosExt.includes(ext)) {
        preview = `<video src="/${arquivo}" class="preview" muted loop onmouseover="this.play()" onmouseout="this.pause()"></video>`;
    } 
    // Áudio
    else if (audiosExt.includes(ext)) {
        preview = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; width: 100%; background: #1e293b; gap: 15px;">
                <svg width="48" height="48" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
                <audio controls src="/${arquivo}"></audio>
            </div>
        `;
    }

    html += `
        <div class="card">
            <div class="preview-container" title="${arquivo}">
                ${preview}
            </div>
            <div class="info">
                <p class="filename">${arquivo}</p>
                <button class="btn" onclick="copiarLink('${arquivo}')">
                    <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    Copiar
                </button>
            </div>
        </div>
    `;
});

// 4. Lógica JavaScript de Copiar Link e Toast
html += `
    </div>
    <div id="toast">Copiado!</div>

    <script>
        function copiarLink(arquivo) {
            // Pega o domínio da Vercel + o nome do arquivo
            const url = window.location.origin + '/' + arquivo;
            
            navigator.clipboard.writeText(url).then(() => {
                mostrarToast('✅ Copiado: ' + arquivo);
            }).catch(err => {
                console.error('Erro ao copiar: ', err);
                alert('Erro ao copiar o link. Tente copiar manualmente.');
            });
        }

        function mostrarToast(mensagem) {
            const toast = document.getElementById("toast");
            toast.innerText = mensagem;
            toast.classList.add("show");
            
            setTimeout(() => { 
                toast.classList.remove("show"); 
            }, 3000);
        }
    </script>
</body>
</html>`;

// 5. Salva o HTML
fs.writeFileSync(path.join(__dirname, 'index.html'), html);
console.log(`✅ Arquivo index.html gerado com sucesso! Foram mapeados ${midias.length} arquivos.`);
