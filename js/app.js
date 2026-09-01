let data = null;
let currentProfile = "hastriv";

const profileSelector = document.getElementById("profile-selector");
const profileHero = document.getElementById("profile-hero");
const gamesContainer = document.getElementById("games-container");
const profilePage = document.getElementById("profile-page");
const gameDetails = document.getElementById("game-details");

async function loadData() {
    try {
        const response = await fetch("data/profiles.json");

        if (!response.ok) {
            throw new Error("Erro ao carregar os dados.");
        }

        data = await response.json();

        const params = new URLSearchParams(window.location.search);
        const profileFromURL = params.get("profile");

        if (profileFromURL && data.profiles[profileFromURL]) {
            currentProfile = profileFromURL;
        }

        renderApp();
    } catch (error) {
        console.error(error);

        gamesContainer.innerHTML = `
            <div class="empty">
                Não foi possível carregar os dados.
            </div>
        `;
    }
}

function renderApp() {
    renderProfileSelector();
    renderProfileHero();
    renderGames();
}

function renderProfileSelector() {
    profileSelector.innerHTML = "";

    Object.entries(data.profiles).forEach(([id, profile]) => {
        const button = document.createElement("div");

        button.className = "profile-option";

        if (id === currentProfile) {
            button.classList.add("active");
        }

        button.innerHTML = `
            <img src="${profile.foto}" alt="${profile.nome}">
            <span>${profile.nome}</span>
        `;

        button.addEventListener("click", () => {
            changeProfile(id);
        });

        profileSelector.appendChild(button);
    });
}

