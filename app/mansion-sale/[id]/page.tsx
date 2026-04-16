
// app/mansion-sale/[id]/page.tsx
import { redirect } from "next/navigation";

export default function Page({ params }: { params: { id: string } }) {
  redirect(`/mansion-preview/${params.id}`);
}