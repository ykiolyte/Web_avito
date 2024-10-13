// Функция для загрузки данных товара
async function loadProduct() {
    const urlParams = new URLSearchParams(window.location.search);
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
        document.getElementById('seller-name').textContent = 'Имя пользователя: ' + product.username;
        document.getElementById('seller-phone').textContent = 'Телефон: ' + product.phone;
        document.getElementById('seller-email').textContent = 'Email: ' + product.email;

        // Отображаем изображения
        const productImagesDiv = document.querySelector('.product-images');
        product.images.forEach(imagePath => {
            const img = document.createElement('img');
            img.src = imagePath;
            img.alt = product.title;
            productImagesDiv.appendChild(img);
        });

    } catch (error) {
        console.error('Ошибка при загрузке товара:', error);
    }
}

// Запускаем загрузку товара при загрузке страницы
document.addEventListener('DOMContentLoaded', loadProduct);
