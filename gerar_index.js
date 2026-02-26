const fs = require('fs');
const path = require('path');

// 1. Definição de extensões por categoria
const categorias = {
    imagens: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
    videos: ['.mp4', '.webm', '.ogg'],
    audios: ['.mp3', '.wav', '.m4a'],
    pdfs: ['.pdf']
};
const todasExt = Object.values(categorias).flat();

// 2. Lê a raiz, filtra e coleta metadados (para ordenação por data)
const arquivos = fs.readdirSync(__dirname);
const midias = arquivos
    .filter(arq => todasExt.includes(path.extname(arq).toLowerCase()))
    .map(arq => {
        // Pega as informações do arquivo para saber quando foi modificado
        const stats = fs.statSync(path.join(__dirname, arq));
        const ext = path.extname(arq).toLowerCase();
        
        let tipo = 'outro';
        if (categorias.imagens.includes(ext)) tipo = 'imagem';
        else if (categorias.videos.includes(ext)) tipo = 'video';
        else if (categorias.audios.includes(ext)) tipo = 'audio';
        else if (categorias.pdfs.includes(ext)) tipo = 'pdf';

        return {
            nome: arq,
            tipo: tipo,
            dataModificacao: stats.mtimeMs // Tempo em ms para ordenar por "mais recentes"
        };
    });

