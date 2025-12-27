import React, { useState } from 'react';
import { useListResource, useDocumentResource, useMeta, useFrappeUser } from '../hooks/useFrappe';
import { DynamicForm } from '../components/DynamicForm';
import { DocTypeMeta, FieldType } from '../types';

// Mock Metadata if fetch fails (for demonstration purposes until user provides JSON)
const MOCK_PROJECT_META: DocTypeMeta = {
  name: "Project Info",
  fields: [
    { fieldname: "project_name", label: "Project Name", fieldtype: FieldType.Data, reqd: 1 },
    { fieldname: "status", label: "Status", fieldtype: FieldType.Select, options: "Proposed\nActive\nCompleted", reqd: 1, default: "Proposed" },
    { fieldname: "developer", label: "Developer", fieldtype: FieldType.Link, options: "Developer", reqd: 1 },
    { fieldname: "developer_email", label: "Developer Email", fieldtype: FieldType.Data, read_only: 1, fetch_from: "developer.email" },
    { fieldname: "carbon_credits", label: "Total Credits", fieldtype: FieldType.Int, read_only: 1 },
    { fieldname: "description", label: "Description", fieldtype: FieldType.Text },
  ]
};

const ProjectList: React.FC<{ onSelect: (name: string) => void, onCreate: () => void }> = ({ onSelect, onCreate }) => {
  const { data, loading, error, next, hasNextPage } = useListResource('Project Info', ['name', 'project_name', 'approval_status']);
  
  if (loading && !data) return <div>Loading Projects...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Projects</h2>
        <button 
          onClick={onCreate}
          className="bg-accent hover:bg-emerald-600 text-white px-4 py-2 rounded shadow transition"
        >
          New Project
        </button>
      </div>
      
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Project Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {data?.map((project: any) => (
              <tr key={project.name} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{project.project_name || project.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    project.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {project.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => onSelect(project.name)} className="text-accent hover:text-emerald-700">Edit</button>
                </td>
              </tr>
            ))}
            {!data || data.length === 0 && (
               <tr><td colSpan={3} className="px-6 py-4 text-center text-slate-500">No projects found. Use the mock metadata to test?</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {hasNextPage && (
        <button onClick={next} className="mt-4 w-full py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded">
          Load More
        </button>
      )}
    </div>
  );
};

const ProjectForm: React.FC<{ name?: string, onBack: () => void }> = ({ name, onBack }) => {
  // Try to fetch real meta, fallback to mock if API not ready
  const { meta: realMeta, loading: metaLoading } = useMeta('Project Info');
  const meta = realMeta || MOCK_PROJECT_META;
  
  const { doc, loading: docLoading, setValue, save, isDirty, error } = useDocumentResource('Project Info', name, meta);

  if (metaLoading || docLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800">&larr; Back to List</button>
        <div className="space-x-2">
           {isDirty && <span className="text-sm text-yellow-600 italic mr-2">Unsaved changes</span>}
           <button 
             onClick={save} 
             disabled={!isDirty}
             className="bg-primary text-white px-4 py-2 rounded disabled:opacity-50"
           >
             {name ? 'Update' : 'Save'}
           </button>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      <DynamicForm 
        meta={meta} 
        doc={doc} 
        onChange={setValue} 
      />
    </div>
  );
};

const ProjectPage: React.FC = () => {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [selectedDoc, setSelectedDoc] = useState<string | undefined>(undefined);

  const handleSelect = (name: string) => {
    setSelectedDoc(name);
    setView('form');
  };

  const handleCreate = () => {
    setSelectedDoc(undefined);
    setView('form');
  };

  const handleBack = () => {
    setView('list');
    setSelectedDoc(undefined);
  };

  return (
    <div>
      {view === 'list' ? (
        <ProjectList onSelect={handleSelect} onCreate={handleCreate} />
      ) : (
        <ProjectForm name={selectedDoc} onBack={handleBack} />
      )}
    </div>
  );
};

export default ProjectPage;
