import { createBrowserRouter } from 'react-router-dom'
import { RootLayout } from '@/components/layout/RootLayout'
import { HomePage } from '@/pages/HomePage'
import { ProjectPage } from '@/pages/ProjectPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { BuildingInteriorPage } from '@/pages/BuildingInteriorPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'work/:slug', element: <ProjectPage /> },
      { path: 'building/:buildingId', element: <BuildingInteriorPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
