import { CartProvider } from './cart/CartContext';
import { CartDrawer } from './components/CartDrawer';
import { Configurator } from './components/Configurator';
import { Hero } from './components/Hero';
import { Showcase3D } from './components/Showcase3D';
import { Nav } from './components/Nav';
import { Close, Delivery, Details, Footer, Movement, Profile, Workshop } from './components/Sections';
import { useScrollReveal } from './lib/useScrollReveal';

export default function App() {
  return (
    <CartProvider>
      <Page />
    </CartProvider>
  );
}

function Page() {
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
      <CartDrawer />
    </>
  );
}
