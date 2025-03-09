window.addEventListener('DOMContentLoaded', () => {
    console.log("Manage-AI-Services page loaded");

    // Request config from main process
    window.electron.ipcRenderer.on('config', (event, config) => {
        console.log("Config received in manage-ai-services.js");

        const form = document.getElementById('ai-services-form');
        if (!form) {
            console.error("Form not found!");
            return;
        }

        const selectedServices = JSON.parse(localStorage.getItem('selectedServices')) || config.pages.map(service => service.name);
        console.log("Selected services:", selectedServices);

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

    // Add direct event listeners for the buttons
    setTimeout(() => {
        console.log("Setting up button handlers");

        const saveButton = document.getElementById('saveButton');
        if (saveButton) {
            saveButton.addEventListener('click', () => {
                console.log("Save button clicked");
                handleSave();
            });
        } else {
            console.error("Save button not found!");
        }

        const returnButton = document.getElementById('returnHome');
        if (returnButton) {
            returnButton.addEventListener('click', () => {
                console.log("Return button clicked");
                window.electron.ipcRenderer.send('navigate', 'index.html');
            });
        } else {
            console.error("Return button not found!");
        }

        // Also add form submit handler if needed
        const form = document.getElementById('ai-services-form');
        if (form) {
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                console.log("Form submitted");
                handleSave();
            });
        }
    }, 500);
});

function handleSave() {
    const checkboxes = document.querySelectorAll('input[name="services"]:checked');
    const selectedServices = Array.from(checkboxes).map(checkbox => checkbox.value);
    console.log("Selected services to save:", selectedServices);

    if (selectedServices.length === 0) {
        const errorMessage = document.getElementById('error-message');
        if (errorMessage) {
            errorMessage.textContent = 'At least one service must be selected.';
            errorMessage.style.display = 'block';
        }
    } else {
        console.log("Saving to localStorage:", JSON.stringify(selectedServices));
        localStorage.setItem('selectedServices', JSON.stringify(selectedServices));
        console.log("Navigating back to index.html");
        window.electron.ipcRenderer.send('navigate', 'index.html');
    }
}
