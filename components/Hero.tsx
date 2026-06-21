/* eslint-disable @next/next/no-img-element */
export function Hero() {
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-border bg-surface sm:aspect-[5/2] lg:aspect-[3/1]">
      <img
        src="/photos/hero.jpg"
        alt="Vue aérienne de la presqu'île"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
      <div className="absolute bottom-0 left-0 p-4 sm:p-5">
        <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-sm sm:text-3xl">
          TyLaouen
        </h1>
        <p className="text-sm text-white/85">Réservations — famille Simonneaux</p>
      </div>
    </div>
  );
}
