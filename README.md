# 오유택 포트폴리오

> **"나는 내 가지들로 이루어져 있다"**

MZS 스튜디오 대표 오유택의 포트폴리오 웹사이트입니다.  
가지(Branches) → 줄기(Stem) → 뿌리(Roots) 컨셉으로 구성되어 있습니다.

![Portfolio Preview](assets/images/preview.png)

---

## ✨ 주요 기능

- **가로 스크롤 갤러리** - Branches 페이지에서 6개 카테고리 작업물 탐색
- **수직 스토리텔링** - Stem 페이지에서 자기소개 및 경력 표시
- **인터랙티브 마인드맵** - Roots 페이지에서 줌/팬 가능한 프로젝트 맵
- **반응형 디자인** - 모바일, 태블릿, 데스크탑 지원
- **화려한 애니메이션** - Apple 스타일의 세련된 인터랙션

---

## 🚀 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env` 파일에 Notion API 키를 설정합니다:

```env
NOTION_TOKEN=your_notion_api_key_here
```

### 3. 개발 서버 실행

```bash
npm run dev
```

또는

```bash
python -m http.server 24433
```

브라우저에서 http://localhost:24433 접속

---

## 📋 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 (포트 24433) |
| `npm run build-data` | Notion에서 데이터 가져오기 |
| `npm run fetch-notion` | 레거시 Notion 데이터 fetch |
| `npm run generate-json` | portfolio.json 생성 |

---

## 📁 프로젝트 구조

```
📁 portfolio/
├── 📁 assets/          # 이미지 에셋
│   └── images/
│       └── portfolio/  # 포트폴리오 이미지
├── 📁 css/
│   ├── base/           # 리셋, 변수
│   ├── components/     # UI 컴포넌트
│   ├── layout/         # 레이아웃
│   ├── pages/          # 페이지별 스타일
│   ├── utilities/      # 애니메이션, 반응형
│   └── main.css        # CSS 진입점
├── 📁 js/
│   ├── core/           # 앱 부트스트랩
│   ├── modules/        # 기능 모듈
│   └── pages/          # 페이지 로직
├── 📁 data/            # portfolio.json
├── 📁 scripts/         # 빌드 스크립트
├── .env                # 환경 변수
├── index.html          # 메인 HTML
├── package.json
├── README.md
└── ARCHITECTURE.md     # 아키텍처 문서
```

---

## 🎨 디자인 컨셉

### 테마
- **우주/은하계** - 밤하늘, 별똥별, 광활한 느낌
- **유기적 성장** - 가지 → 줄기 → 뿌리 메타포
- **Apple 스타일** - 세련되고 미니멀한 UX

### 색상
- 배경: `#0a0a0a` (깊은 검정)
- 강조: `#a78bfa` (부드러운 보라)
- 보조: `#60a5fa` (부드러운 파랑)

### 폰트
- 한글: **Pretendard**
- 영문: **Bebas Neue**

---

## 🔧 기술 스택

- **HTML5** - 시맨틱 마크업
- **CSS3** - 모듈화, CSS 변수, clamp()
- **Vanilla JavaScript** - ES Modules
- **Notion API** - 데이터 소스

---

## 📱 반응형 중단점

| 중단점 | 화면 |
|--------|------|
| < 480px | 모바일 |
| 480px - 767px | 큰 모바일 |
| 768px - 1023px | 태블릿 |
| 1024px - 1439px | 소형 데스크탑 |
| ≥ 1440px | 대형 데스크탑 |

---

## 📄 라이선스

MIT License

---

## 🌐 프로덕션 배포

이 프로젝트는 정적 사이트로, 별도 빌드 없이 배포 가능합니다.

### 배포 전 체크리스트

1. **데이터 최신화**
   ```bash
   npm run build-data
   ```

2. **필요 파일 확인**
   - `index.html`
   - `css/` 폴더 전체
   - `js/` 폴더 전체
   - `data/portfolio.json`
   - `assets/` 폴더 전체

3. **제외 파일**
   - `.env` (API 키 노출 방지)
   - `node_modules/`
   - `scripts/` (빌드 스크립트)

### 호스팅 옵션

| 플랫폼 | 방법 |
|--------|------|
| **GitHub Pages** | 저장소 → Settings → Pages → Source 선택 |
| **Netlify** | 폴더 드래그 앤 드롭 또는 Git 연동 |
| **Vercel** | `vercel` CLI 또는 Git 연동 |
| **AWS S3** | S3 버킷 → 정적 웹 호스팅 활성화 |

### 주의사항

> ⚠️ **Notion 이미지 URL은 1시간 후 만료됩니다.**  
> 프로덕션 배포 전 `npm run build-data` 실행 후 즉시 배포하세요.

---

## 👤 제작자

**오유택** - MZS 스튜디오 대표

- 디자인 스튜디오 2년 운영
- 크몽 600+ 프로젝트
- 유튜브 아카데미 강사
