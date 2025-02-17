window.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab');
    const webviewContainers = document.querySelectorAll('.webview-container');

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
        const homeButton = container.querySelector('.home');
        const backwardButton = container.querySelector('.backward');
        const forwardButton = container.querySelector('.forward');

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

    // Initial resize of the webview elements
    resizeWebviews();
});