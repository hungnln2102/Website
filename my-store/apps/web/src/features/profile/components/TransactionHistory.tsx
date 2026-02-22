import { Receipt } from "lucide-react";

export function TransactionHistory() {
  const transactions: any[] = []; // TODO: Fetch from API

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Lịch sử giao dịch</h2>
      
      {transactions.length === 0 ? (
        <div className="text-center py-12">
          <Receipt className="w-16 h-16 mx-auto text-gray-300 dark:text-slate-600 mb-4" />
          <p className="text-gray-500 dark:text-slate-400">Bạn chưa có giao dịch nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Transaction items will be rendered here */}
        </div>
      )}
    </div>
  );
}
