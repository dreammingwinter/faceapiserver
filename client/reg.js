(() => {
const loader =       document.getElementById('loader');
const imageLabel =   document.getElementById('imageFileLabel');
const imageFile =    document.getElementById('imageFile');
const regBtn =       document.getElementById('regBtn');
const imageHint =    document.getElementById('imageHint');
const responseHint = document.getElementById('responseHint');
const files =        document.getElementById('files');
const success =      document.getElementById('success');

const id =           document.getElementById('_id');
const pib =          document.getElementById('pib');
const phone =        document.getElementById('phone');
const bdate =        document.getElementById('bdate');
const place =        document.getElementById('place');

const idHint =       document.getElementById('_idHint');
const pibHint =      document.getElementById('pibHint');
const phoneHint =    document.getElementById('phoneHint');
const bdateHint =    document.getElementById('bdateHint');
const placeHint =    document.getElementById('placeHint');

const filesCount = 5;
let counter = 0;
const globalFiles = new Array(filesCount);
function add(name, file) {
    if (counter < filesCount) {
        if (globalFiles.some(e => e.file === file)) {
            showImagesHint("Дублюючі зображення");
            return false;
        } else {
            hideImagesHint();
            globalFiles[counter] = {name: name, file: file};
            counter++;
            return true;
        }
    } else {
        showImagesHint("Максимальна кількість зображень - 5");
        return false;
    }
}

function removeFile(index) {
    delete globalFiles[index];
    globalFiles.sort();
    counter--;
    hideImagesHint();
    files.innerHTML = '';

    if (!counter) {
        files.style.display = 'none';
    } else {
        globalFiles.forEach((file, i) => {
            newFile(file.name, i+1);
        });
    }
}

function validateFiles() {    
    for (let i = 0; i < counter; i++) {
        document.getElementsByClassName('fhint')[i].style.display = "none";
    }
    if (counter == filesCount) {
        hideImagesHint();
        return true;
    } else {
        showImagesHint("Для того, щоб додати людину в базу даних, необхідно 5 фото");
        return false;
    }
}

function validateId() {
    const str = id.value;
    if (str.length != 0) {
        const pattern = /^\d{10}$/;
        if (!str.match(pattern)) {
            showHint(idHint, "Будь ласка, заповніть поле правильно (10 цифр)");
            return false;
        } else {
            hideHint(idHint);
            return true;
        }
    } else {
        showHint(idHint, "Будь ласка, заповніть поле");
        return false;
    }
}

function validatePib() {
    const str = pib.value.trim();
    if (str.length != 0) {
        const pattern = /^([A-ZА-ЯҐЄІЇ]{1}[a-zа-яґєії]+(\s|$)){2,3}$/u;
        if (!str.match(pattern)) {
            showHint(pibHint, "Будь ласка, заповніть поле правильно (3 слова)");
            return false;
        } else {
            hideHint(pibHint);
            return true;
        }
    } else {
        showHint(pibHint, "Будь ласка, заповніть поле");
        return false;
    }
}

function validatePhone() {
    const str = phone.value;
    if (str.length != 0) {
        const pattern = /^\d{9}$/;
        if (!str.match(pattern)) {
            showHint(phoneHint, "Будь ласка, заповніть поле правильно (9 цифр)");
            return false;
        } else {
            hideHint(phoneHint);
            return true;
        }
    } else {
        showHint(phoneHint, "Будь ласка, заповніть поле");
        return false;
    }
}

function validateBdate() {
    const str = bdate.value;
    if (str.length != 0) {
        hideHint(bdateHint);
        return true;
    } else {
        showHint(bdateHint, "Будь ласка, заповніть поле");
        return false;
    }
}

function validatePlace() {
    const str = place.value;
    if (str.length != 0) {
        hideHint(placeHint);
        return true;
    } else {
        showHint(placeHint, "Будь ласка, заповніть поле");
        return false;
    }
}

function validateAll() {
    const valFiles = validateFiles();
    const valId =    validateId();
    const valPib =   validatePib();
    const valPhone = validatePhone();
    const valBdate = validateBdate();
    const valPlace = validatePlace();
    
    if (valFiles && valId && valPib && valPhone && valBdate && valPlace) {
        return true;
    } else {
        return false;
    }
}

function newFile(fileName, index) {
    let div = document.createElement('div');
    let data = document.createElement('div');
    let hint = document.createElement('div');
    let span = document.createElement('span');
    let number = document.createElement('div');
    let name = document.createElement('div');
    let del = document.createElement('div');

    div.classList.add('filesFile');
    data.classList.add('fdata');
    hint.classList.add('fhint');
    number.classList.add('fnumber');
    name.classList.add('fname');
    del.classList.add('fx');
    del.onclick = () => {
        removeFile(index-1);
    }
    number.innerText = index;
    name.innerText = fileName;
    del.innerText = '✖';

    data.appendChild(number);
    data.appendChild(name);
    data.appendChild(del);
    hint.appendChild(span);
    div.appendChild(data);
    div.appendChild(hint);

    files.appendChild(div);
}

regBtn.onclick = async () => {
    if (validateAll()) {        
        let data = {
            images: globalFiles.map(e => e.file),
            id: id.value,
            pib: pib.value,
            phone: '+380'+phone.value,
            bdate: bdate.value,
            place: place.value
        };
        let options = {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {  
                'Content-Type': 'application/json'
            }
        };
        hideResHint();
        showLoader();
        const res = await fetch('/add', options);
        const json = await res.json();
        console.log(json);
        handleRes(json);
        hideLoader();
    }
}

imageFile.onchange = () => {
    for (file of imageFile.files) {
        handleFile(file);
    }
}

function handleFile(file) {
    if (file) {
        if (!isSupportedType(file)) { 
            // file is not image
            showImagesHint("Завантажте зображення (підтримувані розширення - .png .jpg .jpeg .jfif та інші)");
        } else {
            let reader = new FileReader();

            reader.onload = e => {
                
                if (add(file.name, e.target.result)) {
                    newFile(file.name, counter);
                    files.style.display = 'block';
                    regBtn.style.backgroundImage = "none";
                }
            };

            reader.readAsDataURL(file);
            hideResHint();
        }
    } else {
        showImagesHint("Завантажте зображення (підтримувані розширення - .png .jpg .jpeg .jfif та інші)");
    }
}

/* handle server response */
function handleRes(res) {
    if (res.error == 1) {
        const val = res.validation;
        if (!val.imagelength) { showImagesHint("Необхідна кількість зображень - 5"); }
        if (!val.allsupportedimages) { showImagesHint("Не всі типи зображень підтримуються (підтримувані розширення - .png .jpg .jpeg .jfif та інші)"); }
        if (!val.idunique) { showHint(idHint, "Людина з таким ІПН вже існує в базі даних"); }
        else if (val.idunique == 'dberror') { showHint(idHint, "Неможливо підключитись до бази даних, щоб перевірити ідентичність ІПН"); }
        if (!val.idlen) { showHint(idHint, "Неправильна довжина ІПН (необхідно 10 цифр)") }
        if (!val.pib) { showHint(pibHint, "Неправильний ПІБ (необхідно 3 слова з великої букви)"); }
        if (!val.phone) { showHint(phoneHint, "Неправильний номер телефону (необхідно 9 цифр)"); }
        if (!val.bdate) { showHint(bdateHint, "Неправильна дата"); }
        if (!val.place) { showHint(placeHint, "Неправильно вказана адреса"); }
    } else if (res.error == 2) {
        const faces = res.faces;
        for (let i = 0; i < faces.length; i++) {
            if (!faces[i]) {
                document.getElementsByClassName('fhint')[i].getElementsByTagName('span')[0].innerText = "На фото не знайдено жодного обличчя";
                document.getElementsByClassName('fhint')[i].style.display = "block";
            } else if (faces[i] > 1) {
                document.getElementsByClassName('fhint')[i].getElementsByTagName('span')[0].innerText = `На фото знайдено облич: ${faces[i]}, необхідно: 1`;
                document.getElementsByClassName('fhint')[i].style.display = "block";
            }
        }
    } else if (res.error == 3) {
        showResHint('Неможливо з`єднатись з базою даних');
    } else {
        success.style.display = 'flex';
    }
}

/* global hints */
function showHint(id, text) {
    id.innerText = text;
    id.style.display = "block";
}
function hideHint(id) {
    id.innerText = "";
    id.style.display = "none";
}

/* image hint */
function showImagesHint(text) {
    imageHint.innerText = text;
    imageHint.style.display = "block";
}
function hideImagesHint() {
    imageHint.innerText = "";
    imageHint.style.display = "none";
}

/* response hint */
function showResHint(text, color) {
    responseHint.innerText = text;
    responseHint.style.display = "block";
    if (color) {
        responseHint.classList.add('greenHint');
    } else {
        responseHint.classList.remove('greenHint');
    }
}
function hideResHint() {
    responseHint.innerText = "";
    responseHint.style.display = "none";
}

/* loader */
function showLoader() {
    loader.style.display = 'flex';
    loader.classList.remove('loaderHidden');
}
function hideLoader() {
    loader.classList.add('loaderHidden');
    setTimeout(() => {loader.style.display = 'none';}, 400);
}

// DRAG AND DROP
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    imageLabel.addEventListener(eventName, preventDefaults, false)
});

function preventDefaults (e) {
    e.preventDefault()
    e.stopPropagation()
}

['dragenter', 'dragover'].forEach(eventName => {
    imageLabel.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    imageLabel.addEventListener(eventName, unhighlight, false);
});

function highlight() {
    imageLabel.classList.add('dropable')
}

function unhighlight() {
    imageLabel.classList.remove('dropable')
}

imageLabel.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    for (file of e.dataTransfer.files) {
        handleFile(file);
    }
}

const supportedTypes = ['png', 'jpg', 'jfif', 'jpeg'];
function isSupportedType(base64Image) {
    for (type of supportedTypes) {
        if (base64Image.type.startsWith(`image/${type}`)) return true;
    }
    return false;
}

})();