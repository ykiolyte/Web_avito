// public/product.js

let productImages = [];
let currentImageIndex = 0;

// Функция для загрузки данных товара
async function loadProduct() {
    const productId = window.location.pathname.split('/').pop();

    try {
        const response = await fetch(`/api/product/${productId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const product = await response.json();

        // Заполняем данные на странице
        document.getElementById('product-title').textContent = product.title;
        document.getElementById('product-price').textContent = product.price + ' ₽';
        document.getElementById('product-description').textContent = product.description;

        // Вставляем ссылку на продавца
        document.getElementById('seller-name').innerHTML = `Имя пользователя: <a href="/seller?id=${product.user_id}">${product.username}</a>`;

        document.getElementById('seller-phone').textContent = 'Телефон: ' + product.phone;
        document.getElementById('seller-email').textContent = 'Email: ' + product.email;

        // Сохраняем изображения и отображаем первое
        productImages = product.images;
        if (productImages.length > 0) {
            document.getElementById('carousel-image').src = productImages[0];
        } else {
            document.getElementById('carousel-image').src = '/images/no-image.png'; // Путь к изображению-заглушке
        }

        // Загрузка отзывов
        loadReviews();

    } catch (error) {
        console.error('Ошибка при загрузке товара:', error);
    }
}

// Функции для управления каруселью
function showNextImage() {
    if (productImages.length > 0) {
        currentImageIndex = (currentImageIndex + 1) % productImages.length;
        document.getElementById('carousel-image').src = productImages[currentImageIndex];
    }
}

function showPrevImage() {
    if (productImages.length > 0) {
        currentImageIndex = (currentImageIndex - 1 + productImages.length) % productImages.length;
        document.getElementById('carousel-image').src = productImages[currentImageIndex];
    }
}

// Добавляем обработчики событий для кнопок карусели
document.addEventListener('DOMContentLoaded', () => {
    loadProduct();

    document.querySelector('.next-button').addEventListener('click', showNextImage);
    document.querySelector('.prev-button').addEventListener('click', showPrevImage);

    // Обработчик формы отзыва
    const reviewForm = document.getElementById('review-form');
    if (reviewForm) {
        reviewForm.addEventListener('submit', submitReview);
    }
});

// Функция для загрузки отзывов
async function loadReviews() {
    const productId = window.location.pathname.split('/').pop();

    try {
        const response = await fetch(`/api/product/${productId}/reviews`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const reviews = await response.json();

        const reviewsList = document.getElementById('reviews-list');
        reviewsList.innerHTML = ''; // Очищаем список отзывов

        reviews.forEach(review => {
            const reviewItem = document.createElement('div');
            reviewItem.classList.add('review-item');

            const reviewAuthor = document.createElement('p');
            reviewAuthor.classList.add('review-author');
            reviewAuthor.textContent = `Автор: ${review.username}`;

            const reviewRating = document.createElement('p');
            reviewRating.classList.add('review-rating');
            reviewRating.textContent = `Оценка: ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}`;

            const reviewText = document.createElement('p');
            reviewText.classList.add('review-text');
            reviewText.textContent = review.text;

            reviewItem.appendChild(reviewAuthor);
            reviewItem.appendChild(reviewRating);
            reviewItem.appendChild(reviewText);

            reviewsList.appendChild(reviewItem);
        });

    } catch (error) {
        console.error('Ошибка при загрузке отзывов:', error);
    }
}

// Функция для отправки отзыва
async function submitReview(event) {
    event.preventDefault();

    const productId = window.location.pathname.split('/').pop();
    const rating = document.getElementById('review-rating').value;
    const text = document.getElementById('review-text').value;

    try {
        const response = await fetch(`/api/product/${productId}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ rating, text })
        });

        if (response.ok) {
            // Очистить форму и обновить список отзывов
            document.getElementById('review-form').reset();
            loadReviews();
        } else {
            throw new Error('Ошибка при отправке отзыва');
        }

    } catch (error) {
        console.error('Ошибка при отправке отзыва:', error);
    }
}
