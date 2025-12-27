export interface FrappeConfig {
  baseUrl: string;
}

export interface FrappeUser {
  name: string;
  email: string;
  roles: string[];
}

// Metadata Types
export enum FieldType {
  Data = "Data",
  Select = "Select",
  Link = "Link",
  Int = "Int",
  Float = "Float",
  Currency = "Currency",
  Date = "Date",
  Check = "Check",
  Text = "Text",
  SmallText = "Small Text",
  Readonly = "Read Only",
  SectionBreak = "Section Break",
  ColumnBreak = "Column Break"
}

export interface DocField {
  fieldname: string;
  label: string;
  fieldtype: FieldType;
  options?: string; // For Select (newline separated) or Link (Doctype)
  reqd?: 0 | 1;
  read_only?: 0 | 1;
  hidden?: 0 | 1;
  fetch_from?: string; // Format: "link_fieldname.source_fieldname"
  depends_on?: string;
  read_only_depends_on?: string;
  mandatory_depends_on?: string;
  default?: any;
}

export interface DocTypeMeta {
  name: string; // The Doctype ID
  fields: DocField[];
  is_submittable?: 0 | 1;
}

// Resource Types
export interface ListResource<T = any> {
  data: T[] | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  next: () => Promise<void>;
  hasNextPage: boolean;
  filters: Record<string, any>;
  setFilters: (filters: Record<string, any>) => void;
}

export interface DocumentResource<T = any> {
  doc: T | null;
  loading: boolean;
  error: string | null;
  save: () => Promise<void>;
  submit: () => Promise<void>;
  delete: () => Promise<void>;
  setValue: (field: string, value: any) => void;
  isDirty: boolean;
}
