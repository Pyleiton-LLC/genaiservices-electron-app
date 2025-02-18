window.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab');
    const webviewContainers = document.querySelectorAll('.webview-container');
    const viewToggle = document.getElementById('viewToggle');
    const content = document.getElementById('content');

    // Function to set the initial URL for each webview
    const setInitialURLs = () => {
        webviewContainers.forEach(container => {
            const webview = container.querySelector('webview');
            const url = container.getAttribute('data-url');
            webview.src = url;
        });
    };

    // Set the initial URLs when the DOM is fully loaded
    setInitialURLs();

    // Function to resize the webview elements
    const resizeWebviews = () => {
        webviewContainers.forEach(container => {
            const webview = container.querySelector('webview');
            if (webview) {
                webview.style.height = 'calc(100% - 75px)';
                webview.style.width = '100%';
            }
        });
    };

    // Display the first webview container by default
    webviewContainers[0].style.display = 'block';

    // Add click event listeners to each tab
    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            document.querySelector('.tab.active').classList.remove('active');
            tab.classList.add('active');

            webviewContainers.forEach((container, containerIndex) => {
                container.style.display = containerIndex === index ? 'block' : 'none';
            });

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
            // Show all webviews side by side
            content.style.display = 'flex';
            content.style.flexDirection = 'row';
            webviewContainers.forEach(container => {
                container.style.display = 'flex';
                container.style.width = '33.33%';
            });
        } else {
            // Revert to tabbed view
            content.style.display = 'flex';
            content.style.flexDirection = 'column';
            const activeTab = document.querySelector('.tab.active');
            const activeIndex = Array.from(tabs).indexOf(activeTab);

            webviewContainers.forEach((container, index) => {
                container.style.display = index === activeIndex ? 'block' : 'none';
                container.style.width = '100%';
            });
        }

        // Resize the webview elements after changing the view
        resizeWebviews();
    });

    // Initial resize of the webview elements
    resizeWebviews();
});