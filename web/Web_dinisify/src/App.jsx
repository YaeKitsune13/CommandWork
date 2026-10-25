import { useMediaQuery } from "./shared/hooks/useMediaQuery";
import DesktopApp from "./desktop/App";
import MobileApp from "./mobile/App";

export default function App() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  return isMobile ? <MobileApp /> : <DesktopApp />;
}
