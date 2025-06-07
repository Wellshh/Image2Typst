document.addEventListener('DOMContentLoaded', () => {
    const formulaImageInput = document.getElementById('formulaImage');
    const uploadButton = document.getElementById('uploadButton');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const resultsContainer = document.getElementById('results');
    const typstResult = document.getElementById('typstResult');
    const loadingSpinner = document.getElementById('loading');
    const errorMessage = document.getElementById('error');
    const uploadSection = document.getElementById('uploadSection');
    const tokenInput = document.getElementById('simpletexToken');

    // Load token from localStorage
    tokenInput.value = localStorage.getItem('simpletexToken') || '';

    // Save token to localStorage on input
    tokenInput.addEventListener('input', () => {
        localStorage.setItem('simpletexToken', tokenInput.value);
    });

    // Trigger file input when the upload button is clicked
    uploadButton.addEventListener('click', () => {
        formulaImageInput.click();
    });

    // Handle file selection
    formulaImageInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            handleFile(file);
        }
    });

    // Drag and drop handlers for the entire upload section
    uploadSection.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadSection.classList.add('drag-over');
    });

    uploadSection.addEventListener('dragleave', () => {
        uploadSection.classList.remove('drag-over');
    });

    uploadSection.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadSection.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file) {
            handleFile(file);
        }
    });

    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            errorMessage.textContent = 'Please select an image file.';
            errorMessage.style.display = 'block';
            return;
        }

        // Show image preview
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreviewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);

        // Hide previous results and errors
        resultsContainer.style.display = 'none';
        errorMessage.style.display = 'none';
        
        // Upload the file
        handleUpload(file);
    }

    async function handleUpload(file) {
        loadingSpinner.style.display = 'block';
        
        const formData = new FormData();
        formData.append('formulaImage', file);

        // Get selected converter and add to form data
        const selectedConverter = document.querySelector('input[name="converter"]:checked').value;
        formData.append('converter', selectedConverter);

        // Get API token and add to form data
        const apiToken = tokenInput.value;
        if (apiToken) {
            formData.append('simpletexToken', apiToken);
        }

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Something went wrong');
            }

            const data = await response.json();

            // Display results
            typstResult.textContent = data.typst;
            resultsContainer.style.display = 'block';

        } catch (error) {
            errorMessage.textContent = `Error: ${error.message}`;
            errorMessage.style.display = 'block';
        } finally {
            loadingSpinner.style.display = 'none';
        }
    }

    // Initialize Clipboard.js
    const clipboard = new ClipboardJS('.copy-button');

    clipboard.on('success', (e) => {
        const originalText = e.trigger.textContent;
        e.trigger.textContent = 'Copied!';
        setTimeout(() => {
            e.trigger.textContent = originalText;
        }, 2000);
        e.clearSelection();
    });

    clipboard.on('error', (e) => {
        console.error('Failed to copy text:', e.trigger);
        const originalText = e.trigger.textContent;
        e.trigger.textContent = 'Error';
        setTimeout(() => {
            e.trigger.textContent = originalText;
        }, 2000);
    });
});