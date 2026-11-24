import { CartProvider } from './cart/CartContext';
import { BackToTop } from './components/BackToTop';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutPage } from './components/CheckoutPage';
import { Configurator } from './components/Configurator';
import { Hero } from './components/Hero';
import { Showcase3D } from './components/Showcase3D';
import { Nav } from './components/Nav';
import { Delivery } from './components/Delivery';
import { Close, Details, Footer, Movement, Profile } from './components/Sections';
import { Workshop } from './components/Workshop';
import { useRoute } from './lib/route';
import { useScrollReveal } from './lib/useScrollReveal';

export default function App() {
  const route = useRoute();
  return <CartProvider>{route === 'checkout' ? <CheckoutPage /> : <Shop />}</CartProvider>;
}

function Shop() {
  useScrollReveal();
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Nav />
      <main id="main">
        <Hero />
        <Showcase3D />
        <Configurator />
        <Details />
        <Profile />
        <Movement />
        <Workshop />
        <Delivery />
        <Close />
      </main>
      <Footer />
      <BackToTop />
      <CartDrawer />
    </>
  );
}
