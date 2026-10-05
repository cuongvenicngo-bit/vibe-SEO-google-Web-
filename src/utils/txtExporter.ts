import { AnalysisReport10X } from '../types';
import { CRITERIA_LIST, STATUS_META } from '../constants/criteria';

export function generateReportTxt(report: AnalysisReport10X): string {
  const dateFormatted = new Date(report.analyzedAt || Date.now()).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const lines: string[] = [];

  // Header
  lines.push('================================================================================');
  lines.push('             BÁO CÁO PHÂN TÍCH WEB 360 - ĐÁNH GIÁ TOÀN DIỆN (BẢN 10X)');
  lines.push('            Đánh giá toàn diện website từ nội dung đến chuyển đổi');
  lines.push('================================================================================');
  lines.push(`Thời gian phân tích: ${dateFormatted}`);
  lines.push(`Website mục tiêu:   ${report.userWebsiteUrl}`);
  lines.push(`Doanh nghiệp:       ${report.businessName || report.businessSummary?.name || 'Doanh nghiệp mục tiêu'}`);
  lines.push(`Ngành nghề:         ${report.businessSummary?.industry || 'Chưa đủ dữ liệu'}`);
  lines.push(`Sản phẩm/dịch vụ:   ${report.businessSummary?.mainProductService || 'Chưa đủ dữ liệu'}`);
  lines.push(`Khu vực kinh doanh: ${report.businessSummary?.location || 'Toàn quốc'}`);
  lines.push(`Khách hàng mục tiêu: ${report.businessSummary?.targetAudience || 'Khách hàng quan tâm'}`);
  lines.push('');
  lines.push('DANH SÁCH 5 ĐỐI THỦ NỔI BẬT ĐƯỢC KIỂM TRA TRONG MẪU TÌM KIẾM:');
  (report.competitorsFound || []).forEach((comp, idx: number) => {
    lines.push(`  ${idx + 1}. ${comp.name} (${comp.url})`);
    lines.push(`     - Truy vấn phát hiện: ${comp.queryFound}`);
    lines.push(`     - Lý do đối chiếu:   ${comp.reason}`);
    lines.push(`     - Mức độ liên quan:  ${comp.relevance.toUpperCase()}`);
    lines.push(`     - Nguồn:             ${comp.source}`);
  });
  lines.push('');
  lines.push('NGUYÊN TẮC PHÂN TÍCH BẮT BUỘC:');
  lines.push('- Mọi dữ liệu dựa trên quan sát thực tế từ website, công cụ tìm kiếm và nguồn công khai.');
  lines.push('- Không tự tạo số liệu: Lượng tìm kiếm, lượt truy cập, doanh thu, tỷ lệ chuyển đổi.');
  lines.push('- Phân biệt rõ: [Quan sát được] / [Nhận định của AI] / [Đề xuất thử nghiệm].');
  lines.push('');

  // PHẦN 1
  lines.push('================================================================================');
  lines.push('PHẦN 1: HỒ SƠ DOANH NGHIỆP & BỐI CẢNH CẠNH TRANH');
  lines.push('================================================================================');
  lines.push(`- Tên doanh nghiệp:     ${report.businessName || report.businessSummary?.name}`);
  lines.push(`- Ngành hoạt động:       ${report.businessSummary?.industry}`);
  lines.push(`- Dòng sản phẩm chính:   ${report.businessSummary?.mainProductService}`);
  lines.push(`- Thị trường trọng tâm:  ${report.businessSummary?.location}`);
  lines.push(`- Từ khóa thương mại:   ${(report.businessSummary?.commercialKeywords || []).join(', ')}`);
  lines.push('');

  // PHẦN 2
  lines.push('================================================================================');
  lines.push('PHẦN 2: HỒ SƠ CHI TIẾT 6 WEBSITE (MỤC TIÊU VÀ 5 ĐỐI THỦ)');
  lines.push('================================================================================');
  (report.competitorProfiles || []).forEach((p, idx: number) => {
    lines.push(`--- [${idx === 0 ? 'WEBSITE MỤC TIÊU CỦA BẠN' : `ĐỐI THỦ ${idx}`}] ${p.name.toUpperCase()} ---`);
    lines.push(`Địa chỉ URL:              ${p.url}`);
    lines.push(`Định vị quan sát được:    ${p.positioning}`);
    lines.push(`Sản phẩm/dịch vụ chính:   ${(p.mainProducts || []).join('; ')}`);
    lines.push(`Nhóm khách hàng hướng tới: ${(p.targetAudience || []).join('; ')}`);
    lines.push(`Tổ chức thanh menu:       ${p.menuOrganization}`);
    lines.push(`Trình bày sản phẩm:       ${p.productPresentation}`);
    lines.push(`Thông điệp cốt lõi:       ${p.keyMessage}`);
    lines.push(`Cam kết đang công bố:     ${p.commitments}`);
    lines.push(`Chính sách bán hàng:      ${p.salesPolicy}`);
    lines.push(`Kênh liên hệ hỗ trợ:      ${(p.contactChannels || []).join(', ')}`);
    lines.push(`Điểm làm tốt:             ${(p.strengths || []).join(' | ')}`);
    lines.push(`Điểm còn hạn chế:         ${(p.weaknesses || []).join(' | ')}`);
    if (!p.isUserSite) {
      lines.push(`Điều website có thể học:  ${(p.learningsForUser || []).join(' | ')}`);
      lines.push(`Chiến lược cạnh tranh:    ${p.competitionStrategy}`);
    }
    lines.push(`Nguồn đối chiếu:          ${(p.verifiedSources || []).join(', ')}`);
    lines.push('');
  });

  // Actionable findings
  if (report.actionableFindings && report.actionableFindings.length > 0) {
    lines.push('--------------------------------------------------------------------------------');
    lines.push('PHÁT HIỆN THỰC TẾ CÓ THỂ HÀNH ĐỘNG NGAY:');
    lines.push('--------------------------------------------------------------------------------');
    report.actionableFindings.forEach((f, idx: number) => {
      lines.push(`${idx + 1}. [${f.category}] ${f.title}`);
      lines.push(`   - Mô tả:        ${f.description}`);
      lines.push(`   - Việc cần làm: ${f.actionNeeded}`);
      lines.push(`   - Thẻ liên kết: ${(f.tags || []).map((t) => t.label + (t.url ? ` (${t.url})` : '')).join(', ')}`);
      lines.push('');
    });
  }

  // PHẦN 3
  lines.push('================================================================================');
  lines.push('PHẦN 3: ĐÁNH GIÁ MA TRẬN 35 TIÊU CHÍ (KHÔNG DÙNG ĐIỂM SỐ GIẢ ĐỊNH)');
  lines.push('================================================================================');
  lines.push('BẢNG XẾP HẠNG TỔNG QUAN:');
  (report.criteriaComparison?.rankings || []).forEach((r) => {
    lines.push(`* ${r.siteName} (${r.siteUrl}): ${r.overallRank}`);
    if (r.groupRanks) {
      lines.push(`   - Điều hướng: ${r.groupRanks.dieuhuong || '—'} | Tin cậy: ${r.groupRanks.tincay || '—'} | Nội dung: ${r.groupRanks.noidung || '—'}`);
      lines.push(`   - Tương tác: ${r.groupRanks.tuongtac || '—'} | Chốt đơn: ${r.groupRanks.chotdon || '—'} | Kỹ thuật: ${r.groupRanks.kythuat || '—'}`);
    }
  });
  lines.push('');
  lines.push('CHI TIẾT ĐÁNH GIÁ CÁC TIÊU CHÍ CHO WEBSITE MỤC TIÊU:');
  CRITERIA_LIST.forEach((crit) => {
    const evalData = report.criteriaComparison?.evaluations?.[crit.id]?.[report.userWebsiteUrl];
    const statusMetaItem = evalData ? (STATUS_META as any)[evalData.status] : null;
    const statusText = statusMetaItem?.label || (evalData ? evalData.status : 'Chưa đủ dữ liệu để xác minh');
    lines.push(`Tiêu chí ${crit.id}. [${crit.groupName}] ${crit.name}`);
    lines.push(`  - Trạng thái:        ${statusText}`);
    if (evalData) {
      lines.push(`  - Bằng chứng:        ${evalData.evidence}`);
      lines.push(`  - Lý do:             ${evalData.reason}`);
      lines.push(`  - Giới hạn nhận định:${evalData.limitation}`);
      lines.push(`  - Đề xuất:           ${evalData.userRecommendation}`);
    }
    lines.push('');
  });

  // PHẦN 4
  lines.push('================================================================================');
  lines.push('PHẦN 4: KHOẢNG TRỐNG CƠ HỘI ĐỘT PHÁ 10X');
  lines.push('================================================================================');
  const oppList = report.opportunityGaps10X || (report as any).opportunityGaps || [];
  oppList.forEach((opp: any, idx: number) => {
    lines.push(`Cơ hội ${opp.orderNumber || idx + 1}: ${opp.title} [${opp.badge || opp.typeName || 'Cơ hội'}]`);
    lines.push(`  - Vấn đề quan sát:   ${opp.description || opp.observedIssue}`);
    lines.push(`  - Vì sao quan tâm:   ${opp.whyOpportunity || opp.whyCare}`);
    lines.push(`  - Việc cần làm:      ${opp.actionNeeded}`);
    lines.push(`  - Tầng phễu:         ${opp.funnelStage || 'Toàn trang'} (Thời gian dự kiến: ${opp.estimatedTimeline})`);
    lines.push('');
  });

  // PHẦN 5
  lines.push('================================================================================');
  lines.push('PHẦN 5: CHIẾN LƯỢC NỘI DUNG VÀ TỐI ƯU HÓA TÌM KIẾM (SEO 10X)');
  lines.push('================================================================================');
  lines.push('A. THÔNG ĐIỆP BÁN HÀNG CỐT LÕI:');
  lines.push(`- Tiêu đề chính:      ${report.mainSalesMessage?.headline || 'Chưa đủ dữ liệu'}`);
  lines.push(`- Phụ đề làm rõ:      ${report.mainSalesMessage?.subheadline || 'Chưa đủ dữ liệu'}`);
  lines.push('- 3 Trụ cột thuyết phục:');
  (report.mainSalesMessage?.threePillars || []).forEach((pil, i: number) => {
    lines.push(`   ${i + 1}. ${pil.title}: ${pil.desc}`);
  });
  lines.push('');
  lines.push('B. 3 CHÂN DUNG KHÁCH HÀNG 10X:');
  (report.personas10X || []).forEach((p, i: number) => {
    lines.push(`Chân dung ${i + 1} [${p.groupNumber}]: ${p.title} (${p.persona})`);
    lines.push(`  - Nỗi đau:         ${p.pain}`);
    lines.push(`  - Mong muốn:       ${p.desire}`);
    lines.push(`  - Vấn đề:          ${p.problem}`);
    lines.push(`  - Giải pháp:       ${p.solution}`);
    lines.push(`  - Câu chuyện thực: ${p.story}`);
    lines.push(`  - Thông điệp:      ${p.message}`);
    lines.push(`  - Nút kêu gọi CTA: ${p.cta}`);
    lines.push('');
  });
  lines.push('C. NỖI SỢ & CAM KẾT HÓA GIẢI:');
  (report.fearsAndCommitments || []).forEach((fc, i: number) => {
    lines.push(`${i + 1}. Điểm đau: ${fc.painPoint}`);
    lines.push(`   - Vì sao sợ:       ${fc.whyCustomerAfraid}`);
    lines.push(`   - Cam kết cần ghi: ${fc.commitmentOnPage}`);
    lines.push('');
  });

  // PHẦN 6
  lines.push('================================================================================');
  lines.push('PHẦN 6: KẾ HOẠCH SẢN XUẤT HÌNH ẢNH, VIDEO VÀ BIỂU MẪU (10X STUDIO)');
  lines.push('================================================================================');
  lines.push('A. 5 BANNER CHIẾN LƯỢC:');
  (report.bannerProduction || []).forEach((b, i: number) => {
    lines.push(`Banner ${i + 1} (${b.position}):`);
    lines.push(`  - Tiêu đề:   ${b.title}`);
    lines.push(`  - Phụ đề:    ${b.subtitle}`);
    lines.push(`  - Yêu cầu:   ${b.imageNeeded}`);
    lines.push(`  - Nút bấm:   ${b.buttonText}`);
    lines.push('');
  });
  lines.push('B. 4 KỊCH BẢN VIDEO THỰC TẾ:');
  (report.videoScripts10X || []).forEach((v, i: number) => {
    lines.push(`Video ${i + 1} [${v.videoNumber}]: ${v.title} (${v.context})`);
    (v.timeline || []).forEach((sc) => {
      lines.push(`   [${sc.timestamp}] ${sc.description}`);
    });
    lines.push('');
  });
  lines.push('C. BIỂU MẪU CHUYỂN ĐỔI CAO:');
  (report.forms10X || []).forEach((f, i: number) => {
    lines.push(`Biểu mẫu ${i + 1} (${f.position}): ${f.title}`);
    lines.push(`  - Trường nhập: ${f.fields}`);
    lines.push(`  - Nút bấm:     ${f.submitButtonText}`);
    lines.push(`  - Cam kết:     ${f.commitment}`);
    lines.push('');
  });

  // PHẦN 7
  lines.push('================================================================================');
  lines.push('PHẦN 7: LỘ TRÌNH TRIỂN KHAI THỰC THI 3 GIAI ĐOẠN (ROADMAP 10X)');
  lines.push('================================================================================');
  const tasks = report.roadmapTasks10X || [];
  tasks.forEach((t, i: number) => {
    const statusText = t.status === 'completed' ? 'Đã hoàn thành' : t.status === 'in_progress' ? 'Đang làm' : 'Chưa làm';
    lines.push(`Nhiệm vụ ${i + 1} [Giai đoạn ${t.phaseId}: ${t.phaseTimeline}]: ${t.taskName}`);
    lines.push(`  - Trạng thái:     ${statusText}`);
    lines.push(`  - Giải quyết:     ${t.gapResolved}`);
    lines.push(`  - Bộ phận:        ${t.department}`);
    lines.push(`  - Chỉ số theo dõi:${t.metricToTrack}`);
    lines.push('');
  });

  // PHẦN 8
  lines.push('================================================================================');
  lines.push('PHẦN 8: DANH SÁCH NGUỒN DỮ LIỆU ĐỐI CHIẾU & XÁC MINH');
  lines.push('================================================================================');
  (report.verifiedSourcesList || []).forEach((src: string, idx: number) => {
    lines.push(`[${idx + 1}] ${src}`);
  });
  lines.push('');
  lines.push('--- HẾT BÁO CÁO PHÂN TÍCH WEB 360 (10X COMMERCIAL EDITION) ---');

  return lines.join('\n');
}

