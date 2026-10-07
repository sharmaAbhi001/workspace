import { Faq } from "../components/Faq"
import { FeatureSpotlights } from "../components/FeatureSpotlights"
import { FeaturesGrid } from "../components/FeaturesGrid"
import { FinalCta } from "../components/FinalCta"
import { Footer } from "../components/Footer"
import { Hero } from "../components/Hero"
import { HowItWorks } from "../components/HowItWorks"
import { Navbar } from "../components/Navbar"
import { Security } from "../components/Security"

export function LandingPage() {
  return (
    <div className="min-h-svh bg-background">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <FeaturesGrid />
        <FeatureSpotlights />
        <Security />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}
