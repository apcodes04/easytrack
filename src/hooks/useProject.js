import { useState, useEffect } from 'react';
import { getProjectsByOrg, getProject } from '../services/projectService';
import { useOrg } from './useOrg';

export const useProject = (projectId = null) => {
  const { currentOrg } = useOrg();
  const [projects, setProjects] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentOrg?.id) return;
    setLoading(true);
    const unsub = getProjectsByOrg(currentOrg.id, (data) => {
      setProjects(data);
      setLoading(false);
    });
    return () => unsub && unsub();
  }, [currentOrg?.id]);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    const unsub = getProject(projectId, (data) => {
      setProject(data);
      setLoading(false);
    });
    return () => unsub && unsub();
  }, [projectId]);

  return { projects, project, loading, error };
};
