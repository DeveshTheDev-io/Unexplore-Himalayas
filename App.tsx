/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Ticket, Mountain, Compass, Tent, MapPin, Menu, X, Calendar, Play, ChevronLeft, ChevronRight, CloudSun, ArrowUp, Lock, PlusCircle, User as UserIcon, Heart } from 'lucide-react';
import FluidBackground from './components/FluidBackground';
import GradientText from './components/GlitchText';
import CustomCursor from './components/CustomCursor';
import DestinationCard from './components/ArtistCard';
import BookingModal from './components/BookingModal';
import AdminPanel from './components/AdminPanel';
import AuthModal from './components/AuthModal';
import UserDashboard from './components/UserDashboard';
import { Destination, Package, User } from './types';
import { getDestinations } from './services/destinationService';
import { getPackages } from './services/packageService';
import { onAuthStateChange } from './services/authService';
import { toggleWishlist, getWishlist } from './services/customerService';

const App: React.FC = () => {
  const { scrollYProgress, scrollY } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Data State
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  
  const [packages, setPackages] = useState<Package[]>([]);
  const [visiblePackages, setVisiblePackages] = useState(3);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // User State
  const [user, setUser] = useState<User | null>(null);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());

  // Modal States
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedBookingPackage, setSelectedBookingPackage] = useState<string | undefined>(undefined);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserDashboardOpen, setIsUserDashboardOpen] = useState(false);

  const [showScrollTop, setShowScrollTop] = useState(false);

  // Fetch Data & Listen for Auth
  useEffect(() => {
    const loadData = async () => {
      setIsDataLoading(true);
      const [destData, pkgData] = await Promise.all([
        getDestinations(),
        getPackages()
      ]);
      setDestinations(destData);
      setPackages(pkgData);
      setIsDataLoading(false);
    };
    loadData();

    // Auth Subscription
    const { data: { subscription } } = onAuthStateChange(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Load wishlist
        const wData = await getWishlist(currentUser.id);
        setWishlistIds(new Set(wData.map(w => w.package_id)));
      } else {
        setWishlistIds(new Set());
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle scroll to top visibility
  useEffect(() => {
    return scrollY.on('change', (latest) => {
      setShowScrollTop(latest > window.innerHeight * 0.5);
    });
  }, [scrollY]);

  // Handle keyboard navigation for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedDestination) return;
      if (e.key === 'ArrowLeft') navigateDestination('prev');
      if (e.key === 'ArrowRight') navigateDestination('next');
      if (e.key === 'Escape') setSelectedDestination(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDestination]);

  const handleBookNow = (packageName?: string) => {
    setSelectedBookingPackage(packageName);
    setIsBookingModalOpen(true);
    setMobileMenuOpen(false);
  };

  const handleWishlistToggle = async (pkgId: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    // Optimistic UI update
    const newSet = new Set(wishlistIds);
    if (newSet.has(pkgId)) {
      newSet.delete(pkgId);
    } else {
      newSet.add(pkgId);
    }
    setWishlistIds(newSet);

    // Server update
    const added = await toggleWishlist(user.id, pkgId);
    // If backend state differs from optimistic, we could correct it here, 
    // but toggleWishlist logic mirrors this.
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const navigateDestination = (direction: 'next' | 'prev') => {
    if (!selectedDestination || destinations.length === 0) return;
    const currentIndex = destinations.findIndex(a => a.id === selectedDestination.id);
    let nextIndex;
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % destinations.length;
    } else {
      nextIndex = (currentIndex - 1 + destinations.length) % destinations.length;
    }
    setSelectedDestination(destinations[nextIndex]);
  };
  
  return (
    <div className="relative min-h-screen text-white selection:bg-[#4fb7b3] selection:text-black cursor-auto md:cursor-none overflow-x-hidden">
      <CustomCursor />
      <FluidBackground />
      
      {/* Booking Modal */}
      <AnimatePresence>
        {isBookingModalOpen && (
          <BookingModal 
            isOpen={isBookingModalOpen}
            onClose={() => setIsBookingModalOpen(false)}
            initialPackage={selectedBookingPackage}
            availablePackages={packages.map(p => p.name)}
            currentUser={user}
          />
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <AuthModal 
            isOpen={isAuthModalOpen} 
            onClose={() => setIsAuthModalOpen(false)}
            onSuccess={() => setIsAuthModalOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* User Dashboard */}
      <AnimatePresence>
        {isUserDashboardOpen && user && (
          <UserDashboard
             isOpen={isUserDashboardOpen}
             onClose={() => setIsUserDashboardOpen(false)}
             user={user}
             onLogout={() => { setUser(null); setIsUserDashboardOpen(false); }}
             onBook={handleBookNow}
          />
        )}
      </AnimatePresence>

      {/* Admin Panel */}
      <AnimatePresence>
        {isAdminPanelOpen && (
          <AdminPanel 
            isOpen={isAdminPanelOpen}
            onClose={() => setIsAdminPanelOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Scroll To Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-6 left-6 z-40 p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white hover:text-black transition-colors shadow-lg group"
            data-hover="true"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>
      
      {/* Scroll Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#a8fbd3] to-[#4fb7b3] origin-left z-[55]"
        style={{ scaleX: scrollYProgress }} 
      />
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 md:px-8 py-6 mix-blend-difference">
        <div className="font-heading text-xl md:text-2xl font-bold tracking-tighter text-white cursor-default z-50">UNEXPLORE</div>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex gap-10 text-sm font-bold tracking-widest uppercase items-center">
          {['Destinations', 'Experience', 'Packages'].map((item) => (
            <button 
              key={item} 
              onClick={() => scrollToSection(item.toLowerCase())}
              className="hover:text-[#a8fbd3] transition-colors text-white cursor-pointer bg-transparent border-none drop-shadow-md"
              data-hover="true"
            >
              {item}
            </button>
          ))}
          
          {/* Auth Button */}
          {user ? (
             <button 
               onClick={() => setIsUserDashboardOpen(true)}
               className="flex items-center gap-2 hover:text-[#a8fbd3] transition-colors"
               data-hover="true"
             >
               <UserIcon className="w-4 h-4" /> My Profile
             </button>
          ) : (
             <button 
               onClick={() => setIsAuthModalOpen(true)}
               className="hover:text-[#a8fbd3] transition-colors"
               data-hover="true"
             >
               Log In
             </button>
          )}

        </div>
        <button 
          onClick={() => handleBookNow()}
          className="hidden md:inline-block border border-white px-8 py-3 text-xs font-bold tracking-widest uppercase hover:bg-white hover:text-black transition-all duration-300 text-white cursor-pointer bg-transparent shadow-[0_0_15px_rgba(0,0,0,0.3)] backdrop-blur-sm"
          data-hover="true"
        >
          Book Now
        </button>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden text-white z-50 relative w-10 h-10 flex items-center justify-center"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
           {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-30 bg-[#0a2e52]/95 backdrop-blur-xl flex flex-col items-center justify-center gap-8 md:hidden"
          >
            {['Destinations', 'Experience', 'Packages'].map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item.toLowerCase())}
                className="text-4xl font-heading font-bold text-white hover:text-[#a8fbd3] transition-colors uppercase bg-transparent border-none"
              >
                {item}
              </button>
            ))}
            
            {user ? (
              <button onClick={() => { setIsUserDashboardOpen(true); setMobileMenuOpen(false); }} className="text-2xl font-bold">My Profile</button>
            ) : (
              <button onClick={() => { setIsAuthModalOpen(true); setMobileMenuOpen(false); }} className="text-2xl font-bold">Log In</button>
            )}

            <button 
              onClick={() => handleBookNow()}
              className="mt-8 border border-white px-10 py-4 text-sm font-bold tracking-widest uppercase bg-white text-black"
            >
              Book Now
            </button>
            
            <div className="absolute bottom-10 flex gap-6 flex-col items-center">
               <div className="flex gap-6">
                 <a href="#" className="text-white/50 hover:text-white transition-colors">Instagram</a>
                 <a href="#" className="text-white/50 hover:text-white transition-colors">Twitter</a>
               </div>
               <a href="mailto:unexplorehimalayas@gmail.com" className="text-white/50 hover:text-white transition-colors">unexplorehimalayas@gmail.com</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO SECTION */}
      <header className="relative h-[100svh] min-h-[600px] flex flex-col items-center justify-center overflow-hidden px-4">
        <motion.div 
          style={{ y, opacity }}
          className="z-10 text-center flex flex-col items-center w-full max-w-6xl pb-24 md:pb-20"
        >
           {/* Date / Location - With enhanced contrast for bright background */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="flex items-center gap-3 md:gap-6 text-xs md:text-base font-mono text-[#a8fbd3] tracking-[0.2em] md:tracking-[0.3em] uppercase mb-4 bg-black/40 border border-white/10 px-6 py-2 rounded-full backdrop-blur-md shadow-lg"
          >
            <span>The Himalayas</span>
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[#4fb7b3] rounded-full animate-pulse"/>
            <span>Open All Season</span>
          </motion.div>

          {/* Main Title */}
          <div className="relative w-full flex justify-center items-center flex-col drop-shadow-2xl">
            <GradientText 
              text="UNEXPLORE" 
              as="h1" 
              className="text-[12vw] md:text-[10vw] leading-[0.9] font-black tracking-tighter text-center filter drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]" 
            />
             <GradientText 
              text="HIMALAYAS" 
              as="h1" 
              className="text-[10vw] md:text-[8vw] leading-[0.9] font-black tracking-tighter text-center mt-2 md:mt-4 filter drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]" 
            />
          </div>
          
          <motion.div
             initial={{ scaleX: 0 }}
             animate={{ scaleX: 1 }}
             transition={{ duration: 1.5, delay: 0.5, ease: "circOut" }}
             className="w-full max-w-md h-px bg-gradient-to-r from-transparent via-white to-transparent mt-4 md:mt-8 mb-6 md:mb-8 opacity-70"
          />

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="text-base md:text-2xl font-bold max-w-xl mx-auto text-white leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] px-4 tracking-wide"
          >
            A journey to the roof of the world
          </motion.p>
        </motion.div>

        {/* MARQUEE - With dark background for contrast at bottom */}
        <div className="absolute bottom-12 md:bottom-16 left-0 w-full py-4 md:py-6 bg-black text-white z-20 overflow-hidden border-y-4 border-white/20 shadow-2xl">
          <motion.div 
            className="flex w-fit will-change-transform"
            animate={{ x: "-50%" }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          >
            {/* Duplicate content for seamless loop */}
            {[0, 1].map((key) => (
              <div key={key} className="flex whitespace-nowrap shrink-0">
                {[...Array(4)].map((_, i) => (
                  <span key={i} className="text-3xl md:text-7xl font-heading font-black px-8 flex items-center gap-4 text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
                    ADVENTURE AWAITS <span className="text-[#4fb7b3] text-2xl md:text-4xl">●</span> 
                    SPIRITUAL JOURNEY <span className="text-[#4fb7b3] text-2xl md:text-4xl">●</span> 
                    NATURE'S GRANDEUR <span className="text-[#4fb7b3] text-2xl md:text-4xl">●</span>
                  </span>
                ))}
              </div>
            ))}
          </motion.div>
        </div>
      </header>

      {/* DESTINATIONS SECTION */}
      <section id="destinations" className="relative z-10 py-20 md:py-32">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 md:mb-16 px-4">
             <h2 className="text-5xl md:text-8xl font-heading font-bold uppercase leading-[0.9] drop-shadow-lg break-words w-full md:w-auto">
              Majestic <br/> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a8fbd3] to-[#4fb7b3]">Peaks</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-white/10 bg-black/40 backdrop-blur-md min-h-[500px]">
            {isDataLoading ? (
              <div className="col-span-full flex items-center justify-center p-20 text-gray-500 animate-pulse">
                 Loading Destinations...
              </div>
            ) : destinations.length > 0 ? (
              destinations.map((dest) => (
                <DestinationCard key={dest.id} destination={dest} onClick={() => setSelectedDestination(dest)} />
              ))
            ) : (
              <div className="col-span-full flex items-center justify-center p-20 text-gray-500">
                 No destinations found.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* EXPERIENCE SECTION */}
      <section id="experience" className="relative z-10 py-20 md:py-32 bg-black/40 backdrop-blur-md border-t border-white/10 overflow-hidden">
        {/* Decorative blurred circle - Optimized */}
        <div className="absolute top-1/2 right-[-20%] w-[50vw] h-[50vw] bg-[#4fb7b3]/20 rounded-full blur-[40px] pointer-events-none will-change-transform" style={{ transform: 'translateZ(0)' }} />

        <div className="max-w-7xl mx-auto px-4 md:px-6 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-16 items-center">
            {/* Text Side - Increased span, added z-index to stay on top */}
            <div className="lg:col-span-6 order-2 lg:order-1 relative z-20">
              <h2 className="text-4xl md:text-7xl font-heading font-bold mb-6 md:mb-8 leading-tight">
                Beyond <br/> 
                {/* Adjusted font sizes to fit better: text-5xl on mobile, 7xl on tablet/lg, 8xl on xl */}
                <GradientText text="IMAGINATION" className="text-5xl md:text-7xl xl:text-8xl" />
              </h2>
              <p className="text-lg md:text-xl text-gray-200 mb-8 md:mb-12 font-light leading-relaxed drop-shadow-md">
                Unexplore Himalayas isn't just a travel agency; it's a gateway to the unknown. We curate experiences that blend adrenaline, spirituality, and raw nature.
              </p>
              
              <div className="space-y-6 md:space-y-8">
                {[
                  { icon: Mountain, title: 'High Altitude Trekking', desc: 'Conquer heights above 14,000ft with expert sherpas.' },
                  { icon: Tent, title: 'Luxury Camping', desc: 'Sleep under the Milky Way in premium glamping sites.' },
                  { icon: Compass, title: 'Off-beat Paths', desc: 'Discover hidden villages and ancient cultures.' },
                ].map((feature, i) => (
                  <div
                    key={i} 
                    className="flex items-start gap-6"
                  >
                    <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/5">
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg md:text-xl font-bold mb-1 md:mb-2 font-heading">{feature.title}</h4>
                      <p className="text-sm text-gray-300">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Image Side - Reduced span */}
            <div className="lg:col-span-6 relative h-[400px] md:h-[700px] w-full order-1 lg:order-2">
              <div className="absolute inset-0 bg-gradient-to-br from-[#637ab9] to-[#4fb7b3] rounded-3xl rotate-3 opacity-30 blur-xl" />
              <div className="relative h-full w-full rounded-3xl overflow-hidden border border-white/10 group shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&q=80&w=1200" 
                  alt="Himalayan Landscape" 
                  className="h-full w-full object-cover transition-transform duration-[1.5s] group-hover:scale-110 will-change-transform" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                
                <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10">
                  <div className="text-5xl md:text-8xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/0 opacity-50">
                    24/7
                  </div>
                  <div className="text-lg md:text-xl font-bold tracking-widest uppercase mt-2 text-white">
                    Support on Ground
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PACKAGES SECTION */}
      <section id="packages" className="relative z-10 py-20 md:py-32 px-4 md:px-6 bg-black/60 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-20">
             <h2 className="text-4xl md:text-8xl font-heading font-bold opacity-30 text-white">
               PACKAGES
             </h2>
             <p className="text-[#a8fbd3] font-mono uppercase tracking-widest -mt-3 md:-mt-8 relative z-10 text-sm md:text-base font-bold bg-black/50 inline-block px-4 py-1 rounded">
               Best Himalayas Tour Packages
             </p>
          </div>
          
          {isDataLoading ? (
            <div className="flex items-center justify-center p-20 text-gray-500 animate-pulse">
               Loading Packages...
            </div>
          ) : packages.length === 0 ? (
            <div className="flex items-center justify-center p-20 text-gray-500">
               No packages available.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {packages.slice(0, visiblePackages).map((pkg, i) => {
                  const inWishlist = wishlistIds.has(pkg.id);
                  return (
                    <motion.div
                      key={pkg.id || i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      whileHover={{ y: -20 }}
                      transition={{ duration: 0.5 }}
                      className={`relative p-8 md:p-10 border border-white/10 backdrop-blur-md flex flex-col min-h-[450px] md:min-h-[550px] transition-colors duration-300 ${pkg.accent} will-change-transform`}
                      data-hover="true"
                    >
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                      
                      {/* Wishlist Button */}
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleWishlistToggle(pkg.id); }}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors z-20"
                      >
                        <Heart className={`w-6 h-6 ${inWishlist ? 'fill-red-500 text-red-500' : 'text-white/50'}`} />
                      </button>

                      <div className="flex-1">
                        <h3 className="text-2xl md:text-3xl font-heading font-bold mb-4 text-white">{pkg.name}</h3>
                        <div className={`text-4xl md:text-5xl font-bold mb-8 md:mb-10 tracking-tighter ${pkg.color === 'white' ? 'text-white' : pkg.color === 'teal' ? 'text-[#4fb7b3]' : 'text-[#637ab9]'}`}>
                          {pkg.price}
                        </div>
                        <ul className="space-y-4 md:space-y-6 text-sm text-gray-200">
                          {pkg.features.map((feature, fIdx) => (
                            <li key={fIdx} className="flex items-center gap-3">
                              {/* Alternate icons based on index for variety */}
                              {fIdx === 0 ? <Calendar className="w-5 h-5 text-gray-400" /> : 
                                fIdx === 1 ? <Ticket className="w-5 h-5 text-gray-400" /> :
                                <MapPin className="w-5 h-5 text-gray-400" />
                              }
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <button 
                        onClick={() => handleBookNow(pkg.name)}
                        className={`w-full py-4 text-sm font-bold uppercase tracking-[0.2em] border border-white/20 transition-all duration-300 mt-8 group overflow-hidden relative text-white cursor-pointer hover:bg-white hover:text-black`}
                      >
                        <span className="relative z-10">
                          Book Now
                        </span>
                        <div className="absolute inset-0 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 ease-out -z-0" />
                      </button>
                    </motion.div>
                  );
                })}
              </div>

              {/* Load More Button */}
              {visiblePackages < packages.length && (
                <div className="mt-16 flex justify-center">
                  <button 
                    onClick={() => setVisiblePackages(prev => prev + 3)}
                    className="group flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/20 rounded-full hover:bg-white/10 transition-all hover:scale-105"
                    data-hover="true"
                  >
                    <PlusCircle className="w-5 h-5 text-[#4fb7b3] group-hover:rotate-90 transition-transform" />
                    <span className="text-sm font-bold uppercase tracking-widest text-white">View More Packages</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 py-12 md:py-16 bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div>
             <div className="font-heading text-3xl md:text-4xl font-bold tracking-tighter mb-4 text-white">UNEXPLORE HIMALAYAS</div>
             <div className="flex gap-2 text-xs font-mono text-gray-400 items-center">
               <span>Made for adventurers</span>
               {/* ADMIN TRIGGER */}
               <button 
                onClick={() => setIsAdminPanelOpen(true)}
                className="ml-2 opacity-10 hover:opacity-50 transition-opacity"
               >
                 <Lock className="w-3 h-3" />
               </button>
             </div>
          </div>
          
          <div className="flex gap-6 md:gap-8 flex-wrap">
            <a href="#" className="text-gray-400 hover:text-white font-bold uppercase text-xs tracking-widest transition-colors cursor-pointer" data-hover="true">
              Instagram
            </a>
            <a href="#" className="text-gray-400 hover:text-white font-bold uppercase text-xs tracking-widest transition-colors cursor-pointer" data-hover="true">
              Twitter
            </a>
            <a href="mailto:unexplorehimalayas@gmail.com" className="text-gray-400 hover:text-white font-bold uppercase text-xs tracking-widest transition-colors cursor-pointer" data-hover="true">
              Contact Us
            </a>
          </div>
        </div>
      </footer>

      {/* Destination Detail Modal */}
      <AnimatePresence>
        {selectedDestination && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedDestination(null)}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md cursor-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-5xl bg-[#1a1b3b] border border-white/10 overflow-hidden flex flex-col md:flex-row shadow-2xl shadow-[#4fb7b3]/10 group/modal"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedDestination(null)}
                className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-white hover:text-black transition-colors"
                data-hover="true"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Navigation Buttons */}
              <button
                onClick={(e) => { e.stopPropagation(); navigateDestination('prev'); }}
                className="absolute left-4 bottom-4 translate-y-0 md:top-1/2 md:bottom-auto md:-translate-y-1/2 z-20 p-3 rounded-full bg-black/50 text-white hover:bg-white hover:text-black transition-colors border border-white/10 backdrop-blur-sm"
                data-hover="true"
                aria-label="Previous Destination"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); navigateDestination('next'); }}
                className="absolute right-4 bottom-4 translate-y-0 md:top-1/2 md:bottom-auto md:-translate-y-1/2 z-20 p-3 rounded-full bg-black/50 text-white hover:bg-white hover:text-black transition-colors border border-white/10 backdrop-blur-sm md:right-8"
                data-hover="true"
                aria-label="Next Destination"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              {/* Image Side */}
              <div className="w-full md:w-1/2 h-64 md:h-auto relative overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={selectedDestination.id}
                    src={selectedDestination.image} 
                    alt={selectedDestination.name} 
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1b3b] via-transparent to-transparent md:bg-gradient-to-r" />
              </div>

              {/* Content Side */}
              <div className="w-full md:w-1/2 p-8 pb-24 md:p-12 flex flex-col justify-center relative">
                <motion.div
                  key={selectedDestination.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <div className="flex items-center gap-3 text-[#4fb7b3] mb-4">
                     <CloudSun className="w-4 h-4" />
                     <span className="font-mono text-sm tracking-widest uppercase">{selectedDestination.season}</span>
                  </div>
                  
                  <h3 className="text-4xl md:text-6xl font-heading font-bold uppercase leading-none mb-2 text-white">
                    {selectedDestination.name}
                  </h3>
                  
                  <p className="text-lg text-[#a8fbd3] font-medium tracking-widest uppercase mb-6">
                    {selectedDestination.region}
                  </p>
                  
                  <div className="h-px w-20 bg-white/20 mb-6" />
                  
                  <p className="text-gray-300 leading-relaxed text-lg font-light mb-8">
                    {selectedDestination.description}
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;