# Schema-Driven Template System Architecture

## Overview
A Sanity.io-inspired schema system where template definitions generate both the UI and rendering logic automatically.

---

## Core Concept

**Current System**: Config JSON → Manual form components → Manual renderer logic
**Schema System**: Schema definition → Auto-generated UI → Auto-generated renderer

---

## Architecture Layers

### 1. Schema Definition Layer

**Location**: `templates/{family}/schema.ts` or `templates/{family}/schema.json`

**Purpose**: Define template structure declaratively

**Example Schema**:
```typescript
export const mtlCodeSchema = {
  name: "mtl-code",
  title: "MTL Code Event Poster",
  dimensions: { width: 1080, height: 1350 },
  
  fields: [
    {
      name: "eventTitle",
      type: "string",
      title: "Event Title",
      validation: { required: true, max: 60 },
      ui: {
        component: "TextInput",
        placeholder: "Code @ Montreal"
      },
      template: {
        replacements: [
          { pattern: "Placeholder Text", selector: "[data-field='eventTitle']" }
        ]
      }
    },
    {
      name: "primaryColor",
      type: "color",
      title: "Primary Color",
      validation: { required: true },
      ui: {
        component: "ColorPicker",
        default: "#3D9DFF"
      },
      template: {
        replacements: [
          { pattern: "#3D9DFF", type: "color" }
        ]
      }
    },
    {
      name: "people",
      type: "array",
      title: "Speakers",
      validation: { min: 1, max: 3 },
      ui: {
        component: "Repeater",
        addButtonLabel: "Add Speaker"
      },
      of: [
        { name: "name", type: "string", ... },
        { name: "headshot", type: "image", ... }
      ],
      template: {
        replacements: [
          { pattern: "Michael Masson", selector: "[data-person='0'][data-field='name']" }
        ]
      }
    }
  ],
  
  template: {
    htmlPath: "template-{variant}.html",
    variants: ["1", "2", "3"],
    assets: { ... },
    colorReplacements: { ... }
  }
}
```

**Key Features**:
- Type-safe schema definitions
- UI generation hints (`ui.component`)
- Template mapping (`template.replacements`)
- Validation rules
- Nested/array fields support

---

### 2. Schema Registry Layer

**Location**: `lib/schema-registry.ts`

**Responsibilities**:
- Load schemas from `templates/{family}/schema.ts`
- Validate schema structure
- Cache schemas for performance
- Provide schema query API

**API**:
```typescript
getSchema(family: string): TemplateSchema
getAllSchemas(): TemplateSchema[]
validateSchema(schema: TemplateSchema): ValidationResult
```

---

### 3. UI Generation Layer

**Location**: `lib/schema-to-ui.ts` + `components/forms/SchemaForm.tsx`

**Responsibilities**:
- Convert schema → React Hook Form schema (Zod)
- Convert schema → React form components
- Handle nested fields (arrays, objects)
- Generate form layout from schema

**Process**:
1. **Schema → Zod**: Generate validation schema
   ```typescript
   schemaToZod(schema) → z.object({ ... })
   ```

2. **Schema → Form Components**: Generate form UI
   ```typescript
   schemaToFormComponents(schema) → <FormField /> components
   ```

3. **Component Mapping**:
   - `string` → `<TextInput />`
   - `color` → `<ColorPicker />`
   - `date` → `<DatePicker />`
   - `array` → `<Repeater />` with add/remove
   - `image` → `<FileUpload />`

**Example Output**:
```tsx
<SchemaForm schema={schema}>
  {/* Auto-generated from schema */}
  <TextInput name="eventTitle" {...fieldProps} />
  <ColorPicker name="primaryColor" {...fieldProps} />
  <Repeater name="people">
    <TextInput name="name" />
    <FileUpload name="headshot" />
  </Repeater>
</SchemaForm>
```

---

### 4. Renderer Generation Layer

**Location**: `lib/schema-to-renderer.ts`

**Responsibilities**:
- Convert schema → template replacement logic
- Generate field mappings automatically
- Handle conditional rendering based on schema

**Process**:
1. **Schema → Replacement Rules**: Extract all `template.replacements`
2. **Generate Renderer Function**: Create replacement logic
3. **Map Data → Template**: Apply replacements based on schema

**Example**:
```typescript
// Schema defines:
{ pattern: "Placeholder Text", selector: "[data-field='eventTitle']" }

// Auto-generates:
html.replace(/Placeholder Text/g, submission.eventTitle)
// OR
html.querySelector("[data-field='eventTitle']").textContent = submission.eventTitle
```

---

### 5. Template Builder Dashboard (Future)

**Location**: `app/admin/templates/` (separate admin area)

**Features**:
- Visual schema editor
- Drag-and-drop field builder
- Live preview of generated form
- Template HTML upload
- Auto-detect fields from HTML (`data-*` attributes)
- Export schema as TypeScript/JSON

**Workflow**:
1. Upload HTML template
2. System scans for `data-field="..."` attributes
3. Auto-suggests schema fields
4. User refines field types, validation, UI components
5. Save schema → Auto-generates form + renderer

---

## File Structure

