// public/seller.js

let sellerId = null;

// Функция для загрузки данных продавца
async function loadSeller() {
    sellerId = new URLSearchParams(window.location.search).get('id');

    try {
        const response = await fetch(`/api/seller/${sellerId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const seller = await response.json();

        // Заполняем данные на странице
        document.getElementById('seller-name').textContent = seller.username;
        document.getElementById('seller-email').textContent = 'Email: ' + seller.email;
        document.getElementById('seller-phone').textContent = 'Телефон: ' + seller.phone;

        // Загрузка отзывов
        loadReviews();

    } catch (error) {
        console.error('Ошибка при загрузке данных продавца:', error);
    }
}

// Функция для загрузки отзывов о продавце
async function loadReviews() {
    try {
        const response = await fetch(`/api/seller/${sellerId}/reviews`);
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

// Функция для отправки отзыва о продавце
async function submitReview(event) {
    event.preventDefault();

    const rating = document.getElementById('review-rating').value;
    const text = document.getElementById('review-text').value;

    try {
        const response = await fetch(`/api/seller/${sellerId}/reviews`, {
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

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    loadSeller();

    const reviewForm = document.getElementById('review-form');
    if (reviewForm) {
        reviewForm.addEventListener('submit', submitReview);
    }
});
