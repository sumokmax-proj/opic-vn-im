-- ============================================================
-- OPIc 베트남어 앱 - Supabase 초기 설정 SQL
-- Supabase 대시보드 → SQL Editor에 붙여넣고 실행하세요
-- ============================================================

-- 1. 테이블 생성
-- ============================================================

CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL DEFAULT '자기소개',
  question_vi TEXT NOT NULL DEFAULT '',
  question_ko TEXT NOT NULL DEFAULT '',
  answer_vi TEXT NOT NULL DEFAULT '',
  answer_ko TEXT NOT NULL DEFAULT '',
  level TEXT NOT NULL DEFAULT 'IM',
  tags JSONB DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY DEFAULT 'default',
  data JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS analysis_cache (
  card_id TEXT PRIMARY KEY,
  result TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customize_cache (
  cache_key TEXT PRIMARY KEY,
  new_answer_vi TEXT NOT NULL,
  new_answer_ko TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS 비활성화 (개인 앱 - 서버 측 service key 사용)
-- ============================================================

ALTER TABLE cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_cache DISABLE ROW LEVEL SECURITY;
ALTER TABLE customize_cache DISABLE ROW LEVEL SECURITY;

-- 3. 카드 데이터 32개 삽입
-- ============================================================

INSERT INTO cards (id, category, question_vi, question_ko, answer_vi, answer_ko, level, tags) VALUES
('001', '자기소개',
 'Hãy giới thiệu về bản thân bạn.',
 '자신에 대해 소개해 주세요.',
 'Xin chào, tôi tên là Sumok. Tôi là một Project Manager trong lĩnh vực công nghệ thông tin. Hiện tại tôi đang sống ở Hà Nội và thường xuyên có những chuyến công tác đến Seoul vì công việc. Tôi rất thích học tiếng Việt vì điều này giúp tôi giao tiếp tốt hơn với đồng nghiệp và những người bạn ở Việt Nam.',
 '안녕하세요, 저는 Sumok입니다. IT 분야의 프로젝트 매니저로 일하고 있습니다. 현재 하노이에 거주 중이며 업무상 서울로 자주 출장을 갑니다. 베트남어를 배우는 것은 업무에서 동료들과 더 잘 소통하기 위해서입니다.',
 'IM', '["자기소개","기본"]'),

('002', '자기소개',
 'Bạn bao nhiêu tuổi và gia đình bạn như thế nào?',
 '몇 살이고 가족은 어떻게 되나요?',
 'Tôi ba mươi tuổi. Gia đình tôi gồm có bố, mẹ, và một người em gái. Hiện tại, tôi đang sống tại Hà Nội vì công việc của tôi là một quản lý dự án IT. Gia đình tôi ở Hà Nội và chúng tôi sống cùng nhau rất hạnh phúc.',
 '저는 30살입니다. 가족은 아버지, 어머니, 그리고 여동생이 한 명 있습니다. 현재 저는 IT 프로젝트 매니저로 일하고 있어서 하노이에서 살고 있습니다. 가족과 함께 하노이에서 행복하게 생활하고 있습니다.',
 'IM', '["자기소개","가족"]'),

('003', '자기소개',
 'Bạn đang học tiếng Việt được bao lâu rồi?',
 '베트남어를 배운 지 얼마나 됐나요?',
 'Tôi đã học tiếng Việt được khoảng sáu tháng rồi. Vì công việc của tôi là IT Project Manager ở Hà Nội, tôi cần phải nói tiếng Việt với đồng nghiệp hàng ngày. Tôi học online mỗi ngày và cố gắng tập nói với người bản ngữ để cải thiện kỹ năng của mình.',
 '베트남어를 배운 지 약 6개월이 됐습니다. IT 프로젝트 매니저로 하노이에서 일하고 있어서 매일 베트남 동료들과 베트남어로 소통해야 합니다. 매일 온라인으로 공부하고 원어민과 말하기 연습을 통해 실력을 늘리려고 노력하고 있습니다.',
 'IM', '["자기소개","언어학습"]'),

('004', '자기소개',
 'Điểm mạnh của bạn là gì?',
 '당신의 장점은 무엇인가요?',
 'Điểm mạnh của tôi là khả năng quản lý dự án hiệu quả và giao tiếp tốt với các thành viên trong đội. Tôi luôn có thể điều phối công việc để hoàn thành đúng hạn và đạt được mục tiêu. Ngoài ra, tôi có khả năng học hỏi nhanh, đặc biệt là khi làm việc với các công nghệ mới trong lĩnh vực IT. Điều này rất hữu ích cho công việc của tôi.',
 '제 장점은 효율적인 프로젝트 관리와 팀원들과의 좋은 소통 능력입니다. 저는 항상 업무를 조율하여 정시에 완료하고 목표를 달성할 수 있습니다. 또한 특히 IT 분야의 새로운 기술을 다룰 때 빠른 학습 능력이 있어서 업무에 매우 도움이 됩니다.',
 'IM', '["자기소개","장점"]'),

('005', '자기소개',
 'Bạn có thể mô tả tính cách của mình không?',
 '자신의 성격을 설명해 줄 수 있나요?',
 'Tôi là người hướng nội nhưng rất thân thiện, đặc biệt là khi làm việc với đồng nghiệp. Vì công việc của tôi là Quản lý Dự án IT, tôi cần phải chú ý rất kỹ đến chi tiết và có khả năng giao tiếp tốt. Tôi thích làm việc độc lập để tập trung vào công việc, nhưng tôi cũng biết cách làm việc nhóm hiệu quả. Điều này rất hữu ích cho công việc quản lý dự án của tôi tại Hà Nội.',
 '저는 내향적이지만 매우 친화적인 사람입니다. 특히 동료들과 일할 때는 더욱 그렇습니다. IT 프로젝트 매니저인 만큼 세부 사항에 매우 주의를 기울이고 의사소통 능력이 중요합니다. 집중력 있는 업무를 위해 독립적으로 일하는 것을 좋아하지만, 효율적인 팀 협력도 잘합니다. 이러한 특성이 하노이에서의 프로젝트 관리 업무에 많은 도움이 됩니다.',
 'IM', '["자기소개","성격"]'),

('006', '자기소개',
 'Mục tiêu của bạn trong năm nay là gì?',
 '올해 목표가 무엇인가요?',
 'Mục tiêu của tôi trong năm nay là nâng cao trình độ tiếng Việt để giao tiếp tốt hơn trong công việc, và cải thiện kỹ năng quản lý dự án khi làm việc với các đồng nghiệp Việt Nam tại Hà Nội. Ngoài ra, tôi muốn có cơ hội khám phá thêm những địa điểm đẹp ở Việt Nam, có thể là Nha Trang hoặc Đà Lạt.',
 '올해 제 목표는 베트남어 실력을 높여서 업무 중에 베트남 동료들과 더 잘 소통하고, 하노이에서 프로젝트 관리 능력을 향상시키는 것입니다. 그리고 앞으로 베트남의 다른 아름다운 도시들, 예를 들어 나트랑이나 달랏 같은 곳을 탐험할 기회를 가지고 싶습니다.',
 'IM', '["자기소개","목표"]'),

('007', '직장',
 'Bạn làm nghề gì?',
 '직업이 무엇인가요?',
 'Tôi là lập trình viên phần mềm. Tôi làm việc tại một công ty công nghệ ở Seoul được ba năm rồi.',
 '저는 소프트웨어 개발자입니다. 서울의 IT 회사에서 3년째 일하고 있습니다.',
 'IM', '["직장","직업"]'),

('008', '직장',
 'Công việc hàng ngày của bạn là gì?',
 '매일 하는 업무는 무엇인가요?',
 'Hàng ngày tôi viết code, tham gia cuộc họp nhóm và xem xét code của đồng nghiệp. Đôi khi tôi làm việc với khách hàng để hiểu yêu cầu của họ.',
 '매일 코드를 작성하고, 팀 회의에 참여하고, 동료의 코드를 검토합니다. 때로는 고객과 함께 요구사항을 파악하는 작업을 합니다.',
 'IM', '["직장","업무"]'),

('009', '직장',
 'Bạn làm việc với bao nhiêu người?',
 '몇 명과 함께 일하나요?',
 'Nhóm tôi có mười người. Chúng tôi thường trao đổi qua ứng dụng nhắn tin và họp trực tuyến.',
 '저희 팀은 10명입니다. 우리는 주로 메신저 앱과 온라인 회의를 통해 소통합니다.',
 'IM', '["직장","팀"]'),

('010', '직장',
 'Bạn thích điều gì nhất về công việc của mình?',
 '직장에서 가장 좋아하는 것은 무엇인가요?',
 'Tôi thích nhất là khi tôi giải quyết được một vấn đề khó. Cảm giác thành công đó rất tuyệt vời.',
 '어려운 문제를 해결했을 때가 가장 좋습니다. 그 성취감이 정말 훌륭합니다.',
 'IM', '["직장","만족감"]'),

('011', '직장',
 'Bạn có hay làm thêm giờ không?',
 '야근을 자주 하나요?',
 'Thỉnh thoảng tôi làm thêm giờ khi có deadline gấp. Nhưng công ty tôi coi trọng cân bằng công việc và cuộc sống.',
 '마감이 급할 때는 가끔 야근을 합니다. 하지만 저희 회사는 일과 생활의 균형을 중요시합니다.',
 'IM', '["직장","근무시간"]'),

('012', '취미',
 'Sở thích của bạn là gì?',
 '취미가 무엇인가요?',
 'Tôi có hai sở thích chính là lập trình và đọc sách. Vào cuối tuần, tôi thường chạy bộ khoảng hai lần một tuần để rèn luyện sức khỏe. Ngoài ra, tôi cũng thích khám phá các địa điểm du lịch như Đà Nẵng và Hội An.',
 '저는 코딩과 독서를 주요 취미로 즐깁니다. 주말에는 주로 주 2회 달리기를 해서 건강을 유지하고 있습니다. 그 외에도 다낭, 호이안 같은 베트남의 여행지를 탐방하는 것을 좋아합니다.',
 'IM', '["취미","여가"]'),

('013', '취미',
 'Bạn thường đọc loại sách gì?',
 '어떤 종류의 책을 주로 읽나요?',
 'Tôi thích đọc tiểu thuyết khoa học viễn tưởng và sách về phát triển bản thân, đặc biệt là những cuốn liên quan đến công nghệ và quản lý dự án. Vì công việc của tôi liên quan đến IT, nên tôi thường tìm kiếm những sách có thể giúp ích cho sự phát triển nghề nghiệp. Gần đây tôi cũng đọc sách tiếng Việt để luyện tập tiếng Việt tốt hơn.',
 '공상과학 소설과 자기계발서를 좋아합니다. IT 프로젝트 매니저로 일하고 있어서 기술과 경영 관련 책들을 많이 읽는데, 업무에 도움이 되기 때문입니다. 최근에는 베트남어 실력을 높이기 위해 베트남어 책도 꾸준히 읽고 있습니다.',
 'IM', '["취미","독서"]'),

('014', '취미',
 'Bạn có chơi thể thao không?',
 '운동을 하나요?',
 'Có, tôi chạy bộ hai lần một tuần. Đó là cách tôi duy trì sức khỏe, đặc biệt là khi công việc rất bận rộn. Bên cạnh đó, tôi cũng thích đi bộ hoặc tập thể dục nhẹ vào cuối tuần để thư giãn.',
 '네, 저는 주 2회 달리기를 합니다. 업무가 바쁠 때도 운동은 꾸준히 하려고 노력합니다. 주말에는 산책이나 가벼운 운동으로 스트레스를 풀어요.',
 'IM', '["취미","운동"]'),

('015', '취미',
 'Bạn thích nghe nhạc gì?',
 '어떤 음악을 좋아하나요?',
 'Tôi thích nghe nhạc pop và nhạc jazz, nhất là khi tôi đi chạy bộ vào cuối tuần. Gần đây tôi cũng nghe nhạc Việt Nam nhiều hơn để vừa học tiếng vừa thư giãn sau những ngày làm việc bận rộn.',
 '팝과 재즈를 좋아합니다. 특히 주말에 달리기할 때 자주 듣습니다. 최근에는 업무 스트레스를 풀고 언어 공부도 함께 하기 위해 베트남 음악을 더 많이 듣고 있어요.',
 'IM', '["취미","음악"]'),

('016', '취미',
 'Bạn có sở thích nào đặc biệt không?',
 '특별한 취미가 있나요?',
 'Tôi có hai sở thích chính là lập trình và đọc sách. Vì tôi là IT Project Manager nên tôi thích code trong thời gian rảnh. Ngoài ra, tôi cũng yêu thích đọc sách để học hỏi những điều mới. Ngoài đó, tôi còn chạy bộ khoảng hai lần một tuần để giữ sức khỏe.',
 '주로 코딩과 독서를 즐깁니다. IT Project Manager라는 업무 특성상 쉬는 시간에도 코딩을 하곤 합니다. 또한 새로운 것을 배우기 위해 독서도 자주 합니다. 건강을 위해 일주일에 두 번 정도 달리기도 하고 있습니다.',
 'IM', '["취미","사진"]'),

('017', '거주지',
 'Bạn sống ở đâu?',
 '어디에 살고 있나요?',
 'Tôi sống ở Seoul, Hàn Quốc. Cụ thể là ở quận Mapo, gần trung tâm thành phố.',
 '저는 한국 서울에 살고 있습니다. 구체적으로는 마포구에 살며 도심과 가깝습니다.',
 'IM', '["거주지","위치"]'),

('018', '거주지',
 'Bạn sống trong nhà hay căn hộ?',
 '단독주택에 사나요, 아파트에 사나요?',
 'Tôi sống trong một căn hộ nhỏ, có hai phòng ngủ. Căn hộ không lớn lắm nhưng rất thoải mái và tiện nghi.',
 '저는 작은 아파트에 살고 있으며 방이 두 개입니다. 아파트가 크지는 않지만 매우 편안하고 편리합니다.',
 'IM', '["거주지","주거형태"]'),

('019', '거주지',
 'Khu vực bạn sống có những tiện ích gì?',
 '사는 지역에 어떤 편의시설이 있나요?',
 'Gần nhà tôi có siêu thị, bệnh viện, và nhiều nhà hàng. Ga tàu điện ngầm cũng chỉ cách năm phút đi bộ.',
 '집 근처에 슈퍼마켓, 병원, 그리고 많은 식당이 있습니다. 지하철역도 걸어서 5분 거리입니다.',
 'IM', '["거주지","편의시설"]'),

('020', '거주지',
 'Bạn có thích nơi bạn đang sống không? Tại sao?',
 '현재 사는 곳이 마음에 드나요? 이유는?',
 'Tôi rất thích nơi này vì giao thông thuận tiện và có nhiều không gian xanh. Tuy nhiên, giá thuê nhà hơi đắt.',
 '교통이 편리하고 녹지 공간이 많아서 이곳이 매우 마음에 듭니다. 다만 임대료가 조금 비싸긴 합니다.',
 'IM', '["거주지","의견"]'),

('021', '거주지',
 'Hàng xóm của bạn như thế nào?',
 '이웃은 어떤가요?',
 'Hàng xóm của tôi rất thân thiện. Chúng tôi thỉnh thoảng chào hỏi nhau ở hành lang và giúp đỡ nhau khi cần.',
 '이웃들이 매우 친절합니다. 우리는 가끔 복도에서 인사를 나누고 필요할 때 서로 도와줍니다.',
 'IM', '["거주지","이웃"]'),

('022', '여행',
 'Bạn có thích đi du lịch không?',
 '여행을 좋아하나요?',
 'Tôi rất thích đi du lịch. Mỗi năm tôi cố gắng đi ít nhất một lần ra nước ngoài để khám phá văn hóa mới.',
 '여행을 정말 좋아합니다. 매년 새로운 문화를 탐험하기 위해 최소 한 번은 해외여행을 하려고 합니다.',
 'IM', '["여행","일반"]'),

('023', '여행',
 'Bạn đã đến những nước nào rồi?',
 '어떤 나라들을 가봤나요?',
 'Tôi đã đến Nhật Bản, Thái Lan và Đài Loan. Mỗi nơi có văn hóa và ẩm thực rất khác nhau và thú vị.',
 '일본, 태국, 대만을 다녀왔습니다. 각 나라마다 문화와 음식이 매우 다르고 흥미롭습니다.',
 'IM', '["여행","경험"]'),

('024', '여행',
 'Bạn thích du lịch một mình hay đi cùng bạn bè?',
 '혼자 여행하는 것을 좋아하나요, 친구와 함께 여행하는 것을 좋아하나요?',
 'Tôi thích cả hai. Du lịch một mình giúp tôi tự do hơn, còn đi với bạn bè thì vui hơn và có nhiều kỷ niệm đẹp.',
 '둘 다 좋아합니다. 혼자 여행하면 더 자유롭고, 친구와 함께하면 더 즐겁고 좋은 추억이 많이 생깁니다.',
 'IM', '["여행","스타일"]'),

('025', '여행',
 'Bạn muốn đến Việt Nam không? Tại sao?',
 '베트남에 가보고 싶나요? 이유는?',
 'Tôi rất muốn đến Việt Nam. Tôi muốn thưởng thức ẩm thực Việt Nam thật sự và khám phá các di tích lịch sử ở đó.',
 '베트남에 정말 가고 싶습니다. 진짜 베트남 음식을 맛보고 그곳의 역사 유적을 탐험하고 싶습니다.',
 'IM', '["여행","베트남"]'),

('026', '여행',
 'Bạn thường chuẩn bị gì khi đi du lịch?',
 '여행 시 보통 어떤 준비를 하나요?',
 'Tôi thường lên kế hoạch trước một tháng. Tôi đặt vé máy bay, khách sạn và tìm hiểu về các địa điểm tham quan.',
 '보통 한 달 전부터 계획을 세웁니다. 항공권과 호텔을 예약하고 관광지에 대해 알아봅니다.',
 'IM', '["여행","준비"]'),

('027', '음식',
 'Bạn thích ăn gì nhất?',
 '가장 좋아하는 음식이 무엇인가요?',
 'Tôi thích nhất là món phở Việt Nam. Nước dùng thơm ngon và thịt bò mềm làm tôi không thể cưỡng lại được.',
 '베트남 쌀국수(phở)를 가장 좋아합니다. 향긋한 육수와 부드러운 쇠고기를 거부할 수 없습니다.',
 'IM', '["음식","선호"]'),

('028', '음식',
 'Bạn có biết nấu ăn không?',
 '요리를 할 줄 아나요?',
 'Tôi biết nấu những món đơn giản như cơm rang, mì xào và canh. Tôi nấu ăn ở nhà khoảng ba lần một tuần.',
 '볶음밥, 볶음면, 국 같은 간단한 요리는 할 줄 압니다. 일주일에 약 세 번 집에서 요리합니다.',
 'IM', '["음식","요리"]'),

('029', '음식',
 'Bạn thích ăn cay không?',
 '매운 음식을 좋아하나요?',
 'Tôi thích ăn cay vừa phải. Người Hàn Quốc quen ăn cay nên tôi ăn được khá nhiều loại đồ ăn cay.',
 '적당히 매운 음식을 좋아합니다. 한국인은 매운 음식에 익숙해서 꽤 많은 종류의 매운 음식을 먹을 수 있습니다.',
 'IM', '["음식","취향"]'),

('030', '음식',
 'Bạn thường ăn sáng bằng gì?',
 '아침으로 주로 무엇을 먹나요?',
 'Thường ngày tôi ăn sáng đơn giản như bánh mì hoặc ngũ cốc với sữa. Cuối tuần tôi ăn thịnh soạn hơn.',
 '평소에는 빵이나 시리얼과 우유 같은 간단한 아침을 먹습니다. 주말에는 더 푸짐하게 먹습니다.',
 'IM', '["음식","식습관"]'),

('031', '음식',
 'Bạn có kiêng ăn gì không?',
 '먹지 못하는 음식이 있나요?',
 'Tôi không ăn được hải sản vì bị dị ứng nhẹ. Ngoài ra tôi ăn được hầu hết mọi thứ và không kén chọn lắm.',
 '가벼운 알레르기 때문에 해산물을 먹지 못합니다. 그 외에는 대부분 다 먹을 수 있고 많이 가리지는 않습니다.',
 'IM', '["음식","제한"]'),

('032', '음식',
 'Bạn thích ăn ở nhà hàng hay tự nấu ở nhà?',
 '식당에서 먹는 것과 집에서 요리하는 것 중 어느 쪽을 좋아하나요?',
 'Tôi thích cả hai tùy tình huống. Ngày bận rộn thì tôi thích ra nhà hàng, còn lúc có thời gian thì tôi tự nấu ăn ở nhà.',
 '상황에 따라 둘 다 좋습니다. 바쁜 날에는 식당을 선호하고, 시간이 있을 때는 집에서 직접 요리합니다.',
 'IM', '["음식","식사방식"]')

ON CONFLICT (id) DO NOTHING;
