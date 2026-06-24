import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <Image
        src="/logo-emblema.png"
        alt="Delicias Caseras"
        width={96}
        height={96}
        priority
        className="h-24 w-24 animate-pulse object-contain opacity-80"
      />
      <p className="font-serif text-xl text-foreground">Delicias Caseras</p>
      <p className="text-xs font-semibold uppercase tracking-[0.26em] text-gold">
        Chocolate artesanal
      </p>
    </div>
  );
}
