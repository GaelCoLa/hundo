// /u/<usuario>/following: a quiénes sigue este jugador.
// Depende de datos de cada visita, así que va dentro de <Suspense>.
import { Suspense } from "react";
import { FollowList } from "@/components/profile/FollowList";

export default function Page({ params }: PageProps<"/[locale]/u/[username]/following">) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 pb-20 pt-6 sm:px-8 sm:pt-10">
      <Suspense fallback={<div className="h-64 rounded-[20px] bg-surface" aria-busy="true" />}>
        <List params={params} />
      </Suspense>
    </main>
  );
}

async function List({ params }: { params: PageProps<"/[locale]/u/[username]/following">["params"] }) {
  const { username } = await params;
  return <FollowList username={username} kind="following" />;
}
