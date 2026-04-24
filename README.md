# DAIMASU — Projection Mapping Kaiseki Landing

대극(大料) 영상 프로젝션 맵핑 카이세키 전용 랜딩 페이지.
마카티(필리핀)의 8석 카운터에서 진행되는 90분 영상 맵핑 코스 요리를 소개하고, 온라인 예약을 받습니다.

- 8코스 · ₱8,000 · 17:30 / 19:30 2회전
- 예약 폼 제출 시 Telegram 봇으로 현장 스탭에게 즉시 알림
- 다국어: 日本語 / English 토글
- 데스크톱·모바일 반응형 (Galaxy Fold ~ 1920 widescreen)

## Tech Stack

- **Next.js 16** (App Router, static export `output: "export"`)
- **React 19** · **TypeScript**
- **Tailwind CSS v4** (via `@theme inline`)
- **Framer Motion** — 섹션 페이드·스크롤 애니메이션
- **react-day-picker v9** — 예약 달력
- **lucide-react** — 아이콘

## Local Development

```bash
npm install
npm run dev
# → http://localhost:3000
```

프로덕션 정적 파일 생성:

```bash
npm run build
# → out/ 에 정적 HTML/CSS/JS 산출
```

## Environment Variables

`.env.local` 에 Telegram 봇 자격정보가 포함되어 있습니다 (커밋됨 — 핸드오프용):

```
NEXT_PUBLIC_TELEGRAM_BOT_TOKEN=<bot token>
NEXT_PUBLIC_TELEGRAM_CHAT_ID=<group chat id>
```

- `NEXT_PUBLIC_` prefix = 클라이언트 번들에 포함 (예약 폼에서 직접 Telegram API 호출)
- 토큰 교체가 필요하면 `@BotFather`에서 재생성 후 파일 수정

## Project Structure

```
src/
├── app/
│   ├── page.tsx         섹션 조립 (Hero → About → Experience → Journey → Menu → Info)
│   ├── layout.tsx       폰트·메타데이터
│   └── globals.css      Tailwind + DayPicker 커스텀 테마
├── components/
│   ├── Hero.tsx         히어로 섹션 (반응형 H1, CTA 2개)
│   ├── Header.tsx       로고 + 내비 + 모바일 햄버거
│   ├── About.tsx        브랜드 소개 + AESTHETICS 카드
│   ├── Experience.tsx   3스텝 경험 흐름
│   ├── Gallery.tsx      Journey 시각 연대기
│   ├── MenuSection.tsx  8코스 — 모바일 캐러셀 · lg 타임라인 · xl 2컬럼
│   ├── Info.tsx         Visitor Guide + 예약 폼 + Contact + FAQ
│   ├── ReservationForm.tsx    날짜·좌석·인원 폼 + Telegram 전송
│   ├── StickyMobileCTA.tsx    모바일 하단 고정 Reserve + WhatsApp
│   └── Footer.tsx
└── lib/
    ├── constants.ts     SITE · NAV · COURSES · CONTACT · RESTAURANT_INFO
    └── language.tsx     JA/EN 토글 Provider + useLang()
```

## Key Design Decisions

- **DayPicker 커스텀 테마** (`globals.css` `.rdp-daimasu .rdp-root ...`): 라이브러리 기본값 override를 위해 `.rdp-root` 셀렉터에 스코프
- **Hero H1 LCP 최적화**: `.hero-h1` class가 CSS 애니메이션으로 직접 페이드 (framer-motion 의존 없음)
- **Sticky Mobile CTA**: Send 버튼과 `#reservation` 섹션 중앙 진입 감지로 자동 숨김
- **Responsive design**: Tailwind 브레이크포인트 `sm/md/lg/xl/2xl`로 단일 코드베이스 분기

## Deployment

정적 파일이라 대부분의 호스팅 선택 가능:

- **Vercel** — 가장 간단 (next.config.ts `output: "export"` 자동 인식)
- **Netlify**, **Cloudflare Pages**, **GitHub Pages**, **S3 + CloudFront** 등

```bash
npm run build
# out/ 을 호스팅에 업로드
```

## Contact

프로젝트 문의 — 김준호 (kjh960120@gmail.com)
