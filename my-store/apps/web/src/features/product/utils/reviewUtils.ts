export function getRatingLabel(rating: number): string {
  switch (rating) {
    case 5: return "Tuyệt vời";
    case 4: return "Tốt";
    case 3: return "Bình thường";
    case 2: return "Không hài lòng";
    case 1: return "Rất tệ";
    default: return "";
  }
}
