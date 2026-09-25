import { useState } from 'react';
import { Landmark, TrendingUp, Cpu, Trophy, Globe, Clapperboard, HeartPulse, Palette, Newspaper } from 'lucide-react';
import { CATEGORY_STYLES, DEFAULT_CATEGORY_STYLE } from './utils';

const CATEGORY_ICONS = {
  Politics: Landmark,
  Economy: TrendingUp,
  Technology: Cpu,
  Sports: Trophy,
  World: Globe,
  Entertainment: Clapperboard,
  Health: HeartPulse,
  Culture: Palette,
};

// תמונת הידיעה אם יש, ואם אין (או שהיא נכשלה בטעינה) - באנר גרדיאנט
// בצבע הקטגוריה עם אייקון, כדי שהגריד יישאר אחיד
const ImageBanner = ({ item, className = '' }) => {
  const [failed, setFailed] = useState(false);
  const categoryStyle = CATEGORY_STYLES[item.category] || DEFAULT_CATEGORY_STYLE;
  const Icon = CATEGORY_ICONS[item.category] || Newspaper;

  if (item.image && !failed) {
    return (
      <img
        src={item.image}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className={`object-cover ${className}`}
      />
    );
  }

  return (
    <div className={`flex items-center justify-center ${categoryStyle.bar} ${className}`}>
      <Icon className="text-white/70" size={32} />
    </div>
  );
};

export default ImageBanner;
