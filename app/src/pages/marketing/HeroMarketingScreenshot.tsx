import { DesktopScreenshotFrame } from "@/pages/marketing/DesktopScreenshotFrame";
import { MobileScreenshotFrame } from "@/pages/marketing/MobileScreenshotFrame";

const DESKTOP_ALT = "BikriKhata business dashboard on desktop";
const MOBILE_ALT = "BikriKhata business dashboard on mobile";

/** Hero product shot — phone frame on small screens, browser frame from md up. */
export function HeroMarketingScreenshot() {
  return (
    <>
      <div className="flex justify-center md:hidden">
        <MobileScreenshotFrame
          src="/marketing/mobile-dashboard.png"
          alt={MOBILE_ALT}
          className="w-full max-w-[min(100%,17.5rem)]"
        />
      </div>
      <div className="hidden md:block">
        <DesktopScreenshotFrame src="/marketing/desktop-dashboard.png" alt={DESKTOP_ALT} />
      </div>
    </>
  );
}
