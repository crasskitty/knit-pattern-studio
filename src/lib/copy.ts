export const MEASUREMENT_ORDER = [
  'neck',
  'shoulderSlope',
  'shoulderToShoulder',
  'shoulderToWrist',
  'biceps',
  'wrist',
  'hpsToBust',
  'hpsToWaistBack',
  'hpsToWaistFront',
  'highBust',
  'chest',
  'bustSpan',
  'waist',
  'waistToArmpit',
  'waistToUnderbust',
  'waistToHips',
  'hips',
  'waistToSeat',
  'seat',
  'seatBack',
  'waistToKnee',
  'waistToFloor',
  'waistToUpperLeg',
  'crossSeam',
  'crossSeamFront',
  'knee',
  'waistBack',
  'ankle',
  'heel',
] as const

export type MeasureCopy = {
  title: string
  how: string
}

export const MEASUREMENT_COPY: Record<string, MeasureCopy> = {
  neck: {
    title: 'Neck',
    how: 'Circumference at the base of the neck, where a close collar would sit. Keep the tape flat, not tight.',
  },
  shoulderSlope: {
    title: 'Shoulder slope',
    how: 'Degrees the shoulder drops from horizontal, from the side of the neck to the shoulder point. Zero is square. This is the only Bibi measurement stored in degrees. The FreeSewing size 38 example uses 13°.',
  },
  shoulderToShoulder: {
    title: 'Shoulder to shoulder',
    how: 'Across the back, from the bone at the end of one shoulder to the same point on the other shoulder.',
  },
  shoulderToWrist: {
    title: 'Shoulder to wrist',
    how: 'From the shoulder point down the arm, slightly bent, to the wrist bone. Sleeve length is a percent of this measurement.',
  },
  biceps: {
    title: 'Biceps',
    how: 'Circumference of the upper arm at its fullest, arm relaxed at your side.',
  },
  wrist: {
    title: 'Wrist',
    how: 'Circumference of the wrist just below the wrist bone.',
  },
  hpsToBust: {
    title: 'High point shoulder to bust',
    how: 'From the high point of the shoulder (where the neck meets the shoulder) down to the fullest part of the bust.',
  },
  hpsToWaistBack: {
    title: 'High point shoulder to waist, back',
    how: 'From the high point of the shoulder, down the back, to the natural waist.',
  },
  hpsToWaistFront: {
    title: 'High point shoulder to waist, front',
    how: 'From the same high point of the shoulder, over the bust, to the natural waist at the front.',
  },
  highBust: {
    title: 'High bust',
    how: 'Circumference under the arms and above the bust. Optional. With “Draft for high bust” on, FreeSewing’s bust plugin copies your chest into bust and drafts the chest line from this high bust.',
  },
  chest: {
    title: 'Chest',
    how: 'Full circumference at the fullest part of the chest, tape level, snug but not tight. Bibi’s chest ease is a percent of this measurement.',
  },
  bustSpan: {
    title: 'Bust span',
    how: 'Distance between the bust points. Optional. The front spread runs only when this is filled in along with high bust.',
  },
  waist: {
    title: 'Waist',
    how: 'Circumference at the natural waist, the narrower part of the torso, tape level.',
  },
  waistToArmpit: {
    title: 'Waist to armpit',
    how: 'Vertical distance from the natural waist up to the bottom of the armpit.',
  },
  waistToUnderbust: {
    title: 'Waist to underbust',
    how: 'Vertical distance from the natural waist up to the underbust. Optional. If you leave it blank, Bibi estimates one sixth of the back waist length.',
  },
  waistToHips: {
    title: 'Waist to hips',
    how: 'Vertical distance from the natural waist down to the hip line you use for the hips circumference.',
  },
  hips: {
    title: 'Hips',
    how: 'Circumference at that hip line. On this block the seat measurement is the fuller lower curve, not this one.',
  },
  waistToSeat: {
    title: 'Waist to seat',
    how: 'Vertical distance from the natural waist down to the fullest part of the seat.',
  },
  seat: {
    title: 'Seat',
    how: 'Full circumference around the fullest part of the seat, standing, tape level.',
  },
  seatBack: {
    title: 'Seat back',
    how: 'The back portion of the seat, from side seam to side seam across the back. It has to be smaller than the full seat. Bibi derives the front as seat minus seat back.',
  },
  waistToKnee: {
    title: 'Waist to knee',
    how: 'Vertical distance from the natural waist to the knee. Optional. Knee length on this block is not a dress. If you leave it blank, Bibi estimates 1.5 times the back waist length.',
  },
  waistToFloor: {
    title: 'Waist to floor',
    how: 'Vertical distance from the natural waist to the floor, barefoot. Optional on Bibi. Required for Lily. Floor length on Bibi is not a dress. If you leave it blank on Bibi, the block estimates 2.5 times the back waist length.',
  },
  waistToUpperLeg: {
    title: 'Waist to upper leg',
    how: 'Vertical distance from the natural waist down to the fullest part of the thigh.',
  },
  crossSeam: {
    title: 'Cross seam',
    how: 'From the centre-front waist, down through the crotch, up to the centre-back waist. Lily uses the full length.',
  },
  crossSeamFront: {
    title: 'Cross seam front',
    how: 'From the centre-front waist through the crotch to the inseam. The back portion is the rest of the cross seam.',
  },
  knee: {
    title: 'Knee',
    how: 'Circumference around the knee, leg relaxed, tape level.',
  },
  waistBack: {
    title: 'Waist back',
    how: 'Across the back at the waist, from side to side. It has to be smaller than the full waist.',
  },
  ankle: {
    title: 'Ankle',
    how: 'Circumference just above the ankle bone.',
  },
  heel: {
    title: 'Heel',
    how: 'Circumference around the heel and instep, the loop the legging hem has to pass over.',
  },
}

