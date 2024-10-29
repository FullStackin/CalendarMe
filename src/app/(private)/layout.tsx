import { ReactNode } from "react";

export default function PrivateLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header></header>

      <main className="container my-6">{children}</main>
    </>
  );
}
