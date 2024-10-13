// Функция для загрузки информации о пользователе
async function loadUserInfo() {
    try {
        const response = await fetch('/api/userinfo');
        const userInfo = await response.json();

        if (userInfo.username) {
            document.getElementById('username').textContent = userInfo.username;
            document.getElementById('first_name').value = userInfo.first_name || '';
            document.getElementById('last_name').value = userInfo.last_name || '';
            document.getElementById('phone').value = userInfo.phone || '';
            document.getElementById('avatar').src = userInfo.avatar || '/avatars/default.png';
        } else {
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Ошибка при загрузке информации о пользователе:', error);
        window.location.href = '/login';
    }
}

// Запускаем загрузку информации о пользователе при загрузке страницы
document.addEventListener('DOMContentLoaded', loadUserInfo);
