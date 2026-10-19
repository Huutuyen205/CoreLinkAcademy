'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Clock,
  Users,
  ArrowRight,
  Search,
  CheckCircle2,
  Award,
  Sparkles,
  Star,
  Calendar,
  Layers,
  GraduationCap,
  ShieldCheck,
  ChevronRight,
  Filter,
  X,
  PhoneCall,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  BadgePercent,
  Brain,
  Video,
  MapPin,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';

interface CourseModule {
  title: string;
  duration: string;
  focus: string;
  aiPractice: string;
}

interface CourseItem {
  id: string;
  code: string;
  name: string;
  levelCategory: 'all' | 'pre' | 'primary' | 'lower_sec' | 'ielts' | 'chuyen' | 'business' | 'special';
  levelName: string;
  targetBand: string;
  ageGroup: string;
  badge?: string;
  isPopular?: boolean;
  rating: number;
  ratingCount: number;
  studentsEnrolled: number;
  tagline: string;
  description: string;
  durationSessions: number;
  durationMonths: string;
  schedule: string;
  classSize: string;
  studyFormat: 'Offline tại cơ sở' | 'Online tương tác cao' | 'Linh hoạt Offline + Online' | '1-kèm-1 AI Coach';
  feeAmountVnd: number;
  originalFeeAmountVnd: number;
  discountPercent: number;
  monthlyEstimateVnd: number;
  highlights: string[];
  outcomes: string[];
  teacher: {
    name: string;
    degree: string;
    certifications: string;
    avatarInitials: string;
    experience: string;
  };
  aiTechFeature: string;
  syllabus: CourseModule[];
}

