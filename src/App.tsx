import { CartProvider } from './cart/CartContext';
import { CartDrawer } from './components/CartDrawer';
import { Configurator } from './components/Configurator';
import { Hero } from './components/Hero';
import { Nav } from './components/Nav';
import { Close, Delivery, Details, Footer, Movement, Profile, Workshop } from './components/Sections';

export default function App() {
  return (
    <CartProvider>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Nav />
      <main id="main">
        <Hero />
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
    </CartProvider>
  );
}