export function downloadReportTxt(report: AnalysisReport10X): void {
  const content = generateReportTxt(report);
  let domain = 'website';
  try {
    const urlObj = new URL(report.userWebsiteUrl);
    domain = urlObj.hostname.replace(/[^a-zA-Z0-9-]/g, '_');
  } catch {
    domain = (report.userWebsiteUrl || 'website').replace(/[^a-zA-Z0-9-]/g, '_');
  }
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `phan-tich-web-360-${domain}-${dateStr}.txt`;

  // UTF-8 BOM (\uFEFF) ensures proper rendering of Vietnamese characters in Notepad and text editors
  const blob = new Blob(['\uFEFF' + content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

// Generate printable HTML client presentation for global commercial use
export function printReportHtml(report: AnalysisReport10X): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Báo Cáo Phân Tích Web 360 - ${report.businessName || 'Doanh Nghiệp'}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 900px; margin: 0 auto; padding: 40px 20px; }
    h1 { color: #0f172a; border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 8px; font-size: 26px; }
    h2 { color: #1e3a8a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 32px; font-size: 19px; }
    h3 { color: #2563eb; margin-top: 20px; font-size: 16px; }
    .badge { display: inline-block; padding: 3px 8px; font-size: 12px; font-weight: 600; border-radius: 4px; background: #e0f2fe; color: #0369a1; }
    .badge-urgent { background: #ffe4e6; color: #be123c; }
    .badge-improve { background: #fef3c7; color: #b45309; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
    th { background: #f1f5f9; font-weight: 600; }
    .meta-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; margin-bottom: 24px; }
    @media print {
      body { padding: 0; font-size: 12px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; text-align: right;">
    <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">In báo cáo / Lưu PDF</button>
  </div>
  <h1>PHÂN TÍCH WEB 360 - BÁO CÁO TOÀN DIỆN</h1>
  <div class="meta-box">
    <strong>Website mục tiêu:</strong> ${report.userWebsiteUrl} | 
    <strong>Doanh nghiệp:</strong> ${report.businessName} | 
    <strong>Ngày kiểm tra:</strong> ${new Date(report.analyzedAt).toLocaleDateString('vi-VN')}
  </div>

  <h2>1. Hồ sơ doanh nghiệp & 5 đối thủ nổi bật</h2>
  <p><strong>Ngành nghề:</strong> ${report.businessSummary?.industry}</p>
  <p><strong>Sản phẩm/Dịch vụ chính:</strong> ${report.businessSummary?.mainProductService}</p>
  <p><strong>Thị trường mục tiêu:</strong> ${report.businessSummary?.location}</p>
  
  <table>
    <thead>
      <tr>
        <th>STT</th>
        <th>Website</th>
        <th>Loại</th>
        <th>Định vị quan sát được</th>
        <th>Điểm mạnh</th>
        <th>Điểm hạn chế</th>
      </tr>
    </thead>
    <tbody>
      ${(report.competitorProfiles || [])
        .map(
          (p, i) => `
        <tr>
          <td>${i + 1}</td>
          <td><strong>${p.name}</strong><br><small>${p.url}</small></td>
          <td>${p.isUserSite ? '<span class="badge">Mục tiêu</span>' : 'Đối thủ'}</td>
          <td>${p.positioning}</td>
          <td>${(p.strengths || []).slice(0, 2).join('; ')}</td>
          <td>${(p.weaknesses || []).slice(0, 2).join('; ')}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <h2>2. Khoảng trống cơ hội đột phá (10X Opportunity Gaps)</h2>
  ${(report.opportunityGaps10X || [])
    .map(
      (g) => `
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0;">#${g.orderNumber} ${g.title}</h3>
        <span class="badge ${g.badgeType === 'urgent' ? 'badge-urgent' : g.badgeType === 'improve' ? 'badge-improve' : ''}">${g.badge}</span>
      </div>
      <p style="margin: 8px 0;"><strong>Vấn đề:</strong> ${g.description}</p>
      <p style="margin: 8px 0;"><strong>Cơ hội:</strong> ${g.whyOpportunity}</p>
      <p style="margin: 8px 0; color: #166534;"><strong>Việc cần làm:</strong> ${g.actionNeeded}</p>
      <small style="color: #64748b;">Tầng phễu: ${g.funnelStage} | Thời gian ước tính: ${g.estimatedTimeline}</small>
    </div>
  `
    )
    .join('')}

  <h2>3. Thông điệp bán hàng & Chân dung khách hàng 10X</h2>
  <div class="card" style="background: #f0fdf4; border-color: #bbf7d0;">
    <h3 style="color: #15803d; margin-top: 0;">${report.mainSalesMessage?.headline}</h3>
    <p>${report.mainSalesMessage?.subheadline}</p>
    <ul>
      ${(report.mainSalesMessage?.threePillars || []).map((p) => `<li><strong>${p.title}:</strong> ${p.desc}</li>`).join('')}
    </ul>
  </div>

  <h2>4. Lộ trình triển khai 3 giai đoạn (Roadmap 10X)</h2>
  <table>
    <thead>
      <tr>
        <th>Giai đoạn</th>
        <th>Nhiệm vụ</th>
        <th>Vấn đề giải quyết</th>
        <th>Phụ trách</th>
        <th>Chỉ số theo dõi</th>
      </tr>
    </thead>
    <tbody>
      ${(report.roadmapTasks10X || [])
        .map(
          (t) => `
        <tr>
          <td><strong>GĐ ${t.phaseId}</strong><br><small>${t.phaseTimeline}</small></td>
          <td><strong>${t.taskName}</strong></td>
          <td>${t.gapResolved}</td>
          <td>${t.department}</td>
          <td>${t.metricToTrack}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <footer style="margin-top: 50px; border-top: 1px solid #cbd5e1; padding-top: 16px; font-size: 11px; color: #64748b; text-align: center;">
    Báo cáo xuất từ nền tảng PHÂN TÍCH WEB 360 · Đánh giá chuẩn xác thực · Bản thương mại toàn cầu
  </footer>
</body>
</html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
