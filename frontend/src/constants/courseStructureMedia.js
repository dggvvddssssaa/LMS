export const COURSE_STRUCTURE_MEDIA = {
  videoIcon: "/images/course-structure-video.svg",
  mediaIcon: "/images/course-structure-media.svg",
};

export const getLessonTypeMeta = (lesson) => {
  const hasText = Boolean((lesson?.content_text || "").trim());
  const hasUrl = Boolean((lesson?.content_url || "").trim());

  if (hasUrl && !hasText) {
    return {
      label: "Video",
      badgeClass: "bg-blue-50 text-blue-700",
      icon: COURSE_STRUCTURE_MEDIA.videoIcon,
    };
  }

  if (!hasUrl && hasText) {
    return {
      label: "Văn bản",
      badgeClass: "bg-emerald-50 text-emerald-700",
      icon: COURSE_STRUCTURE_MEDIA.mediaIcon,
    };
  }

  if (hasUrl && hasText) {
    return {
      label: "Đa phương tiện",
      badgeClass: "bg-amber-50 text-amber-700",
      icon: COURSE_STRUCTURE_MEDIA.mediaIcon,
    };
  }

  return {
    label: "Nội dung",
    badgeClass: "bg-slate-100 text-slate-700",
    icon: COURSE_STRUCTURE_MEDIA.mediaIcon,
  };
};
