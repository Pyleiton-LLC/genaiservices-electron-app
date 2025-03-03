window.addEventListener('DOMContentLoaded', () => {
    window.electron.ipcRenderer.on('config', (event, config) => {
        const selectedServices = JSON.parse(localStorage.getItem('selectedServices')) || config.pages.map(service => service.name);

        const tabsContainer = document.getElementById('tabs');
        const contentContainer = document.getElementById('content');

        // Clear existing tabs and content
        tabsContainer.innerHTML = '';
        contentContainer.innerHTML = '';

        // Filter pages based on selected services
        const filteredPages = config.pages.filter(page => selectedServices.includes(page.name));

        // Create tabs and webview containers based on config
        filteredPages.forEach((page, index) => {
            const tab = document.createElement('div');
            tab.className = 'tab';
            if (index === 0) tab.classList.add('active');
            tab.textContent = page.name;
            tabsContainer.appendChild(tab);

            const webviewContainer = document.createElement('div');
            webviewContainer.className = 'webview-container';
            webviewContainer.setAttribute('data-url', page.url);
            if (index !== 0) webviewContainer.style.display = 'none';

            const controls = document.createElement('div');
            controls.className = 'controls';
            controls.innerHTML = `
                <button class="homepage"><i class="fa-solid fa-house"></i></button>
                <button class="backwardpage"><i class="fa-solid fa-backward"></i></button>
                <button class="forwardpage"><i class="fa-solid fa-forward"></i></button>
            `;
            webviewContainer.appendChild(controls);

            const webview = document.createElement('webview');
            webviewContainer.appendChild(webview);

            contentContainer.appendChild(webviewContainer);
        });

        // Initialize the rest of the script
        initializeTabsAndWebviews();
    });

    // Add event listener to the "Configure AI Services" button
    const configureButton = document.getElementById('configureButton');
    if (configureButton) {
        configureButton.addEventListener('click', () => {
            window.location.href = 'manage-ai-services.html';
        });
    }
});

function initializeTabsAndWebviews() {
    const tabs = document.querySelectorAll('.tab');
    const webviewContainers = document.querySelectorAll('.webview-container');
    const viewAllToggle = document.getElementById('viewAllToggle');
    const content = document.getElementById('content');

    // Function to load the URL for a webview
    const loadWebviewURL = (container) => {
        const webview = container.querySelector('webview');
        const url = container.getAttribute('data-url');
        if (!webview.src) {
            webview.src = url;
        }
    };

    // Function to resize the webview elements
    const resizeWebviews = () => {
        webviewContainers.forEach(container => {
            const webview = container.querySelector('webview');
            if (webview) {
                webview.style.height = 'calc(100% - 45px)';
                webview.style.width = '100%';
            }
        });
    };

    // Display the first webview container by default and load its URL
    webviewContainers[0].style.display = 'block';
    loadWebviewURL(webviewContainers[0]);

    // Add click event listeners to each tab
    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            document.querySelector('.tab.active').classList.remove('active');
            tab.classList.add('active');

            webviewContainers.forEach((container, containerIndex) => {
                if (containerIndex === index) {
                    container.style.display = 'block';
                    loadWebviewURL(container);
                } else {
                    container.style.display = 'none';
                }
            });

            // De-select the "Show All" checkbox
            viewAllToggle.checked = false;

            // Resize the webview elements after switching tabs
            resizeWebviews();
        });
    });

    // Add event listeners to each webview container's controls
    webviewContainers.forEach(container => {
        const webview = container.querySelector('webview');
        const homeButton = container.querySelector('.homepage');
        const backwardButton = container.querySelector('.backwardpage');
        const forwardButton = container.querySelector('.forwardpage');

        // Add click event listener to the Home button
        homeButton.addEventListener('click', () => {
            const url = container.getAttribute('data-url');
            webview.src = url;
        });

        // Add click event listener to the Backward button
        backwardButton.addEventListener('click', () => {
            if (webview.canGoBack()) {
                webview.goBack();
            }
        });

        // Add click event listener to the Forward button
        forwardButton.addEventListener('click', () => {
            if (webview.canGoForward()) {
                webview.goForward();
            }
        });
    });

    // Handle the view toggle checkbox
    viewAllToggle.addEventListener('change', () => {
        if (viewAllToggle.checked) {
            // Show all webviews side by side and load their URLs
            content.style.display = 'flex';
            content.style.flexDirection = 'row';
            webviewContainers.forEach(container => {
                container.style.display = 'flex';
                container.style.width = '33.33%';
                loadWebviewURL(container);
            });
        } else {
            // Revert to tabbed view
            content.style.display = 'flex';
            content.style.flexDirection = 'column';
            const activeTab = document.querySelector('.tab.active');
            const activeIndex = Array.from(tabs).indexOf(activeTab);

            webviewContainers.forEach((container, index) => {
                if (index === activeIndex) {
                    container.style.display = 'block';
                    loadWebviewURL(container);
                } else {
                    container.style.display = 'none';
                }
                container.style.width = '100%';
            });
        }

        // Resize the webview elements after changing the view
        resizeWebviews();
    });

    // Initial resize of the webview elements
    resizeWebviews();
}