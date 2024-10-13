// Глобальная переменная для хранения загруженных объявлений
let allProducts = [];

// Функция для загрузки данных объявлений
async function loadProducts() {
    try {
        const response = await fetch('/ads');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const products = await response.json();
        allProducts = products; // Сохраняем все объявления
        displayProducts(products);
    } catch (error) {
        console.error('Ошибка при загрузке объявлений:', error);
    }
}

// Функция для отображения объявлений на странице
function displayProducts(products) {
    const productList = document.querySelector('.product-list');
    productList.innerHTML = ''; // Очищаем список перед отображением

    products.forEach(product => {
        // Создаем элемент карточки объявления
        const productCard = document.createElement('div');
        productCard.classList.add('product-card');

         // Добавляем событие клика для перехода на страницу товара
         productCard.addEventListener('click', () => {
            window.location.href = `/product/${product.id}`;
        });

        // Добавляем изображение объявления
        if (product.image) {
            const productImage = document.createElement('img');
            productImage.src = product.image;
            productImage.alt = product.title;
            productCard.appendChild(productImage);
        }

        // Контейнер с информацией о объявлении
        const productInfo = document.createElement('div');
        productInfo.classList.add('product-info');

        // Название объявления
        const productTitle = document.createElement('h2');
        productTitle.textContent = product.title;

        // Описание объявления
        const productDescription = document.createElement('p');
        productDescription.textContent = product.description;

        // Цена объявления
        const productPrice = document.createElement('p');
        productPrice.classList.add('price');
        productPrice.textContent = product.price + ' ₽';

        // Автор объявления
        const productAuthor = document.createElement('p');
        productAuthor.textContent = 'Продавец: ' + product.username;

        // Собираем карточку объявления
        productInfo.appendChild(productTitle);
        productInfo.appendChild(productDescription);
        productInfo.appendChild(productPrice);
        productInfo.appendChild(productAuthor);

        productCard.appendChild(productInfo);

        // Добавляем карточку в список объявлений
        productList.appendChild(productCard);
    });
}

// Функция для применения фильтров и сортировки
function applyFilters(event) {
    if (event) event.preventDefault();

    const priceMin = document.getElementById('price-min').value;
    const priceMax = document.getElementById('price-max').value;
    const sortBy = document.getElementById('sort-by').value;

    let filteredProducts = allProducts.slice(); // Копируем массив всех объявлений

    // Фильтрация по цене
    if (priceMin) {
        filteredProducts = filteredProducts.filter(product => product.price >= parseFloat(priceMin));
    }
    if (priceMax) {
        filteredProducts = filteredProducts.filter(product => product.price <= parseFloat(priceMax));
    }

    // Сортировка
    if (sortBy === 'price-asc') {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
        filteredProducts.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'date-desc') {
        filteredProducts.sort((a, b) => new Date(b.date_posted) - new Date(a.date_posted));
    } else if (sortBy === 'date-asc') {
        filteredProducts.sort((a, b) => new Date(a.date_posted) - new Date(b.date_posted));
    }

    // Отображаем отфильтрованные и отсортированные объявления
    displayProducts(filteredProducts);
}

// Запускаем загрузку объявлений при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    loadProducts().then(() => {
        // Добавляем обработчик для формы фильтров
        const filterForm = document.getElementById('filter-form');
        if (filterForm) {
            filterForm.addEventListener('submit', applyFilters);
        }
    });
});
