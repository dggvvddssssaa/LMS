// File lưu trữ tất cả hình ảnh trong dự án
export const IMAGES = {
  // Background images for landing page (using gradients and patterns)
  backgrounds: {
    hero1: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    hero2: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    hero3: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    education1: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    education2: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  },

  // Icons and illustrations (using emojis as placeholders)
  icons: {
    learning: "🎓",
    teacher: "👨‍🏫",
    student: "👨‍🎓",
    certificate: "🏆",
    online: "💻",
    community: "👥",
  },

  // Course thumbnails (placeholders)
  courses: {
    default: "/images/course-default.jpg",
    programming: "/images/course-programming.jpg",
    design: "/images/course-design.jpg",
    business: "/images/course-business.jpg",
  },

  // UI elements
  ui: {
    logo: "/images/logo.png",
    avatar: "/images/avatar-default.jpg",
  },

  // Educational illustrations
  illustrations: {
    study: "/images/study-illustration.svg",
    classroom: "/images/classroom-illustration.svg",
    graduation: "/images/graduation-illustration.svg",
  },
};

// Function to get random background image
export const getRandomBackground = () => {
  const backgrounds = Object.values(IMAGES.backgrounds);
  return backgrounds[Math.floor(Math.random() * backgrounds.length)];
};

// Function to get background by index (for cycling)
export const getBackgroundByIndex = (index) => {
  const backgrounds = Object.values(IMAGES.backgrounds);
  return backgrounds[index % backgrounds.length];
};
