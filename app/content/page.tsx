'use client'

import { useEffect, useState } from 'react'
import { ContentIngestion } from '@/components/content/content-ingestion'
import { ContentList } from '@/components/content/content-list'
import { CategoryManager } from '@/components/content/category-manager'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function ContentPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">Content Management</h1>

      <Tabs defaultValue="ingest" className="space-y-8">
        <TabsList>
          <TabsTrigger value="ingest">Ingest Content</TabsTrigger>
          <TabsTrigger value="manage">Manage Content</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="ingest">
          <ContentIngestion />
        </TabsContent>

        <TabsContent value="manage">
          <ContentList />
        </TabsContent>

        <TabsContent value="categories">
          <CategoryManager />
        </TabsContent>
      </Tabs>
    </div>
  )
} 