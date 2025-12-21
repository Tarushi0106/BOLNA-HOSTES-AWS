import React, { useEffect } from "react";

export default function ThankYou() {
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    window.onpopstate = () => window.history.go(1);
  }, []);

  return (
    <div style={styles.container}>
      <h1>✅ Thank You!</h1>
      <p>Your form has been submitted successfully.</p>
      <p>You may now close this window.</p>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "#f9fafb",
    fontFamily: "Arial",
  },
};
