import React, { useMemo } from 'react';
import { DocTypeMeta, DocField, FieldType } from '../types';
import { TextInput, SelectInput, CheckboxInput } from './ui/Input';
import { useFrappeUser } from '../hooks/useFrappe';

interface DynamicFormProps {
  meta: DocTypeMeta;
  doc: any;
  onChange: (field: string, value: any) => void;
  loading?: boolean;
}

const FieldRenderer: React.FC<{
  field: DocField;
  value: any;
  onChange: (value: any) => void;
  doc: any;
  userRoles: string[];
}> = ({ field, value, onChange, doc, userRoles }) => {
  
  // -- 1. Metadata-Driven Logic: Visibility & Read-Only --
  
  // Evaluate `depends_on` (simplified eval - mostly checking field values)
  const isVisible = useMemo(() => {
    if (field.hidden) return false;
    if (!field.depends_on) return true;
    try {
      // Danger: Parsing eval string. In a real app, use a safe parser or `frappe.utils.eval`.
      // For this simplified version, we only support "eval:doc.status=='Draft'" style simple checks
      const condition = field.depends_on.replace('eval:', '');
      // Create a function context
      // eslint-disable-next-line no-new-func
      const fn = new Function('doc', `return ${condition}`);
      return fn(doc);
    } catch (e) {
      console.warn(`Failed to eval depends_on for ${field.fieldname}`, e);
      return true;
    }
  }, [field.depends_on, field.hidden, doc]);

  // Evaluate `read_only` or `read_only_depends_on`
  const isReadOnly = useMemo(() => {
    if (field.read_only) return true;
    if (!field.read_only_depends_on) return false;
    try {
       const condition = field.read_only_depends_on.replace('eval:', '');
       // Check if role based
       if (condition.includes('role')) {
         // Mock logic: if condition is "eval:!has_common(frappe.user_roles, ['Administrator'])"
         // This is hard to eval safely on client without a full library. 
         // We will skip complex role checks for this demo unless explicitly parsed.
         return false; 
       }
       // eslint-disable-next-line no-new-func
       const fn = new Function('doc', `return ${condition}`);
       return fn(doc);
    } catch (e) {
      return false;
    }
  }, [field.read_only, field.read_only_depends_on, doc]);

  if (!isVisible) return null;

  // -- 2. Field Type Rendering --

  switch (field.fieldtype) {
    case FieldType.Select:
      const options = field.options ? field.options.split('\n') : [];
      return (
        <SelectInput
          label={field.label}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          options={options}
          required={!!field.reqd}
          disabled={isReadOnly}
        />
      );
    
    case FieldType.Check:
      return (
        <CheckboxInput
          label={field.label}
          checked={!!value}
          onChange={(e) => onChange(e.target.checked ? 1 : 0)}
          disabled={isReadOnly}
        />
      );

    case FieldType.Int:
    case FieldType.Float:
    case FieldType.Currency:
      return (
        <TextInput
          type="number"
          label={field.label}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={!!field.reqd}
          disabled={isReadOnly}
        />
      );

    case FieldType.Date:
      return (
        <TextInput
          type="date"
          label={field.label}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={!!field.reqd}
          disabled={isReadOnly}
        />
      );

    case FieldType.SectionBreak:
      return <div className="border-b border-slate-200 mt-6 mb-4 pb-1"><h3 className="text-lg font-semibold text-slate-800">{field.label}</h3></div>;

    case FieldType.ColumnBreak:
       // Simplified layout handling: currently just rendering flat. 
       // To support columns, we'd need a Grid container logic in the parent.
       return null; 

    case FieldType.Data:
    case FieldType.Link: // Treat Link as text input for now, or fetch suggestions if implementing full Link
    default:
      return (
        <TextInput
          type="text"
          label={field.label}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={!!field.reqd}
          disabled={isReadOnly}
          placeholder={field.fieldtype === FieldType.Link ? `Select ${field.options}...` : ''}
        />
      );
  }
};

export const DynamicForm: React.FC<DynamicFormProps> = ({ meta, doc, onChange, loading }) => {
  const { user } = useFrappeUser();

  if (loading) return <div className="p-4 text-center">Loading Form Metadata...</div>;
  if (!meta || !doc) return <div className="p-4 text-center">No Data</div>;

  return (
    <div className="bg-white shadow rounded-lg p-6">
       <h2 className="text-2xl font-bold mb-6 text-slate-800">{meta.name}</h2>
       <div className="grid grid-cols-1 gap-4">
          {meta.fields.map((field) => (
            <FieldRenderer
              key={field.fieldname}
              field={field}
              value={doc[field.fieldname]}
              onChange={(val) => onChange(field.fieldname, val)}
              doc={doc}
              userRoles={user?.roles || []}
            />
          ))}
       </div>
    </div>
  );
};
