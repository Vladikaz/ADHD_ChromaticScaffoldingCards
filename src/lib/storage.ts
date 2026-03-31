// Local Storage & Supabase Cloud persistence for projects
import { supabase } from "@/integrations/supabase/client";
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
  device_id?: string; // Metadata for cloud attribution
}

const STORAGE_KEY = 'semantic-edu-projects';
const DEVICE_ID_KEY = 'adhd_device_id';

/**
 * 1. DEVICE ID GENERATION
 * Creates a unique identifier for this browser/device if one doesn't exist.
 * This allows "Project Separation" in the Supabase database without a login.
 */
export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

// --- LOCAL STORAGE METHODS ---

export function loadProjects(): SavedProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveProject(project: SavedProject): void {
  const projects = loadProjects();
  const idx = projects.findIndex(p => p.id === project.id);
  const updatedProject = { ...project, updatedAt: Date.now() };
  
  if (idx >= 0) {
    projects[idx] = updatedProject;
  } else {
    projects.push(updatedProject);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  
  // Optional: Auto-sync to cloud whenever saved locally
  syncProjectToCloud(updatedProject).catch(console.error);
}

export function deleteProject(id: string): void {
  const projects = loadProjects().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  
  // Also attempt to delete from cloud
  deleteCloudProject(id).catch(console.error);
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

// --- SUPABASE CLOUD METHODS (Attribution Separation) ---

/**
 * 2. CLOUD SYNC
 * Pushes the local project to the Supabase 'projects' table.
 */
export async function syncProjectToCloud(project: SavedProject) {
  const deviceId = getDeviceId();
  
  // We map the UI interface 'SavedProject' to the SQL table columns
  const { data, error } = await supabase
    .from('projects')
    .upsert({
      // If the ID is a local 'proj-' ID, let Supabase generate a UUID 
      // otherwise use the existing ID for updates
      id: project.id.startsWith('proj-') ? undefined : project.id, 
      name: project.title,
      topic: project.content,
      card_data: project.cardData,
      device_id: deviceId,
    }, {
      onConflict: 'id'
    })
    .select();

  if (error) {
    console.error("Supabase Sync Error:", error.message);
    throw error;
  }
  return data?.[0];
}

/**
 * 3. CLOUD LOAD (Attribution Separation)
 * Only fetches projects that match the current device's ID.
 */
export async function loadCloudProjects(): Promise<SavedProject[]> {
  const deviceId = getDeviceId();
  
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('device_id', deviceId) // SEPARATION: Only get THIS device's data
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Supabase Load Error:", error.message);
    return [];
  }

  // Map database rows back to the SavedProject interface
  return (data || []).map(row => ({
    id: row.id,
    title: row.name,
    content: row.topic,
    cardData: row.card_data,
    mode: 'single',
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.created_at).getTime(),
    device_id: row.device_id
  }));
}

export async function deleteCloudProject(id: string) {
  // We don't delete by device_id here because ID is a unique Primary Key
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) console.error("Cloud Delete Error:", error.message);
}
