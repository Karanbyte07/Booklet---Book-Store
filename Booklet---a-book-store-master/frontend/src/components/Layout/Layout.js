import { useEffect, useRef, useState } from "react";
import Footer from "./Footer";
import Header from "./Header";
import { Toaster } from "react-hot-toast";
import { useLocation } from "react-router-dom";

const Layout = ({ children }) => {
  const location = useLocation();
  const pageShellRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const hideFooterOnAdminPages = location.pathname.startsWith("/dashboard/admin");

  useEffect(() => {
    let rafId = null;

    const updateProgress = () => {
      const maxScrollableHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const nextProgress =
        maxScrollableHeight > 0 ? window.scrollY / maxScrollableHeight : 0;
      setScrollProgress(Math.min(Math.max(nextProgress, 0), 1));
    };

    const handleScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        updateProgress();
        rafId = null;
      });
    };

    updateProgress();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [location.pathname]);

  useEffect(() => {
    const pageShell = pageShellRef.current;
    if (!pageShell) return undefined;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const revealSelectors = [
      "[data-fx='reveal']",
      "section",
      ".catalog-grid > *",
      ".responsive-card-grid > *",
      ".card",
    ].join(", ");

    if (prefersReducedMotion) {
      pageShell.querySelectorAll(revealSelectors).forEach((element) => {
        element.classList.add("fx-reveal-in");
      });
      return undefined;
    }

    const seenElements = new WeakSet();
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("fx-reveal-in");
          revealObserver.unobserve(entry.target);
        });
      },
      {
        threshold: 0.14,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    const registerRevealTargets = () => {
      const revealTargets = pageShell.querySelectorAll(revealSelectors);
      revealTargets.forEach((element, index) => {
        if (seenElements.has(element)) return;
        seenElements.add(element);
        element.style.setProperty("--fx-delay", `${Math.min(index * 32, 260)}ms`);
        element.classList.add("fx-reveal-prep");
        revealObserver.observe(element);
      });
    };

    registerRevealTargets();

    const mutationObserver = new MutationObserver(() => {
      registerRevealTargets();
    });

    mutationObserver.observe(pageShell, { childList: true, subtree: true });

    return () => {
      revealObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-primary-100">
      <div className="fx-scroll-progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${Math.max(scrollProgress, 0.02)})` }} />
      </div>
      <Header />
      <main className="pt-16 min-h-screen">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#f97316",
              color: "#fff",
              borderRadius: "8px",
              padding: "16px",
              fontWeight: "500",
            },
            success: {
              iconTheme: {
                primary: "#fff",
                secondary: "#f97316",
              },
            },
          }}
        />
        <div
          key={location.pathname}
          ref={pageShellRef}
          className="fx-route-shell"
        >
          {children}
        </div>
      </main>
      {!hideFooterOnAdminPages && <Footer />}
    </div>
  );
};

export default Layout;
