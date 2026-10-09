import { BrowserRouter as Router } from "react-router-dom";
import { ScrollToTop } from "./components/common/ScrollToTop";
import AppRoutes from "./routes/AppRoutes";
import "react-datepicker/dist/react-datepicker.css";

export default function App() {
  return (
    <Router basename="/tms">
      <ScrollToTop />
      <AppRoutes />
    </Router>
  );
}
