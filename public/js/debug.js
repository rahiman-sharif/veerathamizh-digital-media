// Debug script to detect and log script tags
console.log('Debug script running: checking for all script elements');

document.addEventListener('DOMContentLoaded', function() {
    // Log all script tags on the page
    const scripts = document.querySelectorAll('script');
    console.log('Found', scripts.length, 'script elements on the page:');
    
    scripts.forEach((script, index) => {
        console.log(`Script ${index + 1}:`, {
            src: script.src || '(inline script)',
            id: script.id || '(no id)',
            type: script.type || '(standard)',
            content: !script.src ? script.textContent.substring(0, 100) + '...' : '(external script)'
        });
    });

    // Monitor for dynamically added scripts
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes) {
                mutation.addedNodes.forEach(node => {
                    if (node.tagName === 'SCRIPT') {
                        console.log('Dynamic script added:', {
                            src: node.src || '(inline script)',
                            id: node.id || '(no id)',
                            type: node.type || '(standard)'
                        });
                    }
                });
            }
        });
    });

    observer.observe(document, { 
        childList: true, 
        subtree: true 
    });

    // Check if share-modal.js is being referenced
    if (window.shareModal) {
        console.log('shareModal object found in window:', window.shareModal);
    }

    // Look for any elements that might trigger share functionality
    const possibleShareButtons = document.querySelectorAll('[id*=share], [class*=share], [data-*=share]');
    console.log('Possible share-related elements:', possibleShareButtons.length);
    possibleShareButtons.forEach((el, i) => {
        console.log(`Element ${i+1}:`, {
            id: el.id || '(no id)',
            className: el.className || '(no class)',
            tagName: el.tagName
        });
    });
});
