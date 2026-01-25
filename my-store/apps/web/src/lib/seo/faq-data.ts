/**
 * FAQ data for the website
 * Can be moved to CMS or API in the future
 */

export interface FAQ {
  question: string;
  answer: string;
}

export const faqs: FAQ[] = [
  {
    question: "Phần mềm có phải bản quyền chính hãng không?",
    answer: "Có, tất cả phần mềm tại Mavryk Premium Store đều là bản quyền chính hãng, được cung cấp trực tiếp từ nhà sản xuất hoặc đối tác ủy quyền chính thức.",
  },
  {
    question: "Tôi có thể sử dụng phần mềm trên nhiều máy tính không?",
    answer: "Tùy thuộc vào loại giấy phép bạn mua. Giấy phép cá nhân thường chỉ dùng cho 1-2 máy tính. Giấy phép doanh nghiệp có thể dùng cho nhiều máy hơn. Vui lòng kiểm tra chi tiết trong mô tả sản phẩm.",
  },
  {
    question: "Làm thế nào để kích hoạt phần mềm sau khi mua?",
    answer: "Sau khi thanh toán thành công, bạn sẽ nhận được email chứa key bản quyền và hướng dẫn kích hoạt chi tiết. Quá trình kích hoạt thường mất 5-10 phút.",
  },
  {
    question: "Có hỗ trợ cài đặt phần mềm không?",
    answer: "Có, chúng tôi cung cấp hỗ trợ cài đặt miễn phí cho tất cả khách hàng. Bạn có thể liên hệ qua email hoặc chat trực tuyến để được hỗ trợ.",
  },
  {
    question: "Chính sách hoàn tiền như thế nào?",
    answer: "Chúng tôi hỗ trợ hoàn tiền trong vòng 7 ngày kể từ ngày mua nếu sản phẩm không đúng như mô tả hoặc gặp lỗi kỹ thuật không thể khắc phục. Vui lòng liên hệ bộ phận hỗ trợ để được xử lý.",
  },
  {
    question: "Có chấp nhận thanh toán qua những hình thức nào?",
    answer: "Chúng tôi chấp nhận thanh toán qua thẻ tín dụng, thẻ ghi nợ, chuyển khoản ngân hàng, và các ví điện tử phổ biến như MoMo, ZaloPay.",
  },
];