const COURSES_DATA: CourseItem[] = [
  {
    id: 'c-pre-01',
    code: 'CAM-STARTERS-01',
    name: 'Tiếng Anh Tiền Tiểu Học — Phát Âm Chuẩn & Phản Xạ Ngữ Âm Tự Nhiên (Starters Pre-A1)',
    levelCategory: 'pre',
    levelName: 'Tiền Tiểu Học (4 - 6 tuổi)',
    targetBand: 'Cambridge Starters Pre-A1',
    ageGroup: '4 - 6 tuổi',
    badge: 'Khởi đầu hoàn hảo',
    isPopular: true,
    rating: 4.95,
    ratingCount: 142,
    studentsEnrolled: 620,
    tagline: 'Đánh thức niềm say mê ngôn ngữ qua phương pháp học tương tác trực quan sinh động.',
    description: 'Chương trình thiết kế chuyên biệt cho lứa tuổi mầm non và tiền tiểu học theo khung Cambridge Early Years. Học sinh tiếp thu tiếng Anh tự nhiên như tiếng mẹ đẻ qua hoạt động nhập vai, bài hát và dự án nhỏ, kết hợp trợ lý AI rèn phản xạ phát âm ngữ âm chuẩn xác ngay từ ban đầu.',
    durationSessions: 36,
    durationMonths: '4.5 tháng',
    schedule: '2 buổi / tuần (75 phút / buổi)',
    classSize: '8 - 10 bé',
    studyFormat: 'Offline tại cơ sở',
    feeAmountVnd: 4200000,
    originalFeeAmountVnd: 5250000,
    discountPercent: 20,
    monthlyEstimateVnd: 930000,
    highlights: [
      '100% giáo viên bản ngữ kết hợp trợ giảng sư phạm Việt Nam',
      'Sĩ số nhỏ giới hạn 8 - 10 bé đảm bảo quan tâm sát sao từng em',
      'Trợ lý AI Kids phát âm giúp phụ huynh đồng hành luyện đọc tại nhà',
      'Đánh giá phản xạ định kỳ gửi video học tập trực tiếp cho cha mẹ',
    ],
    outcomes: [
      'Làm chủ 200+ từ vựng quen thuộc về gia đình, màu sắc, động vật, số đếm',
      'Phát âm chuẩn 44 âm ngữ âm Phonics, không bị nói ngọng hay thiếu âm cuối',
      'Tự tin giao tiếp và trả lời các mẫu câu ngắn chào hỏi, giới thiệu bản thân',
      'Hình thành tâm thế hào hứng, yêu thích học tiếng Anh khi bước vào lớp 1',
    ],
    teacher: {
      name: 'ThS. Emma Watson & Cô Thu Hà',
      degree: 'Cử nhân Sư phạm Tiếng Anh — MA Early Childhood',
      certifications: 'CELTA Cambridge, 8 năm chuyên môn mầm non',
      avatarInitials: 'EW',
      experience: '8 năm kinh nghiệm giảng dạy trẻ em quốc tế',
    },
    aiTechFeature: 'AI Kids Pronunciation: Lắng nghe giọng đọc của bé, chấm điểm sao khích lệ và chỉ ra âm vị cần hoàn thiện tức thì.',
    syllabus: [
      { title: 'Giai đoạn 1: Khám phá Thế giới Ngữ âm Phonics', duration: 'Tuần 1 - 4', focus: 'Bảng chữ cái & 24 âm đơn cốt lõi qua câu chuyện', aiPractice: 'AI Mini-Game nhận diện âm thanh và từ vựng cơ bản' },
      { title: 'Giai đoạn 2: Gia đình, Bản thân & Trường lớp', duration: 'Tuần 5 - 8', focus: 'Phản xạ câu hỏi What/Who/Where đơn giản', aiPractice: 'AI Phonics Flashcards ghi âm và chấm điểm giọng đọc' },
      { title: 'Giai đoạn 3: Thế giới Tự nhiên & Động vật quanh em', duration: 'Tuần 9 - 14', focus: 'Mô tả hình ảnh bằng 3-4 câu hoàn chỉnh', aiPractice: 'Tương tác nhập vai kể chuyện với linh vật AI CoreLink' },
      { title: 'Giai đoạn 4: Tổng kết & Tự tin Thuyết trình Nhỏ', duration: 'Tuần 15 - 18', focus: 'Thực hành bài thi mô phỏng Starters Speaking', aiPractice: 'Mô phỏng phỏng vấn khảo thí Cambridge 1-1 với AI' },
    ],
  },
  {
    id: 'c-pri-02',
    code: 'CAM-FLYERS-02',
    name: 'Cambridge Tiểu Học Toàn Diện — Bứt Phá 15 Khiên Movers / Flyers & Tư Duy Toàn Cầu (A1 - A2)',
    levelCategory: 'primary',
    levelName: 'Tiểu Học (7 - 10 tuổi)',
    targetBand: 'Cambridge Movers (A1) & Flyers (A2)',
    ageGroup: 'Lớp 1 - Lớp 5',
    badge: 'Cam kết 14-15 Khiên',
    isPopular: true,
    rating: 4.98,
    ratingCount: 286,
    studentsEnrolled: 1240,
    tagline: 'Phát triển toàn diện 4 kỹ năng Nghe - Nói - Đọc - Viết chuẩn khảo thí Cambridge YLE.',
    description: 'Khóa học được xây dựng theo chuẩn Khung tham chiếu Châu Âu (CEFR A1-A2) và bộ đề Cambridge YLE mới nhất. Tích hợp phương pháp Học tập qua Dự án (Project-Based Learning) rèn luyện tư duy phản biện, kết hợp phòng Lab AI Speaking luyện phát âm và ngữ điệu giúp các em tự tin chinh phục tối đa 15 khiên Cambridge.',
    durationSessions: 40,
    durationMonths: '5 tháng',
    schedule: '2 buổi / tuần (90 phút / buổi)',
    classSize: '10 - 12 học viên',
    studyFormat: 'Linh hoạt Offline + Online',
    feeAmountVnd: 4900000,
    originalFeeAmountVnd: 6100000,
    discountPercent: 20,
    monthlyEstimateVnd: 980000,
    highlights: [
      'Cam kết chuẩn đầu ra 14 - 15 khiên bằng văn bản đào tạo minh bạch',
      'Giáo trình bản quyền Cambridge University Press cập nhật mới nhất',
      'Trợ lý AI chấm bài tự luận Writing và phân tích ngữ điệu Nói 24/7',
      'Báo cáo kết quả chi tiết từng buổi học gửi qua App Phụ huynh theo thời gian thực',
    ],
    outcomes: [
      'Nắm vững 800+ từ vựng học thuật tiểu học và 25 cấu trúc ngữ pháp trọng tâm',
      'Nghe hiểu trọn vẹn các đoạn hội thoại dài 3 - 5 phút của người bản xứ',
      'Tự tin thuyết trình một chủ đề trước đám đông trong thời lượng 3 - 5 phút',
      'Đạt tối thiểu 14 - 15 khiên bài thi khảo thí quốc tế Cambridge Flyers',
    ],
    teacher: {
      name: 'Thầy Trần Quốc Tuấn',
      degree: 'Cử nhân ĐH Sư Phạm Hà Nội — Khoa Sư phạm Tiếng Anh',
      certifications: 'IELTS 8.0, TESOL Certificate, 10 năm KN luyện thi YLE',
      avatarInitials: 'TT',
      experience: 'Đã dẫn dắt hơn 400 học sinh đạt điểm tuyệt đối 15 khiên',
    },
    aiTechFeature: 'AI Cambridge Lab: Chấm điểm bài nói Speaking theo 4 tiêu chí của giám khảo Cambridge, hướng dẫn ngữ điệu câu hỏi và nối âm.',
    syllabus: [
      { title: 'Chương 1: Nền tảng Ngữ pháp & Từ vựng Chuyên sâu', duration: 'Tuần 1 - 4', focus: 'Thời thì cơ bản, giới từ, mạo từ và danh từ đếm được', aiPractice: 'Flashcard lặp lại ngắt quãng SM-2 củng cố từ vựng' },
      { title: 'Chương 2: Đọc hiểu & Kỹ năng Viết đoạn ngắn', duration: 'Tuần 5 - 9', focus: 'Chiến thuật Skimming/Scanning và viết đoạn văn miêu tả', aiPractice: 'AI Writing Assistant sửa lỗi chính tả và gợi ý cấu trúc hay' },
      { title: 'Chương 3: Nghe tương tác & Thuyết trình Dự án', duration: 'Tuần 10 - 15', focus: 'Xây dựng bài thuyết trình nhóm, tranh biện đơn giản', aiPractice: 'Luyện nói shadowing cùng trợ lý giọng đọc chuẩn Anh - Anh' },
      { title: 'Chương 4: Luyện giải Đề thi Khảo thí Cambridge', duration: 'Tuần 16 - 20', focus: 'Luyện 10 bộ đề thi thật Starters/Movers/Flyers bấm giờ', aiPractice: 'Thi thử trên phần mềm khảo thí AI chấm điểm tức thời' },
    ],
  },
  {
    id: 'c-sec-03',
    code: 'CAM-KETPET-03',
    name: 'Cambridge THCS Học Thuật & Luyện Thi KET / PET (A2 - B1) — Bệ Phóng Chuyên Sâu',
    levelCategory: 'lower_sec',
    levelName: 'THCS (11 - 14 tuổi)',
    targetBand: 'Cambridge KET (A2) & PET (B1)',
    ageGroup: 'Lớp 6 - Lớp 9',
    badge: 'Chương trình Trọng điểm',
    isPopular: true,
    rating: 4.96,
    ratingCount: 198,
    studentsEnrolled: 890,
    tagline: 'Làm chủ ngữ pháp học thuật, kỹ năng viết luận và phản xạ thảo luận chuyên sâu.',
    description: 'Chương trình được thiết kế chuẩn xác theo định dạng kỳ thi KET/PET Cambridge, giúp học sinh THCS củng cố toàn diện ngữ pháp nâng cao, phát triển kỹ năng viết luận ngắn 100 từ và thảo luận quan điểm. Là bước đệm hoàn hảo để bước vào lộ trình luyện thi Chuyên Anh cấp 3 và IELTS Academic.',
    durationSessions: 48,
    durationMonths: '6 tháng',
    schedule: '2 buổi / tuần (90 phút / buổi)',
    classSize: '10 - 12 học viên',
    studyFormat: 'Linh hoạt Offline + Online',
    feeAmountVnd: 5600000,
    originalFeeAmountVnd: 7000000,
    discountPercent: 20,
    monthlyEstimateVnd: 933000,
    highlights: [
      'Hệ thống hóa toàn bộ ngữ pháp THCS bám sát chuẩn Bộ GD&ĐT và Cambridge',
      'Chấm chữa bài luận chi tiết 1-1 với giáo viên chuyên môn cao',
      'Phần mềm AI phân tích lỗi sai thường gặp trong các đề thi tuyển sinh',
      'Cam kết đạt chứng chỉ KET/PET với kết quả Pass with Merit hoặc Distinction',
    ],
    outcomes: [
      'Sở hữu 1.500 từ vựng học thuật B1 và cấu trúc câu phức, câu ghép nhuần nhuyễn',
      'Tự tin viết thư điện tử và bài luận văn nghị luận ngắn 100 - 120 từ',
      'Đạt điểm 9.0+ môn Tiếng Anh trong các kỳ thi học kỳ và kiểm tra trên lớp',
      'Sẵn sàng bước vào khóa luyện đề Chuyên Anh vào lớp 10 hoặc IELTS 5.5+',
    ],
    teacher: {
      name: 'ThS. Nguyễn Mai Linh',
      degree: 'Thạc sĩ TESOL — University of Sydney (Úc)',
      certifications: 'IELTS 8.5 Overall, 9 năm luyện thi Cambridge THCS',
      avatarInitials: 'ML',
      experience: 'Đã giúp hơn 600 học viên vượt kỳ thi PET đạt Distinction',
    },
    aiTechFeature: 'AI Essay Evaluator: Phân tích mạch lạc (Cohesion), từ vựng học thuật (Lexical) và ngữ pháp câu phức theo chuẩn khảo thí Cambridge.',
    syllabus: [
      { title: 'Phần 1: Cấu trúc Câu Phức & Ngữ pháp Học thuật', duration: 'Tuần 1 - 6', focus: 'Mệnh đề quan hệ, câu điều kiện hỗn hợp, thể bị động nâng cao', aiPractice: 'Bài tập biến đổi câu tự động chấm và giải thích chi tiết' },
      { title: 'Phần 2: Viết Luận & Trình bày Quan điểm Ngắn', duration: 'Tuần 7 - 12', focus: 'Kỹ thuật viết thư thân mật, thư trang trọng và câu chuyện ngắn', aiPractice: 'AI Writing Coach gợi ý từ nối và sửa lỗi hành văn' },
      { title: 'Phần 3: Đọc Hiểu Nâng cao & Mở rộng Vốn từ B1', duration: 'Tuần 13 - 18', focus: 'Đọc hiểu báo chí khoa học, văn học và suy luận ngữ cảnh', aiPractice: 'Bộ thẻ từ vựng Oxford 3000 tích hợp phát âm chuẩn IPA' },
      { title: 'Phần 4: Luyện Đề Chuẩn Khảo thí PET B1', duration: 'Tuần 19 - 24', focus: 'Giải đề thi chính thức các năm gần nhất kèm chiến thuật thi', aiPractice: 'Mock Test mô phỏng áp lực phòng thi thật 100%' },
    ],
  },
  {
    id: 'c-chuyen-04',
    code: 'SPEC-V10-04',
    name: 'Luyện Thi Vào Lớp 10 Chuyên Anh & Trường Trọng Điểm — Chiến Thuật Chinh Phục Điểm 9+',
    levelCategory: 'chuyen',
    levelName: 'Luyện Thi Chuyên (13 - 15 tuổi)',
    targetBand: 'Chuyên Anh (Ams, Chuyên Sư Phạm, CNN)',
    ageGroup: 'Lớp 8 - Lớp 9',
    badge: 'Tỷ lệ đỗ 92.4%',
    isPopular: false,
    rating: 4.99,
    ratingCount: 112,
    studentsEnrolled: 340,
    tagline: 'Kho đề thi thử độc quyền, làm chủ bẫy đề thi nâng cao và kỹ thuật viết luận đỉnh cao.',
    description: 'Chương trình được biên soạn bởi các thầy cô cựu tổ trưởng chuyên môn trường THPT Chuyên Hà Nội - Amsterdam và Chuyên Ngoại Ngữ. Khóa học tập trung giải mã các dạng bài biến hóa: Word Form nâng cao, Cụm động từ (Phrasal Verbs), Thành ngữ (Idioms), Viết lại câu không đổi nghĩa và bài luận chuyên sâu.',
    durationSessions: 48,
    durationMonths: '6 tháng',
    schedule: '2 buổi / tuần (100 phút / buổi)',
    classSize: '8 - 10 học viên',
    studyFormat: 'Offline tại cơ sở',
    feeAmountVnd: 6800000,
    originalFeeAmountVnd: 8500000,
    discountPercent: 20,
    monthlyEstimateVnd: 1133000,
    highlights: [
      'Đội ngũ giảng viên 15+ năm kinh nghiệm trực tiếp ra đề và chấm thi Chuyên',
      'Ngân hàng đề thi thử bám sát ma trận đề thi Chuyên Sư Phạm, Chuyên Ngoại Ngữ, Ams',
      'Học nhóm nhỏ tối đa 10 học sinh, kèm sát điểm yếu từng dạng bài cụ thể',
      'Chương trình hỗ trợ giải đáp bài tập khó trực tuyến 24/7 với giáo viên trợ giảng',
    ],
    outcomes: [
      'Nắm chắc 100% các chủ điểm ngữ pháp chuyên sâu và hơn 1.200 cụm Idioms/Collocations',
      'Kỹ xảo làm bài đọc hiểu dài (Reading Cloze Test, Multiple Matching) đạt tốc độ tối ưu',
      'Viết lại câu đạt điểm tuyệt đối 10/10 với vốn cấu trúc câu đa dạng',
      'Tự tin bước vào phòng thi với tâm thế vững vàng và tỷ lệ đỗ trường Chuyên trên 90%',
    ],
    teacher: {
      name: 'TS. Lê Hoàng Nam',
      degree: 'Tiến sĩ Lý luận & Phương pháp Dạy học Tiếng Anh',
      certifications: 'Cựu chuyên viên khảo thí, 16 năm luyện thi THPT Chuyên',
      avatarInitials: 'HN',
      experience: 'Hơn 800 học trò đã trúng tuyển Chuyên Ngoại Ngữ và Ams',
    },
    aiTechFeature: 'AI Exam Analytics: Dự đoán điểm số và nhận diện dạng bài học viên thường làm sai để tự động sinh bài tập khắc phục trọng điểm.',
    syllabus: [
      { title: 'Chuyên đề 1: Word Form Biến hóa & Cụm Collocations', duration: 'Tuần 1 - 6', focus: 'Bảng gốc từ Hy Lạp - Latin và quy luật cấu tạo từ nâng cao', aiPractice: 'Ngân hàng 2.000 câu Word Formation trắc nghiệm thông minh' },
      { title: 'Chuyên đề 2: Phrasal Verbs & Thành ngữ Chuyên sâu', duration: 'Tuần 7 - 12', focus: '500 cụm động từ và Idioms xuất hiện nhiều nhất trong đề Chuyên', aiPractice: 'Mini-test tương tác theo ngữ cảnh thực tế hàng ngày' },
      { title: 'Chuyên đề 3: Kỹ thuật Giải Bài Đọc Điền & Tìm Lỗi Sai', duration: 'Tuần 13 - 18', focus: 'Triệt tiêu bẫy ngữ pháp và mẹo làm Cloze Test đạt điểm tuyệt đối', aiPractice: 'AI đối chiếu đáp án và chỉ rõ căn cứ suy luận trong đoạn văn' },
      { title: 'Chuyên đề 4: Luyện Đề Thực Chiến & Chữa Chi Tiết', duration: 'Tuần 19 - 24', focus: 'Giải 20 bộ đề thi chính thức có bấm giờ áp lực phòng thi', aiPractice: 'Mô phỏng thi trực tuyến xếp hạng với học sinh cả nước' },
    ],
  },
  {
    id: 'c-ielts-05',
    code: 'IELTS-FND-05',
    name: 'IELTS Foundation — Xây Vững Nền Tảng Học Thuật & Chiến Thuật 4 Kỹ Năng (Target 5.0 - 5.5+)',
    levelCategory: 'ielts',
    levelName: 'Luyện Thi IELTS (14+ tuổi)',
    targetBand: 'IELTS 5.0 - 5.5+',
    ageGroup: 'Học sinh THPT & Sinh viên',
    badge: 'Xây nền vững chắc',
    isPopular: true,
    rating: 4.94,
    ratingCount: 312,
    studentsEnrolled: 1450,
    tagline: 'Phương pháp Shadowing và Spaced Repetition giúp học viên mất gốc lấy lại căn bản thần tốc.',
    description: 'Khóa học được thiết kế dành riêng cho học viên mất gốc hoặc chưa từng tiếp xúc với bài thi IELTS Academic. Giúp học viên làm quen với cấu trúc đề thi chuẩn Cambridge, mở rộng 2.500 từ vựng học thuật Oxford 3000, phát âm chuẩn IPA không còn ậm ừ khi nói và biết cách triển khai đoạn văn Writing Task 1 & 2 mạch lạc.',
    durationSessions: 48,
    durationMonths: '6 tháng',
    schedule: '2 buổi / tuần (90 phút / buổi)',
    classSize: '10 - 12 học viên',
    studyFormat: 'Linh hoạt Offline + Online',
    feeAmountVnd: 6500000,
    originalFeeAmountVnd: 8125000,
    discountPercent: 20,
    monthlyEstimateVnd: 1083000,
    highlights: [
      'Lộ trình cá nhân hóa theo điểm test đầu vào của từng học viên',
      'Sửa phát âm IPA từng nguyên âm và phụ âm với công nghệ AI Speech Coach',
      'Chấm chữa bài Writing 1-1 không giới hạn số lượng bài nộp',
      'Cam kết đầu ra tối thiểu Band 5.0 - 5.5 bằng văn bản pháp lý hợp đồng',
    ],
    outcomes: [
      'Nắm vững toàn bộ cấu trúc bài thi IELTS 4 kỹ năng Nghe - Nói - Đọc - Viết',
      'Làm chủ 2.500 từ vựng cốt lõi thường gặp trong các đề thi Academic',
      'Nói lưu loát Part 1 các chủ đề quen thuộc không bị vấp hay ngại ngùng',
      'Viết bài Writing Task 1 và Task 2 đúng bố cục 4 đoạn chuẩn học thuật',
    ],
    teacher: {
      name: 'ThS. Sarah Jenkins & Thầy Đức Huy',
      degree: 'ThS. Ngôn Ngữ Học Ứng Dụng (Applied Linguistics)',
      certifications: 'Cựu giám khảo chấm thi khảo thí quốc tế, IELTS 8.5',
      avatarInitials: 'SJ',
      experience: '12 năm giảng dạy IELTS học thuật tại nhiều quốc gia',
    },
    aiTechFeature: 'AI Speaking Partner: Luyện nói 1-1 mọi lúc với trợ lý AI giọng bản xứ, chỉ rõ lỗi phát âm sai và đề xuất câu trả lời hay hơn.',
    syllabus: [
      { title: 'Chặng 1: Chuẩn hóa Phát âm IPA & Ngữ pháp Nền tảng', duration: 'Tuần 1 - 6', focus: 'Ngữ âm, trọng âm từ, nối âm và ngữ điệu câu hỏi', aiPractice: 'Luyện đọc câu và nhận phản hồi phân tích sóng âm tức thì' },
      { title: 'Chặng 2: Làm quen IELTS Listening & Reading Core', duration: 'Tuần 7 - 12', focus: 'Kỹ thuật bắt từ khóa (Keywords) và bẫy Paraphrase cơ bản', aiPractice: 'Bài tập nghe điền từ tự động điều chỉnh tốc độ 0.8x - 1.2x' },
      { title: 'Chặng 3: Xây dựng Ý tưởng Nói & Viết Part 1/Task 1', duration: 'Tuần 13 - 18', focus: 'Mẫu câu miêu tả biểu đồ đường/cột/bánh và trả lời Part 1', aiPractice: 'AI chấm bài miêu tả biểu đồ theo chuẩn band descriptors' },
      { title: 'Chặng 4: Luyện đề Tổng hợp & Thi thử Định kỳ', duration: 'Tuần 19 - 24', focus: 'Thực hành các đề thi Cambridge gần nhất với đồng hồ bấm giờ', aiPractice: 'Full Mock Test trên hệ thống mô phỏng bài thi máy tính' },
    ],
  },
  {
    id: 'c-ielts-06',
    code: 'IELTS-MST-06',
    name: 'IELTS Intensive Master — Cam Kết Chuẩn Đầu Ra 6.5 - 7.5+ (AI Speaking & Writing Coach Chuyên Sâu)',
    levelCategory: 'ielts',
    levelName: 'Luyện Thi IELTS Chuyên Sâu (15+ tuổi)',
    targetBand: 'IELTS 6.5 - 7.5+',
    ageGroup: 'Học sinh THPT & Đại học',
    badge: 'Cam kết bằng hợp đồng',
    isPopular: true,
    rating: 4.99,
    ratingCount: 468,
    studentsEnrolled: 2100,
    tagline: 'Chiến thuật bứt phá điểm số xét tuyển Đại học top đầu và săn học bổng du học toàn phần.',
    description: 'Chương trình cao cấp nhất tại CoreLink Academy dành cho mục tiêu IELTS 6.5 - 7.5+. Kết hợp giảng viên 8.5+ với công nghệ AI phân tích 4 tiêu chí giám khảo: Độ lưu loát (Fluency), Vốn từ học thuật (Lexical Resource), Độ chính xác ngữ pháp (Grammar Range) và Phát âm (Pronunciation). Cam kết hoàn 100% học phí hoặc đào tạo lại miễn phí nếu không đạt điểm chuẩn.',
    durationSessions: 60,
    durationMonths: '7 tháng',
    schedule: '3 buổi / tuần (90 phút / buổi)',
    classSize: '8 - 10 học viên',
    studyFormat: 'Linh hoạt Offline + Online',
    feeAmountVnd: 8900000,
    originalFeeAmountVnd: 11125000,
    discountPercent: 20,
    monthlyEstimateVnd: 1271000,
    highlights: [
      'Ký hợp đồng cam kết đầu ra 6.5 - 7.5+ bảo vệ 100% quyền lợi học viên',
      'AI chấm chữa Writing & Speaking chi tiết theo tiêu chí giám khảo trong vòng 60 giây',
      'Giảng viên 8.5+ IELTS trực tiếp kèm 1-1 hàng tuần sửa bài chuyên sâu',
      'Tặng gói thi thử máy tính (Computer-delivered IELTS) không giới hạn lượt thi',
    ],
    outcomes: [
      'Đạt tối thiểu IELTS 6.5 - 7.5+ đủ điều kiện miễn thi tốt nghiệp và xét tuyển thẳng ĐH',
      'Làm chủ 20 dạng bài Reading khó nhất, đạt tốc độ đọc hiểu 750 từ / 15 phút',
      'Phản xạ Nói tự nhiên Part 2 & Part 3 với cấu trúc IDEA phong phú, ngữ điệu cuốn hút',
      'Viết bài luận Task 2 đạt chuẩn học thuật với dẫn chứng sắc bén và lập luận thuyết phục',
    ],
    teacher: {
      name: 'ThS. David Miller & ThS. Hoàng Yến',
      degree: 'Cựu chuyên gia đào tạo Hội đồng Anh (British Council) & ThS. TESOL',
      certifications: 'IELTS 8.5 Overall (Listening 9.0, Reading 9.0, Speaking 8.5)',
      avatarInitials: 'DM',
      experience: '14 năm kinh nghiệm đào tạo hơn 1.200 học viên đạt 7.0 - 8.0+',
    },
    aiTechFeature: 'AI Examiner 360: Mô phỏng bài thi Speaking 1-1 thực tế, phân tích ngắt nghỉ, ngữ điệu và chỉ ra từ vựng C1-C2 thay thế tối ưu.',
    syllabus: [
      { title: 'Giai đoạn 1: Master Chiến thuật Listening & Reading 7.5+', duration: 'Tuần 1 - 7', focus: 'Multiple Choice bẫy khó, Matching Headings, Map Labelling', aiPractice: 'Phần mềm luyện nghe chọn lọc giọng Anh - Mỹ - Úc đa vùng' },
      { title: 'Giai đoạn 2: Bứt phá Writing Task 1 & Cấu trúc Dữ liệu Phức', duration: 'Tuần 8 - 14', focus: 'Bản đồ (Map), Quy trình (Process) và dạng biểu đồ kết hợp', aiPractice: 'AI sửa câu và đề xuất Collocations học thuật nâng cao' },
      { title: 'Giai đoạn 3: Chuyên sâu Writing Task 2 & Tư duy Phản biện', duration: 'Tuần 15 - 21', focus: '10 chủ đề nghị luận xã hội nóng nhất và chiến thuật lập dàn ý 5 phút', aiPractice: 'Chấm bài tự động theo barem giám khảo IELTS chính thức' },
      { title: 'Giai đoạn 4: Đột phá Speaking 7.0+ & Phòng thi Thực tế', duration: 'Tuần 22 - 28', focus: 'Xử lý các chủ đề Part 3 trừu tượng, kỹ thuật kéo dài câu trả lời', aiPractice: 'Mock Interview 1-1 với cựu giám khảo và hệ thống AI' },
    ],
  },
  {
    id: 'c-biz-07',
    code: 'BIZ-PRO-07',
    name: 'Tiếng Anh Doanh Nghiệp, Đàm Phán & Thuyết Trình Thương Mại (Business English B2 - C1)',
    levelCategory: 'business',
    levelName: 'Người Đi Làm & Doanh Nghiệp',
    targetBand: 'Business English CEFR B2 - C1',
    ageGroup: 'Người đi làm & Quản lý',
    badge: 'Lịch học linh hoạt',
    isPopular: false,
    rating: 4.97,
    ratingCount: 154,
    studentsEnrolled: 580,
    tagline: 'Làm chủ kỹ năng thuyết trình dự án quốc tế, đàm phán hợp đồng và giao tiếp chuyên nghiệp.',
    description: 'Chương trình thiết kế thực chiến dựa trên các tình huống kinh doanh thực tế từ trường kinh doanh Harvard. Giúp chuyên viên, quản lý và lãnh đạo tự tin điều hành cuộc họp bằng tiếng Anh, trình bày chiến lược kinh doanh thuyết phục, xử lý email khủng hoảng và đàm phán thương mại quốc tế với phong thái tự tin đỉnh cao.',
    durationSessions: 36,
    durationMonths: '4.5 tháng',
    schedule: '2 buổi / tuần (90 phút / buổi, ca tối hoặc cuối tuần)',
    classSize: '8 - 10 học viên',
    studyFormat: 'Linh hoạt Offline + Online',
    feeAmountVnd: 6900000,
    originalFeeAmountVnd: 8625000,
    discountPercent: 20,
    monthlyEstimateVnd: 1533000,
    highlights: [
      'Học theo phương pháp Case Study mô phỏng môi trường làm việc tập đoàn đa quốc gia',
      'Lịch học linh hoạt cho người bận rộn, hỗ trợ học bù không lo mất buổi',
      'Trợ lý AI hỗ trợ rà soát email, slide thuyết trình và bài phát biểu chuyên nghiệp',
      'Mở rộng mạng lưới quan hệ (Networking) với các đồng môn là quản lý, doanh nhân',
    ],
    outcomes: [
      'Tự tin thuyết trình trước đối tác nước ngoài trong 30 phút không ngắc ngứ',
      'Viết báo cáo tài chính, email thương mại và biên bản cuộc họp chuẩn chỉnh',
      'Làm chủ nghệ thuật đàm phán win-win bằng tiếng Anh sắc bén',
      'Nâng cao cơ hội thăng tiến vị trí quản lý cấp cao trong các công ty đa quốc gia',
    ],
    teacher: {
      name: 'ThS. Michael Chang',
      degree: 'Thạc sĩ Quản trị Kinh doanh (MBA) — Western Sydney University',
      certifications: 'CELTA Cambridge, 12 năm tư vấn đào tạo doanh nghiệp',
      avatarInitials: 'MC',
      experience: 'Đã đào tạo cho các tập đoàn lớn: VinGroup, FPT, Viettel, Techcombank',
    },
    aiTechFeature: 'AI Business Communicator: Tối ưu hóa văn phong email (Formal/Semi-formal) và đóng vai đối tác nước ngoài phản biện bài thuyết trình.',
    syllabus: [
      { title: 'Module 1: Nghệ thuật Thuyết trình & Báo cáo Dự án', duration: 'Tuần 1 - 4', focus: 'Ngôn ngữ hình thể, mở bài ấn tượng và trình bày số liệu biểu đồ', aiPractice: 'AI phân tích tốc độ nói (WPM) và tần suất dùng từ đệm' },
      { title: 'Module 2: Đàm phán Thương mại & Giải quyết Xung đột', duration: 'Tuần 5 - 9', focus: 'Kỹ thuật đặt câu hỏi dẫn dắt, từ chối khéo léo và chốt thỏa thuận', aiPractice: 'Mô phỏng tình huống thương lượng hợp đồng trực tiếp với AI' },
      { title: 'Module 3: Thư tín Thương mại & Soạn thảo Văn bản Quốc tế', duration: 'Tuần 10 - 14', focus: 'Soạn thảo Proposal, báo cáo tuần và xử lý khiếu nại khách hàng', aiPractice: 'AI kiểm tra giọng điệu văn phong thương mại chuyên nghiệp' },
      { title: 'Module 4: Điều hành Cuộc họp & Giao lưu Quốc tế (Networking)', duration: 'Tuần 15 - 18', focus: 'Phát biểu tại hội nghị, Small Talk tạo thiện cảm trong sự kiện', aiPractice: 'Thực hành tương tác nhập vai cùng các tình huống kinh doanh khó' },
    ],
  },
  {
    id: 'c-special-08',
    code: 'AI-SPEAK-08',
    name: 'Khóa Luyện Phát Âm Chuyên Sâu & AI Speaking Coach 1-Kèm-1 (Mọi Trình Độ)',
    levelCategory: 'special',
    levelName: 'Kỹ Năng Đặc Biệt (Mọi cấp độ)',
    targetBand: 'Phát âm chuẩn IPA & Ngữ điệu bản xứ',
    ageGroup: 'Mọi lứa tuổi',
    badge: '1-kèm-1 cùng AI',
    isPopular: true,
    rating: 4.99,
    ratingCount: 520,
    studentsEnrolled: 3200,
    tagline: 'Triệt tiêu giọng địa phương, chỉnh khẩu hình từng âm vị với trợ lý AI phân tích tần số âm thanh.',
    description: 'Khóa học tập trung giải quyết triệt để vấn đề nói ngượng ngùng, thiếu tự tin, phát âm sai âm cuối (ending sounds), trọng âm và ngữ điệu (intonation). Ứng dụng mô hình AI nhận diện giọng nói phân tích chính xác từng mili-giây khẩu hình, kèm 1 buổi hàng tuần với giảng viên bản xứ để chỉnh lỗi phát âm cá nhân hóa.',
    durationSessions: 24,
    durationMonths: '3 tháng',
    schedule: 'Linh hoạt luyện tập 24/7 + 1 buổi kèm giáo viên / tuần',
    classSize: '1-kèm-1 với Chuyên gia & AI',
    studyFormat: '1-kèm-1 AI Coach',
    feeAmountVnd: 3800000,
    originalFeeAmountVnd: 4750000,
    discountPercent: 20,
    monthlyEstimateVnd: 1266000,
    highlights: [
      'Công nghệ AI Speech Lab độc quyền chấm điểm phát âm theo thời gian thực',
      'Được sửa bài 1-kèm-1 trực tiếp cùng giảng viên ngữ âm chuyên môn cao',
      'Lộ trình cá nhân hóa hoàn toàn theo chất giọng và thói quen phát âm của bạn',
      'Kho bài luyện nói 500+ chủ đề từ đời sống hàng ngày đến học thuật chuyên sâu',
    ],
    outcomes: [
      'Chuẩn hóa 100% 44 âm quốc tế IPA, nói rõ âm đuôi /s/, /ed/, /t/, /d/',
      'Làm chủ quy tắc nhấn trọng âm, nối âm (linking sounds) và nuốt âm tự nhiên',
      'Có được ngữ điệu câu hỏi, câu cảm thán trầm bổng như người bản xứ',
      'Hoàn toàn tự tin khi giao tiếp, phỏng vấn xin việc hoặc thi IELTS Speaking',
    ],
    teacher: {
      name: 'Cô Jennifer Adams & Thầy Hoàng Bách',
      degree: 'Cử nhân Ngôn ngữ học & Chuyên gia Ngữ âm Quốc tế',
      certifications: 'Chứng chỉ Huấn luyện viên Phát âm Tiếng Anh Bản quyền',
      avatarInitials: 'JA',
      experience: '11 năm chuyên trị các ca mất gốc phát âm tại Việt Nam',
    },
    aiTechFeature: 'Real-time Phoneme Precision: Phân tích phổ âm thanh của giọng bạn so với người bản xứ, chỉ rõ vị trí đặt lưỡi và lấy hơi.',
    syllabus: [
      { title: 'Chặng 1: Nền tảng 44 Âm Quốc tế IPA & Khẩu hình', duration: 'Tuần 1 - 3', focus: 'Nguyên âm đơn, nguyên âm đôi và phụ âm bật hơi khó (/θ/, /ð/, /ʃ/)', aiPractice: 'Quét khẩu hình và chấm điểm âm thanh độc quyền' },
      { title: 'Chặng 2: Trọng âm Từ & Quy luật Nhấn âm', duration: 'Tuần 4 - 6', focus: 'Trọng âm từ 2 - 4 âm tiết và âm suy giảm Schwa /ə/', aiPractice: 'Luyện tập theo nhịp điệu (Rhythm) phản xạ nhanh' },
      { title: 'Chặng 3: Nối âm, Nuốt âm & Âm đuôi Tự nhiên', duration: 'Tuần 7 - 9', focus: 'Kỹ thuật Linking words, Elision và Assimilation trong giao tiếp', aiPractice: 'Bài tập Shadowing theo các đoạn hội thoại phim Hollywood' },
      { title: 'Chặng 4: Ngữ điệu Cảm xúc & Nói Tự Tin Trước Đám Đông', duration: 'Tuần 10 - 12', focus: 'Lên giọng, xuống giọng, ngắt nghỉ theo cụm nghĩa (Chuncking)', aiPractice: 'Ghi âm bài thuyết trình 3 phút và nhận báo cáo tiến bộ toàn diện' },
    ],
  },
];

