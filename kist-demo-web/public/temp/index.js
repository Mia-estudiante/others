const input = document.querySelector("#upload")
const preview = document.querySelector(".drag-drop-content")
const submitBtn = document.querySelector("#submitBtn")

input.addEventListener("change", (e) => {
    while(preview.firstChild) {
        preview.removeChild(preview.firstChild);
    }

    const curFiles = input.files;
    const image = document.createElement('img');
    image.src = URL.createObjectURL(curFiles[0]);
    image.classList.add('preview-img')
    preview.appendChild(image);
    submitBtn.disabled = false;
})