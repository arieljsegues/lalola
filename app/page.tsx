import SiteHeader from "@/app/components/layout/SiteHeader";
import Hero from "@/app/components/sections/Hero";
import MenuSection from "@/app/components/sections/MenuSection";
import AboutSection from "@/app/components/sections/AboutSection";
import ContactSection from "@/app/components/sections/ContactSection";

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