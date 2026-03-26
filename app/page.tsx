import { CTASection } from '../components/landing/cta-section'
import { DashboardPreview } from '../components/landing/DashboardPreview'
import FAQSection from '../components/landing/FAQSection'
import { FeaturesSection } from '../components/landing/features-section'
import { Footer } from '../components/landing/footer'
import HeroSection from '../components/landing/hero-section'
import { LandingFinanceSection } from '../components/landing/LandingFinanceSection'
import { Navbar } from '../components/landing/navbar'

export default function HomePage() {
  return (
    <main className='flex min-h-screen flex-col bg-background font-serif'>
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <LandingFinanceSection />
      <DashboardPreview />
      <FAQSection />
      <CTASection />
      <Footer />
    </main>
  )
}
