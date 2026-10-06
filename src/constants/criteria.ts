import { CriterionDefinition, CriteriaGroupKey } from '../types';

export interface CriteriaGroupMeta {
  key: CriteriaGroupKey;
  name: string;
  description: string;
}

export const CRITERIA_GROUPS: CriteriaGroupMeta[] = [
  {
    key: 'dieuhuong',
    name: 'Điều hướng',
    description: 'Cách thức tổ chức cấu trúc, tìm kiếm và phân luồng người dùng',
  },
  {
    key: 'tincay',
    name: 'Tin cậy',
    description: 'Các yếu tố minh bạch, pháp lý, cam kết và bằng chứng xã hội',
  },
  {
    key: 'noidung',
    name: 'Nội dung',
    description: 'Chiều sâu thông tin sản phẩm, bài toán khách hàng và kiến thức ngành',
  },
  {
    key: 'tuongtac',
    name: 'Tương tác',
    description: 'Công cụ hỗ trợ khách hàng so sánh, ra quyết định và kết nối trực tiếp',
  },
  {
    key: 'chotdon',
    name: 'Chốt đơn',
    description: 'Chính sách mua bán, ưu đãi, nút kêu gọi và biểu mẫu chuyển đổi',
  },
  {
    key: 'kythuat',
    name: 'Kỹ thuật',
    description: 'Tốc độ, độ thân thiện di động, đo lường chuyển đổi và chuẩn SEO',
  },
  {
    key: 'dacthunganh',
    name: 'Đặc thù ngành',
    description: 'Thông số đo lường, môi trường sử dụng, chứng từ và giao lắp',
  },
];

