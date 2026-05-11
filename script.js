let cardContainer = document.querySelector(".card-container");
let todosOsDados = []; // Renomeado para clareza
let categoriaAtual = 'todos';
let todosMapas = []; // lista de mapas carregada de maps.json


// 1. Carrega os dados do JSON uma única vez quando a página é carregada.
async function carregarDados() {
    try {
        const resposta = await fetch("data.json");
        if (!resposta.ok) throw new Error(`Falha na requisição: ${resposta.status} ${resposta.statusText}`);
        todosOsDados = await resposta.json();
        // renderiza o menu de categorias e os cards
        if (typeof renderizarCategorias === 'function') renderizarCategorias(todosOsDados);
        renderizarCards(todosOsDados); // Exibe todos os cards inicialmente

        // Aplica o estado inicial a partir da URL e ouve por mudanças
        function applyInitialStateFromURL() {
            if (location.pathname.split('/').pop() !== 'fatos.html') return;

            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            const cat = params.get('categoria') || 'todos';
            const busca = params.get('busca') || '';

            const inputBuscaLocal = document.querySelector('header input');
            if (inputBuscaLocal) {
                inputBuscaLocal.value = busca;
            }

            // `selecionarCategoria` aplica o filtro de categoria e, em seguida,
            // o filtro de busca, renderizando o resultado final.
            selecionarCategoria(cat);
        }

        // Aplica o estado da URL ao carregar e sempre que o hash mudar
        applyInitialStateFromURL();
        window.addEventListener('hashchange', applyInitialStateFromURL, false);

    } catch (erro) {
        console.error('Erro ao carregar/parsear data.json:', erro);
        cardContainer.innerHTML = `<p class="erro">Erro ao carregar dados. Veja o console para detalhes.</p>`;
    }
}

/* --- Mapas: carregar e exibir galeria de mapas (maps.json) --- */
async function carregarMapas() {
    try {
        const resp = await fetch('maps.json');
        if (!resp.ok) throw new Error('Falha ao carregar maps.json');
        const mapas = await resp.json();
        todosMapas = Array.isArray(mapas) ? mapas : [];
        renderizarMapas(todosMapas);
        // atualiza categorias para refletir o contador de mapas
        if (typeof renderizarCategorias === 'function' && todosOsDados && todosOsDados.length) renderizarCategorias(todosOsDados);
    } catch (err) {
        console.warn('Nenhum mapa disponível ou erro ao carregar maps.json:', err);
        todosMapas = [];
    }
}

function renderizarMapas(lista) {
    const grid = document.querySelector('.maps-grid');
    if (!grid || !Array.isArray(lista)) return;
    grid.innerHTML = '';
    lista.forEach(m => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'map-thumb';
        btn.title = m.title || '';
        btn.innerHTML = `
            <img src="${m.file}" alt="${m.title || 'Mapa'}" loading="lazy" />
            <div class="map-thumb-label">${m.title || ''}</div>
        `;
        btn.addEventListener('click', () => openMapModal(m));
        grid.appendChild(btn);
    });

    // se desejar, podemos relacionar mapas com fatos mais tarde
}

function openMapModal(mapObj) {
    const modal = document.getElementById('map-modal');
    const img = document.getElementById('map-modal-img');
    const title = document.getElementById('map-modal-title');
    if (!modal || !img) return;
    img.src = mapObj.file;
    img.alt = mapObj.title || 'Mapa';
    title.textContent = mapObj.title || '';
    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');
}

function closeMapModal() {
    const modal = document.getElementById('map-modal');
    const img = document.getElementById('map-modal-img');
    if (!modal) return;
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    if (img) img.src = '';
}

// listeners do modal
document.addEventListener('click', (e) => {
    const modal = document.getElementById('map-modal');
    if (!modal) return;
    if (e.target && e.target.id === 'map-modal-close') return closeMapModal();
    // fechar ao clicar fora do conteúdo
    if (e.target && e.target.classList.contains('map-modal')) return closeMapModal();
});

// fechar com Esc
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMapModal();
});

// Carrega apenas as categorias para popular o dropdown do header (sem renderizar cards)
async function carregarCategoriasHeader() {
    try {
        if (todosOsDados && todosOsDados.length) {
            // tentar também carregar mapas para atualizar o contador no header
            try {
                const r = await fetch('maps.json');
                if (r.ok) {
                    const m = await r.json();
                    todosMapas = Array.isArray(m) ? m : [];
                }
            } catch (e) { /* silencioso */ }
            if (typeof renderizarCategorias === 'function') renderizarCategorias(todosOsDados);
            return;
        }
        const resp = await fetch('data.json');
        if (!resp.ok) throw new Error(`Falha na requisição: ${resp.status}`);
        const dados = await resp.json();
        todosOsDados = dados;
        // tenta carregar mapas também para contar
        try {
            const r2 = await fetch('maps.json');
            if (r2.ok) {
                const m2 = await r2.json();
                todosMapas = Array.isArray(m2) ? m2 : [];
            }
        } catch (e) { /* silencioso */ }
        if (typeof renderizarCategorias === 'function') renderizarCategorias(todosOsDados);
    } catch (err) {
        console.error('Erro ao carregar categorias para o header:', err);
        // não exibimos cards aqui; apenas falha silenciosa no header
    }
}

