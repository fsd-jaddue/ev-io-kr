import type { Sido } from "@/lib/ev/types";

/**
 * 17개 시·도와 시·군·구 목록.
 * evCode는 무공해차 통합누리집(ev.or.kr) 지역코드 체계(행정표준코드 앞자리)를 참고한 값으로,
 * 외부 링크 및 수집 스크립트의 지역 매칭 보조용입니다. 실제 매칭은 지역명 기준으로 수행합니다.
 */
export const SIDO_LIST: Sido[] = [
  {
    slug: "seoul",
    name: "서울특별시",
    short: "서울",
    evCode: "1100",
    sigungu: [
      "종로구", "중구", "용산구", "성동구", "광진구", "동대문구", "중랑구", "성북구", "강북구", "도봉구",
      "노원구", "은평구", "서대문구", "마포구", "양천구", "강서구", "구로구", "금천구", "영등포구", "동작구",
      "관악구", "서초구", "강남구", "송파구", "강동구",
    ],
  },
  {
    slug: "busan",
    name: "부산광역시",
    short: "부산",
    evCode: "2600",
    sigungu: [
      "중구", "서구", "동구", "영도구", "부산진구", "동래구", "남구", "북구", "해운대구", "사하구",
      "금정구", "강서구", "연제구", "수영구", "사상구", "기장군",
    ],
  },
  {
    slug: "daegu",
    name: "대구광역시",
    short: "대구",
    evCode: "2700",
    sigungu: ["중구", "동구", "서구", "남구", "북구", "수성구", "달서구", "달성군", "군위군"],
  },
  {
    slug: "incheon",
    name: "인천광역시",
    short: "인천",
    evCode: "2800",
    sigungu: ["중구", "동구", "미추홀구", "연수구", "남동구", "부평구", "계양구", "서구", "강화군", "옹진군"],
  },
  {
    slug: "gwangju",
    name: "광주광역시",
    short: "광주",
    evCode: "2900",
    sigungu: ["동구", "서구", "남구", "북구", "광산구"],
  },
  {
    slug: "daejeon",
    name: "대전광역시",
    short: "대전",
    evCode: "3000",
    sigungu: ["동구", "중구", "서구", "유성구", "대덕구"],
  },
  {
    slug: "ulsan",
    name: "울산광역시",
    short: "울산",
    evCode: "3100",
    sigungu: ["중구", "남구", "동구", "북구", "울주군"],
  },
  {
    slug: "sejong",
    name: "세종특별자치시",
    short: "세종",
    evCode: "3611",
    sigungu: ["세종시"],
  },
  {
    slug: "gyeonggi",
    name: "경기도",
    short: "경기",
    evCode: "4100",
    sigungu: [
      "수원시", "성남시", "의정부시", "안양시", "부천시", "광명시", "평택시", "동두천시", "안산시", "고양시",
      "과천시", "구리시", "남양주시", "오산시", "시흥시", "군포시", "의왕시", "하남시", "용인시", "파주시",
      "이천시", "안성시", "김포시", "화성시", "광주시", "양주시", "포천시", "여주시", "연천군", "가평군", "양평군",
    ],
  },
  {
    slug: "gangwon",
    name: "강원특별자치도",
    short: "강원",
    evCode: "4200",
    sigungu: [
      "춘천시", "원주시", "강릉시", "동해시", "태백시", "속초시", "삼척시", "홍천군", "횡성군", "영월군",
      "평창군", "정선군", "철원군", "화천군", "양구군", "인제군", "고성군", "양양군",
    ],
  },
  {
    slug: "chungbuk",
    name: "충청북도",
    short: "충북",
    evCode: "4300",
    sigungu: ["청주시", "충주시", "제천시", "보은군", "옥천군", "영동군", "증평군", "진천군", "괴산군", "음성군", "단양군"],
  },
  {
    slug: "chungnam",
    name: "충청남도",
    short: "충남",
    evCode: "4400",
    sigungu: [
      "천안시", "공주시", "보령시", "아산시", "서산시", "논산시", "계룡시", "당진시", "금산군", "부여군",
      "서천군", "청양군", "홍성군", "예산군", "태안군",
    ],
  },
  {
    slug: "jeonbuk",
    name: "전북특별자치도",
    short: "전북",
    evCode: "4500",
    sigungu: ["전주시", "군산시", "익산시", "정읍시", "남원시", "김제시", "완주군", "진안군", "무주군", "장수군", "임실군", "순창군", "고창군", "부안군"],
  },
  {
    slug: "jeonnam",
    name: "전라남도",
    short: "전남",
    evCode: "4600",
    sigungu: [
      "목포시", "여수시", "순천시", "나주시", "광양시", "담양군", "곡성군", "구례군", "고흥군", "보성군",
      "화순군", "장흥군", "강진군", "해남군", "영암군", "무안군", "함평군", "영광군", "장성군", "완도군", "진도군", "신안군",
    ],
  },
  {
    slug: "gyeongbuk",
    name: "경상북도",
    short: "경북",
    evCode: "4700",
    sigungu: [
      "포항시", "경주시", "김천시", "안동시", "구미시", "영주시", "영천시", "상주시", "문경시", "경산시",
      "의성군", "청송군", "영양군", "영덕군", "청도군", "고령군", "성주군", "칠곡군", "예천군", "봉화군", "울진군", "울릉군",
    ],
  },
  {
    slug: "gyeongnam",
    name: "경상남도",
    short: "경남",
    evCode: "4800",
    sigungu: [
      "창원시", "진주시", "통영시", "사천시", "김해시", "밀양시", "거제시", "양산시", "의령군", "함안군",
      "창녕군", "고성군", "남해군", "하동군", "산청군", "함양군", "거창군", "합천군",
    ],
  },
  {
    slug: "jeju",
    name: "제주특별자치도",
    short: "제주",
    evCode: "5000",
    sigungu: ["제주시", "서귀포시"],
  },
];

export function getSido(slug: string): Sido | undefined {
  return SIDO_LIST.find((s) => s.slug === slug);
}

export function getSidoByShort(short: string): Sido | undefined {
  const s = short.replace(/\s/g, "");
  return SIDO_LIST.find((x) => x.short === s || x.name === s || x.name.startsWith(s));
}

/** 시·군·구명을 URL slug로 (한글 유지, 공백 제거) */
export function sigunguSlug(name: string): string {
  return encodeURIComponent(name.replace(/\s/g, ""));
}

export function decodeSigungu(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}