const COMPARISON_DATA = [
  {
    criteria: 'Sĩ số lớp học',
    corelink: 'Chỉ 8 - 12 học viên (Quan tâm kèm cặp từng em)',
    traditional: '20 - 30 học viên (Ít cơ hội tương tác trực tiếp)',
    highlight: true,
  },
  {
    criteria: 'Đội ngũ Giảng viên',
    corelink: '100% có bằng TESOL/CELTA, IELTS 8.0 - 8.5+, cựu giám khảo',
    traditional: 'Chất lượng không đồng đều, nhiều trợ giảng sinh viên',
    highlight: true,
  },
  {
    criteria: 'Công nghệ AI đồng hành',
    corelink: 'Trợ lý AI phân tích phát âm 24/7, chấm Writing trong 60 giây',
    traditional: 'Chỉ học trên lớp, về nhà tự học không có người sửa lỗi',
    highlight: true,
  },
  {
    criteria: 'Cam kết chuẩn đầu ra',
    corelink: 'Ký HỢP ĐỒNG ĐÀO TẠO pháp lý, học lại miễn phí 100%',
    traditional: 'Cam kết bằng lời nói hoặc điều kiện ràng buộc khắt khe',
    highlight: true,
  },
  {
    criteria: 'Báo cáo cho Phụ huynh',
    corelink: 'Cập nhật điểm danh, nhận xét từng buổi học qua App di động',
    traditional: 'Chỉ thông báo qua sổ liên lạc cuối khóa hoặc tin nhắn rời rạc',
    highlight: false,
  },
  {
    criteria: 'Chính sách bảo lưu & Hoàn phí',
    corelink: 'Tuân thủ nghiêm ngặt TT 29/2024/TT-BGDĐT, bảo lưu tối đa 6 tháng',
    traditional: 'Thủ tục phức tạp, thường bị mất phí nếu không thể học tiếp',
    highlight: false,
  },
];

