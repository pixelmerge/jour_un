// Utility to derive BMR/TDEE and default targets
export function deriveTargets({ age, height_cm, weight_kg, gender, activity_level } = {}, weightKg) {
  const w = weightKg ?? weight_kg ?? 70;
  const h = height_cm ?? 170;
  const a = typeof age === 'number' ? age : 30;
  let bmr = 2000;
  if (gender) {
    const g = String(gender).toLowerCase();
    if (g.startsWith('m')) {
      bmr = Math.round(10 * w + 6.25 * h - 5 * a + 5);
    } else if (g.startsWith('f')) {
      bmr = Math.round(10 * w + 6.25 * h - 5 * a - 161);
    }
  } else {
    bmr = Math.round(10 * w + 6.25 * h - 5 * a + 0);
  }

  const activityMap = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    super_active: 1.9
  };
  const factor = activityMap[activity_level] ?? (typeof activity_level === 'number' ? activity_level : 1.375);
  const tdee = Math.round(bmr * factor);

  const activityMinutesTarget = 30;
  const sleepHoursTarget = 8;

  return {
    derived_daily_calorie_target: tdee,
    derived_activity_minutes_target: activityMinutesTarget,
    derived_sleep_target_hours: sleepHoursTarget,
    derived_bmr: bmr,
    derived_activity_factor: factor
  };
}
