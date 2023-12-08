addPosition();

selectNextYear();

sendReqPosForUpdate();

function addPosition() {
    let positions = document.querySelector('.positions');
    let x = 1;

    fetch('/get-categories')
        .then((response) => { return response.json(); }) //  ответ от сервера
        .then((categories) => {
            let select = document.querySelector('.select-positions');

            categories.forEach((category, index) => {
                select.append(new Option(category, index + 1));
            });
        });

    document.querySelector('.add-position').addEventListener('click', () => { //  btn
        x++;

        let html = `
        <div class="position">
            <input type="text" value="${x}" disabled>
            <input type="text" placeholder="Производитель" name="company" required>
            <input type="text" placeholder="Модель" name="model" required>
            <input type="text" placeholder="Версия" name="version">
            <input type="text" placeholder="Количество" name="count" required>
            <input type="text" placeholder="Цена" name="price">

            <select name="category" id="" class="select-positions-">
                <option value="0">Не выбрано</option>
            </select>

            <input type="text" placeholder="Примечание" name="position_note">
        </div>`;

        positions.insertAdjacentHTML('beforeend', html);

        let allPositions = document.querySelectorAll('.positions');

        fetch('/get-categories')
            .then((response) => { return response.json(); }) //  ответ от сервера
            .then((categories) => {
                let select = allPositions[0].children[allPositions[0].children.length - 1].children[6]; //  select категорий

                categories.forEach((category, index) => {
                    select.append(new Option(category, index + 1));
                });
            });
    });
}

function selectNextYear() {
    //  функция для отображения следующего года при создании заявки

    let select_year = document.querySelector('.input-year').children[1];

    for (let i = 0; i < select_year.children.length; i++) {
        if (select_year[i].value == Number(new Date(Date.now()).getFullYear()) + 1) select_year[i].selected = true;
    }
}