function changeProfile(profileId) {
    currentProfile = profileId;

    const url = new URL(window.location);
    url.searchParams.set("profile", profileId);

    window.history.pushState({}, "", url);

    closeGame(false);
    renderApp();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function renderProfileHero() {
    const profile = data.profiles[currentProfile];

    profileHero.innerHTML = `
        <img
            class="profile-hero-image"
            src="${profile.foto}"
            alt="${profile.nome}"
        >

        <div class="profile-hero-content">
            <h1 class="profile-hero-name">${profile.nome}</h1>
            <p class="profile-hero-description">${profile.descricao}</p>
        </div>
    `;
}

function groupByPlatform(games) {
    return games.reduce((grouped, game) => {
        if (!grouped[game.plataforma]) {
            grouped[game.plataforma] = [];
        }

        grouped[game.plataforma].push(game);

        return grouped;
    }, {});
}

function renderGames() {
    const games = data.profiles[currentProfile].jogos;

    gamesContainer.innerHTML = "";

    if (games.length === 0) {
        gamesContainer.innerHTML = `
            <div class="empty">
                Nenhum jogo registrado ainda.
            </div>
        `;

        return;
    }

    const groupedGames = groupByPlatform(games);

    Object.entries(groupedGames)
        .sort(([, gamesA], [, gamesB]) => {
            const latestA = Math.max(
                ...gamesA.map(game => new Date(game.data_finalizacao))
            );

            const latestB = Math.max(
                ...gamesB.map(game => new Date(game.data_finalizacao))
            );

            return latestB - latestA;
        })
        .forEach(([platform, platformGames]) => {
            platformGames.sort((a, b) => {
                return new Date(b.data_finalizacao) - new Date(a.data_finalizacao);
            });

            const section = document.createElement("section");
            section.className = "platform-section";

            const header = document.createElement("div");
            header.className = "platform-header";
            header.innerHTML = `
                <h2 class="platform-title">${platform}</h2>
            `;

            const grid = document.createElement("div");
            grid.className = "games-grid";

            platformGames.forEach(game => {
                const card = document.createElement("article");
                card.className = "game-card";

                const ratingClass = getRatingClass(game.avaliacao);

                card.innerHTML = `
                    <div class="game-image-container">
                        <img
                            class="game-image"
                            src="${game.imagem}"
                            alt="${game.nome}"
                            loading="lazy"
                        >
                    </div>

                    <div class="game-info">
                        <div class="game-name" title="${game.nome}">
                            ${game.nome}
                        </div>

                        <div class="game-date">
                            ${formatDate(game.data_finalizacao)}
                        </div>

                        <div class="game-rating ${ratingClass}">
                            ★ ${formatRating(game.avaliacao)}
                        </div>
                    </div>
                `;

                card.addEventListener("click", () => {
                    openGame(game);
                });

                grid.appendChild(card);
            });

            section.appendChild(header);
            section.appendChild(grid);

            gamesContainer.appendChild(section);
        });
}

function openGame(game) {
    profilePage.style.display = "none";

    const ratingClass = getRatingClass(game.avaliacao);

    gameDetails.innerHTML = `
        <button class="back-button" id="back-button">
            ← Voltar
        </button>

        <div class="game-details-header">
            <img
                class="game-details-cover"
                src="${game.imagem}"
                alt="${game.nome}"
            >

            <div class="game-details-info">
                <h1 class="game-details-title">${game.nome}</h1>

                <div class="game-details-platform">
                    ${game.plataforma}
                </div>

                <div class="game-details-meta">
                    <div class="meta-item">
                        <span class="meta-label">Finalizado em</span>

                        <span class="meta-value">
                            ${formatDate(game.data_finalizacao)}
                        </span>
                    </div>

                    <div class="meta-item">
                        <span class="meta-label">Avaliação</span>

                        <span class="meta-value ${ratingClass}">
                            ★ ${formatRating(game.avaliacao)}/10.0
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <div class="prints-section">
            <h2 class="prints-title">Prints</h2>

            ${
                game.prints && game.prints.length > 0
                    ? `
                        <div class="prints-grid">
                            ${game.prints.map(print => `
                                <div class="print-card" data-print="${print}">
                                    <img
                                        class="print-image"
                                        src="${print}"
                                        alt="Print de ${game.nome}"
                                        loading="lazy"
                                    >
                                </div>
                            `).join("")}
                        </div>
                    `
                    : `
                        <div class="no-prints">
                            Nenhum print adicionado para este jogo.
                        </div>
                    `
            }
        </div>
    `;

    gameDetails.classList.add("active");

    document.getElementById("back-button").addEventListener("click", () => {
        closeGame();
    });

    document.querySelectorAll(".print-card").forEach(print => {
        print.addEventListener("click", () => {
            openLightbox(print.dataset.print);
        });
    });

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function openLightbox(imageSrc) {
    const lightbox = document.createElement("div");

    lightbox.className = "image-lightbox";

    lightbox.innerHTML = `
        <button class="lightbox-close" aria-label="Fechar">
            ×
        </button>

        <img
            class="lightbox-image"
            src="${imageSrc}"
            alt="Print ampliado"
        >
    `;

    document.body.appendChild(lightbox);

    requestAnimationFrame(() => {
        lightbox.classList.add("active");
    });

    const close = () => {
        lightbox.classList.remove("active");

        setTimeout(() => {
            lightbox.remove();
        }, 300);
    };

    lightbox.addEventListener("click", event => {
        if (
            event.target === lightbox ||
            event.target.classList.contains("lightbox-close")
        ) {
            close();
        }
    });

    document.addEventListener("keydown", function escapeHandler(event) {
        if (event.key === "Escape") {
            close();
            document.removeEventListener("keydown", escapeHandler);
        }
    });
}

function closeGame(scroll = true) {
    gameDetails.classList.remove("active");
    gameDetails.innerHTML = "";

    profilePage.style.display = "block";

    if (scroll) {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }
}

function getRatingClass(rating) {
    rating = Number(rating);

    if (rating < 5) {
        return "rating-red";
    }

    if (rating < 8) {
        return "rating-yellow";
    }

    return "rating-green";
}

function formatRating(rating) {
    return Number(rating).toFixed(1);
}

function formatDate(dateString) {
    const date = new Date(`${dateString}T12:00:00`);

    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    }).format(date);
}

loadData();