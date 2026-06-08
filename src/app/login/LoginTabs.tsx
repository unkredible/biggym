"use client";

import { useState } from "react";

export default function LoginTabs({
  login,
  signup,
  initial = "login",
}: {
  login: React.ReactNode;
  signup: React.ReactNode;
  initial?: "login" | "signup";
}) {
  const [tab, setTab] = useState<"login" | "signup">(initial);

  return (
    <>
      <div style={{ display: "flex", marginBottom: "1.1rem" }}>
        <button
          type="button"
          className={tab === "login" ? "primary" : ""}
          onClick={() => setTab("login")}
          style={{ flex: 1, borderRadius: "999px 0 0 999px" }}
        >
          Log in
        </button>
        <button
          type="button"
          className={tab === "signup" ? "primary" : ""}
          onClick={() => setTab("signup")}
          style={{ flex: 1, borderRadius: "0 999px 999px 0" }}
        >
          Sign up
        </button>
      </div>
      {tab === "login" ? login : signup}
    </>
  );
}
