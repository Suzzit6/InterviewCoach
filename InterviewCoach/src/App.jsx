import { useState } from "react";
import "./App.css";
import { Interview } from "./Interview/Interview";
import {
  BrowserRouter as Router,
  Route,
  Link,
  Routes,
  useLocation,
} from "react-router-dom";
import WebcamFeed from "./Interview/WebcamFeed";
import { InterviewCoach } from "./Interview/InterviewCoach";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="h-screen overflow-hidden">
      {" "}
      {/* Added overflow-hidden */}
      {/* <Router>
      <Routes>
        <Route path="/sarthi" element={<Interview />} />
        <Route path="/webcam" element={<WebcamFeed />} />
      </Routes>
    </Router> */}
      {/* <Interview />
    <WebcamFeed />
    <Test /> */}
      <InterviewCoach />
    </div>
  );
}

export default App;
