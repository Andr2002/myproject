document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.user-logo').addEventListener('click', () => {
        document.querySelector('.user-modal').style.display = 'block'; //  показ блока user-profile
    });

    document.querySelector('.create-btn').addEventListener('click', () => { //  кнопка "Создать"
        window.location.href = '/create-request';
    });

    document.querySelector('.exit-btn').addEventListener('click', () => { //  кнопка "Выйти из системы"
        window.location.href = '/exit';
    });

    document.querySelector('.profile-exit-btn').addEventListener('click', () => { //  кнопка "Выйти из системы" в профиле
        window.location.href = '/exit';
    });

    document.querySelector('.close-logo').addEventListener('click', () => { //  кнопка "закрыть"
        document.querySelector('.user-modal').style.display = 'none';
    });

    document.addEventListener('keyup', (e) => {
        if (e.key == 'Escape') document.querySelector('.user-modal').style.display = 'none';
    });
});