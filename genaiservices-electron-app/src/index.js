require('../styles.css');
window.addEventListener('DOMContentLoaded', () => {
    let configData = null; // Store the config data globally

    window.electron.ipcRenderer.on('config', (event, config) => {
        configData = config; // Store the config for later use

        // Get selected services
        const selectedServices = JSON.parse(localStorage.getItem('selectedServices')) || config.pages.map(service => service.name);

        // Get custom tab order or create default
        let tabOrder = JSON.parse(localStorage.getItem('tabOrder')) || selectedServices;

        // Filter tabOrder to only include currently selected services
        tabOrder = tabOrder.filter(tabName => selectedServices.includes(tabName));

        // Add any new selected services that aren't in the order yet
        selectedServices.forEach(service => {
            if (!tabOrder.includes(service)) {
                tabOrder.push(service);
            }
        });

        // Save updated tab order
        localStorage.setItem('tabOrder', JSON.stringify(tabOrder));

        const tabsContainer = document.getElementById('tabs');
        const contentContainer = document.getElementById('content');

        // Clear existing tabs and content
        tabsContainer.innerHTML = '';
        contentContainer.innerHTML = '';

        // Create tabs and webview containers based on ordered tabs
        const orderedPages = [];
        tabOrder.forEach(tabName => {
            const page = config.pages.find(p => p.name === tabName);
            if (page) {
                orderedPages.push(page);
            }
        });

        // Create tabs and webview containers based on config
        orderedPages.forEach((page, index) => {
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
            webview.setAttribute('allowpopups', 'true');
            webview.setAttribute('preload', './webview-preload.js');

            webview.src = page.url; // Ensure the webview has a src attribute
            webviewContainer.appendChild(webview);

            webview.addEventListener('ipc-message', (event) => {
                if (event.channel === 'open-external' && event.args && event.args[0]) {
                    console.log('Opening external URL:', event.args[0]);
                    window.electron.shell.openExternal(event.args[0])
                        .catch(err => console.error('Failed to open URL:', err));
                }
            });

            contentContainer.appendChild(webviewContainer);

            webview.addEventListener('new-window', (e) => {
                e.preventDefault();

                if (window.electron.shouldStayInWebview(e.url)) {
                    webview.src = e.url;
                } else {
                    window.electron.shell.openExternal(e.url);
                }
            });

            webview.addEventListener('will-navigate', (e) => {
                if (!window.electron.shouldStayInWebview(e.url) && e.url !== webview.src) {
                    e.preventDefault();
                    window.electron.shell.openExternal(e.url);
                }
            });
        });

        // Initialize the rest of the script
        initializeTabsAndWebviews();

        // Only initialize reordering after everything else is done
        setTimeout(() => {
            initializeTabReordering();
            initializeManageAiServicesModal();
        }, 500);
    });

    // Add event listeners only after DOM is fully loaded
    window.addEventListener('load', () => {
        const manageAIiServicesButton = document.getElementById('manageAiServicesButton');
        if (manageAIiServicesButton) {
            manageAIiServicesButton.addEventListener('click', () => {
                showManageAiServicesModal();
            });
        }
    });

    // New function to show configure modal
    function showManageAiServicesModal() {
        if (!configData) return;

        const modal = document.getElementById('manageAiServicesModal');
        if (!modal) return;

        const form = document.getElementById('ai-services-form');
        const errorMessage = document.getElementById('error-message');

        if (!form) return;

        // Clear existing form content
        form.innerHTML = '';
        if (errorMessage) errorMessage.style.display = 'none';

        // Get selected services
        const selectedServices = JSON.parse(localStorage.getItem('selectedServices')) ||
            configData.pages.map(service => service.name);

        // Generate checkboxes based on config
        configData.pages.forEach(service => {
            const label = document.createElement('label');
            label.className = 'service-checkbox';
            label.innerHTML = `
                <input type="checkbox" name="services" value="${service.name}" 
                    ${selectedServices.includes(service.name) ? 'checked' : ''}> 
                ${service.name}
            `;
            form.appendChild(label);
        });

        // Show the modal
        modal.style.display = 'block';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }

    function initializeManageAiServicesModal() {
        const modal = document.getElementById('manageAiServicesModal');
        if (!modal) return;

        const closeButtons = modal.querySelectorAll('.close');
        const saveButton = document.getElementById('saveServices');
        const cancelButton = document.getElementById('cancelServices');

        function hideModal() {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300); // Wait for animation to complete
        }

        // Close modal buttons
        closeButtons.forEach(button => {
            button.addEventListener('click', hideModal);
        });

        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                hideModal();
            }
        });

        // Cancel button just closes the modal
        if (cancelButton) {
            cancelButton.addEventListener('click', hideModal);
        }

        // Save button functionality
        if (saveButton) {
            saveButton.addEventListener('click', () => {
                const checkboxes = document.querySelectorAll('input[name="services"]:checked');
                const selectedServices = Array.from(checkboxes).map(checkbox => checkbox.value);
                const errorMessage = document.getElementById('error-message');

                if (selectedServices.length === 0) {
                    if (errorMessage) {
                        errorMessage.textContent = 'At least one service must be selected.';
                        errorMessage.style.display = 'block';
                    }
                } else {
                    // Save the selection to localStorage
                    localStorage.setItem('selectedServices', JSON.stringify(selectedServices));

                    // Hide modal
                    hideModal();

                    // Show success notification
                    const notification = document.createElement('div');
                    notification.className = 'notification';
                    notification.textContent = 'AI services updated!';
                    document.body.appendChild(notification);

                    // Apply the new services configuration without reload
                    if (configData) {
                        applyServiceChanges(configData);
                    }

                    // Fade in notification
                    setTimeout(() => {
                        notification.classList.add('show');

                        // Remove notification after animation completes
                        setTimeout(() => {
                            notification.classList.remove('show');
                            setTimeout(() => notification.remove(), 300);
                        }, 2000);
                    }, 10);
                }
            });
        }
    }
});

