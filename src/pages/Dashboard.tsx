import { user, workouts, weeklyReport } from '../data/mockData';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <h1>Welcome back, {user.name}!</h1>
      <p className="goal">Your Goal: {user.goal}</p>

      <div className="card weekly-report">
        <h2>Weekly Report</h2>
        <p><strong>{weeklyReport.week}</strong></p>
        <p>{weeklyReport.summary}</p>
        <p><em>AI Feedback: {weeklyReport.feedback}</em></p>
      </div>

      <div className="card workout-history">
        <h2>Recent Workouts</h2>
        <ul>
          {workouts.map((workout, index) => (
            <li key={index}>
              {workout.date}: {workout.type} - {workout.duration} mins, {workout.calories} kcal
            </li>
          ))}
        </ul>
      </div>

      <div className="card ai-character">
        <h2>Your AI Personal Trainer</h2>
        <p>Ready for your next session? Chat with your AI trainer for tips and motivation!</p>
        {/* Character component will go here */}
      </div>
    </div>
  );
};

export default Dashboard; 