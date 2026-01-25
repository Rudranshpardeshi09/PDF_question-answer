import { AppProvider } from "./context/AppContext";
import { ThemeProvider } from "./context/ThemeContext";
import Home from "./pages/Home";

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <Home />
      </AppProvider>
    </ThemeProvider>
  );
}
