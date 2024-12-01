(function() {
    // AGGRESSIVE DEBUGGING
    // Direct console output to ensure visibility
    window.alert = function(message) {
        // console.error('ALERT:', message);
    };

    function initializeMapboxMaps() {
        // Debugging: Print all window keys

        // Aggressive API key retrieval
        function getMapboxApiKey() {
            const sources = [
                () => {
                    // debugLog('Checking onePDMapboxLocationData');
                    return window.onePDMapboxLocationData?.apiKey;
                },
                () => {
                    // debugLog('Checking onePDMapbox');
                    return window.onePDMapbox?.apiKey;
                },
                () => {
                    // debugLog('Checking wpApiSettings');
                    return window.wpApiSettings?.mapboxApiKey;
                },
                () => {
                    // debugLog('Checking onepd_mapbox_settings');
                    return window.onepd_mapbox_settings?.api_key;
                }
            ];

            for (const source of sources) {
                const apiKey = source();
                if (apiKey) {
                    // debugLog(' API Key found:', apiKey);
                    return apiKey;
                }
            }

            // console.error(' NO MAPBOX API KEY FOUND');
            return null;
        }

        // Check Mapbox GL JS availability
        if (typeof mapboxgl === 'undefined') {
            // console.error(' MAPBOX GL JS NOT LOADED');
            return;
        }

        // Retrieve API key
        const apiKey = getMapboxApiKey();
        if (!apiKey) {
            // console.error(' CANNOT INITIALIZE MAPS: NO API KEY');
            return;
        }

        // Configure Mapbox
        mapboxgl.accessToken = apiKey;

        // Find all location card blocks
        const locationCards = document.querySelectorAll('.wp-block-onepd-mapbox-location-card');
        
        // debugLog(` Location Cards Found: ${locationCards.length}`);

        locationCards.forEach((card, index) => {
            // Get map container
            const mapContainer = card.querySelector('.wp-block-onepd-mapbox-location-card__map');
            
            if (!mapContainer) {
                // console.warn(` Location Card ${index}: Map container not found`);
                return;
            }

            // Ensure container has a unique ID
            if (!mapContainer.id) {
                mapContainer.id = `mapbox-container-${index}`;
            }

            // Extract location data
            const latitude = parseFloat(card.dataset.latitude);
            const longitude = parseFloat(card.dataset.longitude);
            const mapStyle = card.dataset.mapStyle || 'streets-v12';
            const zoomLevel = parseInt(card.dataset.zoomLevel) || 12;

            // debugLog(` Location Card ${index} Data:`, { 
            //     latitude, 
            //     longitude, 
            //     mapStyle, 
            //     zoomLevel 
            // });

            // Validate coordinates
            if (isNaN(latitude) || isNaN(longitude)) {
                // console.error(` Location Card ${index}: Invalid coordinates`, {
                //     latitude, 
                //     longitude,
                //     rawLatitude: card.dataset.latitude,
                //     rawLongitude: card.dataset.longitude
                // });
                return;
            }

            try {
                // Create map with extensive logging
                // debugLog(` Initializing map for container: ${mapContainer.id}`);
                const map = new mapboxgl.Map({
                    container: mapContainer.id,
                    style: `mapbox://styles/mapbox/${mapStyle}`,
                    center: [longitude, latitude],
                    zoom: zoomLevel,
                    interactive: true,
                    attributionControl: true
                });

                // Add marker
                // debugLog(' Adding marker');
                new mapboxgl.Marker()
                    .setLngLat([longitude, latitude])
                    .addTo(map);

                // Add navigation control
                // debugLog(' Adding navigation control');
                map.addControl(new mapboxgl.NavigationControl());

                // Add load event listener
                map.on('load', () => {
                    // debugLog(` Map Loaded Successfully for ${mapContainer.id}`);
                });

                // Add error event listener
                map.on('error', (error) => {
                    // console.error(` Map Error for ${mapContainer.id}:`, error);
                });

            } catch (error) {
                // console.error(` Location Card ${index}: Map initialization error`, error);
                mapContainer.textContent = 'Map could not be loaded';
            }
        });
    }

    // Ensure script runs after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeMapboxMaps);
    } else {
        initializeMapboxMaps();
    }
})();
