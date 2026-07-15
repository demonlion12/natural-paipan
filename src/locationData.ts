export type BirthLocation = {
  id: string;
  label: string;
  aliases: string[];
  longitude: number;
  latitude: number;
  timezoneOffset: number;
};

export const birthLocations: BirthLocation[] = [
  { id: 'beijing', label: '北京市', aliases: ['北京'], longitude: 116.4074, latitude: 39.9042, timezoneOffset: 8 },
  { id: 'shanghai', label: '上海市', aliases: ['上海'], longitude: 121.4737, latitude: 31.2304, timezoneOffset: 8 },
  { id: 'tianjin', label: '天津市', aliases: ['天津'], longitude: 117.2009, latitude: 39.0842, timezoneOffset: 8 },
  { id: 'chongqing', label: '重庆市', aliases: ['重庆'], longitude: 106.5516, latitude: 29.563, timezoneOffset: 8 },
  { id: 'hangzhou', label: '浙江省 杭州市', aliases: ['浙江杭州', '杭州'], longitude: 120.1551, latitude: 30.2741, timezoneOffset: 8 },
  { id: 'ningbo', label: '浙江省 宁波市', aliases: ['浙江宁波', '宁波'], longitude: 121.5504, latitude: 29.8746, timezoneOffset: 8 },
  { id: 'wenzhou', label: '浙江省 温州市', aliases: ['浙江温州', '温州'], longitude: 120.6994, latitude: 27.9943, timezoneOffset: 8 },
  { id: 'jiaxing', label: '浙江省 嘉兴市', aliases: ['浙江嘉兴', '嘉兴'], longitude: 120.7555, latitude: 30.7461, timezoneOffset: 8 },
  { id: 'huzhou', label: '浙江省 湖州市', aliases: ['浙江湖州', '湖州'], longitude: 120.0868, latitude: 30.8943, timezoneOffset: 8 },
  { id: 'deqing', label: '浙江省 湖州市 德清县', aliases: ['浙江湖州德清', '浙江德清', '湖州德清', '德清'], longitude: 119.9774, latitude: 30.5425, timezoneOffset: 8 },
  { id: 'shaoxing', label: '浙江省 绍兴市', aliases: ['浙江绍兴', '绍兴'], longitude: 120.5821, latitude: 30.0511, timezoneOffset: 8 },
  { id: 'jinhua', label: '浙江省 金华市', aliases: ['浙江金华', '金华'], longitude: 119.6474, latitude: 29.0792, timezoneOffset: 8 },
  { id: 'yiwu', label: '浙江省 金华市 义乌市', aliases: ['浙江义乌', '金华义乌', '义乌'], longitude: 120.0751, latitude: 29.3069, timezoneOffset: 8 },
  { id: 'quzhou', label: '浙江省 衢州市', aliases: ['浙江衢州', '衢州'], longitude: 118.8595, latitude: 28.9701, timezoneOffset: 8 },
  { id: 'zhoushan', label: '浙江省 舟山市', aliases: ['浙江舟山', '舟山'], longitude: 122.2072, latitude: 29.9853, timezoneOffset: 8 },
  { id: 'taizhou-zj', label: '浙江省 台州市', aliases: ['浙江台州', '台州'], longitude: 121.4208, latitude: 28.6564, timezoneOffset: 8 },
  { id: 'lishui', label: '浙江省 丽水市', aliases: ['浙江丽水', '丽水'], longitude: 119.9229, latitude: 28.4676, timezoneOffset: 8 },
  { id: 'nanjing', label: '江苏省 南京市', aliases: ['江苏南京', '南京'], longitude: 118.7969, latitude: 32.0603, timezoneOffset: 8 },
  { id: 'suzhou', label: '江苏省 苏州市', aliases: ['江苏苏州', '苏州'], longitude: 120.5853, latitude: 31.2989, timezoneOffset: 8 },
  { id: 'wuxi', label: '江苏省 无锡市', aliases: ['江苏无锡', '无锡'], longitude: 120.3119, latitude: 31.4912, timezoneOffset: 8 },
  { id: 'changzhou', label: '江苏省 常州市', aliases: ['江苏常州', '常州'], longitude: 119.9741, latitude: 31.8112, timezoneOffset: 8 },
  { id: 'xuzhou', label: '江苏省 徐州市', aliases: ['江苏徐州', '徐州'], longitude: 117.2841, latitude: 34.2058, timezoneOffset: 8 },
  { id: 'guangzhou', label: '广东省 广州市', aliases: ['广东广州', '广州'], longitude: 113.2644, latitude: 23.1291, timezoneOffset: 8 },
  { id: 'shenzhen', label: '广东省 深圳市', aliases: ['广东深圳', '深圳'], longitude: 114.0579, latitude: 22.5431, timezoneOffset: 8 },
  { id: 'foshan', label: '广东省 佛山市', aliases: ['广东佛山', '佛山'], longitude: 113.1214, latitude: 23.0215, timezoneOffset: 8 },
  { id: 'dongguan', label: '广东省 东莞市', aliases: ['广东东莞', '东莞'], longitude: 113.7518, latitude: 23.0207, timezoneOffset: 8 },
  { id: 'zhuhai', label: '广东省 珠海市', aliases: ['广东珠海', '珠海'], longitude: 113.5767, latitude: 22.2707, timezoneOffset: 8 },
  { id: 'chengdu', label: '四川省 成都市', aliases: ['四川成都', '成都'], longitude: 104.0665, latitude: 30.5723, timezoneOffset: 8 },
  { id: 'wuhan', label: '湖北省 武汉市', aliases: ['湖北武汉', '武汉'], longitude: 114.3054, latitude: 30.5931, timezoneOffset: 8 },
  { id: 'changsha', label: '湖南省 长沙市', aliases: ['湖南长沙', '长沙'], longitude: 112.9388, latitude: 28.2282, timezoneOffset: 8 },
  { id: 'zhengzhou', label: '河南省 郑州市', aliases: ['河南郑州', '郑州'], longitude: 113.6254, latitude: 34.7466, timezoneOffset: 8 },
  { id: 'xian', label: '陕西省 西安市', aliases: ['陕西西安', '西安'], longitude: 108.9398, latitude: 34.3416, timezoneOffset: 8 },
  { id: 'jinan', label: '山东省 济南市', aliases: ['山东济南', '济南'], longitude: 117.1205, latitude: 36.6512, timezoneOffset: 8 },
  { id: 'qingdao', label: '山东省 青岛市', aliases: ['山东青岛', '青岛'], longitude: 120.3826, latitude: 36.0671, timezoneOffset: 8 },
  { id: 'shenyang', label: '辽宁省 沈阳市', aliases: ['辽宁沈阳', '沈阳'], longitude: 123.4315, latitude: 41.8057, timezoneOffset: 8 },
  { id: 'dalian', label: '辽宁省 大连市', aliases: ['辽宁大连', '大连'], longitude: 121.6147, latitude: 38.914, timezoneOffset: 8 },
  { id: 'harbin', label: '黑龙江省 哈尔滨市', aliases: ['黑龙江哈尔滨', '哈尔滨'], longitude: 126.5349, latitude: 45.8038, timezoneOffset: 8 },
  { id: 'changchun', label: '吉林省 长春市', aliases: ['吉林长春', '长春'], longitude: 125.3235, latitude: 43.8171, timezoneOffset: 8 },
  { id: 'shijiazhuang', label: '河北省 石家庄市', aliases: ['河北石家庄', '石家庄'], longitude: 114.5149, latitude: 38.0428, timezoneOffset: 8 },
  { id: 'taiyuan', label: '山西省 太原市', aliases: ['山西太原', '太原'], longitude: 112.5489, latitude: 37.8706, timezoneOffset: 8 },
  { id: 'hefei', label: '安徽省 合肥市', aliases: ['安徽合肥', '合肥'], longitude: 117.2272, latitude: 31.8206, timezoneOffset: 8 },
  { id: 'fuzhou', label: '福建省 福州市', aliases: ['福建福州', '福州'], longitude: 119.2965, latitude: 26.0745, timezoneOffset: 8 },
  { id: 'xiamen', label: '福建省 厦门市', aliases: ['福建厦门', '厦门'], longitude: 118.0894, latitude: 24.4798, timezoneOffset: 8 },
  { id: 'nanchang', label: '江西省 南昌市', aliases: ['江西南昌', '南昌'], longitude: 115.8579, latitude: 28.682, timezoneOffset: 8 },
  { id: 'kunming', label: '云南省 昆明市', aliases: ['云南昆明', '昆明'], longitude: 102.8329, latitude: 24.8801, timezoneOffset: 8 },
  { id: 'guiyang', label: '贵州省 贵阳市', aliases: ['贵州贵阳', '贵阳'], longitude: 106.6302, latitude: 26.6477, timezoneOffset: 8 },
  { id: 'nanning', label: '广西壮族自治区 南宁市', aliases: ['广西南宁', '南宁'], longitude: 108.3669, latitude: 22.817, timezoneOffset: 8 },
  { id: 'haikou', label: '海南省 海口市', aliases: ['海南海口', '海口'], longitude: 110.1983, latitude: 20.044, timezoneOffset: 8 },
  { id: 'lanzhou', label: '甘肃省 兰州市', aliases: ['甘肃兰州', '兰州'], longitude: 103.8343, latitude: 36.0611, timezoneOffset: 8 },
  { id: 'xining', label: '青海省 西宁市', aliases: ['青海西宁', '西宁'], longitude: 101.7782, latitude: 36.6171, timezoneOffset: 8 },
  { id: 'yinchuan', label: '宁夏回族自治区 银川市', aliases: ['宁夏银川', '银川'], longitude: 106.2309, latitude: 38.4872, timezoneOffset: 8 },
  { id: 'urumqi', label: '新疆维吾尔自治区 乌鲁木齐市', aliases: ['新疆乌鲁木齐', '乌鲁木齐'], longitude: 87.6168, latitude: 43.8256, timezoneOffset: 8 },
  { id: 'hohhot', label: '内蒙古自治区 呼和浩特市', aliases: ['内蒙古呼和浩特', '呼和浩特'], longitude: 111.7492, latitude: 40.8426, timezoneOffset: 8 },
  { id: 'lhasa', label: '西藏自治区 拉萨市', aliases: ['西藏拉萨', '拉萨'], longitude: 91.1322, latitude: 29.6604, timezoneOffset: 8 },
  { id: 'hongkong', label: '中国香港', aliases: ['香港', '香港特别行政区'], longitude: 114.1694, latitude: 22.3193, timezoneOffset: 8 },
  { id: 'macau', label: '中国澳门', aliases: ['澳门', '澳门特别行政区'], longitude: 113.5439, latitude: 22.1987, timezoneOffset: 8 },
  { id: 'taipei', label: '中国台湾 台北市', aliases: ['台湾台北', '台北'], longitude: 121.5654, latitude: 25.033, timezoneOffset: 8 },
  { id: 'singapore', label: '新加坡', aliases: ['Singapore'], longitude: 103.8198, latitude: 1.3521, timezoneOffset: 8 },
  { id: 'tokyo', label: '日本 东京都', aliases: ['日本东京', '东京', 'Tokyo'], longitude: 139.6917, latitude: 35.6895, timezoneOffset: 9 },
  { id: 'seoul', label: '韩国 首尔', aliases: ['韩国首尔', '首尔', 'Seoul'], longitude: 126.978, latitude: 37.5665, timezoneOffset: 9 },
  { id: 'bangkok', label: '泰国 曼谷', aliases: ['泰国曼谷', '曼谷', 'Bangkok'], longitude: 100.5018, latitude: 13.7563, timezoneOffset: 7 },
  { id: 'london', label: '英国 伦敦', aliases: ['伦敦', 'London'], longitude: -0.1276, latitude: 51.5072, timezoneOffset: 0 },
  { id: 'paris', label: '法国 巴黎', aliases: ['巴黎', 'Paris'], longitude: 2.3522, latitude: 48.8566, timezoneOffset: 1 },
  { id: 'new-york', label: '美国 纽约', aliases: ['纽约', 'New York'], longitude: -74.006, latitude: 40.7128, timezoneOffset: -5 },
  { id: 'los-angeles', label: '美国 洛杉矶', aliases: ['洛杉矶', 'Los Angeles'], longitude: -118.2437, latitude: 34.0522, timezoneOffset: -8 },
  { id: 'vancouver', label: '加拿大 温哥华', aliases: ['温哥华', 'Vancouver'], longitude: -123.1207, latitude: 49.2827, timezoneOffset: -8 },
  { id: 'sydney', label: '澳大利亚 悉尼', aliases: ['澳洲悉尼', '悉尼', 'Sydney'], longitude: 151.2093, latitude: -33.8688, timezoneOffset: 10 },
];

function normalizeLocation(value: string) {
  return value.trim().normalize('NFKC').toLocaleLowerCase('zh-CN').replace(/[\s·,，省市区县特别行政]/g, '');
}

export function findBirthLocation(value: string) {
  const normalized = normalizeLocation(value);
  if (!normalized) return undefined;
  return birthLocations.find((location) => [location.label, ...location.aliases].some((candidate) => normalizeLocation(candidate) === normalized));
}