export const OPTION_BLURB: Record<string, string> = {
  chestEase: 'Ease at the chest, as a percent of the chest measurement.',
  waistEase: 'Ease at the waist, as a percent of the waist. Applied only while fit waist is on.',
  hipsEase: 'Ease at the hips, as a percent of the hips measurement.',
  seatEase: 'Ease at the seat, as a percent of the seat measurement.',
  fitWaist: 'Pulls the side seam in at the waist. Off keeps a straighter, looser side.',
  draftForHighBust:
    'Package default is on. It changes the draft only when high bust is filled in. Add bust span as well if you want the front spread.',
  bustEase: 'Extra ease on the full bust during the front spread. Package minimum is 0.',
  sleeves: 'Drafts a separate sleeve. Off drafts a sleeveless armhole and a strap.',
  sleeveLength:
    'Percent of shoulder-to-wrist. Below 5% Bibi treats it as a cap and hides the separate sleeve.',
  cuffEase: 'Bibi reuses this as sleeve fullness: how wide the sleeve is, as a percent of the wrist.',
  length: 'Which horizontal line the hem follows. Knee and floor still need design work. This block does not draft a dress.',
  lengthBonus: 'Extra length as a percent of the length used for that hem line. Negative shortens it.',
  flare: 'Opens the hem. The package shows this control once the hem is below the waist.',
  necklineWidth: 'How wide the neck opening is, as a percent along the shoulder.',
  necklineDepth: 'How far the front neck drops toward the bust, as a percent of that distance.',
  necklineBend: 'Curve of the front neckline.',
  backNeckCutout: 'How far the back neck drops, as a percent of the distance from neck to chest line.',
  backNeckBend: 'Curve of the back neckline.',
  strapWidth: 'Shoulder strap width when sleeves are off.',
  armholeCurveFront: 'Front armhole curve for the sleeveless draft.',
  armholeCurveBack: 'Back armhole curve for the sleeveless draft.',
  armholeDropBack: 'How far the back armhole drops when sleeves are off.',
  useWaistRibbing: 'Adds a ribbing waistband and shortens the body by the ribbing height.',
  useCuffRibbing: 'Adds cuff ribbing when the sleeve is long enough to take it.',
  ribbingStretch: 'How much the ribbing itself stretches. This is not the body fabric’s negative ease.',
  ribbingHeight: 'Ribbing height as a percent of back-waist length plus waist-to-hips.',
  bindingHeight:
    'Knit binding width for the neck and armhole, as a percent of back-waist length plus waist-to-hips. FreeSewing snaps the absolute width to 10, 15, 20, 25, or 30 mm.',
  neckEase: 'How large Shelly’s neck hole is, as a percent of the neck measurement.',
  neckBalance: 'Shifts Shelly’s neck hole toward the front. 0 is centered. The package default is 40.',
  armpitEase: 'Drops the sleeve down the body, as a percent of the sleeve diameter.',
  sleeveEase: 'Vertical ease around the armhole and shoulder. Shelly eases this toward the wrist.',
  wristEase: 'Ease around the wrist. For short sleeves Shelly blends this with sleeve ease.',
  straightSides: 'On makes a tube from the chest and ignores the hip ease. Package default is on.',
  bodyLength: 'Body length as a percent of back-waist length plus waist-to-hips. Package default is 120.',
  neckbandLength: 'Shelly’s neckband, as a percent of the drafted neck opening. Package default is 80.',
  neckbandWidth: 'Neckband width as a percent of the neck measurement. The draft uses twice that for the folded band.',
  hemWidth: 'Body hem allowance as a percent of the seam allowance. 200 means twice the seam allowance.',
  sleeveHem: 'Sleeve hem allowance as a percent of the seam allowance.',
  sideShape: 'Curves the side seam. Negative is concave, positive is convex.',
  raglanScoopLength: 'How long the scoop along the raglan seam is, as a percent of the raglan length.',
  raglanScoopMagnitude: 'How deep that scoop is, as a percent of the raglan length.',
  fabricStretch:
    'Lily’s horizontal fabric stretch, percent. The package wants waist, seat, and knee ease at this value divided by −10.',
  kneeEase: 'Ease at the knee, as a percent of the knee measurement. Lily’s range is negative through zero.',
  waistHeight: 'Where the waistband sits. 100 is the waist, 0 is the hips. Lily’s default is 50.',
  waistbandWidth: 'Width of Lily’s waistband, as a percent.',
}

export const LENGTH_LABEL: Record<string, string> = {
  underbust: 'Underbust',
  waist: 'Waist',
  hips: 'Hips',
  seat: 'Seat',
  knee: 'Knee line',
  floor: 'Floor line',
}

export const MIT_NOTICE = `MIT License

Copyright (c) 2022 Joost De Cock

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`
