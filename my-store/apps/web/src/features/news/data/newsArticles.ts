export type NewsArticle = {
  id: string;
  slug: string;
  category: string;
  title: string;
  summary: string;
  publishedAt: string;
  publishedLabel: string;
  visualLabel: string;
  visualHeadline: string;
  visualDescription: string;
  accentClass: string;
  content: string[];
  /** Nội dung HTML từ CMS (ưu tiên hiển thị khi có) */
  contentHtml?: string | null;
  /** Ảnh bìa từ API */
  coverImageUrl?: string | null;
};

export const NEWS_ARTICLES: NewsArticle[] = [
  {
    id: "adobe-guide",
    slug: "huong-dan-adobe-creative-cloud-cho-nguoi-moi",
    category: "Hướng dẫn",
    title: "Hướng dẫn Adobe Creative Cloud cho người mới bắt đầu",
    summary:
      "Tổng hợp các bước đăng nhập, đổi mật khẩu, đăng xuất tài khoản và xử lý các tình huống cơ bản khi sử dụng Adobe Creative Cloud.",
    publishedAt: "2026-03-28",
    publishedLabel: "28/03/2026",
    visualLabel: "Mới cập nhật",
    visualHeadline: "Adobe Guide",
    visualDescription:
      "Xem nhanh quy trình đăng nhập và xử lý lỗi cơ bản trước khi cần hỗ trợ sâu hơn.",
    accentClass:
      "from-cyan-500 via-sky-600 to-indigo-700 dark:from-cyan-500 dark:via-blue-600 dark:to-indigo-800",
    content: [
      "Bài viết này dành cho khách hàng lần đầu dùng Adobe Creative Cloud tại cửa hàng, tập trung vào thao tác cơ bản để bắt đầu nhanh và đúng quy trình.",
      "Bạn nên kiểm tra email kích hoạt, đăng nhập đúng tài khoản, sau đó đổi mật khẩu ngay lần đầu để đảm bảo an toàn. Nếu gặp lỗi đăng nhập, hãy xác nhận lại thông tin thiết bị và tình trạng mạng trước khi gửi ticket hỗ trợ.",
      "Trong trường hợp ứng dụng báo lỗi license, bạn có thể đăng xuất toàn bộ phiên và đăng nhập lại. Nếu vẫn không xử lý được, hãy liên hệ đội ngũ hỗ trợ và gửi kèm ảnh màn hình để được xử lý nhanh hơn.",
    ],
  },
  {
    id: "about-store",
    slug: "quy-trinh-xu-ly-don-va-ho-tro-sau-mua",
    category: "Nội bộ",
    title: "Cách Mavryk Premium Store xử lý đơn và hỗ trợ sau mua",
    summary:
      "Tóm tắt cách cửa hàng tiếp nhận đơn, gửi key, hỗ trợ kích hoạt và đồng hành với khách hàng trong quá trình sử dụng.",
    publishedAt: "2026-03-24",
    publishedLabel: "24/03/2026",
    visualLabel: "Vận hành",
    visualHeadline: "Hỗ trợ sau mua",
    visualDescription:
      "Đọc nhanh về quy trình xử lý đơn, gửi key và cách đội ngũ hỗ trợ đồng hành cùng khách hàng.",
    accentClass:
      "from-slate-800 via-slate-900 to-blue-950 dark:from-slate-800 dark:via-slate-950 dark:to-slate-900",
    content: [
      "Ngay sau khi hệ thống ghi nhận thanh toán hợp lệ, đơn hàng sẽ được chuyển vào hàng chờ xử lý để kiểm tra thông tin sản phẩm và gói dịch vụ phù hợp.",
      "Đội ngũ vận hành thực hiện cấp key hoặc tài khoản theo đúng mô tả sản phẩm. Trong các gói cần thao tác kỹ thuật, bộ phận hỗ trợ sẽ chủ động theo dõi đến khi khách dùng ổn định.",
      "Sau mua, khách hàng vẫn có thể liên hệ để được hướng dẫn thêm hoặc xử lý sự cố phát sinh. Mục tiêu của cửa hàng là đảm bảo trải nghiệm sử dụng thực tế, không dừng ở bước giao hàng.",
    ],
  },
  {
    id: "support-ticket-guide",
    slug: "huong-dan-gui-yeu-cau-ho-tro-sau-mua",
    category: "Hướng dẫn",
    title: "Hướng dẫn gửi yêu cầu hỗ trợ sau mua để được xử lý nhanh",
    summary:
      "Checklist ngắn để gửi ticket đúng thông tin, giúp đội ngũ hỗ trợ xác nhận và xử lý sự cố nhanh hơn.",
    publishedAt: "2026-03-26",
    publishedLabel: "26/03/2026",
    visualLabel: "Thao tác nhanh",
    visualHeadline: "Gửi ticket đúng chuẩn",
    visualDescription:
      "Chuẩn hóa thông tin ngay từ đầu để tránh phải trao đổi lại nhiều lần.",
    accentClass:
      "from-sky-500 via-blue-600 to-indigo-700 dark:from-sky-500 dark:via-blue-700 dark:to-indigo-800",
    content: [
      "Khi cần hỗ trợ, bạn nên gửi mã đơn, email mua hàng và mô tả lỗi cụ thể để hệ thống tiếp nhận chính xác ngay lần đầu.",
      "Nếu có ảnh màn hình hoặc video ngắn về lỗi, hãy đính kèm để đội kỹ thuật khoanh vùng nhanh hơn và giảm thời gian phản hồi.",
      "Bạn cũng nên ghi rõ khung giờ có thể nhận hỗ trợ để việc xử lý và xác nhận kết quả được liền mạch hơn.",
    ],
  },
  {
    id: "all-products",
    slug: "tong-hop-cac-nhom-phan-mem-dang-ban",
    category: "Danh mục",
    title: "Tổng hợp các nhóm phần mềm đang có trên cửa hàng",
    summary:
      "Mở nhanh danh mục tổng, tìm các nhóm sản phẩm đang bán và xem toàn bộ kho phần mềm bản quyền đang sẵn có.",
    publishedAt: "2026-03-20",
    publishedLabel: "20/03/2026",
    visualLabel: "Kho sản phẩm",
    visualHeadline: "Danh mục đầy đủ",
    visualDescription:
      "Phù hợp khi bạn muốn xem tổng quan tất cả nhóm phần mềm trước khi đi sâu vào từng sản phẩm.",
    accentClass:
      "from-emerald-500 via-teal-600 to-cyan-700 dark:from-emerald-600 dark:via-teal-700 dark:to-cyan-800",
    content: [
      "Trang danh mục giúp bạn nhìn toàn cảnh kho phần mềm bản quyền hiện có theo từng nhóm nhu cầu như học tập, văn phòng, thiết kế và giải trí.",
      "Bạn có thể lọc nhanh theo danh mục, so sánh gói và xem giá theo thời hạn sử dụng để chọn phương án phù hợp với nhu cầu thực tế.",
      "Với khách hàng mới, nên bắt đầu từ danh mục tổng để tiết kiệm thời gian tìm kiếm trước khi đi vào chi tiết từng sản phẩm.",
    ],
  },
  {
    id: "internal-sla-update",
    slug: "cap-nhat-sla-ho-tro-theo-khung-gio-moi",
    category: "Nội bộ",
    title: "Cập nhật SLA hỗ trợ theo khung giờ mới của đội vận hành",
    summary:
      "Thông báo điều chỉnh thời gian phản hồi ưu tiên cho các nhóm yêu cầu phổ biến trong giờ cao điểm.",
    publishedAt: "2026-03-22",
    publishedLabel: "22/03/2026",
    visualLabel: "Thông báo",
    visualHeadline: "SLA vận hành mới",
    visualDescription:
      "Tinh chỉnh quy trình để tối ưu tốc độ phản hồi và chất lượng hỗ trợ.",
    accentClass:
      "from-slate-700 via-slate-900 to-indigo-900 dark:from-slate-700 dark:via-slate-950 dark:to-indigo-950",
    content: [
      "Đội vận hành đã điều chỉnh SLA theo nhóm lỗi để ưu tiên xử lý các ticket ảnh hưởng trực tiếp đến khả năng sử dụng của khách hàng.",
      "Những yêu cầu xác thực thông tin đơn hàng sẽ được phân luồng sớm để hạn chế thời gian chờ ở các khung giờ cao điểm.",
      "Thay đổi này giúp tỷ lệ phản hồi đúng hạn ổn định hơn và giảm thời gian xử lý trung bình cho các ticket phổ biến.",
    ],
  },
  {
    id: "best-selling",
    slug: "nhung-goi-ban-chay-nhat-hien-tai",
    category: "Bán chạy",
    title: "Những gói phần mềm được khách hàng chọn mua nhiều nhất",
    summary:
      "Danh sách các gói đang có lượng quan tâm cao, giúp khách mới nhìn nhanh nhóm sản phẩm phổ biến trên cửa hàng.",
    publishedAt: "2026-03-16",
    publishedLabel: "16/03/2026",
    visualLabel: "Được quan tâm",
    visualHeadline: "Sản phẩm bán chạy",
    visualDescription:
      "Gợi ý các nhóm sản phẩm nổi bật để khách hàng mới tiết kiệm thời gian tìm kiếm.",
    accentClass:
      "from-amber-400 via-orange-500 to-rose-600 dark:from-amber-500 dark:via-orange-600 dark:to-rose-700",
    content: [
      "Danh sách bán chạy phản ánh các gói đang được nhiều khách hàng lựa chọn trong giai đoạn gần đây.",
      "Đây là điểm bắt đầu tốt cho người mới vì nhóm sản phẩm này thường đã được thị trường kiểm chứng về nhu cầu và độ ổn định.",
      "Bạn vẫn nên đọc kỹ mô tả từng gói để đảm bảo phù hợp mục đích sử dụng, tránh chọn theo xu hướng mà không đúng nhu cầu.",
    ],
  },
  {
    id: "category-navigation-tips",
    slug: "meo-loc-danh-muc-de-tim-goi-phu-hop",
    category: "Danh mục",
    title: "Mẹo lọc danh mục để tìm gói phù hợp trong ít bước nhất",
    summary:
      "Gợi ý cách kết hợp lọc danh mục và từ khóa để rút ngắn thời gian tìm sản phẩm.",
    publishedAt: "2026-03-18",
    publishedLabel: "18/03/2026",
    visualLabel: "Tips",
    visualHeadline: "Lọc danh mục hiệu quả",
    visualDescription:
      "Giảm thao tác tìm kiếm bằng cách đi từ nhu cầu đến nhóm sản phẩm phù hợp.",
    accentClass:
      "from-emerald-500 via-teal-600 to-cyan-700 dark:from-emerald-600 dark:via-teal-700 dark:to-cyan-800",
    content: [
      "Bạn nên bắt đầu từ nhóm nhu cầu chính như học tập, văn phòng hoặc thiết kế để thu hẹp danh sách sản phẩm ngay từ đầu.",
      "Sau khi chọn danh mục, hãy dùng thêm từ khóa theo phần mềm hoặc thời hạn sử dụng để tìm gói phù hợp nhanh hơn.",
      "Nếu còn nhiều lựa chọn tương tự, ưu tiên so sánh mục mô tả quyền lợi và phạm vi hỗ trợ để ra quyết định chính xác.",
    ],
  },
  {
    id: "new-products",
    slug: "cap-nhat-cac-san-pham-moi-len-ke",
    category: "Sản phẩm mới",
    title: "Cập nhật các sản phẩm mới vừa được đưa lên trang",
    summary:
      "Theo dõi nhanh những gói mới được bổ sung để khách hàng không bỏ lỡ các lựa chọn vừa cập nhật lên hệ thống.",
    publishedAt: "2026-03-12",
    publishedLabel: "12/03/2026",
    visualLabel: "Mới lên kệ",
    visualHeadline: "Bộ sưu tập mới",
    visualDescription:
      "Tập trung vào những nhóm sản phẩm mới vừa lên trang để dễ so sánh và chọn mua.",
    accentClass:
      "from-violet-500 via-fuchsia-600 to-pink-600 dark:from-violet-600 dark:via-fuchsia-700 dark:to-pink-700",
    content: [
      "Khu vực sản phẩm mới giúp bạn nắm nhanh các gói vừa được bổ sung để không bỏ lỡ lựa chọn phù hợp.",
      "Mỗi bản cập nhật đều đi kèm thông tin cơ bản về thời hạn, phạm vi sử dụng và mức giá tham khảo.",
      "Nếu bạn chưa chắc sản phẩm mới có phù hợp hay không, hãy gửi nhu cầu cụ thể để đội ngũ hỗ trợ tư vấn chính xác hơn.",
    ],
  },
  {
    id: "best-selling-trends",
    slug: "xu-huong-goi-ban-chay-theo-thang",
    category: "Bán chạy",
    title: "Xu hướng gói bán chạy theo từng tháng trên cửa hàng",
    summary:
      "Tổng hợp biến động nhóm sản phẩm được chọn nhiều để khách hàng mới tham khảo nhanh.",
    publishedAt: "2026-03-14",
    publishedLabel: "14/03/2026",
    visualLabel: "Xu hướng",
    visualHeadline: "Biến động nhu cầu",
    visualDescription:
      "Theo dõi nhóm sản phẩm tăng trưởng nhanh để có thêm góc nhìn trước khi mua.",
    accentClass:
      "from-amber-400 via-orange-500 to-rose-600 dark:from-amber-500 dark:via-orange-600 dark:to-rose-700",
    content: [
      "Dữ liệu bán chạy theo tháng cho thấy nhu cầu thường tập trung vào các gói có mức sử dụng linh hoạt và hỗ trợ nhanh.",
      "Các đợt cao điểm thường xuất hiện khi có chương trình ưu đãi hoặc giai đoạn học tập, làm việc tăng nhu cầu phần mềm.",
      "Bạn có thể dùng thông tin xu hướng như một nguồn tham khảo, nhưng vẫn nên chọn theo nhu cầu thực tế của mình.",
    ],
  },
  {
    id: "promotions",
    slug: "cach-theo-doi-khuyen-mai-dang-dien-ra",
    category: "Khuyến mãi",
    title: "Cách theo dõi các ưu đãi và đợt giảm giá đang có",
    summary:
      "Trang tổng hợp các ưu đãi đang diễn ra, giúp khách hàng xem nhanh các đợt giảm giá thay vì phải đi từng danh mục.",
    publishedAt: "2026-03-08",
    publishedLabel: "08/03/2026",
    visualLabel: "Ưu đãi hiện tại",
    visualHeadline: "Khuyến mãi đang mở",
    visualDescription:
      "Mở nhanh các ưu đãi đang hoạt động để khách hàng chọn đúng gói và đúng thời điểm mua.",
    accentClass:
      "from-rose-500 via-red-500 to-orange-600 dark:from-rose-600 dark:via-red-600 dark:to-orange-700",
    content: [
      "Trang khuyến mãi tập hợp các ưu đãi đang hoạt động để bạn theo dõi dễ hơn mà không cần kiểm tra từng danh mục riêng lẻ.",
      "Mỗi chương trình có điều kiện áp dụng khác nhau, vì vậy bạn nên đọc kỹ thời gian hiệu lực và phạm vi sản phẩm trước khi mua.",
      "Trong các đợt cao điểm, số lượng ưu đãi có thể thay đổi nhanh. Bạn nên chốt đơn sớm nếu đã tìm được gói phù hợp.",
    ],
  },
  {
    id: "new-arrival-roundup",
    slug: "tong-hop-dot-cap-nhat-san-pham-moi-tuan-nay",
    category: "Sản phẩm mới",
    title: "Tổng hợp đợt cập nhật sản phẩm mới trong tuần này",
    summary:
      "Danh sách nhanh các gói mới cùng định hướng chọn gói theo nhu cầu sử dụng thực tế.",
    publishedAt: "2026-03-10",
    publishedLabel: "10/03/2026",
    visualLabel: "Roundup",
    visualHeadline: "Cập nhật theo tuần",
    visualDescription:
      "Xem nhanh các bổ sung mới nhất để không bỏ lỡ lựa chọn phù hợp.",
    accentClass:
      "from-violet-500 via-fuchsia-600 to-pink-600 dark:from-violet-600 dark:via-fuchsia-700 dark:to-pink-700",
    content: [
      "Đợt cập nhật tuần này bổ sung thêm một số gói có thời hạn linh hoạt để phù hợp với nhu cầu dùng ngắn và trung hạn.",
      "Mỗi sản phẩm mới đều được chuẩn hóa mô tả để bạn so sánh nhanh phạm vi sử dụng trước khi quyết định mua.",
      "Nếu cần tư vấn lựa chọn giữa các gói mới, bạn có thể gửi nhu cầu cụ thể để đội ngũ hỗ trợ gợi ý phương án phù hợp.",
    ],
  },
  {
    id: "promo-combo-tips",
    slug: "meo-chon-combo-khuyen-mai-tiet-kiem-chi-phi",
    category: "Khuyến mãi",
    title: "Mẹo chọn combo khuyến mãi để tối ưu chi phí sử dụng",
    summary:
      "Cách đọc điều kiện áp dụng và chọn combo phù hợp với nhu cầu để tiết kiệm hiệu quả hơn.",
    publishedAt: "2026-03-06",
    publishedLabel: "06/03/2026",
    visualLabel: "Mẹo tiết kiệm",
    visualHeadline: "Chọn combo hợp lý",
    visualDescription:
      "Tránh mua dư nhu cầu bằng cách so khớp quyền lợi với mục tiêu sử dụng.",
    accentClass:
      "from-rose-500 via-red-500 to-orange-600 dark:from-rose-600 dark:via-red-600 dark:to-orange-700",
    content: [
      "Combo khuyến mãi thường có lợi khi bạn đã xác định rõ nhu cầu sử dụng trong một khoảng thời gian nhất định.",
      "Bạn nên kiểm tra kỹ điều kiện áp dụng, phạm vi sản phẩm và thời gian hiệu lực trước khi chọn combo.",
      "Khi phân vân giữa nhiều gói ưu đãi, hãy ưu tiên phương án có quyền lợi sát nhất với nhu cầu để tránh lãng phí.",
    ],
  },
];

export const getNewsArticleBySlug = (slug: string) =>
  NEWS_ARTICLES.find((article) => article.slug === slug);
