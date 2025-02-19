Directory structure:
└── marcus-w-hobbs-ai-sdk-preview-rag/
    ├── README.md
    ├── LICENSE
    ├── components.json
    ├── drizzle.config.ts
    ├── next.config.mjs
    ├── package.json
    ├── postcss.config.mjs
    ├── project-structure.md
    ├── requirements.txt
    ├── tailwind.config.ts
    ├── tsconfig.json
    ├── .env.example
    ├── .eslintrc.json
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── api/
    │   │   ├── categories/
    │   │   │   └── route.ts
    │   │   ├── content/
    │   │   │   ├── route.ts
    │   │   │   └── [id]/
    │   │   │       └── route.ts
    │   │   ├── ingest/
    │   │   │   ├── batch/
    │   │   │   │   └── route.ts
    │   │   │   ├── markdown/
    │   │   │   │   └── route.ts
    │   │   │   ├── pdf/
    │   │   │   │   └── route.ts
    │   │   │   └── url/
    │   │   │       └── route.ts
    │   │   ├── resource/
    │   │   │   └── route.ts
    │   │   └── sources/
    │   │       └── route.ts
    │   ├── content/
    │   │   ├── layout.tsx
    │   │   └── page.tsx
    │   └── preview/
    │       ├── layout.tsx
    │       └── page.tsx
    ├── components/
    │   ├── icons.tsx
    │   ├── project-overview.tsx
    │   ├── content/
    │   │   ├── batch-upload.tsx
    │   │   ├── category-manager.tsx
    │   │   ├── category-select.tsx
    │   │   ├── content-ingestion.tsx
    │   │   ├── content-list.tsx
    │   │   ├── markdown-upload.tsx
    │   │   ├── pdf-upload.tsx
    │   │   ├── upload-zone.tsx
    │   │   └── url-form.tsx
    │   └── ui/
    │       ├── badge.tsx
    │       ├── button.tsx
    │       ├── dialog.tsx
    │       ├── dropdown-menu.tsx
    │       ├── input.tsx
    │       ├── label.tsx
    │       ├── loading-spinner.tsx
    │       ├── scroll-area.tsx
    │       ├── select.tsx
    │       ├── table.tsx
    │       ├── tabs.tsx
    │       └── textarea.tsx
    ├── extension/
    │   ├── background.ts
    │   ├── content.ts
    │   ├── manifest.json
    │   ├── popup.html
    │   ├── popup.ts
    │   └── tsconfig.json
    ├── lib/
    │   ├── env.mjs
    │   ├── utils.ts
    │   ├── actions/
    │   │   └── resources.ts
    │   ├── ai/
    │   │   └── embedding.ts
    │   ├── db/
    │   │   ├── extensions.ts
    │   │   ├── index.ts
    │   │   ├── migrate.ts
    │   │   ├── migrations/
    │   │   │   ├── 0000_init.sql
    │   │   │   ├── 0000_yielding_bloodaxe.sql
    │   │   │   ├── 0002_update_embeddings.sql
    │   │   │   └── meta/
    │   │   │       ├── 0000_snapshot.json
    │   │   │       └── _journal.json
    │   │   └── schema/
    │   │       ├── content.ts
    │   │       ├── embeddings.ts
    │   │       └── resources.ts
    │   ├── services/
    │   │   └── content-ingestion.ts
    │   ├── types/
    │   │   └── pdf-parse.d.ts
    │   └── validations/
    │       └── content.ts
    ├── public/
    └── .cursor/
        └── rules/
            ├── drizzle-orm-best-practices.mdc
            ├── general-coding-standards.mdc
            ├── nextjs-best-practices.mdc
            ├── openai-best-practices.mdc
            ├── radix-ui-best-practices.mdc
            ├── react-best-practices.mdc
            ├── tailwindcss-best-practices.mdc
            ├── typescript-best-practices.mdc
            └── zod-best-practices.mdc