// Function to apply service changes without reloading
function applyServiceChanges(config) {
    // Get the selected services from localStorage
    const selectedServices = JSON.parse(localStorage.getItem('selectedServices')) ||
        config.pages.map(service => service.name);

    // Get custom tab order or create default
    let tabOrder = JSON.parse(localStorage.getItem('tabOrder')) || selectedServices;

    // Filter tabOrder to only include currently selected services
    tabOrder = tabOrder.filter(tabName => selectedServices.includes(tabName));

    // Add any new selected services that aren't in the order yet
    selectedServices.forEach(service => {
        if (!tabOrder.includes(service)) {
            tabOrder.push(service);
        }
    });

    // Save updated tab order
    localStorage.setItem('tabOrder', JSON.stringify(tabOrder));

    const tabsContainer = document.getElementById('tabs');
    const contentContainer = document.getElementById('content');

    // Record current active tab if possible
    const activeTab = tabsContainer.querySelector('.tab.active');
    const activeTabName = activeTab ? activeTab.textContent : null;

    // Clear existing tabs and content
    tabsContainer.innerHTML = '';
    contentContainer.innerHTML = '';

    // Create tabs and webview containers based on ordered tabs
    const orderedPages = [];
    tabOrder.forEach(tabName => {
        const page = config.pages.find(p => p.name === tabName);
        if (page) {
            orderedPages.push(page);
        }
    });

    // Create tabs and webview containers based on config
    orderedPages.forEach((page, index) => {
        // Set the first tab as active, or the previously active tab if it still exists
        const isActive = (index === 0 && !activeTabName) ||
            (activeTabName && page.name === activeTabName);

        const tab = document.createElement('div');
        tab.className = 'tab';
        if (isActive) tab.classList.add('active');
        tab.textContent = page.name;
        tabsContainer.appendChild(tab);

        const webviewContainer = document.createElement('div');
        webviewContainer.className = 'webview-container';
        webviewContainer.setAttribute('data-url', page.url);
        if (!isActive) webviewContainer.style.display = 'none';

        const controls = document.createElement('div');
        controls.className = 'controls';
        controls.innerHTML = `
            <button class="homepage"><i class="fa-solid fa-house"></i></button>
            <button class="backwardpage"><i class="fa-solid fa-backward"></i></button>
            <button class="forwardpage"><i class="fa-solid fa-forward"></i></button>
        `;
        webviewContainer.appendChild(controls);

        const webview = document.createElement('webview');
        webview.setAttribute('allowpopups', 'true');
        webview.setAttribute('preload', './webview-preload.js');

        webview.src = page.url; // Ensure the webview has a src attribute
        webviewContainer.appendChild(webview);

        webview.addEventListener('ipc-message', (event) => {
            if (event.channel === 'open-external' && event.args && event.args[0]) {
                console.log('Opening external URL:', event.args[0]);
                window.electron.shell.openExternal(event.args[0])
                    .catch(err => console.error('Failed to open URL:', err));
            }
        });

        contentContainer.appendChild(webviewContainer);

        webview.addEventListener('new-window', (e) => {
            e.preventDefault();

            if (window.electron.shouldStayInWebview(e.url)) {
                webview.src = e.url;
            } else {
                window.electron.shell.openExternal(e.url);
            }
        });

        webview.addEventListener('will-navigate', (e) => {
            if (!window.electron.shouldStayInWebview(e.url) && e.url !== webview.src) {
                e.preventDefault();
                window.electron.shell.openExternal(e.url);
            }
        });
    });

    // Initialize the tabs and webviews again
    initializeTabsAndWebviews();

    // Re-initialize the tab reordering functionality
    setTimeout(() => {
        initializeTabReordering();
    }, 500);
}

