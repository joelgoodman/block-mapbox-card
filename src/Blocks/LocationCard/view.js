/* global mapboxgl */
(() => {
    const initMap = async (container) => {
        if (!container) return;

        const lat = parseFloat(container.dataset.lat);
        const lng = parseFloat(container.dataset.lng);
        const address = container.dataset.address;

        if (!lat || !lng || !mapboxgl) {
            console.error('Missing required data or Mapbox GL JS not loaded');
            return;
        }

        try {
            const map = new mapboxgl.Map({
                container: container,
                style: 'mapbox://styles/mapbox/light-v11',
                center: [lng, lat],
                zoom: 15,
                interactive: false,
                attributionControl: false
            });

            // Add marker
            const markerEl = document.createElement('div');
            markerEl.className = 'wp-block-onepd-mapbox-location-card__marker';
            markerEl.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 0C7.58 0 4 3.58 4 8c0 5.25 8 13 8 13s8-7.75 8-13c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" fill="currentColor"/>
                </svg>
            `;

            new mapboxgl.Marker(markerEl)
                .setLngLat([lng, lat])
                .addTo(map);

            // Add click handler to open in Google Maps
            container.addEventListener('click', () => {
                window.open(
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || `${lat},${lng}`)}`,
                    '_blank'
                );
            });

            // Add hover effect
            container.style.cursor = 'pointer';
            container.title = 'Click to open in Google Maps';

            return map;
        } catch (error) {
            console.error('Error initializing map:', error);
            container.innerHTML = '<div class="wp-block-onepd-mapbox-location-card__error">Error loading map</div>';
        }
    };

    const init = () => {
        const mapContainers = document.querySelectorAll('.wp-block-onepd-mapbox-location-card__map-container');
        mapContainers.forEach(initMap);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
