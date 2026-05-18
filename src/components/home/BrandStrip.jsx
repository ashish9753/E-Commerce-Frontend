const brands = ['Samsung', 'LG', 'Sony', 'Bosch', 'Philips', 'Apple', 'Xiaomi', 'JBL', 'Asus', 'IFB', 'Prestige', 'Atomberg'];

const styles = [
  'font-serif text-[30px] font-normal',
  'font-extrabold tracking-[-0.05em] uppercase text-[22px]',
  'font-serif italic text-[28px]',
  'font-light tracking-[0.4em] uppercase text-sm',
];

export default function BrandStrip() {
  const doubled = [...brands, ...brands];
  return (
    <div className="py-9 border-t border-b border-line bg-white mt-18 overflow-hidden">
      <div className="flex gap-16 items-center animate-marquee">
        {doubled.map((b, i) => (
          <span key={i} className={`text-soft italic whitespace-nowrap shrink-0 ${styles[i % 4]}`}>{b}</span>
        ))}
      </div>
    </div>
  );
}
