import { Footer } from "./Footer";
import { Header, MobileBookingBar } from "./Header";

export function SiteShell({ children, overlay = false, bookingBar = true }: { children: React.ReactNode; overlay?: boolean; bookingBar?: boolean }) {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-graphite focus:px-4 focus:py-2 focus:text-ivory">К содержимому</a>
      <Header overlay={overlay} />
      <main id="main" className={overlay ? "" : "pt-16 md:pt-20"}>{children}</main>
      <Footer />
      {bookingBar && <MobileBookingBar />}
    </>
  );
}
