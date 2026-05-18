const items = [
  { ic: '🚚', name: 'Free Delivery', dsc: 'On orders above Rs. 5,000 in Kathmandu Valley' },
  { ic: '🛡️', name: 'Authorized Warranty', dsc: 'Brand warranty on every product we sell' },
  { ic: '🔄', name: 'Easy Returns', dsc: '7-day hassle-free return via our portal' },
  { ic: '📞', name: '24/7 Support', dsc: 'Customer care available round the clock' },
];

export default function PromiseBar() {
  return (
    <div className="grid grid-cols-4 border-t border-b border-line max-md:grid-cols-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-4 items-start p-9 px-7 border-r border-line last:border-r-0 max-md:border-r-0">
          <div className="w-10.5 h-10.5 rounded-xl bg-surface flex items-center justify-center text-xl shrink-0">{item.ic}</div>
          <div>
            <div className="text-sm font-bold">{item.name}</div>
            <div className="text-xs text-mute mt-1 leading-normal">{item.dsc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