export const CRITERIA_LIST_35: CriterionDefinition[] = [
  // 1-3: Điều hướng
  {
    id: 1,
    name: '01. Điều hướng theo nhu cầu sử dụng',
    group: 'dieuhuong',
    groupName: 'Điều hướng',
    funnelStage: 'Đầu – Giữa phễu',
    defaultPriority: 'Cao',
  },
  {
    id: 2,
    name: '02. Bộ lọc theo giá, kích thước và loại',
    group: 'dieuhuong',
    groupName: 'Điều hướng',
    funnelStage: 'Giữa phễu',
    defaultPriority: 'Cao',
  },
  {
    id: 3,
    name: '03. Trang đích riêng theo nhóm hoặc khu vực',
    group: 'dieuhuong',
    groupName: 'Điều hướng',
    funnelStage: 'Đầu phễu',
    defaultPriority: 'Đã có',
  },

  // 4-8: Tin cậy
  {
    id: 4,
    name: '04. Dải cam kết ở đầu trang và khi cuộn',
    group: 'tincay',
    groupName: 'Tin cậy',
    funnelStage: 'Đầu phễu',
    defaultPriority: 'Cao',
  },
  {
    id: 5,
    name: '05. Số điện thoại nổi bật ở đầu trang',
    group: 'tincay',
    groupName: 'Tin cậy',
    funnelStage: 'Đầu phễu',
    defaultPriority: 'Cao',
  },
  {
    id: 6,
    name: '06. Giờ làm việc và địa chỉ rõ',
    group: 'tincay',
    groupName: 'Tin cậy',
    funnelStage: 'Đầu phễu',
    defaultPriority: 'Đã có',
  },
  {
    id: 7,
    name: '07. Đánh giá khách hàng có tên và ảnh thật',
    group: 'tincay',
    groupName: 'Tin cậy',
    funnelStage: 'Giữa phễu',
    defaultPriority: 'Khoảng trống',
    explanation: 'Tin cậy · Tên và ảnh trên trang không tự chứng minh khách đã mua. Cần hồ sơ và sự đồng ý khi công bố.',
  },
  {
    id: 8,
    name: '08. Pháp nhân, chứng nhận và đối tác',
    group: 'tincay',
    groupName: 'Tin cậy',
    funnelStage: 'Cuối phễu',
    defaultPriority: 'Trung bình',
  },

  // 9-15: Nội dung
  {
    id: 9,
    name: '09. Câu hỏi thường gặp chuyên sâu',
    group: 'noidung',
    groupName: 'Nội dung',
    funnelStage: 'Giữa phễu',
    defaultPriority: 'Cao',
  },
  {
    id: 10,
    name: '10. Chuyên mục bài viết kiến thức',
    group: 'noidung',
    groupName: 'Nội dung',
    funnelStage: 'Giữa phễu',
    defaultPriority: 'Đã có',
  },
  {
    id: 11,
    name: '11. Hướng dẫn chọn sản phẩm',
    group: 'noidung',
    groupName: 'Nội dung',
    funnelStage: 'Giữa phễu',
    defaultPriority: 'Đã có',
  },
  {
    id: 12,
    name: '12. So sánh các phương án thay thế',
    group: 'noidung',
    groupName: 'Nội dung',
    funnelStage: 'Giữa phễu',
    defaultPriority: 'Trung bình',
  },
  {
    id: 13,
    name: '13. Thông số và bộ ảnh sản phẩm cận cảnh',
    group: 'noidung',
    groupName: 'Nội dung',
    funnelStage: 'Giữa phễu',
    defaultPriority: 'Cao',
  },
  {
    id: 14,
    name: '14. Hồ sơ triển khai có kết quả thực tế',
    group: 'noidung',
    groupName: 'Nội dung',
    funnelStage: 'Giữa phễu',
    defaultPriority: 'Trung bình',
  },
  {
    id: 15,
    name: '15. Video sản phẩm vận hành thực tế',
    group: 'noidung',
    groupName: 'Nội dung',
    funnelStage: 'Giữa phễu',
    defaultPriority: 'Cao',
  },

  // 16-19: Tương tác
  {
    id: 16,
    name: '16. Bộ câu hỏi tương tác gợi ý sản phẩm',
    group: 'tuongtac',
    groupName: 'Tương tác',
    funnelStage: 'Giữa phễu',
    defaultPriority: 'Khoảng trống',
    explanation: 'Tương tác · Chỉ kết luận trong các trang đã lấy mẫu; chức năng được nạp bằng mã chạy thêm có thể chưa được phát hiện.',
  },
  {
    id: 17,
    name: '17. Chọn sản phẩm để so sánh cạnh nhau',
    group: 'tuongtac',
    groupName: 'Tương tác',
    funnelStage: 'Giữa – Cuối phễu',
    defaultPriority: 'Khoảng trống',
  },
  {
    id: 18,
    name: '18. Công cụ ước tính tổng chi phí hoặc trả góp',
    group: 'tuongtac',
    groupName: 'Tương tác',
    funnelStage: 'Cuối phễu',
    defaultPriority: 'Khoảng trống',
    explanation: 'Tương tác · Không đồng nhất công cụ đổi đơn vị với công cụ ước tính chi phí mua cân.',
  },
  {
    id: 19,
    name: '19. Chat trực tiếp hoặc Zalo luôn hiển thị',
    group: 'tuongtac',
    groupName: 'Tương tác',
    funnelStage: 'Cuối phễu',
    defaultPriority: 'Cao',
  },

  // 20-25: Chốt đơn
  {
    id: 20,
    name: '20. Bảo hành rõ thời hạn, phạm vi và nơi tiếp nhận',
    group: 'chotdon',
    groupName: 'Chốt đơn',
    funnelStage: 'Cuối phễu',
    defaultPriority: 'Đã có',
  },
  {
    id: 21,
    name: '21. Đổi trả và hoàn tiền rõ điều kiện',
    group: 'chotdon',
    groupName: 'Chốt đơn',
    funnelStage: 'Cuối phễu',
    defaultPriority: 'Cao',
  },
  {
    id: 22,
    name: '22. Trả góp hoặc thanh toán linh hoạt',
    group: 'chotdon',
    groupName: 'Chốt đơn',
    funnelStage: 'Cuối phễu',
    defaultPriority: 'Trung bình',
  },
  {
    id: 23,
    name: '23. Ưu đãi có hạn được xác thực',
    group: 'chotdon',
    groupName: 'Chốt đơn',
    funnelStage: 'Cuối phễu',
    defaultPriority: 'Thấp',
    explanation: 'Chốt đơn · Không khuyến nghị tạo bộ đếm hoặc số suất giả.',
  },
  {
    id: 24,
    name: '24. Nút theo hành trình và thanh cố định trên điện thoại',
    group: 'chotdon',
    groupName: 'Chốt đơn',
    funnelStage: 'Cuối phễu',
    defaultPriority: 'Cao',
  },
  {
    id: 25,
    name: '25. Biểu mẫu thu thông tin theo nhiều mức',
    group: 'chotdon',
    groupName: 'Chốt đơn',
    funnelStage: 'Cuối phễu',
    defaultPriority: 'Cao',
    explanation: 'Chốt đơn · Chỉ đọc cấu trúc; không gửi biểu mẫu thử tới doanh nghiệp.',
  },

  // 26-29: Kỹ thuật
  {
    id: 26,
    name: '26. Tốc độ tải trang',
    group: 'kythuat',
    groupName: 'Kỹ thuật',
    funnelStage: 'Toàn trang',
    defaultPriority: 'Cần xác minh',
    explanation: 'Kỹ thuật · Dung lượng mã nguồn tròn từ lần tải mã nguồn trang; không phải kết quả tốc độ diện thoại tại Việt Nam.',
  },
  {
    id: 27,
    name: '27. Trải nghiệm trên điện thoại',
    group: 'kythuat',
    groupName: 'Kỹ thuật',
    funnelStage: 'Toàn trang',
    defaultPriority: 'Cần xác minh',
  },
  {
    id: 28,
    name: '28. Đo lường và theo dõi chuyển đổi',
    group: 'kythuat',
    groupName: 'Kỹ thuật',
    funnelStage: 'Toàn trang',
    defaultPriority: 'Cần xác minh',
    explanation: 'Kỹ thuật · Thấy đoạn mã không chứng minh sự kiện gửi, ghi nhận đơn hàng hoặc dữ liệu chính xác.',
  },
  {
    id: 29,
    name: '29. Tối ưu công cụ tìm kiếm trên trang',
    group: 'kythuat',
    groupName: 'Kỹ thuật',
    funnelStage: 'Đầu phễu',
    defaultPriority: 'Cần xác minh',
  },

  // 30-35: Đặc thù ngành
  {
    id: 30,
    name: '30. Tải trọng, độ chia, kích thước khớp cấu hình',
    group: 'dacthunganh',
    groupName: 'Đặc thù ngành',
    funnelStage: 'Giữa – Cuối phễu',
    defaultPriority: 'Cao',
  },
  {
    id: 31,
    name: '31. Chọn cân theo môi trường có bằng chứng',
    group: 'dacthunganh',
    groupName: 'Đặc thù ngành',
    funnelStage: 'Giữa phễu',
    defaultPriority: 'Cao',
  },
  {
    id: 32,
    name: '32. Chứng từ đo lường phù hợp nhu cầu',
    group: 'dacthunganh',
    groupName: 'Đặc thù ngành',
    funnelStage: 'Cuối phễu',
    defaultPriority: 'Cao',
    explanation: 'Đặc thù ngành · Phân biệt kiểm tra nội bộ, hiệu chuẩn và kiểm định; xác nhận loại hồ sơ cần dùng với đơn vị chuyên môn.',
  },
  {
    id: 33,
    name: '33. Báo giá tách đã bao gồm và chưa bao gồm',
    group: 'dacthunganh',
    groupName: 'Đặc thù ngành',
    funnelStage: 'Cuối phễu',
    defaultPriority: 'Cao',
  },
  {
    id: 34,
    name: '34. Giao, lắp đặt và hướng dẫn theo địa bàn',
    group: 'dacthunganh',
    groupName: 'Đặc thù ngành',
    funnelStage: 'Cuối phễu',
    defaultPriority: 'Cao',
  },
  {
    id: 35,
    name: '35. Hàng sẵn và thời gian giao dự kiến',
    group: 'dacthunganh',
    groupName: 'Đặc thù ngành',
    funnelStage: 'Cuối phễu',
    defaultPriority: 'Trung bình',
  },
];

export const CRITERIA_LIST = CRITERIA_LIST_35;

export const STATUS_META = {
  good: {
    label: '● Có',
    tooltip: 'Đáp ứng đủ trong nội dung đã kiểm tra',
    color: 'emerald',
    badgeClass: 'text-emerald-700 dark:text-emerald-300 font-semibold',
  },
  partial: {
    label: '◓ Chưa đủ',
    tooltip: 'Có dấu vết, còn thiếu hoặc chưa xác minh phần quan trọng',
    color: 'amber',
    badgeClass: 'text-amber-700 dark:text-amber-300 font-semibold',
  },
  no_evidence: {
    label: '○ Không thấy',
    tooltip: 'Chưa tìm được bằng chứng trong mẫu trang',
    color: 'slate',
    badgeClass: 'text-slate-500 dark:text-slate-400',
  },
  insufficient_data: {
    label: 'Chưa xác minh',
    tooltip: 'Không đủ dữ liệu để kết luận',
    color: 'slate',
    badgeClass: 'text-slate-400 italic',
  },
};
