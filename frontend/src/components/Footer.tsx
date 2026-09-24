export default function Footer() {
  return (
    <>
      <footer className="bg-[#FAF8F5] text-[#333333]">
        
        {/* Full-width Email Subscription Banner with Oxblood Background */}
        <div className="bg-[#4A0E17] text-white py-6 sm:py-8 border-b border-[#360910]">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-14 text-center md:text-left">
            
            {/* Title */}
            <span className="font-sans-clean text-[11px] sm:text-xs font-light tracking-[0.10em] text-[#FDFBFA]">
              Enter Into The World of Mangesh Mahadev
            </span>
      
            {/* Input Form with Underline & Submit Arrow */}
            <form className="flex items-center w-full sm:w-auto min-w-[280px] sm:min-w-[340px] border-b border-white/70 focus-within:border-white transition-colors pb-1">
              <input
                type="email"
                placeholder="Enter Your Email Here"
                required
                className="bg-transparent text-white placeholder-white/60 text-xs sm:text-[13px] focus:outline-none w-full tracking-wider font-light"
              />
              <button
                type="submit"
                className="text-white hover:text-[#E6C69C] transition px-2 text-sm font-light flex items-center justify-center"
                aria-label="Subscribe"
              >
                &rarr;
              </button>
            </form>
      
          </div>
        </div>
      
        {/* Main Footer Sitemap & Links on Clean Ivory Background */}
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pt-14 pb-12">
          
          {/* 5-Column Sitemap Navigation */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-14 text-xs">
            
            {/* Col 1: CUSTOMER CARE */}
            <div className="space-y-3">
              <h4 className="font-sans-clean text-[10px] text-[#333333] tracking-[0.18em] uppercase font-semibold">CUSTOMER CARE</h4>
              <ul className="space-y-2 font-light text-[#333333]">
                <li><a href="/account" className="hover:text-[#4A0E17] transition">Orders & Shipment</a></li>
                <li><a href="#" className="hover:text-[#4A0E17] transition">Returns & Exchange</a></li>
                <li><a href="#bespoke-appointment" className="hover:text-[#4A0E17] transition">Contact Us</a></li>
                <li><a href="#" className="hover:text-[#4A0E17] transition">FAQs</a></li>
                <li><a href="#" className="hover:text-[#4A0E17] transition">Check Gift Card Balance</a></li>
              </ul>
            </div>
      
            {/* Col 2: ABOUT US */}
            <div className="space-y-3">
              <h4 className="font-sans-clean text-[10px] text-[#333333] tracking-[0.18em] uppercase font-semibold">ABOUT US</h4>
              <ul className="space-y-2 font-light text-[#333333]">
                <li><a href="#about-house" className="hover:text-[#4A0E17] transition">Mangesh Mahadev Foundation</a></li>
                <li><a href="#about-house" className="hover:text-[#4A0E17] transition">Sustainability</a></li>
                <li><a href="/careers" className="hover:text-[#4A0E17] transition">Careers</a></li>
                <li><a href="#celebs" className="hover:text-[#4A0E17] transition">Celebrity Archives</a></li>
                <li><a href="#lookbook" className="hover:text-[#4A0E17] transition">Runway FW'26</a></li>
              </ul>
            </div>
      
            {/* Col 3: CATEGORIES */}
            <div className="space-y-3">
              <h4 className="font-sans-clean text-[10px] text-[#333333] tracking-[0.18em] uppercase font-semibold">CATEGORIES</h4>
              <ul className="space-y-2 font-light text-[#333333]">
                <li><a href="#sherwanis" className="hover:text-[#4A0E17] transition">Royal Sherwanis</a></li>
                <li><a href="#bandhgalas" className="hover:text-[#4A0E17] transition">Imperial Bandhgalas</a></li>
                <li><a href="#kurtas" className="hover:text-[#4A0E17] transition">Kurtas & Shirts</a></li>
                <li><a href="#nehru-jackets" className="hover:text-[#4A0E17] transition">Nehru Jackets</a></li>
                <li><a href="#accessories" className="hover:text-[#4A0E17] transition">Safas & Accessories</a></li>
              </ul>
            </div>
      
            {/* Col 4: LEGAL */}
            <div className="space-y-3">
              <h4 className="font-sans-clean text-[10px] text-[#333333] tracking-[0.18em] uppercase font-semibold">LEGAL</h4>
              <ul className="space-y-2 font-light text-[#333333]">
                <li><a href="#" className="hover:text-[#4A0E17] transition">Corporate Information</a></li>
                <li><a href="#" className="hover:text-[#4A0E17] transition">Terms & Conditions</a></li>
                <li><a href="#" className="hover:text-[#4A0E17] transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[#4A0E17] transition">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-[#4A0E17] transition">Shipping Policy</a></li>
              </ul>
            </div>
      
            {/* Col 5: NEED HELP? (Clean Constrained Vector SVGs) */}
            <div className="space-y-3 col-span-2 sm:col-span-1">
              <h4 className="font-sans-clean text-[10px] text-[#333333] tracking-[0.18em] uppercase font-semibold">NEED HELP?</h4>
              <ul className="space-y-3 font-light text-[#333333]">
                <li>
                  <a href="#bespoke-appointment" className="flex items-center gap-2 hover:text-[#4A0E17] transition">
                    <svg className="w-4 h-4 text-gray-700 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    <span>Store Locator</span>
                  </a>
                </li>
                <li>
                  <a href="mailto:care@shrutimangesh.com" className="flex items-center gap-2 hover:text-[#4A0E17] transition">
                    <svg className="w-4 h-4 text-gray-700 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                    <span>Email Us</span>
                  </a>
                </li>
                <li>
                  <a href="tel:+919999313366" className="flex items-center gap-2 hover:text-[#4A0E17] transition">
                    <svg className="w-4 h-4 text-gray-700 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24 11.72 11.72 0 003.68.59 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.72 11.72 0 00.59 3.68 1 1 0 01-.24 1.02l-2.23 2.09z" />
                    </svg>
                    <span>WhatsApp / Call Us: +91 99993 13366</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center gap-2 hover:text-[#4A0E17] transition">
                    <svg className="w-4 h-4 text-gray-700 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                    <span>Sitemap</span>
                  </a>
                </li>
              </ul>
            </div>
      
          </div>
      
          {/* Footer Secondary: Copyright & Social Vector Icons */}
          <div className="pt-6 border-t border-[#EAE3DB] flex flex-col md:flex-row justify-between items-center text-[11px] text-[#333333] gap-4">
            <div>
              © {new Date().getFullYear()} House of Mangesh Mahadev Private Limited. | All Rights Reserved.
            </div>
            <div className="flex items-center gap-4 text-gray-700">
              {/* FB */}
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#4A0E17] transition" aria-label="Facebook">
                <svg className="w-4 h-4 fill-current shrink-0" width="16" height="16" viewBox="0 0 24 24">
                  <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.595 0 9 1.583 9 4.615V8z" />
                </svg>
              </a>
      
              {/* IG */}
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#4A0E17] transition" aria-label="Instagram">
                <svg className="w-4 h-4 fill-current shrink-0" width="16" height="16" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
      
              {/* YT */}
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#4A0E17] transition" aria-label="YouTube">
                <svg className="w-4 h-4 fill-current shrink-0" width="16" height="16" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
      
              {/* Pinterest */}
              <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#4A0E17] transition" aria-label="Pinterest">
                <svg className="w-4 h-4 fill-current shrink-0" width="16" height="16" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
                </svg>
              </a>
            </div>
          </div>
      
          {/* Legal Notice */}
          <div className="pt-4 text-center text-[9px] text-[#333333] font-light tracking-[0.08em]">
            By continuing, I agree to Mangesh Mahadev <a href="#" className="underline hover:text-[#4A0E17]">Privacy Policy</a> and <a href="#" className="underline hover:text-[#4A0E17]">Terms of use</a>
          </div>
      
        </div>
      </footer>
      
      
    </>
  );
}
