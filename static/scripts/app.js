document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const previewContainer = document.getElementById('preview-container');
    const uploadForm = document.getElementById('upload-form');

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length) {
            fileInput.files = files;
            previewFiles();
        }
    });

    fileInput.addEventListener('change', () => {
        previewFiles();
    });

    function closeImage() {
        previewContainer.innerHTML = '';
        fileInput.value = '';
        dropZone.style.display = 'block';
    }

    function previewFiles() {
        previewContainer.innerHTML = '';
        const files = fileInput.files;
        if (files.length !== 1) {
            alert('Please select only one file');
            return;
        }
        for (const file of files) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const img = document.createElement('img');
                img.src = e.target.result;

                const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                svg.setAttribute("class", "svg-icon");
                svg.setAttribute("viewBox", "0 0 24 24");
                svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
                svg.addEventListener("click", closeImage);
                svg.innerHTML = `<g><path d="M0 0h24v24H0z" fill="none"/><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm0-9.414l2.828-2.829 1.415 1.415L13.414 12l2.829 2.828-1.415 1.415L12 13.414l-2.828 2.829-1.415-1.415L10.586 12 7.757 9.172l1.415-1.415L12 10.586z"/></g>`;

                const container = document.createElement('div');
                container.classList.add('image-container');
                container.appendChild(img);
                container.appendChild(svg);

                previewContainer.appendChild(container);
            };
            reader.readAsDataURL(file);
        }
        dropZone.style.display = 'none';
    }

    async function uploadFile(files) {
        const formData = new FormData();
        for (const file of files) {
            formData.append('file', file);
        }

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                if (result.error === undefined) {
                    window.location.href = `/result/${result.image}`;
                } else {
                    window.location.href = `/error/${result.error}`;
                }
            } else {
                if (result.error !== undefined) {
                    window.location.href = `/error/${result.error}`;
                } else {
                    window.location.href = `/error/Unknown error occurred during upload.`;
                }
            }
        } catch (error) {
            console.error('Error uploading files:', error);
            window.location.href = `/error/${encodeURIComponent('Error uploading files: ' + error.message)}`;
        }
    }

    uploadForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const files = fileInput.files;
        if (files.length === 1) {
            uploadFile(files);
        } else {
            alert('Please select only one file');
        }
    });
});


