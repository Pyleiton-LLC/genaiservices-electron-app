const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
    // Override all link clicks
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.href && (link.href.startsWith('http:') || link.href.startsWith('https:'))) {
            e.preventDefault();
            e.stopPropagation();
            ipcRenderer.sendToHost('open-external', link.href);
            return false;
        }
    }, true);
});