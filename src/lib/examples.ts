import type { DesignId } from '@/lib/bibi'
import bibi from '@/assets/examples/bibi.jpg'
import lily from '@/assets/examples/lily.jpg'
import shelly from '@/assets/examples/shelly.jpg'

export type FinishedExample = {
  src: string
  alt: string
  caption: string
}

export const FINISHED_EXAMPLES: Record<DesignId, FinishedExample> = {
  bibi: {
    src: bibi,
    alt: 'Finished fitted knit top with short set-in sleeves, a shaped waist, and a bound round neck.',
    caption:
      'Default make: a close-fitting jersey top to the seat, short set-in sleeves, a shaped waist, and a narrow neck binding. This picture stays on the default make.',
  },
  shelly: {
    src: shelly,
    alt: 'Finished raglan knit tee with short sleeves, a crew neckband, and diagonal seams from the neck to the underarms.',
    caption:
      'Default make: a hip-length raglan tee with short sleeves, a neckband, and straight sides. This picture stays on the default make.',
  },
  lily: {
    src: lily,
    alt: 'Finished full-length knit leggings with a folded waistband and narrow ankle hems.',
    caption:
      'Default make: full-length leggings with a folded waistband between the waist and hips, close through the leg, hemmed at the ankle. This picture stays on the default make.',
  },
}