// 2. Função que lida com a busca em tempo real a cada digitação.
function manipularBusca() {
    const inputBuscaLocal = document.querySelector('header input');
    const termo = inputBuscaLocal ? inputBuscaLocal.value.trim() : '';
    // Adiciona a lógica para esconder/mostrar o título do site
    const siteTitle = document.querySelector('.site-title');
    const siteDescription = document.querySelector('.site-description');
    const aboutExodo = document.querySelector('.about-exodo');

    if (termo) {
        if (siteTitle) siteTitle.style.display = 'none';
        if (siteDescription) siteDescription.style.display = 'none';
        if (aboutExodo) aboutExodo.style.display = 'none';
    } else {
        if (siteTitle) siteTitle.style.display = '';
        if (siteDescription) siteDescription.style.display = '';
        if (aboutExodo) aboutExodo.style.display = '';
    }

    // Aplica filtro por termo e por categoria atual
    let resultados = filtroPorTermo(todosOsDados, termo);
    if (categoriaAtual && categoriaAtual !== 'todos') {
        resultados = resultados.filter(item => (item.categoria || '').toLowerCase() === categoriaAtual.toLowerCase());
    }
    renderizarCards(resultados, termo);
    updateURL(categoriaAtual, termo);

    // verificar se o termo casa com mapas; se sim, mostrar galeria filtrada
    try {
        const t = removerAcentos(termo || '');
        const mapsSection = document.getElementById('maps-gallery');
        if (mapsSection) {
            const mapasFiltrados = filtroMapasPorTermo(todosMapas, t);
            if (t && mapasFiltrados.length > 0) {
                renderizarMapas(mapasFiltrados);
                mapsSection.style.display = 'block';
            } else if (categoriaAtual === 'mapas') {
                renderizarMapas(todosMapas || []);
                mapsSection.style.display = 'block';
            } else {
                mapsSection.style.display = 'none';
            }
        }
    } catch (e) { /* silencioso */ }
}

function renderizarCards(dados, termo = '') {
    cardContainer.innerHTML = '';
    if (!dados || dados.length === 0) {
        cardContainer.innerHTML = `<p class="nenhum">Nenhum resultado encontrado${termo ? ` para "${termo}"` : ''}.</p>`;
        return;
    }

    for (let dado of dados) {
        let article = document.createElement("article");
        article.classList.add("card");
        article.innerHTML = `
        <h2>${dado.nome}</h2>
        <p><strong>Significado:</strong> ${dado.significado}</p>
        <p><strong>Referência:</strong> ${dado.referencia}</p>
        <p class="description">${dado.descricao}</p>
        `;
        cardContainer.appendChild(article);
    }
}

