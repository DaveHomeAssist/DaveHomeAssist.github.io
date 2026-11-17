// Shared public-catalog rule for the hub hero, the directory, and the
// static hero numbers written into index.html.
//
// A project is public when its manifest `visibility` is "public".
// `unlisted` and `isolated` stay out of the public catalog.
// `featured` and `status` are separate fields: they do not change
// whether a project is public.
//
// Classic script (no import/export) so index.html can load it from disk
// with a plain <script src>. Node reads the same file through vm and
// uses globalThis.ProjectCounts.

(function (root) {
  function isPublicProject(project) {
    return Boolean(project) && project.visibility === 'public';
  }

  function getPublicProjects(projects) {
    return (Array.isArray(projects) ? projects : []).filter(isPublicProject);
  }

  function getFeaturedProjects(projects) {
    return getPublicProjects(projects).filter((project) => project.featured === true);
  }

  function getActiveProjects(projects) {
    return getPublicProjects(projects).filter((project) => project.status === 'active');
  }

  function getHeroStats(projects) {
    return {
      public: getPublicProjects(projects).length,
      featured: getFeaturedProjects(projects).length,
      active: getActiveProjects(projects).length,
    };
  }

  root.ProjectCounts = {
    isPublicProject,
    getPublicProjects,
    getFeaturedProjects,
    getActiveProjects,
    getHeroStats,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
