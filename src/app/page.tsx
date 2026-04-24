import Navigation from "@/components/Navigation";
import ScrollProgress from "@/components/ui/ScrollProgress";
import Hero from "@/components/sections/Hero";
import Experience from "@/components/sections/Experience";
import Projects from "@/components/sections/Projects";
import GetInTouch from "@/components/sections/GetInTouch";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <ScrollProgress />
      <Navigation />
      <main>
        <Hero />
        <Experience />
        <Projects />
        <GetInTouch />
      </main>
      <Footer />
    </>
  );
}