const FAQS_DATA = [
  {
    q: 'Làm thế nào để biết con tôi hoặc bản thân phù hợp với khóa học nào?',
    a: 'Tại CoreLink Academy, 100% học viên trước khi nhập học đều được làm bài Đánh giá Năng lực Toàn diện (Placement Test) miễn phí kết hợp phỏng vấn 1-1 với giáo viên chuyên môn. Hệ thống sẽ phân tích chính xác điểm mạnh, lỗ hổng ngữ pháp và phản xạ nói để xếp vào đúng lớp có trình độ tương đương.',
  },
  {
    q: 'Chính sách cam kết đầu ra bằng hợp đồng có hiệu lực pháp lý như thế nào?',
    a: 'CoreLink Academy ký Hợp đồng Đào tạo minh bạch trước ngày khai giảng. Nếu học viên tham gia tối thiểu 90% số buổi học và hoàn thành các nhiệm vụ học tập theo chỉ dẫn của giáo viên mà không đạt điểm số cam kết tại kỳ thi chính thức (Cambridge hoặc IELTS), trung tâm sẽ tài trợ 100% học phí học lại cho đến khi đạt điểm mong muốn.',
  },
  {
    q: 'Trợ lý AI hỗ trợ việc học ngoài giờ trên lớp như thế nào?',
    a: 'Học viên được cấp tài khoản App học tập tích hợp AI độc quyền. Khi ở nhà, học viên có thể luyện nói không giới hạn: AI sẽ nhận diện lỗi sai phát âm, chỉ ra cách đặt khẩu hình đúng, chấm bài tự luận Writing trong vòng 60 giây và gợi ý các từ vựng học thuật C1-C2 thay thế tối ưu.',
  },
  {
    q: 'Nếu học viên bận việc đột xuất hoặc ốm có được học bù không?',
    a: 'Có. CoreLink Academy hỗ trợ học viên học bù linh hoạt tại các lớp cùng trình độ trong tuần hoặc xem lại video bài giảng chất lượng cao trên cổng học viên trực tuyến. Ngoài ra, giáo viên trợ giảng luôn sẵn sàng hỗ trợ giải đáp 1-1 các kiến thức buổi học học viên bị lỡ.',
  },
  {
    q: 'Chính sách học phí và bảo lưu/hoàn phí theo Thông tư 29/2024/TT-BGDĐT ra sao?',
    a: 'Trung tâm thực hiện công khai biểu phí minh bạch. Học viên được hoàn 100% học phí trước ngày khai giảng; hoàn 70% trong 2 tuần đầu nếu có lý do chính đáng; và được bảo lưu kết quả học phí tối đa 06 tháng đối với các trường hợp sức khỏe hoặc di chuyển nơi cư trú có đơn xác nhận.',
  },
  {
    q: 'Trung tâm có các cơ sở học trực tiếp ở đâu và có lớp trực tuyến không?',
    a: 'Hệ thống hiện có 2 cơ sở khang trang tại Hà Nội: Cơ sở 1 tại Duy Tân, Cầu Giấy và Cơ sở 2 tại Nguyễn Trãi, Thanh Xuân. Với học viên ở xa hoặc lịch trình bận rộn, chúng tôi có các lớp Trực tuyến Tương tác Cao (Live Interactive) sĩ số nhỏ với chất lượng và cam kết tương đương lớp trực tiếp.',
  },
];

