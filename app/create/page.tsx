
import { Suspense } from "react";
import CreatePage from "./CreatePageTemp";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreatePage />
    </Suspense>
  );
}