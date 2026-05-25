import { useState } from "react";
import MapView from "./components/MapView";
import Sidebar from "./components/Sidebar";

export default function App() {
  const [rain, setRain] = useState(false);

  return (
    <div className="app">
      <Sidebar onRainToggle={setRain} />
      <MapView rain={rain} />
    </div>
  );
}