// 3. Monta o HTML, injetando os dados como JSON para o Frontend gerenciar dinamicamente
const jsonMidias = JSON.stringify(midias);

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Media Hub Pro</title>
    <style>
        :root { 
            --bg: #0f172a; --surface: #1e293b; --surface-hover: #334155; 
            --text: #f8fafc; --text-muted: #94a3b8;
            --primary: #3b82f6; --primary-hover: #2563eb; 
            --success: #10b981; --border: #334155; --radius: 12px;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', system-ui, sans-serif; background: var(--bg); color: var(--text); padding: 2rem; min-height: 100vh; }
        
        header { max-width: 1400px; margin: 0 auto 2rem; }
        h1 { font-size: 2.2rem; font-weight: 700; background: linear-gradient(to right, #60a5fa, #a78bfa); -webkit-background-clip: text; color: transparent; margin-bottom: 1.5rem; text-align: center; }
        
        /* Controles (Filtros, Busca, Ordenação) */
        .controls { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; justify-content: space-between; background: var(--surface); padding: 1rem; border-radius: var(--radius); border: 1px solid var(--border); }
        
        .tabs { display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 4px; }
        .tab-btn { background: transparent; color: var(--text-muted); border: 1px solid transparent; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s; white-space: nowrap; }
        .tab-btn:hover { color: var(--text); background: var(--surface-hover); }
        .tab-btn.active { background: var(--primary); color: white; }
        
        .search-sort { display: flex; gap: 1rem; flex: 1; min-width: 300px; justify-content: flex-end; }
        input[type="text"], select { background: var(--bg); color: var(--text); border: 1px solid var(--border); padding: 0.6rem 1rem; border-radius: 8px; font-size: 0.95rem; outline: none; transition: border-color 0.2s; }
        input[type="text"]:focus, select:focus { border-color: var(--primary); }
        input[type="text"] { flex: 1; max-width: 300px; }
        
        /* Grid */
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; max-width: 1400px; margin: 0 auto; }
        
        /* Cards */
        .card { background: var(--surface); border-radius: var(--radius); overflow: hidden; display: flex; flex-direction: column; border: 1px solid var(--border); transition: transform 0.2s, box-shadow 0.2s; }
        .card:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5); border-color: var(--surface-hover); }
        
        .preview-container { height: 180px; background: #000; display: flex; align-items: center; justify-content: center; position: relative; border-bottom: 1px solid var(--border); overflow: hidden;}
        .preview { width: 100%; height: 100%; object-fit: cover; }
        .icon-fallback { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; color: var(--text-muted); }
        .icon-fallback svg { width: 48px; height: 48px; stroke: currentColor; fill: none; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
        
        .info { padding: 1.2rem; display: flex; flex-direction: column; gap: 1rem; flex: 1; }
        .filename { font-size: 0.9rem; font-weight: 500; word-break: break-all; color: var(--text); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .date { font-size: 0.75rem; color: var(--text-muted); }
        
        .actions { display: flex; gap: 0.5rem; margin-top: auto; }
        .btn { flex: 1; background: var(--surface-hover); color: var(--text); border: 1px solid var(--border); padding: 0.6rem; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 0.4rem; transition: all 0.2s; text-decoration: none; }
        .btn:hover { background: var(--border); }
        .btn-primary { background: var(--primary); color: white; border-color: var(--primary); }
        .btn-primary:hover { background: var(--primary-hover); border-color: var(--primary-hover); }
        
        /* Players Nativos */
        audio { width: 90%; height: 40px; }
        
        /* Empty State */
        .empty-state { grid-column: 1 / -1; text-align: center; padding: 4rem; color: var(--text-muted); font-size: 1.2rem; }

        /* Toast */
        #toast { visibility: hidden; min-width: 250px; background-color: var(--success); color: #fff; text-align: center; border-radius: 8px; padding: 1rem; position: fixed; z-index: 100; left: 50%; bottom: 30px; font-weight: bold; transform: translate(-50%, 20px); opacity: 0; transition: all 0.3s ease; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3); }
        #toast.show { visibility: visible; opacity: 1; transform: translate(-50%, 0); }
        
        @media (max-width: 768px) {
            .search-sort { flex-direction: column; min-width: 100%; }
            input[type="text"] { max-width: 100%; }
        }
    </style>
</head>
<body>

    <header>
        <h1>📸 Media Hub Pro</h1>
        <div class="controls">
            <div class="tabs" id="tabs">
                <button class="tab-btn active" data-filter="todos">Todos</button>
                <button class="tab-btn" data-filter="imagem">Imagens</button>
                <button class="tab-btn" data-filter="video">Vídeos</button>
                <button class="tab-btn" data-filter="audio">Áudios</button>
                <button class="tab-btn" data-filter="pdf">PDFs</button>
            </div>
            <div class="search-sort">
                <input type="text" id="searchInput" placeholder="Buscar arquivo...">
                <select id="sortSelect">
                    <option value="recentes">Mais Recentes</option>
                    <option value="antigos">Mais Antigos</option>
                    <option value="az">Nome (A-Z)</option>
                    <option value="za">Nome (Z-A)</option>
                </select>
            </div>
        </div>
    </header>

    <main class="grid" id="grid"></main>

    <div id="toast">Copiado!</div>

    <script>
        // Dados recebidos do Node.js
        const todasMidias = ${jsonMidias};
        
        // Elementos DOM
        const grid = document.getElementById('grid');
        const searchInput = document.getElementById('searchInput');
        const sortSelect = document.getElementById('sortSelect');
        const tabs = document.querySelectorAll('.tab-btn');
        
        // Estado atual
        let currentFilter = 'todos';
        let currentSearch = '';
        let currentSort = 'recentes';

        // Ícones SVG
        const icons = {
            audio: '<svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>',
            pdf: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
            copy: '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
            open: '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>'
        };

        function formatarData(ms) {
            return new Date(ms).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
        }

        // Função principal que desenha os cards na tela
        function render() {
            // 1. Filtrar
            let filtrados = todasMidias.filter(m => {
                const matchFiltro = currentFilter === 'todos' || m.tipo === currentFilter;
                const matchBusca = m.nome.toLowerCase().includes(currentSearch.toLowerCase());
                return matchFiltro && matchBusca;
            });

            // 2. Ordenar
            filtrados.sort((a, b) => {
                if (currentSort === 'recentes') return b.dataModificacao - a.dataModificacao;
                if (currentSort === 'antigos') return a.dataModificacao - b.dataModificacao;
                if (currentSort === 'az') return a.nome.localeCompare(b.nome);
                if (currentSort === 'za') return b.nome.localeCompare(a.nome);
                return 0;
            });

            // 3. Montar HTML
            grid.innerHTML = '';
            
            if (filtrados.length === 0) {
                grid.innerHTML = '<div class="empty-state">Nenhum arquivo encontrado. 😢</div>';
                return;
            }

            filtrados.forEach(m => {
                let previewHTML = '';
                
                if (m.tipo === 'imagem') {
                    previewHTML = \`<img src="/\${m.nome}" class="preview" alt="\${m.nome}" loading="lazy">\`;
                } else if (m.tipo === 'video') {
                    previewHTML = \`<video src="/\${m.nome}" class="preview" muted loop onmouseover="this.play()" onmouseout="this.pause()"></video>\`;
                } else if (m.tipo === 'audio') {
                    previewHTML = \`
                        <div class="icon-fallback" style="height: 100%; justify-content: center; gap: 1rem;">
                            \${icons.audio}
                            <audio controls src="/\${m.nome}"></audio>
                        </div>\`;
                } else if (m.tipo === 'pdf') {
                    previewHTML = \`
                        <div class="icon-fallback" style="height: 100%; justify-content: center;">
                            \${icons.pdf}
                            <span style="margin-top: 10px; font-weight: bold;">Documento PDF</span>
                        </div>\`;
                }

                grid.innerHTML += \`
                    <div class="card">
                        <div class="preview-container" title="\${m.nome}">
                            \${previewHTML}
                        </div>
                        <div class="info">
                            <div>
                                <p class="filename" title="\${m.nome}">\${m.nome}</p>
                                <span class="date">Modificado: \${formatarData(m.dataModificacao)}</span>
                            </div>
                            <div class="actions">
                                <a href="/\${m.nome}" target="_blank" class="btn" title="Visualizar">
                                    \${icons.open} Abrir
                                </a>
                                <button class="btn btn-primary" onclick="copiarLink('\${m.nome}')">
                                    \${icons.copy} Copiar
                                </button>
                            </div>
                        </div>
                    </div>
                \`;
            });
        }

        // Listeners para os controles
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value;
            render();
        });

        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            render();
        });

        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                tabs.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                currentFilter = e.target.getAttribute('data-filter');
                render();
            });
        });

        // Funções Globais (Copiar e Notificação)
        window.copiarLink = function(arquivo) {
            const url = window.location.origin + '/' + arquivo;
            navigator.clipboard.writeText(url).then(() => {
                mostrarToast('✅ Link Copiado!');
            }).catch(err => {
                console.error('Erro:', err);
                alert('Erro ao copiar o link.');
            });
        };

        function mostrarToast(mensagem) {
            const toast = document.getElementById("toast");
            toast.innerText = mensagem;
            toast.classList.add("show");
            setTimeout(() => toast.classList.remove("show"), 3000);
        }

        // Renderização inicial
        render();
    </script>
</body>
</html>`;

// 4. Salva o HTML
fs.writeFileSync(path.join(__dirname, 'index.html'), html);
console.log(`✅ Arquivo index.html gerado com sucesso! Foram mapeados ${midias.length} arquivos.`);