// Function to apply tab order without reload
function applyTabOrder(newOrder) {
    const tabsContainer = document.getElementById('tabs');
    const contentContainer = document.getElementById('content');

    // Get the currently active tab
    const activeTab = tabsContainer.querySelector('.tab.active');
    const activeTabName = activeTab ? activeTab.textContent : null;

    // Get all tabs and webview containers
    const tabs = Array.from(tabsContainer.querySelectorAll('.tab'));
    const webviewContainers = Array.from(contentContainer.querySelectorAll('.webview-container'));

    // Create a map of tab names to webview containers
    const containerMap = new Map();
    tabs.forEach((tab, index) => {
        containerMap.set(tab.textContent, webviewContainers[index]);
    });

    // First, hide all containers
    webviewContainers.forEach(container => {
        container.style.display = 'none';
    });

    // Clear the current tabs
    tabsContainer.innerHTML = '';
    // Clear the content container but keep references to webviews
    contentContainer.innerHTML = '';

    // Reorder tabs and webview containers according to new order
    newOrder.forEach((name, index) => {
        // Recreate the tab with the same properties
        const tab = document.createElement('div');
        tab.className = 'tab';
        if (name === activeTabName) {
            tab.classList.add('active');
        }
        tab.textContent = name;
        tabsContainer.appendChild(tab);

        // Get the corresponding container and append it in the new order
        const container = containerMap.get(name);
        if (container) {
            // Only show the active container
            container.style.display = name === activeTabName ? 'block' : 'none';
            contentContainer.appendChild(container);
        }
    });

    // Force display update for containers
    requestAnimationFrame(() => {
        webviewContainers.forEach(container => {
            const shouldBeVisible = container.parentElement &&
                containerMap.get(activeTabName) === container;
            container.style.display = shouldBeVisible ? 'block' : 'none';
        });
    });

    // Reinitialize the tabs with event listeners
    initializeTabsAndWebviews();
}

// New function to handle tab reordering
function initializeTabReordering() {
    const reorderButton = document.getElementById('reorderTabsButton');
    if (!reorderButton) {
        console.error('Reorder button not found!');
        return;
    }

    const modal = document.getElementById('reorderModal');
    if (!modal) {
        console.error('Modal element not found!');
        return;
    }

    const closeButton = modal.querySelector('.close');
    const saveButton = document.getElementById('saveTabOrder');
    const cancelButton = document.getElementById('cancelTabOrder');
    const sortableList = document.getElementById('sortableTabs');

    if (!closeButton || !saveButton || !cancelButton || !sortableList) {
        console.error('One or more modal elements not found!');
        return;
    }

    // Show modal when reorder button is clicked
    reorderButton.addEventListener('click', () => {
        // Get current tabs and populate sortable list
        const tabs = document.querySelectorAll('.tab');
        sortableList.innerHTML = '';

        tabs.forEach(tab => {
            const li = document.createElement('li');
            li.className = 'sortable-item';
            li.setAttribute('data-name', tab.textContent);

            const handle = document.createElement('div');
            handle.className = 'drag-handle';
            handle.innerHTML = '<i class="fa-solid fa-grip-vertical"></i>';

            const tabName = document.createElement('span');
            tabName.textContent = tab.textContent;

            li.appendChild(handle);
            li.appendChild(tabName);
            sortableList.appendChild(li);
        });

        modal.style.display = 'block';
        // For the animation:
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);

        makeSortable();
    });

    function hideModal() {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300); // Wait for animation to complete
    }

    // Close modal on close button click
    closeButton.addEventListener('click', () => {
        hideModal();
    });

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            hideModal();
        }
    });

    // Cancel button closes the modal without saving
    cancelButton.addEventListener('click', () => {
        hideModal();
    });

    // Save button saves the new order and applies it without reloading
    saveButton.addEventListener('click', () => {
        const newOrder = [];
        sortableList.querySelectorAll('.sortable-item').forEach(item => {
            newOrder.push(item.getAttribute('data-name'));
        });

        // Save the new order to localStorage
        localStorage.setItem('tabOrder', JSON.stringify(newOrder));

        // Hide modal immediately
        hideModal();

        // Show a success notification
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = 'Tab order saved!';
        document.body.appendChild(notification);

        // Apply the new order without a reload
        applyTabOrder(newOrder);

        // Fade in notification
        setTimeout(() => {
            notification.classList.add('show');

            // Remove notification after animation completes
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 2000);
        }, 10);
    });
}

