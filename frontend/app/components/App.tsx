"use client";

import { useState } from "react";
import { Landing } from "./Landing";
import { SignIn } from "./SignIn";
import { SignUp } from "./SignUp";
import { Predict } from "./Predict";
import { Chatbot } from "./Chatbot";

type Route = "landing" | "signin" | "signup" | "predict";

export function App() {
  const [route, setRoute] = useState<Route>("landing");

  function nav(r: Route) {
    setRoute(r);
    window.scrollTo(0, 0);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {route === "landing" && <Landing onGoHome={() => nav("landing")} onGoSignin={() => nav("signin")} />}
      {route === "signin" && (
        <SignIn onGoHome={() => nav("landing")} onGoSignup={() => nav("signup")} onSignedIn={() => nav("predict")} />
      )}
      {route === "signup" && (
        <SignUp onGoHome={() => nav("landing")} onGoSignin={() => nav("signin")} onSignedUp={() => nav("predict")} />
      )}
      {route === "predict" && <Predict onGoHome={() => nav("landing")} />}
      {route === "predict" && <Chatbot />}
    </div>
  );
}
