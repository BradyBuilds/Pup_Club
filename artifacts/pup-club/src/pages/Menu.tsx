import { useGetMenu } from '@workspace/api-client-react';

export function Menu() {
  const { data: menuItems, isLoading } = useGetMenu();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <span className="text-[#00E5FF] font-mono text-sm animate-pulse">Loading menu...</span>
      </div>
    );
  }

  if (!menuItems || menuItems.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 text-gray-500">
        <span className="text-3xl mb-2">🍽️</span>
        <p className="font-mono text-sm uppercase">Menu unavailable</p>
      </div>
    );
  }

  // Group by category
  const grouped = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof menuItems>);

  // Sort categories (Drinks usually first, then Food, etc)
  const categories = Object.keys(grouped).sort();

  return (
    <div className="h-full overflow-y-auto pb-20 p-4 space-y-8">
      <header>
        <h1 className="text-4xl font-display font-bold text-[#FF2D78] neon-text-primary uppercase tracking-wider flex items-center gap-2">
          <span>🍺</span> Menu
        </h1>
        <p className="text-gray-400 text-sm mt-1">Fuel for the arcade.</p>
      </header>

      {categories.map(category => {
        const items = grouped[category].sort((a, b) => a.sort_order - b.sort_order);
        
        return (
          <div key={category}>
            <h2 className="text-2xl font-display font-bold text-[#00E5FF] uppercase border-b border-[#252540] pb-2 mb-4">
              {category}
            </h2>
            
            <div className="space-y-4">
              {items.map(item => (
                <div 
                  key={item.id} 
                  className={`p-3 rounded-lg flex flex-col ${
                    item.is_special ? 'bg-[#FF2D78]/10 border border-[#FF2D78]/50' : ''
                  } ${!item.is_available ? 'opacity-50' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      {item.name}
                      {item.is_special && (
                        <span className="text-[10px] bg-[#FF2D78] text-white px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">Special</span>
                      )}
                    </h3>
                    <div className="font-mono font-bold text-[#39FF14]">
                      ${(item.price ?? 0).toFixed(2)}
                    </div>
                  </div>
                  
                  {item.description && (
                    <p className="text-sm text-gray-400 line-clamp-2 pr-12">
                      {item.description}
                    </p>
                  )}
                  
                  {!item.is_available && (
                    <span className="text-xs text-red-500 font-bold uppercase mt-1">Out of stock</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
