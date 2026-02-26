import type { CoreLayoutProps } from 'react-admin'

import { Error } from 'react-admin'
import { ErrorBoundary } from 'react-error-boundary'

import Header from '@/components/header'

const Layout = (props: CoreLayoutProps) => {
  const { children } = props

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