export default function CoursesPage() {
  const [courses] = useState<CourseItem[]>(COURSES_DATA);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'fee-asc' | 'fee-desc' | 'duration'>('popular');

  // Modals state
  const [activeDetailCourse, setActiveDetailCourse] = useState<CourseItem | null>(null);
  const [activeEnrollCourse, setActiveEnrollCourse] = useState<CourseItem | null>(null);
  const [enrollForm, setEnrollForm] = useState({
    parentName: '',
    phone: '',
    email: '',
    branch: 'HN-CG',
    slot: 'Tối T2-T4-T6 (18:00 - 19:30)',
  });
  const [enrollSubmitted, setEnrollSubmitted] = useState(false);

  // Quick Course Matcher state
  const [matcherAge, setMatcherAge] = useState<string>('all');
  const [matcherGoal, setMatcherGoal] = useState<string>('all');

  // FAQ accordion open states
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return courses
      .filter((c) => {
        // Category filter
        const matchCategory = selectedCategory === 'all' || c.levelCategory === selectedCategory;

        // Format filter
        const matchFormat =
          selectedFormat === 'all' ||
          (selectedFormat === 'offline' && c.studyFormat.toLowerCase().includes('offline')) ||
          (selectedFormat === 'online' && c.studyFormat.toLowerCase().includes('online')) ||
          (selectedFormat === '1on1' && c.studyFormat.toLowerCase().includes('1-kèm-1'));

        // Search keyword
        const term = searchKeyword.trim().toLowerCase();
        const matchSearch =
          !term ||
          c.name.toLowerCase().includes(term) ||
          c.code.toLowerCase().includes(term) ||
          c.targetBand.toLowerCase().includes(term) ||
          c.description.toLowerCase().includes(term) ||
          c.levelName.toLowerCase().includes(term);

        return matchCategory && matchFormat && matchSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'fee-asc') return a.feeAmountVnd - b.feeAmountVnd;
        if (sortBy === 'fee-desc') return b.feeAmountVnd - a.feeAmountVnd;
        if (sortBy === 'duration') return b.durationSessions - a.durationSessions;
        return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
      });
  }, [courses, selectedCategory, selectedFormat, searchKeyword, sortBy]);

  const categoryTabs = [
    { id: 'all', label: 'Tất Cả Khóa Học', count: courses.length },
    { id: 'pre', label: 'Tiền Tiểu Học (4-6T)', count: courses.filter((c) => c.levelCategory === 'pre').length },
    { id: 'primary', label: 'Cambridge Tiểu Học', count: courses.filter((c) => c.levelCategory === 'primary').length },
    { id: 'lower_sec', label: 'Cambridge THCS', count: courses.filter((c) => c.levelCategory === 'lower_sec').length },
    { id: 'ielts', label: 'Luyện Thi IELTS', count: courses.filter((c) => c.levelCategory === 'ielts').length },
    { id: 'chuyen', label: 'Chuyên Anh Vào 10', count: courses.filter((c) => c.levelCategory === 'chuyen').length },
    { id: 'business', label: 'Tiếng Anh Doanh Nghiệp', count: courses.filter((c) => c.levelCategory === 'business').length },
    { id: 'special', label: 'AI Phát Âm 1-on-1', count: courses.filter((c) => c.levelCategory === 'special').length },
  ];

  const handleEnrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollForm.parentName || !enrollForm.phone) {
      alert('Vui lòng nhập họ tên và số điện thoại liên hệ!');
      return;
    }
    setEnrollSubmitted(true);
  };

  const resetEnrollModal = () => {
    setActiveEnrollCourse(null);
    setEnrollSubmitted(false);
    setEnrollForm({
      parentName: '',
      phone: '',
      email: '',
      branch: 'HN-CG',
      slot: 'Tối T2-T4-T6 (18:00 - 19:30)',
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-between font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Top Main Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center font-extrabold text-white text-xl shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
              CL
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 font-heading">
                  CoreLink Academy
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Cambridge & AI
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium block">
                Chuẩn Quốc Tế & Cá Nhân Hóa AI
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-slate-600">
            <Link href="/" className="hover:text-blue-600 transition">
              Trang Chủ
            </Link>
            <Link href="/courses" className="text-blue-600 font-bold flex items-center gap-1.5">
              <span>Khóa Học</span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            </Link>
            <Link href="/#roadmap" className="hover:text-blue-600 transition">
              Lộ Trình
            </Link>
            <Link href="/#teachers" className="hover:text-blue-600 transition">
              Đội Ngũ Giảng Viên
            </Link>
            <Link href="/blog" className="hover:text-blue-600 transition">
              Tin Tức & Kinh Nghiệm
            </Link>
            <Link href="/info" className="hover:text-blue-600 transition">
              Công Khai Pháp Lý
            </Link>
          </nav>

          <div className="flex items-center gap-3.5">
            <a
              href="tel:0987654321"
              className="hidden sm:inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 px-3 py-2 rounded-xl hover:bg-slate-50 transition"
            >
              <PhoneCall className="w-4 h-4 text-blue-600" />
              <span>098.765.4321</span>
            </a>

            <Link
              href="/login"
              className="text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              Cổng Học Viên
            </Link>

            <Link
              href="/register-trial"
              className="text-xs font-bold px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition shadow-sm shadow-blue-500/20"
            >
              Đăng Ký Học Thử
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 bg-gradient-to-b from-blue-50/70 via-white to-[#F8FAFC] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 border border-blue-200 text-blue-800 text-xs font-bold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              <span>Tiên phong ứng dụng AI vào khảo thí & đào tạo chuẩn Cambridge</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight font-heading leading-tight">
              Khám Phá Các Khóa Học Tại <span className="text-blue-600">CoreLink Academy</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Chương trình đào tạo tinh hoa từ tiền tiểu học đến luyện thi chứng chỉ quốc tế IELTS 8.0+.
              Mô hình lớp học giới hạn <strong>8 - 12 học viên</strong>, 100% giáo viên chuyên môn cao,
              kết hợp <strong>trợ lý AI Speaking Coach 24/7</strong> giúp học viên bứt phá phản xạ vượt bậc.
            </p>

            {/* Quick Stat Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 max-w-2xl mx-auto text-left">
              <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                <div className="text-xs text-slate-500 font-medium">Sĩ số vàng</div>
                <div className="text-lg font-black text-slate-900 font-heading">8 - 12 HV/Lớp</div>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                <div className="text-xs text-slate-500 font-medium">Giáo viên đạt chuẩn</div>
                <div className="text-lg font-black text-blue-600 font-heading">100% TESOL/CELTA</div>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                <div className="text-xs text-slate-500 font-medium">Đạt mục tiêu</div>
                <div className="text-lg font-black text-emerald-600 font-heading">98.4% Đạt Cam Kết</div>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                <div className="text-xs text-slate-500 font-medium">Trợ lý luyện nói AI</div>
                <div className="text-lg font-black text-indigo-600 font-heading">Hỗ trợ 24/7</div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="pt-6 max-w-2xl mx-auto">
              <div className="relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  placeholder="Tìm theo tên khóa học, mã môn (vd: IELTS, KET, PET, Starters), hoặc kỹ năng..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full pl-12 pr-10 py-3.5 rounded-2xl border border-slate-300 bg-white text-sm focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 shadow-sm transition"
                />
                {searchKeyword && (
                  <button
                    onClick={() => setSearchKeyword('')}
                    className="absolute right-3.5 top-3.5 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        {/* Category Tabs & Filter Toolbar */}
        <div className="space-y-4">
          {/* Level Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categoryTabs.map((tab) => {
              const active = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-150 flex items-center gap-2 ${
                    active
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                      active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sub Toolbar: Format Filter & Sorting */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                Hình thức học:
              </span>
              {[
                { id: 'all', label: 'Tất cả hình thức' },
                { id: 'offline', label: 'Trực tiếp tại cơ sở' },
                { id: 'online', label: 'Online tương tác cao' },
                { id: '1on1', label: '1-kèm-1 AI Coach' },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setSelectedFormat(fmt.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    selectedFormat === fmt.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
              <span className="text-slate-500 font-semibold">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-600"
              >
                <option value="popular">Phổ biến nhất</option>
                <option value="rating">Đánh giá cao nhất</option>
                <option value="fee-asc">Học phí: Thấp đến cao</option>
                <option value="fee-desc">Học phí: Cao đến thấp</option>
                <option value="duration">Thời lượng khóa học</option>
              </select>
            </div>
          </div>
        </div>

        {/* Smart Course Matcher Banner (Interactive Recommendation) */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white shadow-lg shadow-blue-900/10 relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-60 h-60 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-[11px] font-bold border border-white/20">
                <Brain className="w-3.5 h-3.5 text-yellow-300" />
                <span>Bộ lọc thông minh 30 giây</span>
              </div>
              <h3 className="text-xl font-black font-heading tracking-tight">
                Chưa biết chọn khóa học nào phù hợp với năng lực hiện tại?
              </h3>
              <p className="text-xs text-blue-100 leading-relaxed">
                Đăng ký ngay bài kiểm tra trình độ 4 kỹ năng theo khung CEFR/Cambridge. Nhận ngay lộ trình cá nhân hóa và tư vấn miễn phí từ Giám đốc học thuật.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <Link
                href="/#quick-test"
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs text-center shadow-md transition"
              >
                Kiểm Tra Trình Độ 3 Phút
              </Link>
              <Link
                href="/register-trial"
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-blue-500/40 hover:bg-blue-500/60 text-white border border-white/30 font-bold text-xs text-center transition"
              >
                Đăng Ký Học Thử Miễn Phí
              </Link>
            </div>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
          <div>
            Hiển thị <strong className="text-slate-900">{filteredCourses.length}</strong> khóa học đạt chuẩn
          </div>
          {(selectedCategory !== 'all' || selectedFormat !== 'all' || searchKeyword) && (
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedFormat('all');
                setSearchKeyword('');
              }}
              className="text-blue-600 hover:underline font-bold"
            >
              Xóa toàn bộ bộ lọc
            </button>
          )}
        </div>

        {/* Courses Cards Grid */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 max-w-md mx-auto space-y-3">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 font-heading">Không Tìm Thấy Khóa Học</h3>
            <p className="text-xs text-slate-500">
              Không có khóa học nào khớp với từ khóa hoặc bộ lọc bạn chọn. Vui lòng thử tìm kiếm với cụm từ khác.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedFormat('all');
                setSearchKeyword('');
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
            >
              Xem Tất Cả Khóa Học
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-3xl border border-slate-200/90 hover:border-blue-300 p-6 flex flex-col justify-between hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-200 hover:-translate-y-1 relative group"
              >
                {/* Top Badge & Code */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-extrabold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                        {c.code}
                      </span>
                      {c.badge && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          {c.badge}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span>{c.rating}</span>
                      <span className="text-slate-400 text-[10px] font-normal">({c.ratingCount})</span>
                    </div>
                  </div>

                  {/* Title & Level */}
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 block mb-1">
                      {c.levelName}
                    </span>
                    <h3 className="text-lg font-black text-slate-900 font-heading leading-snug group-hover:text-blue-600 transition-colors">
                      {c.name}
                    </h3>
                  </div>

                  {/* Target Band Pill */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Chuẩn đầu ra:</span>
                    <span className="font-extrabold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded-md">
                      {c.targetBand}
                    </span>
                  </div>

                  {/* Short Description */}
                  <p className="text-xs text-slate-600 leading-relaxed min-h-[48px] line-clamp-3">
                    {c.tagline}
                  </p>

                  {/* Key Highlights Checklist */}
                  <div className="space-y-1.5 pt-1 text-xs">
                    {c.highlights.slice(0, 2).map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Course Details Box */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Thời lượng:
                      </span>
                      <span className="font-bold text-slate-800">
                        {c.durationSessions} buổi ({c.durationMonths})
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        Sĩ số giới hạn:
                      </span>
                      <span className="font-bold text-slate-800">{c.classSize}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-slate-400" />
                        Hình thức:
                      </span>
                      <span className="font-bold text-slate-800">{c.studyFormat}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-slate-500 block text-[11px]">Học phí trọn gói:</span>
                          <span className="text-xs text-slate-400 line-through">
                            {c.originalFeeAmountVnd.toLocaleString('vi-VN')} ₫
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-black text-blue-700 font-heading">
                            {c.feeAmountVnd.toLocaleString('vi-VN')} ₫
                          </span>
                          <span className="text-[10px] text-emerald-700 font-bold block">
                            (Tiết kiệm {c.discountPercent}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Teacher Snippet */}
                  <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                      {c.teacher.avatarInitials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{c.teacher.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{c.teacher.degree}</div>
                    </div>
                  </div>

                  {/* AI Badge */}
                  <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-900 flex items-start gap-2">
                    <Brain className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{c.aiTechFeature}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-6 border-t border-slate-100 mt-6 space-y-2">
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => setActiveDetailCourse(c)}
                      className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 hover:border-blue-600 hover:text-blue-600 text-slate-700 text-xs font-bold text-center transition"
                    >
                      Xem Lộ Trình
                    </button>
                    <button
                      onClick={() => setActiveEnrollCourse(c)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold text-center shadow-sm shadow-blue-500/20 transition"
                    >
                      Đăng Ký Học Thử
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Why CoreLink Academy Superiority Table */}
        <section className="pt-12 pb-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Giá Trị Khác Biệt
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
                Vì Sao 5.000+ Phụ Huynh & Học Viên Tin Chọn CoreLink Academy?
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Sự kết hợp hoàn hảo giữa phương pháp sư phạm tương tác cao và công nghệ AI cá nhân hóa.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="p-4 font-bold text-slate-700 rounded-l-xl">Tiêu chí đào tạo</th>
                    <th className="p-4 font-extrabold text-blue-700 bg-blue-50/70 border-x border-blue-100">
                      CoreLink Academy (Chuẩn Quốc Tế & AI)
                    </th>
                    <th className="p-4 font-bold text-slate-500 rounded-r-xl">Trung tâm truyền thống</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {COMPARISON_DATA.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 font-bold text-slate-900">{row.criteria}</td>
                      <td className="p-4 font-semibold text-blue-900 bg-blue-50/40 border-x border-blue-100/70">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{row.corelink}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-500">{row.traditional}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQs Accordion */}
        <section className="pt-6 pb-12">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Giải Đáp Thắc Mắc
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
                Câu Hỏi Thường Gặp Về Khóa Học
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Mọi thắc mắc của bạn về lộ trình, chính sách học phí và cam kết chất lượng.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {FAQS_DATA.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div
                    key={index}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs transition"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-slate-900 hover:text-blue-600 transition"
                    >
                      <span className="text-sm">{faq.q}</span>
                      {isOpen ? (
                        <ChevronUp className="w-5 h-5 text-blue-600 shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/40">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Bottom Consultation Banner */}
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-800 text-white text-center space-y-6 shadow-xl shadow-blue-900/20">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-black font-heading tracking-tight">
              Sẵn Sàng Bứt Phá Điểm Số Tiếng Anh Cùng CoreLink?
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              Nhận ngay ưu đãi <strong>giảm 20% học phí</strong> và <strong>01 buổi học thử 1-1 miễn phí</strong> cùng Giảng viên chuẩn quốc tế khi đăng ký trong tuần này!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <Link
              href="/register-trial"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white text-blue-700 font-extrabold text-sm shadow-md hover:bg-blue-50 transition"
            >
              Đăng Ký Học Thử Ngay
            </Link>
            <a
              href="tel:0987654321"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-blue-600/50 hover:bg-blue-600/70 text-white font-extrabold text-sm border border-white/30 transition flex items-center justify-center gap-2"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Gọi 098.765.4321</span>
            </a>
          </div>
        </div>
      </main>

      {/* Course Detail Modal */}
      {activeDetailCourse && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setActiveDetailCourse(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="space-y-3 pr-8">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  {activeDetailCourse.code}
                </span>
                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  {activeDetailCourse.levelName}
                </span>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                  Đầu ra: {activeDetailCourse.targetBand}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
                {activeDetailCourse.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {activeDetailCourse.description}
              </p>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block">Thời lượng:</span>
                <strong className="text-slate-900 font-bold">{activeDetailCourse.durationSessions} buổi</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Lịch học:</span>
                <strong className="text-slate-900 font-bold">{activeDetailCourse.schedule}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Sĩ số:</span>
                <strong className="text-slate-900 font-bold">{activeDetailCourse.classSize}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Học phí:</span>
                <strong className="text-blue-700 font-black">
                  {activeDetailCourse.feeAmountVnd.toLocaleString('vi-VN')} ₫
                </strong>
              </div>
            </div>

            {/* Key Outcomes */}
            <div className="space-y-3">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-600" />
                <span>Chuẩn Đầu Ra & Kỹ Năng Đạt Được:</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activeDetailCourse.outcomes.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Syllabus Breakdown */}
            <div className="space-y-3">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Lộ Trình Đào Tạo Từng Giai Đoạn:</span>
              </h4>
              <div className="space-y-3">
                {activeDetailCourse.syllabus.map((stage, sIdx) => (
                  <div key={sIdx} className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2 text-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-slate-900 font-heading">{stage.title}</span>
                      <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md text-[11px]">
                        {stage.duration}
                      </span>
                    </div>
                    <div className="text-slate-600">
                      <strong>Trọng tâm:</strong> {stage.focus}
                    </div>
                    <div className="text-indigo-700 flex items-center gap-1.5 pt-1">
                      <Brain className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>{stage.aiPractice}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lead Teacher Profile */}
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                {activeDetailCourse.teacher.avatarInitials}
              </div>
              <div className="text-xs space-y-0.5">
                <div className="font-extrabold text-slate-900 text-sm">{activeDetailCourse.teacher.name}</div>
                <div className="text-blue-700 font-semibold">{activeDetailCourse.teacher.degree}</div>
                <div className="text-slate-500">{activeDetailCourse.teacher.certifications} • {activeDetailCourse.teacher.experience}</div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => {
                  const c = activeDetailCourse;
                  setActiveDetailCourse(null);
                  setActiveEnrollCourse(c);
                }}
                className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition text-center"
              >
                Đăng Ký Khóa Học Này
              </button>
              <button
                onClick={() => setActiveDetailCourse(null)}
                className="px-6 py-3 rounded-2xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fast Course Enrollment Modal */}
      {activeEnrollCourse && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={resetEnrollModal}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {enrollSubmitted ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900 font-heading">
                    Đăng Ký Thành Công!
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                    Hệ thống đã tiếp nhận yêu cầu học thử khóa <strong>{activeEnrollCourse.name}</strong>.
                    Chuyên viên học vụ sẽ liên hệ qua số điện thoại <strong>{enrollForm.phone}</strong> trong vòng 15 phút.
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-left space-y-1">
                  <div><strong>Mã tiếp nhận:</strong> CL-{Math.floor(100000 + Math.random() * 900000)}</div>
                  <div><strong>Người đăng ký:</strong> {enrollForm.parentName}</div>
                  <div><strong>Cơ sở dự kiến:</strong> {enrollForm.branch === 'HN-CG' ? 'Cơ sở 1 — Cầu Giấy (Duy Tân)' : 'Cơ sở 2 — Thanh Xuân (Nguyễn Trãi)'}</div>
                </div>
                <button
                  onClick={resetEnrollModal}
                  className="w-full py-3 rounded-2xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition"
                >
                  Xác Nhận & Hoàn Tất
                </button>
              </div>
            ) : (
              <form onSubmit={handleEnrollSubmit} className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                    Đăng Ký Tư Vấn & Học Thử
                  </span>
                  <h3 className="text-lg font-black text-slate-900 font-heading">
                    {activeEnrollCourse.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Học phí ưu đãi: <strong className="text-blue-700">{activeEnrollCourse.feeAmountVnd.toLocaleString('vi-VN')} ₫</strong> (Tiết kiệm {activeEnrollCourse.discountPercent}%)
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Họ tên Phụ huynh / Học viên *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn A"
                      value={enrollForm.parentName}
                      onChange={(e) => setEnrollForm({ ...enrollForm, parentName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-blue-600 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Số điện thoại liên hệ *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0912 345 678"
                      value={enrollForm.phone}
                      onChange={(e) => setEnrollForm({ ...enrollForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-blue-600 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Địa chỉ Email (tùy chọn)
                    </label>
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={enrollForm.email}
                      onChange={(e) => setEnrollForm({ ...enrollForm, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-blue-600 shadow-2xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Cơ sở học tập
                      </label>
                      <select
                        value={enrollForm.branch}
                        onChange={(e) => setEnrollForm({ ...enrollForm, branch: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white text-slate-800"
                      >
                        <option value="HN-CG">Cơ sở Cầu Giấy</option>
                        <option value="HN-TX">Cơ sở Thanh Xuân</option>
                        <option value="ONLINE">Lớp Trực Tuyến Live</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Ca học mong muốn
                      </label>
                      <select
                        value={enrollForm.slot}
                        onChange={(e) => setEnrollForm({ ...enrollForm, slot: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white text-slate-800"
                      >
                        <option value="Tối T2-T4-T6">Tối T2-T4-T6 (18h)</option>
                        <option value="Tối T3-T5-T7">Tối T3-T5-T7 (18h)</option>
                        <option value="Cuối tuần">Thứ Bảy & Chủ Nhật</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50/70 rounded-xl text-[11px] text-blue-900 border border-blue-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Cam kết bảo mật 100% dữ liệu cá nhân theo Luật BV Dữ Liệu Cá Nhân 91/2025/QH15.</span>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition"
                  >
                    Gửi Yêu Cầu Học Thử
                  </button>
                  <button
                    type="button"
                    onClick={resetEnrollModal}
                    className="px-5 py-3 rounded-2xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-base">
                  CL
                </div>
                <span className="text-white font-extrabold text-base font-heading">CoreLink Academy</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Hệ thống đào tạo tiếng Anh chuẩn quốc tế Cambridge & IELTS tích hợp AI, chuẩn hóa theo Thông tư 29/2024/TT-BGDĐT.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Chương Trình Học</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/courses" className="hover:text-white transition">Cambridge Tiền Tiểu Học (Starters)</Link></li>
                <li><Link href="/courses" className="hover:text-white transition">Cambridge Tiểu Học (Movers/Flyers)</Link></li>
                <li><Link href="/courses" className="hover:text-white transition">Cambridge THCS (KET/PET)</Link></li>
                <li><Link href="/courses" className="hover:text-white transition">Luyện Thi IELTS Chuyên Sâu 7.5+</Link></li>
                <li><Link href="/courses" className="hover:text-white transition">Luyện Thi Chuyên Anh Vào 10</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Thông Tin Pháp Lý</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/info" className="hover:text-white transition">Quy Chế Hoạt Động & Biểu Phí</Link></li>
                <li><Link href="/info" className="hover:text-white transition">Chính Sách Hoàn & Bảo Lưu Học Phí</Link></li>
                <li><Link href="/info" className="hover:text-white transition">Chuẩn Mực Đội Ngũ Giảng Viên</Link></li>
                <li><Link href="/info" className="hover:text-white transition">Bảo Vệ Dữ Liệu Học Sinh</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Liên Hệ Trực Tiếp</h4>
              <div className="space-y-2 text-xs leading-relaxed">
                <p><strong>Hotline:</strong> 098.765.4321</p>
                <p><strong>Email:</strong> admissions@corelink.edu.vn</p>
                <p><strong>Cơ sở 1:</strong> Số 18 Duy Tân, Cầu Giấy, Hà Nội</p>
                <p><strong>Cơ sở 2:</strong> Số 45 Nguyễn Trãi, Thanh Xuân, Hà Nội</p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>© 2026 CoreLink Academy. Bản quyền được bảo lưu. Giấy phép QĐ-1284/QĐ-SGDĐT-HàNội.</div>
            <div className="flex gap-4">
              <Link href="/info" className="hover:text-slate-300">Điều khoản</Link>
              <Link href="/info" className="hover:text-slate-300">Bảo mật</Link>
              <Link href="/info" className="hover:text-slate-300">Biểu phí</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
