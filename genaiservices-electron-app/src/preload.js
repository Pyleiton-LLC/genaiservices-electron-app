/*window.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab');
    const webview = document.querySelector('webview');

    // Function to set the initial URL based on the active tab
    const setInitialURL = () => {
        const activeTab = document.querySelector('.tab.active');
        if (activeTab) {
            webview.src = activeTab.getAttribute('data-url');
        }
    };

    // Set the initial URL when the webview is fully loaded
    webview.addEventListener('did-finish-load', setInitialURL);

    // Add click event listeners to each tab
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelector('.tab.active').classList.remove('active');
            tab.classList.add('active');
            webview.src = tab.getAttribute('data-url');
        });
    });
});*/