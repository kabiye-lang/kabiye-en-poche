import type { CoreLayoutProps } from 'react-admin'

import { Error } from 'react-admin'
import { ErrorBoundary } from 'react-error-boundary'

import Header from '@/components/header'
import { useRequireAdmin } from '@/hooks/use-require-admin'

const Layout = (props: CoreLayoutProps) => {
  const { children } = props
  // Every admin page renders inside this layout, so the role check sits here, not on one page.
  const access = useRequireAdmin()

  if (access === 'error') {
    return <p className="p-8 text-center">Could not check your access. Reload the page.</p>
  }
  if (access === 'hide') {
    return null
  }

  return (
    <>
      <Header />
      <div className="container mx-auto pt-16 pb-8">
        <main id="main-content">
          <ErrorBoundary FallbackComponent={Error}>{children}</ErrorBoundary>
        </main>
      </div>
    </>
  )
}

export default Layout
