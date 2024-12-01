(function() {
    // Mapbox Lazy Loading and Performance Optimization
    const MapboxManager = {
        // Track loaded maps to prevent duplicate initializations
        loadedMaps: new Set(),
        
        // Mapbox GL JS dynamic import
        async loadMapboxGL() {
            if (window.mapboxgl) return window.mapboxgl;
            
            try {
                // Dynamically import Mapbox GL JS
                const mapboxgl = await import('https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js');
                
                // Load CSS dynamically
                const link = document.createElement('link');
                link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
                link.rel = 'stylesheet';
                document.head.appendChild(link);
                
                return mapboxgl;
            } catch (error) {
                console.error('Failed to load Mapbox GL JS:', error);
                return null;
            }
        },

        // Retrieve API key with existing fallback logic
        getMapboxApiKey() {
            const sources = [
                () => window.onePDMapboxLocationData?.apiKey,
                () => window.onePDMapbox?.apiKey,
                () => window.wpApiSettings?.mapboxApiKey,
                () => window.onepd_mapbox_settings?.api_key
            ];

            for (const source of sources) {
                const apiKey = source();
                if (apiKey) return apiKey;
            }

            return null;
        },

        // Intersection Observer for Lazy Loading
        observeMaps() {
            const observer = new IntersectionObserver((entries, observer) => {
                entries.forEach(async entry => {
                    if (entry.isIntersecting) {
                        const mapContainer = entry.target;
                        
                        // Prevent duplicate map initialization
                        if (this.loadedMaps.has(mapContainer.id)) return;

                        // Initialize map
                        await this.initializeMap(mapContainer);
                        
                        // Stop observing this container
                        observer.unobserve(mapContainer);
                    }
                });
            }, {
                rootMargin: '100px', // Start loading slightly before entering viewport
                threshold: 0.01
            });

            // Observe all map containers
            document.querySelectorAll('.wp-block-onepd-mapbox-location-card__map').forEach(mapContainer => {
                // Ensure unique ID
                if (!mapContainer.id) {
                    mapContainer.id = `mapbox-container-${Math.random().toString(36).substr(2, 9)}`;
                }
                observer.observe(mapContainer);
            });
        },

        // Map Initialization with existing logic
        async initializeMap(mapContainer) {
            // Prevent duplicate initializations
            if (this.loadedMaps.has(mapContainer.id)) return;

            // Load Mapbox GL JS
            const mapboxgl = await this.loadMapboxGL();
            if (!mapboxgl) {
                mapContainer.textContent = 'Map could not be loaded';
                return;
            }

            // Retrieve API key
            const apiKey = this.getMapboxApiKey();
            if (!apiKey) {
                mapContainer.textContent = 'Map could not be initialized: No API key';
                return;
            }

            // Get parent card for data attributes
            const card = mapContainer.closest('.wp-block-onepd-mapbox-location-card');
            if (!card) return;

            // Extract location data
            const latitude = parseFloat(card.dataset.latitude);
            const longitude = parseFloat(card.dataset.longitude);
            const mapStyle = card.dataset.mapStyle || 'streets-v12';
            const zoomLevel = parseInt(card.dataset.zoomLevel) || 12;

            // Validate coordinates
            if (isNaN(latitude) || isNaN(longitude)) {
                mapContainer.textContent = 'Invalid map coordinates';
                return;
            }

            try {
                // Configure Mapbox
                mapboxgl.accessToken = apiKey;

                // Create map
                const map = new mapboxgl.Map({
                    container: mapContainer.id,
                    style: `mapbox://styles/mapbox/${mapStyle}`,
                    center: [longitude, latitude],
                    zoom: zoomLevel,
                    interactive: true,
                    attributionControl: true
                });

                // Add marker
                new mapboxgl.Marker()
                    .setLngLat([longitude, latitude])
                    .addTo(map);

                // Add navigation control
                map.addControl(new mapboxgl.NavigationControl());

                // Mark as loaded
                this.loadedMaps.add(mapContainer.id);
            } catch (error) {
                console.error('Map initialization error:', error);
                mapContainer.textContent = 'Map could not be loaded';
            }
        },

        // Initialize all map-related functionality
        init() {
            // Ensure script runs after DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.observeMaps());
            } else {
                this.observeMaps();
            }
        }
    };

    // Start map initialization
    MapboxManager.init();
})();