```
templates/
  {family}/
    schema.ts          # Schema definition (TypeScript)
    template-1.html     # HTML templates
    template-2.html
    template-3.html

lib/
  schema-registry.ts        # Load/validate schemas
  schema-to-ui.ts           # Generate form UI
  schema-to-renderer.ts      # Generate renderer logic
  schema-types.ts           # TypeScript types

components/
  forms/
    SchemaForm.tsx          # Generic schema-driven form
    fields/
      StringField.tsx       # Field components
      ColorField.tsx
      ArrayField.tsx
      ImageField.tsx
      ...

app/
  admin/                    # Future: Template builder dashboard
    templates/
      [family]/
        edit/
          page.tsx          # Schema editor UI
```

---

## Data Flow

### Creating a Template

1. **Design in Figma** → Export HTML
2. **Add data attributes** to HTML:
   ```html
   <div data-field="eventTitle">Placeholder Text</div>
   <input data-field="primaryColor" data-type="color" data-default="#3D9DFF">
   ```
3. **Auto-scan HTML** → Generate base schema
4. **Refine schema** → Add validation, UI hints, formats
5. **Save schema** → System auto-generates:
   - Form UI (`SchemaForm`)
   - Validation (Zod)
   - Renderer logic
   - Route registration

### Using a Template

1. User visits `/templates/{family}/create`
2. System loads schema from `templates/{family}/schema.ts`
3. `SchemaForm` generates UI from schema
4. User fills form → Validates against schema
5. Submit → Data stored
6. Render → Uses schema's `template.replacements` to map data to HTML

---

## Schema Definition Format

### Field Types

```typescript
type FieldType = 
  | "string"
  | "color" 
  | "date"
  | "time"
  | "number"
  | "boolean"
  | "array"
  | "object"
  | "image"
  | "file"
  | "select"      // Dropdown
  | "textarea"   // Multi-line text
  | "richText"   // Future: Rich text editor
```

### Field Structure

```typescript
interface SchemaField {
  // Identity
  name: string
  type: FieldType
  title: string
  description?: string
  
  // Validation
  validation?: {
    required?: boolean
    min?: number
    max?: number
    pattern?: string
    custom?: (value: any) => boolean | string
  }
  
  // UI Generation
  ui?: {
    component?: string        // Override default component
    placeholder?: string
    options?: any             // Component-specific options
    layout?: "inline" | "block"
    group?: string            // Group fields together
  }
  
  // Template Mapping
  template?: {
    replacements: Array<{
      pattern: string         // What to replace in HTML
      selector?: string       // CSS selector (if using DOM manipulation)
      type?: "text" | "color" | "attribute"
      regex?: boolean         // Use regex pattern
    }>
  }
  
  // Nested fields (for array/object)
  of?: SchemaField[]         // Array items
  fields?: SchemaField[]     // Object properties
}
```

---

## Migration Path

### Phase 1: Schema System (Current → Schema)
- Keep existing `config.json` system
- Add parallel `schema.ts` support
- Gradually migrate templates to schema format
- Both systems work simultaneously

### Phase 2: Auto-Generation
- Build `schema-to-ui.ts` generator
- Build `schema-to-renderer.ts` generator
- Replace `DynamicForm` with `SchemaForm`
- Replace manual renderer with schema-driven renderer

### Phase 3: Template Builder Dashboard
- Build admin UI for schema editing
- Add HTML scanner for auto-detection
- Visual field builder
- Export/import schemas

### Phase 4: Advanced Features
- Conditional fields (show/hide based on other fields)
- Field dependencies
- Custom field types
- Template preview in dashboard
- Version control for schemas

---

## Benefits

1. **No Code Changes**: Add template = create schema file
2. **Type Safety**: TypeScript schemas catch errors at compile time
3. **Consistency**: All templates use same UI generation logic
4. **Maintainability**: Single source of truth (schema)
5. **Extensibility**: Easy to add new field types
6. **Developer Experience**: Auto-completion, validation, preview

---

## Example: Adding New Template

**Current System** (Manual):
1. Create `config.json` (manual)
2. Create form component (manual)
3. Update renderer logic (manual)
4. Create route (manual)
5. Update templates page (manual)

**Schema System** (Automatic):
1. Create `schema.ts` file
2. Done! ✅
   - Form auto-generated
   - Renderer auto-generated
   - Route auto-registered
   - Templates page auto-updated

---

## Technical Considerations

### Performance
- Schema caching (already in registry)
- Lazy loading of field components
- Code splitting per template

### Validation
- Schema validation at build time
- Runtime validation in forms
- Type checking with TypeScript

### Backwards Compatibility
- Support both `config.json` and `schema.ts` during migration
- Auto-convert `config.json` → `schema.ts` tool

### Extensibility
- Plugin system for custom field types
- Custom UI components per field
- Custom renderer logic per field type

---

## Implementation Priority

1. **Schema Definition System** (Foundation)
   - TypeScript schema types
   - Schema registry
   - Schema validation

2. **UI Generation** (Core Feature)
   - Schema → Zod conversion
   - Schema → Form components
   - Basic field types (string, color, date, array)

3. **Renderer Generation** (Core Feature)
   - Schema → Replacement rules
   - Auto-generate renderer from schema

4. **Template Builder Dashboard** (Future Enhancement)
   - Visual editor
   - HTML scanner
   - Live preview

---

## Key Differences from Current System

| Current (Config) | Schema System |
|-----------------|---------------|
| JSON config | TypeScript schema |
| Manual form components | Auto-generated forms |
| Manual renderer logic | Auto-generated renderer |
| Field definitions separate | UI + validation + template in one place |
| Static | Dynamic & extensible |

---

This architecture provides a solid foundation for a Sanity.io-like system where schemas drive everything.

