'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, ShieldCheck, Award, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface LegalInfo {
  organizationName: string;
  licenseNumber: string;
  licensedBy: string;
  licensedDate: string;
  headquarters: string;
  branches: Array<{
    code: string;
    name: string;
    address: string;
  }>;
  tuitionPolicy: {
    standardRefundRule: string;
    reservationRule: string;
    feeList: Array<{
      program: string;
      level: string;
      feeMonthlyVnd: number;
      sessionsPerWeek: number;
    }>;
  };
  teachingStandards: {
    qualificationRate: string;
    internationalCertRate: string;
    curriculumStandards: string;
  };
}

export default function PublicLegalInfoPage() {
  const [legalData, setLegalData] = useState<LegalInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLegalInfo();
  }, []);

  const fetchLegalInfo = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/public/info');
      if (res.ok) {
        const data = await res.json();
        setLegalData(data);
      } else {
        // Fallback compliance data theo TT 29/2024/TT-BGDĐT
        setLegalData({
          organizationName: 'Hệ thống Trung tâm Đào tạo Ngoại ngữ & Tin học CoreLink Academy',
          licenseNumber: 'QĐ-1284/QĐ-SGDĐT-HàNội',
          licensedBy: 'Sở Giáo dục và Đào tạo TP. Hà Nội',
          licensedDate: '15/01/2024',
          headquarters: 'Tòa nhà văn phòng CoreLink, Cầu Giấy, Hà Nội',
          branches: [
            { code: 'HN-CG', name: 'Cơ sở 1 — Cầu Giấy', address: 'Số 18 Phố Duy Tân, P. Dịch Vọng Hậu, Q. Cầu Giấy, Hà Nội' },
            { code: 'HN-TX', name: 'Cơ sở 2 — Thanh Xuân', address: 'Số 45 Đường Nguyễn Trãi, P. Thượng Đình, Q. Thanh Xuân, Hà Nội' },
          ],
          tuitionPolicy: {
            standardRefundRule: 'Hoàn 100% học phí trước ngày khai giảng; hoàn 70% trong vòng 2 tuần đầu nếu học viên không thể tiếp tục theo học vì lý do chính đáng.',
            reservationRule: 'Cho phép bảo lưu học phí tối đa 06 tháng đối với học sinh có đơn xin nghỉ ốm hoặc chuyển nơi cư trú.',
            feeList: [
              { program: 'Tiếng Anh Tiểu học (Cambridge Young Learners)', level: 'Lớp 1 - 5', feeMonthlyVnd: 1500000, sessionsPerWeek: 2 },
              { program: 'Tiếng Anh THCS & Chuyên sâu', level: 'Lớp 6 - 9', feeMonthlyVnd: 1800000, sessionsPerWeek: 2 },
              { program: 'Luyện thi Chuyên cấp 3 & IELTS Foundation', level: 'Lớp 8 - 10', feeMonthlyVnd: 2200000, sessionsPerWeek: 2 },
              { program: 'Luyện thi IELTS Chuyên sâu Cam kết 6.5 - 7.5+', level: 'THPT & SV', feeMonthlyVnd: 2800000, sessionsPerWeek: 3 },
            ],
          },
          teachingStandards: {
            qualificationRate: '100% giáo viên tốt nghiệp Đại học chuyên ngành Sư phạm Ngoại ngữ hoặc Ngôn ngữ Anh',
            internationalCertRate: '92% sở hữu chứng chỉ giảng dạy quốc tế CELTA/TESOL và IELTS 8.0+',
            curriculumStandards: 'Giáo trình xây dựng theo Khung tham chiếu chuẩn Châu Âu CEFR và chuẩn đầu ra Bộ GD&ĐT',
          },
        });
      }
    } catch (err) {
      console.error('Error fetching legal info:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-800 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-lg shadow-sm">
              CL
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 tracking-tight">CoreLink Academy</span>
              <p className="text-xs text-slate-500 font-medium">Công Khai Thông Tin Hoạt Động Giáo Dục</p>
            </div>
          </Link>

          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link href="/courses" className="text-slate-600 hover:text-blue-600 transition-colors">Khóa học</Link>
            <Link href="/register-trial" className="text-slate-600 hover:text-blue-600 transition-colors">Đăng ký học thử</Link>
            <Link href="/info" className="text-blue-600 font-semibold">Công khai pháp lý</Link>
            <Link href="/login" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium">
              Đăng nhập
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 space-y-10">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            Tuân Thủ Thông Tư 29/2024/TT-BGDĐT
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Công Khai Pháp Lý & Quy Chế Hoạt Động
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Bảo đảm tuyệt đối quyền lợi người học, tính minh bạch về biểu phí, cam kết chuẩn mực đội ngũ giảng dạy và quy chuẩn an toàn cơ sở giáo dục.
          </p>
        </div>

        {legalData && (
          <div className="space-y-8">
            {/* 1. Pháp lý & Hệ thống cơ sở */}
            <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">1. Pháp Lý & Hệ Thống Cơ Sở Đào Tạo</h2>
                  <p className="text-xs text-slate-500">Giấy phép thành lập và hoạt động giáo dục chính thức</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-6">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 block mb-1">Tổ chức chủ quản</span>
                  <strong className="text-slate-900 font-semibold">{legalData.organizationName}</strong>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <span className="text-xs text-emerald-700 block mb-1">Số giấy phép hoạt động</span>
                  <strong className="text-emerald-800 font-bold">{legalData.licenseNumber}</strong>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 block mb-1">Cơ quan cấp phép</span>
                  <strong className="text-slate-900 font-semibold">{legalData.licensedBy}</strong>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 block mb-1">Ngày cấp phép</span>
                  <strong className="text-slate-900 font-semibold">{legalData.licensedDate}</strong>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-3">
                  Địa điểm cơ sở được cấp phép hoạt động:
                </h3>
                <div className="space-y-2.5">
                  {legalData.branches.map((b) => (
                    <div key={b.code} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <span className="font-bold text-blue-700">{b.name}</span>
                      <span className="text-slate-600 text-xs sm:text-sm">{b.address}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 2. Niêm yết học phí & Quy chế hoàn */}
            <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">2. Niêm Yết Học Phí & Quy Chế Hoàn / Bảo Lưu</h2>
                  <p className="text-xs text-slate-500">Thực hiện theo Điều 8 Thông tư 29/2024/TT-BGDĐT</p>
                </div>
              </div>

              <div className="overflow-x-auto mb-6">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 text-xs font-semibold">
                      <th className="py-3 px-4">Chương trình đào tạo</th>
                      <th className="py-3 px-4">Cấp độ / Đối tượng</th>
                      <th className="py-3 px-4">Thời lượng</th>
                      <th className="py-3 px-4 text-right">Học phí niêm yết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {legalData.tuitionPolicy.feeList.map((fee, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">{fee.program}</td>
                        <td className="py-3 px-4 text-slate-600">{fee.level}</td>
                        <td className="py-3 px-4 text-slate-600">{fee.sessionsPerWeek} buổi/tuần</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700">
                          {fee.feeMonthlyVnd.toLocaleString('vi-VN')} đ/tháng
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80">
                  <div className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">
                    Chính sách hoàn phí:
                  </div>
                  <p className="text-xs leading-relaxed text-amber-950">
                    {legalData.tuitionPolicy.standardRefundRule}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80">
                  <div className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">
                    Chính sách bảo lưu:
                  </div>
                  <p className="text-xs leading-relaxed text-blue-950">
                    {legalData.tuitionPolicy.reservationRule}
                  </p>
                </div>
              </div>
            </section>

            {/* 3. Tiêu chuẩn đội ngũ giảng viên */}
            <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">3. Tiêu Chuẩn Giảng Viên & Chuẩn Đầu Ra</h2>
                  <p className="text-xs text-slate-500">Đội ngũ sư phạm chất lượng cao được kiểm định định kỳ</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700 font-medium">
                    {legalData.teachingStandards.qualificationRate}
                  </span>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700 font-medium">
                    {legalData.teachingStandards.internationalCertRate}
                  </span>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700 font-medium">
                    {legalData.teachingStandards.curriculumStandards}
                  </span>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
