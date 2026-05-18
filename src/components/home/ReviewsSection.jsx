const reviews = [
  { text: 'Excellent service! Got my refrigerator delivered the next day and the installation team was very professional. Will definitely shop again.', name: 'Suman Shrestha', place: 'Lalitpur', rating: 5 },
  { text: 'Best prices in Kathmandu for electronics. The warranty support is genuine and they actually honor it without any hassle.', name: 'Priya Tamang', place: 'Bhaktapur', rating: 5 },
  { text: 'Ordered an AC last summer and the installation was done within 24 hours. The product quality and after-sales support are top-notch.', name: 'Rajan KC', place: 'Kathmandu', rating: 5 },
];

export default function ReviewsSection() {
  return (
    <section className="py-18">
      <div className="wrap">
        <div className="flex items-end justify-between mb-9 gap-6">
          <div>
            <div className="kicker">Reviews</div>
            <h2 className="font-serif text-[44px] leading-none tracking-tight font-normal mt-2">What our <i className="text-accent">customers</i> say</h2>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-[18px] max-md:grid-cols-1">
          {reviews.map((r, i) => (
            <div key={i} className="p-6 bg-surface-2 rounded-[18px] border border-line">
              <div className="font-serif text-[60px] leading-[0.5] text-accent">"</div>
              <p className="text-[15px] leading-[1.55] my-3.5 mb-[18px] text-ink-2">{r.text}</p>
              <div className="flex items-center gap-3">
                <div className="w-9.5 h-9.5 rounded-full bg-accent text-white font-bold flex items-center justify-center text-sm shrink-0">{r.name[0]}</div>
                <div>
                  <div className="text-[13px] font-bold">{r.name}</div>
                  <div className="text-[11px] text-mute">{r.place} · {'★'.repeat(r.rating)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
