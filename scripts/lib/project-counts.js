// Shared public-catalog rule for the hub hero, the directory, and the
// static hero numbers written into index.html.
//
// A project is public when its manifest `visibility` is "public".
// `unlisted` and `isolated` stay out of the public catalog.
// `featured` and `status` are separate fields: they do not change
// whether a project is public.

export function isPublicProject(project) {
  return Boolean(project) && project.visibility === 'public';
}

export function getPublicProjects(projects) {
  return (Array.isArray(projects) ? projects : []).filter(isPublicProject);
}

export function getFeaturedProjects(projects) {
  return getPublicProjects(projects).filter((project) => project.featured === true);
}

export function getActiveProjects(projects) {
  return getPublicProjects(projects).filter((project) => project.status === 'active');
}

export function getHeroStats(projects) {
  return {
    public: getPublicProjects(projects).length,
    featured: getFeaturedProjects(projects).length,
    active: getActiveProjects(projects).length,
  };
}
