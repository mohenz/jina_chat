const KMA_ENDPOINT = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst';
const KMA_RELEASE_HOURS = [23, 20, 17, 14, 11, 8, 5, 2];
const DEG = Math.PI / 180;

function toKmaGrid(latitude, longitude) {
  const re = 6371.00877 / 5;
  const slat1 = 30 * DEG;
  const slat2 = 60 * DEG;
  const olon = 126 * DEG;
  const olat = 38 * DEG;
  const xo = 43;
  const yo = 136;
  const sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) /
    Math.log(Math.tan(Math.PI / 4 + slat2 / 2) / Math.tan(Math.PI / 4 + slat1 / 2));
  const sf = Math.tan(Math.PI / 4 + slat1 / 2) ** sn * Math.cos(slat1) / sn;
  const ro = re * sf / Math.tan(Math.PI / 4 + olat / 2) ** sn;
  const ra = re * sf / Math.tan(Math.PI / 4 + latitude * DEG / 2) ** sn;
  const theta = longitude * DEG - olon;
  return {
    nx: Math.floor(ra * Math.sin(theta) + xo + 0.5),
    ny: Math.floor(ro - ra * Math.cos(theta) + yo + 0.5)
  };
}

function getKoreaDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23'
  }).formatToParts(date);
  return Object.fromEntries(parts.filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
}

function previousDate(dateString) {
  const date = new Date(`${dateString.slice(0, 4)}-${dateString.slice(4, 6)}-${dateString.slice(6, 8)}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(date.getUTCDate()).padStart(2, '0')}`;
}

function getBaseTimeCandidates(dateParts) {
  const hour = Number(dateParts.hour);
  const available = KMA_RELEASE_HOURS.filter(releaseHour => releaseHour <= hour - 1);
  if (available.length) {
    const sameDay = available.slice(0, 3).map(releaseHour => ({
      baseDate: `${dateParts.year}${dateParts.month}${dateParts.day}`,
      baseTime: `${String(releaseHour).padStart(2, '0')}00`
    }));
    sameDay.push({ baseDate: previousDate(`${dateParts.year}${dateParts.month}${dateParts.day}`), baseTime: '2300' });
    return sameDay;
  }
  return [{ baseDate: previousDate(`${dateParts.year}${dateParts.month}${dateParts.day}`), baseTime: '2300' }];
}

function numberValue(items, category) {
  const entry = items.find(item => item.category === category);
  const value = Number(entry?.fcstValue);
  return Number.isFinite(value) ? value : null;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const serviceKey = process.env.KMA_SERVICE_KEY;
  if (!serviceKey) {
    res.status(503).json({ error: '기상청 API 키가 서버에 설정되지 않았습니다.' });
    return;
  }

  const latitude = Number(req.query?.lat);
  const longitude = Number(req.query?.lon);
  if (!Number.isFinite(latitude) || latitude < 33 || latitude > 39 ||
      !Number.isFinite(longitude) || longitude < 124 || longitude > 132) {
    res.status(400).json({ error: '대한민국 안의 위치를 선택해 주세요.' });
    return;
  }

  try {
    const { nx, ny } = toKmaGrid(latitude, longitude);
    const dateParts = getKoreaDateParts();
    const baseCandidates = getBaseTimeCandidates(dateParts);
    let responseData = null;
    let lastFailure = null;

    for (const base of baseCandidates) {
      const params = new URLSearchParams({
        serviceKey,
        pageNo: '1',
        numOfRows: '1000',
        dataType: 'JSON',
        base_date: base.baseDate,
        base_time: base.baseTime,
        nx: String(nx),
        ny: String(ny)
      });
      const upstream = await fetch(`${KMA_ENDPOINT}?${params.toString()}`, { signal: AbortSignal.timeout(9000) });
      const payload = await upstream.json();
      const response = payload?.response;
      if (upstream.ok && response?.header?.resultCode === '00' && response?.body?.items?.item?.length) {
        responseData = response.body.items.item;
        break;
      }
      lastFailure = response?.header?.resultMsg || `HTTP ${upstream.status}`;
    }

    if (!responseData) {
      console.error('[Weather] KMA forecast request failed:', lastFailure || 'empty response');
      res.status(502).json({ error: '기상청 예보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.' });
      return;
    }

    const date = `${dateParts.year}${dateParts.month}${dateParts.day}`;
    const todayItems = responseData.filter(item => item.fcstDate === date);
    const futureToday = todayItems
      .filter(item => item.fcstTime >= `${dateParts.hour}00`)
      .sort((a, b) => a.fcstTime.localeCompare(b.fcstTime));
    const nextTime = futureToday[0]?.fcstTime;
    const nextTimeItems = nextTime ? futureToday.filter(item => item.fcstTime === nextTime) : [];
    const hourlyTemps = todayItems.filter(item => item.category === 'TMP').map(item => Number(item.fcstValue)).filter(Number.isFinite);
    const minForecast = numberValue(responseData, 'TMN');
    const maxForecast = numberValue(responseData, 'TMX');
    const temperature = numberValue(nextTimeItems, 'TMP') ?? hourlyTemps[0] ?? null;
    const precipitationType = Number(numberValue(nextTimeItems, 'PTY') ?? 0);
    const sky = Number(numberValue(nextTimeItems, 'SKY') ?? 1);
    const rainChanceValues = todayItems.filter(item => item.category === 'POP').map(item => Number(item.fcstValue)).filter(Number.isFinite);
    const rainAmount = nextTimeItems.find(item => item.category === 'PCP')?.fcstValue;
    const windSpeeds = nextTimeItems.find(item => item.category === 'WSD')?.fcstValue;

    res.status(200).json({
      location: String(req.query?.location || '선택한 지역').slice(0, 40),
      observedAt: new Date().toISOString(),
      temperature,
      minTemperature: minForecast ?? (hourlyTemps.length ? Math.min(...hourlyTemps) : null),
      maxTemperature: maxForecast ?? (hourlyTemps.length ? Math.max(...hourlyTemps) : null),
      precipitationType,
      sky,
      precipitationProbability: rainChanceValues.length ? Math.max(...rainChanceValues) : 0,
      precipitationAmount: rainAmount || '강수 없음',
      windSpeed: windSpeeds === undefined ? null : Number(windSpeeds),
      forecastTime: nextTime || null,
      source: '기상청 단기예보'
    });
  } catch (error) {
    console.error('[Weather] Forecast request error:', error.message);
    res.status(502).json({ error: '날씨 정보를 가져오는 중 오류가 발생했습니다.' });
  }
}
