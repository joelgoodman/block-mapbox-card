import { registerBlockType } from '@wordpress/blocks';
import Edit from './edit';
import './editor.scss';
import metadata from './block.json';

// Ensure the global object is set up immediately
window.onePDMapbox = window.onePDMapbox || {};

// Function to retrieve API key from multiple sources
function getMapboxApiKey() {
    console.log('Attempting to retrieve Mapbox API Key');
    console.log('Window object keys:', Object.keys(window));

    // Prioritized sources for API key
    const sources = [
        // First, check if already set in global object
        () => window.onePDMapbox?.apiKey,
        
        // Then check WordPress API settings
        () => window.wpApiSettings?.mapboxApiKey,
        
        // Check WordPress localized settings
        () => window.onepd_mapbox_settings?.api_key,
        
        // Fallback: search for any global object with a Mapbox API key
        () => {
            const mapboxKeys = Object.keys(window).filter(key => 
                key.toLowerCase().includes('mapbox') && 
                typeof window[key] === 'object' && 
                window[key].apiKey
            );
            return mapboxKeys.length > 0 ? window[mapboxKeys[0]].apiKey : null;
        }
    ];

    for (const source of sources) {
        const apiKey = source();
        if (apiKey) {
            // Ensure the key is set in the global object
            window.onePDMapbox.apiKey = apiKey;
            console.log('API Key found and set:', apiKey);
            return apiKey;
        }
    }

    console.error('No Mapbox API Key found');
    return null;
}

// Attempt to retrieve API key immediately
const apiKey = getMapboxApiKey();

// Debugging and utility methods
window.onePDMapboxDebug = {
    getApiKey: () => {
        return getMapboxApiKey();
    },
    setApiKey: (key) => {
        console.log('Setting Mapbox API Key:', key);
        window.onePDMapbox = window.onePDMapbox || {};
        window.onePDMapbox.apiKey = key;
    },
    // Add a method to print all window keys for debugging
    printWindowKeys: () => {
        console.log('All window keys:', Object.keys(window));
    },
    // Method to force API key retrieval
    forceApiKeyRetrieval: () => {
        return getMapboxApiKey();
    }
};

// If no API key is found, log a warning
if (!apiKey) {
    console.warn('No Mapbox API Key could be retrieved. Location search will not work.');
}

// Localize the API key to make it available in the frontend
wp.blocks.registerBlockType(metadata.name, {
    ...metadata,
    edit: Edit,
    save: () => null, // Dynamic block, rendered by PHP
    attributes: {
        ...metadata.attributes,
        mapboxApiKey: {
            type: 'string',
            default: apiKey || ''
        }
    }
});
