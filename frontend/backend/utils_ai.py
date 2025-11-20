import datetime
from collections import Counter, defaultdict

def ai_pattern_detection(readings):
    # readings: list of dicts with keys: value, unit, category, food_intake, timestamp
    food_counter = Counter()
    time_of_day_counter = Counter()
    food_times = defaultdict(list)
    suggestions = []
    # Only consider readings with food_intake and abnormal category
    for r in readings:
        if r.get('food_intake') and r.get('category') == 'Abnormal':
            food_counter[r['food_intake']] += 1
            food_times[r['food_intake']].append(r['timestamp'])
        # Time of day analysis
        hour = r['timestamp'].hour
        if r.get('category') == 'Abnormal':
            if 5 <= hour < 12:
                time_of_day_counter['morning'] += 1
            elif 12 <= hour < 17:
                time_of_day_counter['afternoon'] += 1
            else:
                time_of_day_counter['evening'] += 1
    # Suggest foods with >=3 abnormal readings
    for food, count in food_counter.items():
        if count >= 3:
            suggestions.append(f"Your blood sugar often rises within 2 hours after meals containing {food}.")
    # Suggest time of day spikes
    if time_of_day_counter:
        most_common = time_of_day_counter.most_common(1)[0][0]
        suggestions.append(f"Higher average readings are observed in the {most_common}.")
    return suggestions[:3]

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
