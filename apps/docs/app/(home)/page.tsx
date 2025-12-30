import Hero from "@/components/hero";
import Footer from "@/components/footer";
import Features from "@/components/features";
import StructuredData from "@/components/structured-data";

export default function HomePage() {
  return (
    <main>
      <StructuredData type="organization" />
      <StructuredData type="software" />
      <StructuredData type="faq" />
      <Hero />
      <Features />
      <Footer />
    </main>
  );
}
