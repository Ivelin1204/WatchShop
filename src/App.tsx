import { CartProvider } from './cart/CartContext';
import { BackToTop } from './components/BackToTop';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutPage } from './components/CheckoutPage';
import { Configurator } from './components/Configurator';
import { Gallery } from './components/Gallery';
import { Hero } from './components/Hero';
import { Showcase3D } from './components/Showcase3D';
import { Nav } from './components/Nav';
import { Reviews } from './components/Reviews';
import { ScrollProgress } from './components/ScrollProgress';
import { Delivery } from './components/Delivery';
import { Close, Details, Footer, Movement, Profile } from './components/Sections';
import { Workshop } from './components/Workshop';
import { LangProvider, useI18n } from './i18n';
import { useRoute } from './lib/route';
import { useScrollReveal } from './lib/useScrollReveal';

export default function App() {
  const route = useRoute();
  return (
    <LangProvider>
      <CartProvider>{route === 'checkout' ? <CheckoutPage /> : <Shop />}</CartProvider>
    </LangProvider>
  );
}

function Shop() {
  useScrollReveal();
  const { t } = useI18n();
  return (
    <>
      <a className="skip" href="#main">
        {t.common.skip}
      </a>
      <ScrollProgress />
      <Nav />
      <main id="main">
        <Hero />
        <Showcase3D />
        <Gallery />
        <Configurator />
        <Details />
        <Profile />
        <Movement />
        <Workshop />
        <Reviews />
        <Delivery />
        <Close />
      </main>
      <Footer />
      <BackToTop />
      <CartDrawer />
    </>
  );
}
