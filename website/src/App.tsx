import { MotionConfig } from "motion/react";

import Home from "./pages/Home";

export default function App() {
  return (
    /* The CSS `prefers-reduced-motion` rule in index.css only reaches CSS animations and
       transitions. Every animation on this page is a `motion/react` transform driven in
       JS, which that rule cannot touch — `reducedMotion="user"` is what actually honours
       the reader's setting, and the direction asks for it outright. */
    <MotionConfig reducedMotion="user">
      <div className="font-sans antialiased">
        <Home />
      </div>
    </MotionConfig>
  );
}
