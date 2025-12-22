let products = [];
let currentBuild = {
    cpu: null,
    motherboard: null,
    gpu: null,
    ram: null,
    psu: null,
    case: null,
    ssd: null,
    cooler: null
};
let currentCategory = 'all';

// Загрузка базы данных
async function loadData() {
    try {
        const res = await fetch('data.json'); 
        products = await res.json();
        
        // Загружаем сборку из localStorage
        loadBuildFromStorage();
        
        const params = new URLSearchParams(window.location.search);
        const query = params.get('q') || '';
        
        document.getElementById('bigSearch').value = query;
        document.getElementById('sideSearch').value = query;
        
        filterAndRender(query);
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
}

// Фильтрация и рендер
function filterAndRender(q) {
    const query = q.toLowerCase();
    let filtered = products;
    
    // Фильтр по поиску
    if (query) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(query) ||
            p.keywords.some(k => k.toLowerCase().includes(query))
        );
    }
    
    // Фильтр по категории
    if (currentCategory !== 'all') {
        filtered = filtered.filter(p => p.category === currentCategory);
    }
    
    document.getElementById('resultsCount').textContent = `Найдено товаров: ${filtered.length}`;
    applySort(filtered);
}

function render(list) {
    const container = document.getElementById('cardsGrid');
    container.innerHTML = '';
    
    if (!list.length) {
        container.innerHTML = "<p>Ничего не найдено</p>";
        return;
    }
    
    list.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        
        // Проверяем, есть ли уже этот компонент в сборке
        const inBuild = isInBuild(item.category, item.id);
        const canAdd = canAddToBuild(item.category);
        
        card.innerHTML = `
            <div class="card-image">
                <img src="${imagePath}" alt="${item.name}" 
                     onerror="this.onerror=null; this.src='images/no-image.png';">
            </div>
            <div class="card-header">
                <h3 class="card-title">${item.name}</h3>
                <span class="card-category">${getCategoryName(item.category)}</span>
                    ${item.store ? `<span class="card-store">${item.store}</span>` : ''}
            </div>
            <div class="card-details">
                ${renderSpecs(item.specs)}
            </div>
            <div class="card-footer">
                <div class="price">${item.price.toLocaleString()} ₽</div>
                <div class="card-actions">
                    <a href="${item.link}" target="_blank" style="padding: 8px 16px; background: #f0f0f0; border-radius: 4px; text-decoration: none; color: #333;"><img src="link.png" width='15px'></a>
                    <button class="add-to-build-btn" 
                            data-id="${item.id}" 
                            data-category="${item.category}"
                            ${inBuild || !canAdd ? 'disabled' : ''}>
                        ${inBuild ? '✓ В сборке' : "<img src='add.png' width='15px'>"}
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
    
    // Добавляем обработчики к кнопкам
    document.querySelectorAll('.add-to-build-btn').forEach(btn => {
        if (!btn.disabled) {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                const category = e.target.dataset.category;
                addToBuild(id, category);
            });
        }
    });
}

function renderSpecs(specs) {
    if (!specs) return '';
    let html = '';
    for (const [key, value] of Object.entries(specs)) {
        html += `<div><strong>${getSpecName(key)}:</strong> ${value}</div>`;
    }
    return html;
}

function getSpecName(key) {
    const names = {
        'socket': 'Сокет',
        'chipset': 'Чипсет',
        'cores': 'Ядер',
        'threads': 'Потоков',
        'frequency': 'Частота',
        'tdp': 'TDP',
        'memory_type': 'Тип памяти',
        'max_memory': 'Макс. память',
        'memory_slots': 'Слотов памяти',
        'memory_freq': 'Частота памяти',
        'form_factor': 'Форм-фактор',
        'pcie_slots': 'Слотов PCI-E',
        'chip': 'Чип',
        'memory': 'Память (ГБ)',
        'length': 'Длина (мм)',
        'power': 'Потребление (Вт)',
        'capacity': 'Объем (ГБ)',
        'frequency': 'Частота (МГц)',
        'latency': 'Тайминги',
        'voltage': 'Напряжение (В)',
        'efficiency': 'Эффективность',
        'pcie_connectors': 'Коннекторов PCI-E',
        'cpu_connectors': 'Коннекторов CPU',
        'sata_connectors': 'Коннекторов SATA',
        'max_gpu_length': 'Макс. длина видеокарты',
        'max_cpu_cooler': 'Макс. высота кулера',
        'psu_support': 'Поддержка БП',
        'fans': 'Вентиляторов',
        'type': 'Тип',
        'read_speed': 'Скорость чтения',
        'write_speed': 'Скорость записи',
        'height': 'Высота (мм)'
    };
    return names[key] || key;
}

function getCategoryName(category) {
    const names = {
        'cpu': 'Процессор',
        'motherboard': 'Материнская плата',
        'gpu': 'Видеокарта',
        'ram': 'ОЗУ',
        'psu': 'Блок питания',
        'case': 'Корпус',
        'ssd': 'SSD',
        'cooler': 'Кулер'
    };
    return names[category] || category;
}

// Сортировка
function applySort(list) {
    const mode = document.getElementById('sortSelect').value;
    let sorted = [...list];
    
    if (mode === 'price-asc') sorted.sort((a, b) => a.price - b.price);
    if (mode === 'price-desc') sorted.sort((a, b) => b.price - a.price);
    if (mode === 'alphabet') sorted.sort((a, b) => a.name.localeCompare(b.name));
    
    render(sorted);
}

// Функции для сборки ПК
function isInBuild(category, id) {
    return currentBuild[category] && currentBuild[category].id === id;
}

function canAddToBuild(category) {
    // Некоторые категории могут быть только одной в сборке
    const singleCategories = ['cpu', 'motherboard', 'psu', 'case'];
    if (singleCategories.includes(category)) {
        return !currentBuild[category];
    }
    return true;
}

function addToBuild(id, category) {
    const product = products.find(p => p.id === id && p.category === category);
    if (!product) return;
    
    currentBuild[category] = product;
    saveBuildToStorage();
    updateBuildPanel();
    filterAndRender(document.getElementById('sideSearch').value); // Перерисовываем карточки
    
    // Проверяем совместимость
    checkCompatibility();
}

function removeFromBuild(category) {
    currentBuild[category] = null;
    saveBuildToStorage();
    updateBuildPanel();
    filterAndRender(document.getElementById('sideSearch').value);
    checkCompatibility();
}

function updateBuildPanel() {
    const container = document.getElementById('buildItems');
    const totalPriceElement = document.getElementById('totalPrice');
    
    let totalPrice = 0;
    let html = '';
    
    for (const [category, product] of Object.entries(currentBuild)) {
        if (product) {
            totalPrice += product.price;
            html += `
                <div class="build-item">
                  <div class="build-item-image">
                        <img src="${imagePath}" alt="${product.name}"
                             onerror="this.onerror=null; this.src='images/no-image.png';">
                    </div>
                    <div class="build-item-info">
                        <div class="build-item-name">${getCategoryName(category)}: ${product.name}</div>
                        <div class="build-item-store">${product.store ? `Магазин: ${product.store}` : ''}</div>
                        <div class="build-item-price">${product.price.toLocaleString()} ₽</div>
                    </div>
                    <button class="remove-item" data-category="${category}">✕</button>
                </div>
            `;
        }
    }
    
    container.innerHTML = html || '<p>Добавляйте компоненты из списка</p>';
    totalPriceElement.textContent = `${totalPrice.toLocaleString()} ₽`;
    
    // Добавляем обработчики для кнопок удаления
    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const category = e.target.dataset.category;
            removeFromBuild(category);
        });
    });
}

function checkCompatibility() {
    const list = document.getElementById('compatibilityList');
    list.innerHTML = '';
    
    const checks = [];
    
    // Проверка процессора и материнской платы
    if (currentBuild.cpu && currentBuild.motherboard) {
        const cpuSocket = currentBuild.cpu.specs.socket;
        const mbSocket = currentBuild.motherboard.specs.socket;
        
        if (cpuSocket === mbSocket) {
            checks.push({status: 'ok', text: '✓ Процессор и материнская плата совместимы'});
        } else {
            checks.push({status: 'error', text: '✗ Несовместимые сокеты CPU и материнской платы'});
        }
        
        // Проверка памяти
        const cpuMemType = currentBuild.cpu.specs.memory_type;
        const mbMemType = currentBuild.motherboard.specs.memory_type;
        
        if (cpuMemType.includes(mbMemType) || mbMemType.includes(cpuMemType)) {
            checks.push({status: 'ok', text: '✓ Тип памяти совместим'});
        } else {
            checks.push({status: 'error', text: '✗ Несовместимый тип памяти'});
        }
    } else {
        if (currentBuild.cpu && !currentBuild.motherboard) {
            checks.push({status: 'warning', text: '⚠ Добавьте материнскую плату'});
        }
        if (!currentBuild.cpu && currentBuild.motherboard) {
            checks.push({status: 'warning', text: '⚠ Добавьте процессор'});
        }
    }
    
    // Проверка видеокарты и корпуса
    if (currentBuild.gpu && currentBuild.case) {
        const gpuLength = currentBuild.gpu.specs.length;
        const caseMaxLength = currentBuild.case.specs.max_gpu_length;
        
        if (gpuLength <= caseMaxLength) {
            checks.push({status: 'ok', text: '✓ Видеокарта поместится в корпус'});
        } else {
            checks.push({status: 'error', text: '✗ Видеокарта слишком длинная для корпуса'});
        }
    }
    
    // Проверка кулера и корпуса
    if (currentBuild.cooler && currentBuild.case) {
        const coolerHeight = currentBuild.cooler.specs.height;
        const caseMaxCooler = currentBuild.case.specs.max_cpu_cooler;
        
        if (coolerHeight <= caseMaxCooler) {
            checks.push({status: 'ok', text: '✓ Кулер поместится в корпус'});
        } else {
            checks.push({status: 'error', text: '✗ Кулер слишком высокий для корпуса'});
        }
    }
    
    // Проверка мощности БП
    if (currentBuild.psu) {
        let totalPower = 0;
        if (currentBuild.cpu) totalPower += currentBuild.cpu.specs.tdp || 100;
        if (currentBuild.gpu) totalPower += currentBuild.gpu.specs.power || 200;
        totalPower += 150; // Запас на остальные компоненты
        
        const psuPower = currentBuild.psu.specs.power;
        
        if (psuPower >= totalPower) {
            checks.push({status: 'ok', text: `✓ Блок питания достаточно мощный (${psuPower}W)`});
        } else {
            checks.push({status: 'warning', text: `⚠ Блок питания может не хватить (нужно ~${totalPower}W)`});
        }
    }
    
    // Отображаем проверки
    checks.forEach(check => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="compatibility-${check.status}">${check.text}</span>`;
        list.appendChild(li);
    });
    
    // Показываем/скрываем панель проверки
    const checkPanel = document.getElementById('compatibilityCheck');
    checkPanel.style.display = checks.length ? 'block' : 'none';
}

