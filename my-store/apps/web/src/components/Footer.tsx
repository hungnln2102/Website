export default function Footer() {
  return (
    <footer className="mt-16 bg-gray-900 text-white dark:bg-slate-950 dark:border-t dark:border-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <h3 className="mb-4 text-xl font-bold">Mavryk Premium Store</h3>
            <p className="text-gray-400">
              Chuyên cung cấp phần mềm bản quyền chính hãng với giá tốt và hỗ trợ tận tâm.
            </p>
          </div>
          <div>
            <h4 className="mb-4 font-semibold">Hỗ trợ khách hàng</h4>
            <ul className="space-y-2 text-gray-400">
              <li>Hotline: 0378 304 963</li>
              <li>Email: support@mavrykpremium.store</li>
              <li>Thời gian: 8:00 - 23:00 hằng ngày</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold">Chính sách</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a
                  href="/gioi-thieu"
                  className="transition-colors hover:text-white"
                  onClick={(e) => {
                    e.preventDefault();
                    window.history.pushState({}, "", "/gioi-thieu");
                    window.dispatchEvent(new PopStateEvent("popstate"));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Giới thiệu
                </a>
              </li>
              <li>
                <span className="cursor-default">Chính sách bảo hành</span>
              </li>
              <li>
                <span className="cursor-default">Điều khoản sử dụng</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 flex flex-col items-center justify-between border-t border-gray-800 pt-8 md:flex-row">
          <p className="text-gray-400">&copy; 2024 Mavryk Premium Store. All rights reserved.</p>
          <div className="mt-4 md:mt-0">
            <a 
              href="//www.dmca.com/Protection/Status.aspx?ID=c788f409-9a7f-422c-9359-bf1582035d73" 
              title="DMCA.com Protection Status" 
              className="dmca-badge transition-opacity hover:opacity-80"
              target="_blank"
              rel="noopener noreferrer"
            > 
              <img 
                src="https://images.dmca.com/Badges/dmca_protected_sml_120l.png?ID=c788f409-9a7f-422c-9359-bf1582035d73" 
                alt="DMCA.com Protection Status" 
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