// Function to make the list sortable
function makeSortable() {
    const sortableList = document.getElementById('sortableTabs');
    if (!sortableList) return;

    let draggedItem = null;

    const items = sortableList.querySelectorAll('.sortable-item');

    items.forEach(item => {
        const handle = item.querySelector('.drag-handle');
        if (handle) {
            handle.addEventListener('mousedown', function (e) {
                draggedItem = item;
                item.classList.add('dragging');

                // Store initial mouse position
                const initialY = e.clientY;
                const initialRect = item.getBoundingClientRect();
                const offsetY = initialY - initialRect.top;

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);

                function onMouseMove(e) {
                    if (!draggedItem) return;

                    // Prevent default to avoid text selection
                    e.preventDefault();

                    // Update position of the dragged item
                    draggedItem.style.position = 'absolute';
                    draggedItem.style.top = `${e.clientY - offsetY}px`;
                    draggedItem.style.width = `${initialRect.width}px`;
                    draggedItem.style.zIndex = 1000;

                    // Add a visual indicator of where the item will be placed
                    const list = document.getElementById('sortableTabs');
                    const listItems = Array.from(list.querySelectorAll('.sortable-item:not(.dragging)'));

                    // Remove any existing placeholder
                    const existingPlaceholder = list.querySelector('.drop-placeholder');
                    if (existingPlaceholder) {
                        existingPlaceholder.remove();
                    }

                    // Create and insert a placeholder
                    const placeholder = document.createElement('li');
                    placeholder.className = 'drop-placeholder';
                    placeholder.style.height = '3px';  // Make it a bit more visible

                    // Find the position to insert the placeholder
                    const nextItem = listItems.find(item => {
                        const box = item.getBoundingClientRect();
                        return e.clientY < box.top + box.height / 2;
                    });

                    if (nextItem) {
                        list.insertBefore(placeholder, nextItem);
                    } else if (listItems.length > 0) {
                        list.appendChild(placeholder);
                    }
                }

                function onMouseUp() {
                    if (draggedItem) {
                        // Remove the placeholder
                        const placeholder = document.querySelector('.drop-placeholder');
                        if (placeholder) {
                            // Insert the dragged item where the placeholder is
                            if (placeholder.nextSibling) {
                                sortableList.insertBefore(draggedItem, placeholder.nextSibling);
                            } else {
                                sortableList.appendChild(draggedItem);
                            }
                            placeholder.remove();
                        }

                        // Reset styles
                        draggedItem.style.position = '';
                        draggedItem.style.top = '';
                        draggedItem.style.width = '';
                        draggedItem.style.zIndex = '';
                        draggedItem.classList.remove('dragging');
                        draggedItem = null;
                    }

                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                }
            });
        }
    });
}

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
    if (webviewContainers.length > 0) {
        webviewContainers[0].style.display = 'block';
        loadWebviewURL(webviewContainers[0]);
    }

    // Add click event listeners to each tab
    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            const activeTab = document.querySelector('.tab.active');
            if (activeTab) {
                activeTab.classList.remove('active');
            }
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
            if (viewAllToggle) {
                viewAllToggle.checked = false;
            }

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

        if (homeButton) {
            // Add click event listener to the Home button
            homeButton.addEventListener('click', () => {
                const url = container.getAttribute('data-url');
                if (webview && url) {
                    webview.src = url;
                }
            });
        }

        if (backwardButton && webview) {
            // Add click event listener to the Backward button
            backwardButton.addEventListener('click', () => {
                if (webview.canGoBack()) {
                    webview.goBack();
                }
            });
        }

        if (forwardButton && webview) {
            // Add click event listener to the Forward button
            forwardButton.addEventListener('click', () => {
                if (webview.canGoForward()) {
                    webview.goForward();
                }
            });
        }
    });

    // Handle the view toggle checkbox
    if (viewAllToggle) {
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
    }

    // Initial resize of the webview elements
    resizeWebviews();
}