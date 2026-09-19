/**
 * Image service for AI-generated placeholders and optimized image URLs
 * Uses high-quality placeholder services with AI aesthetics
 */

export const ImageService = {
  // Unsplash API for high-quality stock images
  unsplash: (keyword: string, width = 800, height = 600) => {
    const encodedKeyword = encodeURIComponent(keyword);
    return `https://source.unsplash.com/${width}x${height}/?${encodedKeyword}`;
  },

  // Placeholder with custom dimensions and gradient colors
  placeholder: (width: number, height: number, bgColor = '1e293b', textColor = 'e2e8f0') => {
    return `https://via.placeholder.com/${width}x${height}/${bgColor}/${textColor}?text=Loading`;
  },

  // Gradient background placeholder
  gradient: (width: number, height: number, color1 = '3b82f6', color2 = '8b5cf6') => {
    return `https://dummyimage.com/${width}x${height}/${color1}/${color2}.png&text=`;
  },

  // Gaming-themed hero images
  gaming: {
    typing: () => 'https://images.unsplash.com/photo-1587829191301-dcc8dd1df0fa?w=1200&h=600&fit=crop',
    leaderboard: () => 'https://images.unsplash.com/photo-1551431009-381d36ac3a14?w=800&h=400&fit=crop',
    competition: () => 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop',
    achievement: () => 'https://images.unsplash.com/photo-1606857521033-639c06d3a7cf?w=800&h=400&fit=crop',
    speed: () => 'https://images.unsplash.com/photo-1551288049-bebda4e267f71?w=800&h=400&fit=crop',
    dashboard: () => 'https://images.unsplash.com/photo-1551432009-5bed266f8550?w=1200&h=600&fit=crop',
  },

  // Profile/Avatar images
  avatar: (seed: string, size = 150) => {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&size=${size}`;
  },

  // Gaming icons and badges
  badges: {
    gold: () => 'https://images.unsplash.com/photo-1606857521033-639c06d3a7cf?w=200&h=200&fit=crop',
    silver: () => 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=200&h=200&fit=crop',
    bronze: () => 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=200&h=200&fit=crop',
    master: () => 'https://images.unsplash.com/photo-1606857521033-639c06d3a7cf?w=200&h=200&fit=crop',
  },

  // Empty state illustrations
  emptyStates: {
    noContests: () => 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=400&fit=crop&opacity=0.3',
    noSubmissions: () => 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=400&fit=crop&opacity=0.3',
    noResults: () => 'https://images.unsplash.com/photo-1547775076-7c6da9ca3ef5?w=400&h=400&fit=crop&opacity=0.3',
    offline: () => 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=400&fit=crop&opacity=0.3',
  },

  // Fallback gradient SVG
  fallbackGradient: (color1 = '#3b82f6', color2 = '#8b5cf6', width = 800, height = 600) => {
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#grad)" />
        <text x="50%" y="50%" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle">
          Loading...
        </text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  },

  // Optimization helper
  optimize: (url: string, width?: number, height?: number, quality = 75) => {
    if (url.includes('unsplash')) {
      const params = new URLSearchParams();
      if (width) params.append('w', width.toString());
      if (height) params.append('h', height.toString());
      params.append('fit', 'crop');
      params.append('q', quality.toString());
      return `${url}?${params.toString()}`;
    }
    return url;
  },
};

export default ImageService;