function saveBuildToStorage() {
    localStorage.setItem('pcBuild', JSON.stringify(currentBuild));
}

function loadBuildFromStorage() {
    const saved = localStorage.getItem('pcBuild');
    if (saved) {
        try {
            currentBuild = JSON.parse(saved);
            updateBuildPanel();
            checkCompatibility();
        } catch (e) {
            console.error('Ошибка загрузки сборки:', e);
        }
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    // Поиск
    document.getElementById('bigSearchBtn').addEventListener('click', () => {
        const val = document.getElementById('bigSearch').value.trim();
        if (val) window.location.href = `search.html?q=${encodeURIComponent(val)}`;
    });
    
    document.getElementById('sideSearch').addEventListener('input', (e) => {
        filterAndRender(e.target.value);
    });
    
    document.getElementById('sortSelect').addEventListener('change', () => {
        filterAndRender(document.getElementById('sideSearch').value);
    });
    
    // Категории
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentCategory = e.target.dataset.category;
            filterAndRender(document.getElementById('sideSearch').value);
        });
    });
    
    // Бургер-меню
    const burgerBtn = document.getElementById('burgerBtn');
    const leftPanel = document.getElementById('leftPanel');
    
    burgerBtn.addEventListener('click', () => {
        if (leftPanel.classList.contains('hidden') || leftPanel.classList.contains('visible')) {
            leftPanel.classList.toggle('visible');
            leftPanel.classList.remove('hidden');
        } else {
            leftPanel.classList.add('hidden');
        }
    });
    
    // Панель сборки ПК
    document.getElementById('buildPcBtn').addEventListener('click', () => {
        document.getElementById('buildPanel').classList.add('open');
    });
    
    document.getElementById('closeBuild').addEventListener('click', () => {
        document.getElementById('buildPanel').classList.remove('open');
    });
    
    loadData();
});
