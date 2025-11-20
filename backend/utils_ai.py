import datetime
from collections import Counter, defaultdict

def ai_pattern_detection(readings):
    # readings: list of dicts with keys: value, unit, category, food_intake, timestamp
    if not readings:
        return ["No readings available yet. Keep logging your blood sugar to get personalized suggestions!"]

    food_counter = Counter()
    time_of_day_counter = Counter()
    food_times = defaultdict(list)
    abnormal_readings = [r for r in readings if r.get('category') == 'Abnormal']
    normal_readings = [r for r in readings if r.get('category') == 'Normal']
    suggestions = []

    # Trend analysis (last 7 vs previous 7 readings)
    if len(readings) >= 14:
        last7 = [r['value'] for r in readings[-7:]]
        prev7 = [r['value'] for r in readings[-14:-7]]
        avg_last7 = sum(last7) / 7
        avg_prev7 = sum(prev7) / 7
        if avg_last7 < avg_prev7:
            suggestions.append(f"Great job! Your average blood sugar over the last week ({avg_last7:.1f}) is lower than the previous week ({avg_prev7:.1f}). Keep up the healthy habits!")
        elif avg_last7 > avg_prev7:
            suggestions.append(f"Your average blood sugar this week ({avg_last7:.1f}) is higher than last week ({avg_prev7:.1f}). Review your recent meals and routines for possible causes, and try to get back on track.")
        else:
            suggestions.append(f"Your average blood sugar has remained steady over the last two weeks at {avg_last7:.1f}. Consistency is good—keep monitoring!")

    # Only consider readings with food_intake and abnormal category
    for r in abnormal_readings:
        if r.get('food_intake'):
            food_counter[r['food_intake']] += 1
            food_times[r['food_intake']].append(r['timestamp'])
        # Time of day analysis
        hour = r['timestamp'].hour
        if 5 <= hour < 12:
            time_of_day_counter['morning'] += 1
        elif 12 <= hour < 17:
            time_of_day_counter['afternoon'] += 1
        else:
            time_of_day_counter['evening'] += 1

    # Suggest foods with >=3 abnormal readings
    for food, count in food_counter.items():
        if count >= 3:
            suggestions.append(f"Your blood sugar often rises after meals containing {food}. Try reducing portion size, swapping for a healthier alternative, or pairing with more fiber/protein.")

    # Suggest time of day spikes
    if time_of_day_counter:
        most_common = time_of_day_counter.most_common(1)[0][0]
        suggestions.append(f"You tend to have higher readings in the {most_common}. Consider reviewing your {most_common} meals and routines for improvements.")

    # Motivational/positive feedback
    if len(normal_readings) > len(abnormal_readings):
        suggestions.append("Most of your recent readings are in the normal range—excellent work! Keep maintaining your healthy habits.")
    elif len(abnormal_readings) > 0 and len(normal_readings) > 0:
        suggestions.append("You have a mix of normal and abnormal readings. Focus on what worked on your best days and try to repeat those habits.")
    elif len(abnormal_readings) > 0:
        suggestions.append("Many of your readings are above the normal range. Small changes—like more water, fiber, and regular activity—can make a big difference. You can do it!")

    # Always return at least one motivational suggestion
    if not suggestions:
        suggestions.append("Keep logging your readings and making small healthy changes. Every step counts!")

    return suggestions[:4]

def report_generation(readings, period_start, period_end):
    # readings: list of dicts with keys: value, unit, category, food_intake, timestamp
    filtered = [r for r in readings if period_start <= r['timestamp'].date() <= period_end]
    patient_ids = set(r['patient_id'] for r in filtered)
    category_counts = Counter(r['category'] for r in filtered)
    values = [r['value'] for r in filtered]
    stats = {
        'active_patients': len(patient_ids),
        'avg': sum(values)/len(values) if values else 0,
        'max': max(values) if values else 0,
        'min': min(values) if values else 0,
        'category_counts': dict(category_counts)
    }
    food_counter = Counter(r['food_intake'] for r in filtered if r.get('food_intake') and r['category'] == 'Abnormal')
    top_foods = [food for food, _ in food_counter.most_common(3)]
    trigger_summary = {'top_foods': top_foods}
    return stats, trigger_summary
