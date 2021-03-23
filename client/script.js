(function(){
const loader =       document.getElementById('loader');
const imageLabel =   document.getElementById('imageFileLabel');
const imageFile =    document.getElementById('imageFile');
const imageHint =    document.getElementById('imageHint');
const responseHint = document.getElementById('responseHint');
const tableData =    document.getElementById('tableData');
const canvasWrap =   document.getElementById('canvasWrapper');
const canvas =       document.getElementById('canvas');
const img =          document.getElementById('UploadedImage');
const searchBtn =    document.getElementById('searchBtn');

let globalFile;

imageFile.onchange = () => {
    handleFile(imageFile.files[0]);
}

searchBtn.onclick = async () => {
    if (!globalFile) {
        showHint("Спершу завантажте зображення");
    } else {
        let data = {
            image: globalFile
        };
        let options = {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {  
                'Content-Type': 'application/json'
            }
        };
        hideHint();
        showLoader();
        const res = await fetch('/api', options);
        const json = await res.json();
        // console.log(json);
        hideLoader();
        handleRes(json);
    }
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
    handleFile(e.dataTransfer.files[0]);
}

function handleFile(file) {
    if (file) {
        if (!isSupportedType(file)) { 
            // file is not image
            showHint("Завантажте зображення (підтримувані розширення - .png .jpg .jpeg .jfif)");
        } else {
            let reader = new FileReader();
            img.title = file.name;

            reader.onload = e => {
                globalFile = img.src = e.target.result;                
                searchBtn.style.backgroundImage = "none";
                tableData.style.display = 'none';
                canvasWrap.style.display = "flex";
            };

            reader.readAsDataURL(file);
            hideHint();
            hideResHint();
            tableData.innerHTML = '';
            canvas.src = "";
        }
    } else {
        showHint("Завантажте зображення (підтримувані розширення - .png .jpg .jpeg .jfif)");
    }
}

function showLoader() {
    loader.style.display = 'flex';
    loader.classList.remove('loaderHidden');
}
function hideLoader() {
    loader.classList.add('loaderHidden');
    setTimeout(() => {loader.style.display = 'none';}, 400);
}

/* image hint */
function showHint(text) {
    imageHint.innerText = text;
    imageHint.style.display = "block";
}
function hideHint() {
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

/* handle server response */
function handleRes(res) {
    tableData.innerHTML = '';
    if (res.error) {
        showResHint(`Знайдено облич: ${res.faces}, з них розпізнано: ${res.recognized}\n Неможливо підключитись до бази даних`);
        canvas.src = res.canvas;
    } else {
        if (res.faces == 0) {
            showResHint("Неможливо знайти обличчя на фото");
        } else if (res.recognized == 0) {
            showResHint(`Знайдено облич: ${res.faces}, з них розпізнано: ${res.recognized}`);
            canvas.src = res.canvas;
        } else {
            showResHint(`Знайдено облич: ${res.faces}, з них розпізнано: ${res.recognized}, ось що вдалось знайти в базі даних:`, 1);
            canvas.src = res.canvas;
            for (r of res.data) {
                tableData.appendChild(generateTable(r));
            }
            tableData.style.display = 'flex';
        }
    }
}

function generateTable(res) {
    let table = document.createElement('table');
    const data = [
        ["ІПН", res._id],
        ["Ім'я", res.label],
        ["Телефон", res.phone],
        ["Адреса", res.address],
        ["Дата народження", new Date(res.bdate).toLocaleDateString()]
    ];
    for (r of data) {
        let tr = document.createElement('tr');
        for (d of r) {
            let td = document.createElement('td');
            td.innerText = d;
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
    return table;
}

const supportedTypes = ['png', 'jpg', 'jfif', 'jpeg'];
function isSupportedType(base64Image) {
    for (type of supportedTypes) {
        if (base64Image.type.startsWith(`image/${type}`)) return true;
    }
    return false;
}

})();