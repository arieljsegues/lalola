import SiteHeader from "@/components/layout/SiteHeader";
import Hero from "@/components/sections/Hero";
import MenuSection from "@/components/sections/MenuSection";
import AboutSection from "@/components/sections/AboutSection";
import ContactSection from "@/components/sections/ContactSection";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <MenuSection />
        <AboutSection />
        <ContactSection />
      </main>
    </>
  );
}