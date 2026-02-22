import { Heart } from "lucide-react";

export function FavoriteProducts({ onProductClick }: { onProductClick: (slug: string) => void }) {
  const favorites: any[] = []; // TODO: Fetch from API

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Sản phẩm yêu thích</h2>
      
      {favorites.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 mx-auto text-gray-300 dark:text-slate-600 mb-4" />
          <p className="text-gray-500 dark:text-slate-400">Bạn chưa có sản phẩm yêu thích nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Favorite product cards will be rendered here */}
        </div>
      )}
    </div>
  );
}