function removerAcentos(str = '') {
    return str.normalize('NFKD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

function filtroPorTermo(lista, termo) {
    if (!termo) return lista;
    const t = removerAcentos(termo);
    return lista.filter(item => {
        const campos = [item.nome, item.significado, item.referencia, item.descricao].filter(Boolean).join(' ');
        return removerAcentos(campos).includes(t);
    });
}

function filtroMapasPorTermo(lista, termo) {
    if (!termo) return [];
    const t = removerAcentos(termo);
    return lista.filter(mapa => {
        const campos = [mapa.title, mapa.file].filter(Boolean).join(' ');
        return removerAcentos(campos).includes(t);
    });
}

// 3. Função de Debounce
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

function updateURL(categoria, termo) {
    const hashParts = [];
    if (categoria && categoria !== 'todos') {
        hashParts.push(`categoria=${encodeURIComponent(categoria)}`);
    }
    if (termo) {
        hashParts.push(`busca=${encodeURIComponent(termo)}`);
    }

    const newHash = hashParts.join('&');
    history.replaceState(null, '', newHash ? `#${newHash}` : window.location.pathname + window.location.search);
}

// Renderiza o menu de categorias (botões) com contadores
function renderizarCategorias(dados) {
    const mainNav = document.getElementById('categorias-nav');
    const headerDropdown = document.getElementById('fatos-dropdown');
    if (mainNav) mainNav.innerHTML = '';
    if (headerDropdown) headerDropdown.innerHTML = '';

    const mapa = dados.reduce((acc, item) => {
        const cat = (item.categoria || 'outros').toString().toLowerCase();
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
    }, {});

    const categorias = Object.keys(mapa).sort();

    // Helper para criar botão
    function criarBtn(catKey, label) {
        const btn = document.createElement('button');
        btn.className = 'category-btn';
        btn.type = 'button';
        btn.dataset.cat = catKey;
        btn.textContent = label;
        return btn;
    }

    // 'Todos' primeiro (sem contador)
    const todosLabel = 'Todos';
    const btnTodosMain = criarBtn('todos', todosLabel);
    btnTodosMain.classList.add('active');

    // botão 'Mapas' (após 'Todos') — sem contador
    const mapasLabel = 'Mapas';
    const btnMapas = criarBtn('mapas', mapasLabel);

    if (mainNav) mainNav.appendChild(btnTodosMain.cloneNode(true));
    if (mainNav) mainNav.appendChild(btnMapas.cloneNode(true));
    if (headerDropdown) headerDropdown.appendChild(btnTodosMain.cloneNode(true));
    if (headerDropdown) headerDropdown.appendChild(btnMapas.cloneNode(true));

    for (const c of categorias) {
        const label = `${c.charAt(0).toUpperCase() + c.slice(1)}`;
        const btn = criarBtn(c, label);
        if (mainNav) mainNav.appendChild(btn.cloneNode(true));
        if (headerDropdown) headerDropdown.appendChild(btn.cloneNode(true));
    }

    // Delegação de evento para clicar nos botões (main nav)
    if (mainNav) {
        mainNav.addEventListener('click', (e) => {
            const b = e.target.closest('button');
            if (!b) return;
            const cat = b.dataset.cat;
            selecionarCategoria(cat);
        });
    }

    // Delegação no header dropdown — seleciona categoria e fecha dropdown (se aplicável)
    if (headerDropdown) {
        headerDropdown.addEventListener('click', (e) => {
            const b = e.target.closest('button');
            if (!b) return;
            const cat = b.dataset.cat;
            const dropdownContainer = document.querySelector('.nav .has-dropdown');

            // Seleciona categoria e, se estivermos fora de fatos.html, navega para fatos.html com hash indicando categoria
            if (location.pathname.split('/').pop() !== 'fatos.html') {
                // Navega para fatos.html e envia a categoria via hash para que a página a aplique
                if (dropdownContainer) dropdownContainer.classList.remove('is-open');
                location.href = `fatos.html#categoria=${encodeURIComponent(cat)}`;
                return;
            }
            selecionarCategoria(cat);
            // close dropdown after selection
            if (dropdownContainer) dropdownContainer.classList.remove('is-open');
        });
    }
}

function selecionarCategoria(cat) {
    categoriaAtual = cat || 'todos';
    const nav = document.getElementById('categorias-nav');
    if (nav) {
        nav.querySelectorAll('.category-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === categoriaAtual));
    }

    // também sincroniza o dropdown no header
    const headerDropdown = document.getElementById('fatos-dropdown');
    if (headerDropdown) {
        headerDropdown.querySelectorAll('.category-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === categoriaAtual));
    }

    // aplica filtro combinado com termo de busca atual
    const inputBuscaLocal = document.querySelector('header input');
    const termo = inputBuscaLocal ? inputBuscaLocal.value.trim() : '';
    let resultados = filtroPorTermo(todosOsDados, termo);
    if (categoriaAtual && categoriaAtual !== 'todos') {
        resultados = resultados.filter(item => (item.categoria || '').toLowerCase() === categoriaAtual.toLowerCase());
    }
    renderizarCards(resultados, termo);
    updateURL(categoriaAtual, termo);

    // mostrar/ocultar galeria de mapas
    try {
        const mapsSection = document.getElementById('maps-gallery');
        if (mapsSection) {
            if (categoriaAtual === 'mapas') {
                // mostra todos os mapas
                renderizarMapas(todosMapas || []);
                mapsSection.style.display = 'block';
            } else {
                mapsSection.style.display = 'none';
            }
        }
    } catch (e) { /* silencioso */ }

    // Atualiza o badge de categoria ativa (se existir)
    try {
        const badge = document.getElementById('categoria-ativa');
        if (badge) {
            const catLabel = (categoriaAtual === 'todos') ? 'Todos' : (categoriaAtual.charAt(0).toUpperCase() + categoriaAtual.slice(1));
            // total disponível nessa categoria (sem filtro de termo)
            const totalNaCategoria = (categoriaAtual === 'todos') ? todosOsDados.length : todosOsDados.filter(d => (d.categoria || '').toLowerCase() === categoriaAtual.toLowerCase()).length;
            const mostrando = resultados.length;
            if (categoriaAtual === 'todos') {
                badge.textContent = `Categoria: ${catLabel} — mostrando ${mostrando} de ${totalNaCategoria}`;
            } else {
                badge.textContent = `Categoria: ${catLabel} (${totalNaCategoria}) — mostrando ${mostrando}`;
            }
        }
    } catch (e) {
        // silencioso
    }
}

// Função chamada pelo botão de busca no header
function iniciarBusca() {
    const inputBuscaLocal = document.querySelector('header input');
    if (!inputBuscaLocal) return;

    const termo = inputBuscaLocal.value.trim();
    const estamosEmFatos = window.location.pathname.includes('fatos.html');

    if (termo) {
        if (estamosEmFatos) {
            // Se já estamos em fatos.html, apenas manipulamos a busca, sem recarregar
            manipularBusca();
        } else {
            // Se estamos em outra página (ex: index.html), redirecionamos para fatos.html
            window.location.href = `fatos.html#busca=${encodeURIComponent(termo)}`;
        }
    } else {
        // Se o termo de busca está vazio, apenas limpa a busca localmente
        if (estamosEmFatos) {
            manipularBusca();
        }
    }
}

// 4. Adiciona o "ouvinte" para o evento 'input' usando o debounce
// (Removido o 'if (inputBusca)' global e movido para dentro de setupSearchBindings)

// Adiciona listeners não-inline: click no botão de busca e Enter no input
function setupSearchBindings() {
    const botao = document.getElementById('botao-busca');
    const inputBuscaLocal = document.querySelector('header input');

    if (botao) {
        botao.addEventListener('click', (e) => {
            e.preventDefault();
            iniciarBusca();
        });
    }

    if (inputBuscaLocal) {
        // Espera 300ms de inatividade antes de chamar manipularBusca
        inputBuscaLocal.addEventListener('input', debounce(manipularBusca, 300));

        inputBuscaLocal.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                iniciarBusca();
            }
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupSearchBindings);
} else {
    setupSearchBindings();
}

// 5. Observação: não carregamos `data.json` automaticamente aqui para evitar
// que o conteúdo apareça na página inicial. A página `fatos.html` carrega
// os dados por conta própria (script inline) — assim todo o conteúdo fica
// centralizado em 'Fatos Bíblicos'.

/* --- Nav: tornar a barra de navegação funcional --- */
function setupNavigation() {
    const links = document.querySelectorAll('#primary-nav a');

    function marcaAtivoPorUrl() {
        const path = location.pathname.split('/').pop() || 'index.html';
        const hash = location.hash.replace('#', '');
        links.forEach(a => a.classList.remove('active'));

        for (const a of links) {
            const href = a.getAttribute('href');
            if (!href) continue;
            // compara path simples (index.html, fatos.html) ou hash
            if (href.endsWith(path) || (hash && href.includes(hash))) {
                a.classList.add('active');
                return;
            }
        }
    }

    // clique: deixa o link ativo (navegação normal permite recarregar a página)
    links.forEach(a => {
        a.addEventListener('click', () => {
            // A navegação padrão do link será executada.
            // A marcação de ativo será atualizada on-load e on-hashchange.
        });
    });

    // marca ao carregar
    marcaAtivoPorUrl();

    // se houver mudança de hash, atualiza ativo
    window.addEventListener('hashchange', marcaAtivoPorUrl);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupNavigation); else setupNavigation();

// Se estivermos em uma página que não carrega os dados completos (ex: index.html),
// carregamos apenas as categorias para popular o dropdown do header.

function setupDropdownBehavior() {
    const dropdownContainer = document.querySelector('.nav .has-dropdown');
    const dropdownToggle = document.getElementById('fatos-link');

    if (!dropdownContainer || !dropdownToggle) return;

    dropdownToggle.addEventListener('click', (e) => {
        // On fatos.html, we prevent default to toggle menu.
        // On other pages, the link should navigate.
        if (location.pathname.includes('fatos.html')) {
            e.preventDefault();
            dropdownContainer.classList.toggle('is-open');
        }
    });

    // Close dropdown if clicking outside
    document.addEventListener('click', (e) => {
        if (!dropdownContainer.contains(e.target)) {
            dropdownContainer.classList.remove('is-open');
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupDropdownBehavior);
} else {
    setupDropdownBehavior();
}

function setupCardExpansion() {
    const cardContainer = document.querySelector(".card-container");
    if (!cardContainer) return;

    cardContainer.addEventListener('click', (e) => {
        const clickedCard = e.target.closest('.card');
        if (!clickedCard) return;

        // Check if the clicked card is already expanded
        const isAlreadyExpanded = clickedCard.classList.contains('expanded');

        // Remove 'expanded' from all cards
        cardContainer.querySelectorAll('.card').forEach(card => {
            card.classList.remove('expanded');
        });

        // If the clicked card was not already expanded, expand it
        if (!isAlreadyExpanded) {
            clickedCard.classList.add('expanded');
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupCardExpansion);
} else {
    setupCardExpansion();
}