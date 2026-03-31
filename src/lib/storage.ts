// Local Storage persistence for projects

import type { GeneratedCard } from './cardTypes';

export interface SavedProject {
  id: string;
  title: string;
  content: string;
  cardData?: GeneratedCard | null;
  mode: 'single' | 'multi';
  themeOverride?: 'yellow' | 'blue' | 'lavender';
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'semantic-edu-projects';

export function loadProjects(): SavedProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveProject(project: SavedProject): void {
  const projects = loadProjects();
  const idx = projects.findIndex(p => p.id === project.id);
  if (idx >= 0) {
    projects[idx] = { ...project, updatedAt: Date.now() };
  } else {
    projects.push(project);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function deleteProject(id: string): void {
  const projects = loadProjects().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function createNewProject(): SavedProject {
  return {
    id: `proj-${Date.now()}`,
    title: 'Untitled',
    content: '',
    mode: 'single',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
