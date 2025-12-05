let products = [];

async function loadData() {
    const res = await fetch("data.json");
    products = await res.json();
    render(products);
}

function render(list) {
    const container = document.getElementById("results");
    container.innerHTML = "";

    if (!list.length) {
        container.innerHTML = "<p>Ничего не найдено</p>";
        return;
    }

    list.forEach(item => {
        container.innerHTML += `
            <div class="card">
                <h2>${item.name}</h2>
                <p><b>Магазин:</b> ${item.store}</p>
                <p><b>Цена:</b> ${item.price} ₽</p>
                <a href="${item.link}" target="_blank">Перейти на сайт</a>
            </div>
        `;
    });
}

document.getElementById("searchInput").addEventListener("input", () => {
    const query = searchInput.value.toLowerCase().trim();
    if (!query) {
        applySort(products);
        return;
    }

    const keywords = query.split(" ").filter(k => k); // отдельные слова поиска

    const filtered = products.filter(p => {
        const searchable = [p.name, ...(p.keywords || [])].join(" ").toLowerCase();
        return keywords.every(k => searchable.includes(k));
    });

    applySort(filtered);
});

document.getElementById("sortSelect").addEventListener("change", () => {
    applySort(products);
});

function applySort(list) {
    const mode = sortSelect.value;

    if (mode === "price-asc") list.sort((a, b) => a.price - b.price);
    if (mode === "price-desc") list.sort((a, b) => b.price - a.price);
    if (mode === "alphabet") list.sort((a, b) => a.name.localeCompare(b.name));

    render(list);
}

loadData();

