window.addEventListener('DOMContentLoaded', () => {
    window.electron.ipcRenderer.on('config', (event, config) => {
        const form = document.getElementById('ai-services-form');
        const selectedServices = JSON.parse(localStorage.getItem('selectedServices')) || config.pages.map(service => service.name);

        // Clear existing form content
        form.innerHTML = '';

        // Generate checkboxes based on config
        config.pages.forEach(service => {
            const label = document.createElement('label');
            label.innerHTML = `
                <input type="checkbox" name="services" value="${service.name}" ${selectedServices.includes(service.name) ? 'checked' : ''}> ${service.name}
            `;
            form.appendChild(label);
        });

        // Add error message container
        const errorMessage = document.createElement('div');
        errorMessage.id = 'error-message';
        errorMessage.style.color = '#b22222';
        errorMessage.style.display = 'none';
        form.appendChild(errorMessage);
    });

    // Handle form submission
    document.getElementById('ai-services-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const selectedServices = Array.from(document.querySelectorAll('input[name="services"]:checked')).map(checkbox => checkbox.value);

        if (selectedServices.length === 0) {
            const errorMessage = document.getElementById('error-message');
            errorMessage.textContent = 'At least one service must be selected.';
            errorMessage.style.display = 'block';
        } else {
            localStorage.setItem('selectedServices', JSON.stringify(selectedServices));
            window.location.href = 'index.html';
        }
    });

    // Handle the "Return to Home" button
    document.getElementById('returnHome').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
});