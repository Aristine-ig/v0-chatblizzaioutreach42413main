import { FoodLog, UserProfile } from '../lib/supabase';

interface ExportOptions {
  startDate: Date;
  endDate: Date;
}

export const exportToCSV = (logs: FoodLog[], profile: UserProfile | null) => {
  const headers = ['Date', 'Time', 'Food Name', 'Calories', 'Protein (g)', 'Carbs (g)', 'Fats (g)'];

  const rows = logs.map(log => {
    const date = new Date(log.logged_at);
    return [
      date.toLocaleDateString(),
      date.toLocaleTimeString(),
      log.food_name,
      log.calories.toString(),
      log.protein.toFixed(1),
      log.carbs.toFixed(1),
      log.fats.toFixed(1),
    ];
  });

  const totalCalories = logs.reduce((sum, log) => sum + log.calories, 0);
  const totalProtein = logs.reduce((sum, log) => sum + log.protein, 0);
  const totalCarbs = logs.reduce((sum, log) => sum + log.carbs, 0);
  const totalFats = logs.reduce((sum, log) => sum + log.fats, 0);

  const summaryRows = [
    [],
    ['Summary'],
    ['Total Entries', logs.length.toString()],
    ['Total Calories', totalCalories.toString()],
    ['Total Protein (g)', totalProtein.toFixed(1)],
    ['Total Carbs (g)', totalCarbs.toFixed(1)],
    ['Total Fats (g)', totalFats.toFixed(1)],
  ];

  if (profile) {
    summaryRows.push(
      [],
      ['Daily Goals'],
      ['Target Calories', profile.daily_calories.toString()],
      ['Target Protein (g)', profile.daily_protein.toString()],
      ['Target Carbs (g)', profile.daily_carbs.toString()],
      ['Target Fats (g)', profile.daily_fats.toString()],
    );
  }

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ...summaryRows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `nutrition-export-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = (logs: FoodLog[], profile: UserProfile | null, options: ExportOptions) => {
  const dailyStats: { [key: string]: { calories: number; protein: number; carbs: number; fats: number; meals: FoodLog[] } } = {};

  logs.forEach(log => {
    const dateStr = new Date(log.logged_at).toLocaleDateString();
    if (!dailyStats[dateStr]) {
      dailyStats[dateStr] = { calories: 0, protein: 0, carbs: 0, fats: 0, meals: [] };
    }
    dailyStats[dateStr].calories += log.calories;
    dailyStats[dateStr].protein += log.protein;
    dailyStats[dateStr].carbs += log.carbs;
    dailyStats[dateStr].fats += log.fats;
    dailyStats[dateStr].meals.push(log);
  });

  const totalCalories = logs.reduce((sum, log) => sum + log.calories, 0);
  const totalProtein = logs.reduce((sum, log) => sum + log.protein, 0);

  const avgCalories = logs.length > 0 ? Math.round(totalCalories / Object.keys(dailyStats).length) : 0;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Nutrition Report</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        h1 {
          color: #059669;
          border-bottom: 3px solid #10b981;
          padding-bottom: 10px;
          margin-bottom: 30px;
        }
        h2 {
          color: #047857;
          margin-top: 30px;
          margin-bottom: 15px;
        }
        .summary {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }
        .summary-card {
          background: linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%);
          padding: 20px;
          border-radius: 12px;
          border-left: 4px solid #10b981;
        }
        .summary-label {
          font-size: 14px;
          color: #047857;
          font-weight: 600;
          margin-bottom: 5px;
        }
        .summary-value {
          font-size: 28px;
          font-weight: bold;
          color: #1f2937;
        }
        .day-section {
          background: #f9fafb;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        .day-header {
          font-size: 18px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 10px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e5e7eb;
        }
        .day-totals {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 15px;
          font-size: 12px;
        }
        .day-total-item {
          text-align: center;
          padding: 8px;
          background: white;
          border-radius: 8px;
        }
        .meal-item {
          background: white;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .meal-name {
          font-weight: 600;
          color: #1f2937;
        }
        .meal-time {
          font-size: 12px;
          color: #6b7280;
        }
        .meal-macros {
          font-size: 12px;
          color: #6b7280;
          text-align: right;
        }
        .goals {
          background: #eff6ff;
          padding: 20px;
          border-radius: 12px;
          border-left: 4px solid #3b82f6;
          margin-top: 30px;
        }
        .goals h3 {
          color: #1e40af;
          margin-top: 0;
        }
        .goals-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        .goal-item {
          display: flex;
          justify-content: space-between;
          padding: 8px;
        }
        @media print {
          body {
            padding: 20px;
          }
          .summary {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <h1>Nutrition Report</h1>
      <p style="color: #6b7280; margin-bottom: 30px;">
        ${options.startDate.toLocaleDateString()} - ${options.endDate.toLocaleDateString()}
      </p>

      <div class="summary">
        <div class="summary-card">
          <div class="summary-label">Total Entries</div>
          <div class="summary-value">${logs.length}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Avg. Calories/Day</div>
          <div class="summary-value">${avgCalories}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Total Protein</div>
          <div class="summary-value">${Math.round(totalProtein)}g</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Total Calories</div>
          <div class="summary-value">${totalCalories}</div>
        </div>
      </div>

      ${profile ? `
      <div class="goals">
        <h3>Daily Goals</h3>
        <div class="goals-grid">
          <div class="goal-item">
            <span>Calories:</span>
            <strong>${profile.daily_calories} kcal</strong>
          </div>
          <div class="goal-item">
            <span>Protein:</span>
            <strong>${profile.daily_protein}g</strong>
          </div>
          <div class="goal-item">
            <span>Carbs:</span>
            <strong>${profile.daily_carbs}g</strong>
          </div>
          <div class="goal-item">
            <span>Fats:</span>
            <strong>${profile.daily_fats}g</strong>
          </div>
        </div>
      </div>
      ` : ''}

      <h2>Daily Breakdown</h2>
      ${Object.entries(dailyStats).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()).map(([date, data]) => `
        <div class="day-section">
          <div class="day-header">${date}</div>
          <div class="day-totals">
            <div class="day-total-item">
              <div style="color: #f97316; font-weight: 600;">${data.calories}</div>
              <div style="color: #6b7280;">Calories</div>
            </div>
            <div class="day-total-item">
              <div style="color: #ef4444; font-weight: 600;">${Math.round(data.protein)}g</div>
              <div style="color: #6b7280;">Protein</div>
            </div>
            <div class="day-total-item">
              <div style="color: #f59e0b; font-weight: 600;">${Math.round(data.carbs)}g</div>
              <div style="color: #6b7280;">Carbs</div>
            </div>
            <div class="day-total-item">
              <div style="color: #eab308; font-weight: 600;">${Math.round(data.fats)}g</div>
              <div style="color: #6b7280;">Fats</div>
            </div>
          </div>
          ${data.meals.map(meal => `
            <div class="meal-item">
              <div>
                <div class="meal-name">${meal.food_name}</div>
                <div class="meal-time">${new Date(meal.logged_at).toLocaleTimeString()}</div>
              </div>
              <div class="meal-macros">
                <div><strong>${meal.calories}</strong> kcal</div>
                <div>P: ${Math.round(meal.protein)}g | C: ${Math.round(meal.carbs)}g | F: ${Math.round(meal.fats)}g</div>
              </div>
            </div>
          `).join('')}
        </div>
      `).join('')}
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  }
};
