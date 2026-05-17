function normalizeYouTubeUrl(rawUrl) {
  if (!rawUrl) return rawUrl;
  
  try {
    if (rawUrl.includes('/embed/')) {
      return rawUrl;
    }
    
    let id = null;
    const urlStr = rawUrl.trim();
    const urlToParse = urlStr.startsWith('http') ? urlStr : `https://${urlStr}`;
    const url = new URL(urlToParse);
    
    if (url.hostname.includes("youtu.be")) {
      id = url.pathname.slice(1).split('?')[0];
    } else if (url.hostname.includes("youtube.com")) {
      if (url.pathname === "/watch") {
        id = url.searchParams.get("v");
      } else if (url.pathname.startsWith("/shorts/")) {
        id = url.pathname.split("/shorts/")[1].split('?')[0];
      }
    }
    
    if (id && /^[a-zA-Z0-9_-]{6,}$/.test(id)) {
      return `https://www.youtube.com/embed/${id}`;
    }
    
    return rawUrl;
  } catch (err) {
    return rawUrl;
  }
}

function isValidYouTubeUrl(rawUrl) {
    if (!rawUrl) return false;
    const normalized = normalizeYouTubeUrl(rawUrl);
    return normalized.includes('youtube.com/embed/') || normalized.includes('youtube-nocookie.com/embed/');
}

function isYouTubeUrl(url) {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be');
}

module.exports = {
  normalizeYouTubeUrl,
  isValidYouTubeUrl,
  isYouTubeUrl
};
