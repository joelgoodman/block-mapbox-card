document.addEventListener('DOMContentLoaded', () => {
    // Get API key from window object (maintaining existing API key retrieval)
    const { apiKey } = window.onePDMapboxLocationData || {};
    
    if (!apiKey || !window.mapboxgl) {
        console.error('Mapbox GL JS or API key not available');
        return;
    }

    // Configure Mapbox
    window.mapboxgl.accessToken = apiKey;

    // Find all location card blocks
    const locationCards = document.querySelectorAll('.wp-block-onepd-location-card');
    
    locationCards.forEach(card => {
        // Try to get coordinates from data attributes
        const latitude = parseFloat(card.dataset.latitude) || 0;
        const longitude = parseFloat(card.dataset.longitude) || 0;
        const mapStyle = card.dataset.mapStyle || 'streets-v12';
        const zoomLevel = parseInt(card.dataset.zoomLevel) || 14;
        
        if (!latitude || !longitude) return;

        const mapContainer = card.querySelector('.wp-block-onepd-location-card__map');
        if (!mapContainer) return;

        // Create map
        const map = new window.mapboxgl.Map({
            container: mapContainer,
            style: `mapbox://styles/mapbox/${mapStyle}`,
            center: [longitude, latitude],
            zoom: zoomLevel,
            trackUserLocation: false
        });

        // Add marker
        new window.mapboxgl.Marker()
            .setLngLat([longitude, latitude])
            .addTo(map);

        // Add navigation controls
        map.addControl(new window.mapboxgl.NavigationControl(), 'top-left');
    });
});
