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
    
      <InterviewCoach />
  );
}

export default App;
