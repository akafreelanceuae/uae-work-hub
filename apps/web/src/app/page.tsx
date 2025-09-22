import { Layout } from '@/components/layout/layout'
import { Hero } from '@/components/sections/hero'

export default function HomePage() {
  return (
    <Layout showHeader={false}>
      <Hero />
    </Layout>
  )
}
