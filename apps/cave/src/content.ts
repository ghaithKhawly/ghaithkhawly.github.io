// Content comes from the same JSON the classic site uses, which is generated from the
// LaTeX CV (apps/classic/cv-fulltime.tex). This maps it to the shape the cave reads.
import cv from '../../classic/src/data/cv-fulltime.json';

const dash = (s: string) => s.replace(/ - /g, ' – ');

export interface Experience { company: string; position: string; period: string; description: string[]; technologies: string[] }
export interface Project { title: string; description: string; technologies: string[] }

export const CV = {
  name: cv.hero.name,
  title: cv.hero.title,
  location: cv.hero.location,
  email: cv.hero.email,
  github: cv.hero.github,
  linkedin: cv.hero.linkedin,
  about: cv.about,
  experiences: cv.experiences.map((e): Experience => ({ company: e.company, position: e.position, period: dash(e.period), description: e.description, technologies: e.technologies ?? [] })),
  skills: cv.skillCategories.map((c) => ({ title: c.title, skills: c.skills })),
  education: { degree: cv.education.degree, institution: cv.education.institution, period: dash(cv.education.period), note: cv.education.description },
  certifications: { year: cv.certifications[0]?.year ?? '', items: cv.certifications.map((c) => c.title) },
  languages: cv.languages,
  // The projects with a painting are in content/projects.ts. This one is told under Experience.
  medical: pick('Medical App'),
};

function pick(title: string): Project {
  const p = cv.projects.find((q) => q.title === title);
  if (!p) throw new Error(`Project "${title}" is missing from cv-fulltime.json`);
  return { title: p.title, description: p.description, technologies: p.technologies };
}
